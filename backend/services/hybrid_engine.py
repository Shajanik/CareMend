"""
services/hybrid_engine.py
=========================
Hybrid osteoporosis risk prediction engine.

Architecture
------------
                    ┌─────────────────────┐
  raw input ──────► │  Input Validator     │
                    └────────┬────────────┘
                             │ validated + encoded
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌──────────────────┐         ┌──────────────────────┐
   │  Rule-Based       │         │  ML Model             │
   │  Scoring Engine   │         │  (Logistic Regression)│
   │  (deterministic)  │         │  + StandardScaler     │
   └────────┬─────────┘         └──────────┬───────────┘
            │ rule_pct (0-100)              │ ml_pct (0-100)
            └──────────────┬───────────────┘
                           ▼
              ┌────────────────────────┐
              │  Hybrid Combiner       │
              │  final = α·rule + β·ml │
              │  (α=0.45, β=0.55)      │
              └────────────┬───────────┘
                           │
              ┌────────────▼───────────┐
              │  Output Builder        │
              │  risk_pct, category,   │
              │  factors, recs         │
              └────────────────────────┘

Public API
----------
    from services.hybrid_engine import predict_hybrid
    result = predict_hybrid(raw_input_dict)
"""

import os
import sys
from typing import Optional
import numpy as np
import joblib
from utils.logger import logger

# ── Paths ─────────────────────────────────────────────────────────────────────
_BASE    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MODELS  = os.path.join(_BASE, "models")

_MODEL_FILE  = os.path.join(_MODELS, "hybrid_model.pkl")
_SCALER_FILE = os.path.join(_MODELS, "hybrid_scaler.pkl")
_COLS_FILE   = os.path.join(_MODELS, "hybrid_feature_cols.pkl")

# ── Load artefacts once ───────────────────────────────────────────────────────
_model        = None
_scaler       = None
_feature_cols = None

try:
    _model        = joblib.load(_MODEL_FILE)
    _scaler       = joblib.load(_SCALER_FILE)
    _feature_cols = joblib.load(_COLS_FILE)
    logger.info("Hybrid ML model loaded successfully.")
except Exception as e:
    logger.warning(f"Hybrid model not found — rule-only mode active. ({e})")


# ═════════════════════════════════════════════════════════════════════════════
#  VALIDATION
# ═════════════════════════════════════════════════════════════════════════════

VALID = {
    "gender":            ["male", "female"],
    "physical_activity": ["active", "sedentary"],
    "smoking":           ["yes", "no"],
    "alcohol":           ["yes", "no"],
    "prior_fractures":   ["yes", "no"],
    "family_history":    ["yes", "no"],
    "bone_density":      ["normal", "low", "very_low"],   # T-score bands
}


def validate_input(raw: dict) -> list[str]:
    """Return list of error strings; empty = valid."""
    errors = []

    # age
    try:
        age = int(raw.get("age", -1))
        if not (1 <= age <= 120):
            errors.append("age must be 1–120")
    except (TypeError, ValueError):
        errors.append("age must be an integer")

    # bmi
    try:
        bmi = float(raw.get("bmi", -1))
        if not (10.0 <= bmi <= 70.0):
            errors.append("bmi must be 10–70")
    except (TypeError, ValueError):
        errors.append("bmi must be a number")

    # categorical
    for field, allowed in VALID.items():
        val = str(raw.get(field, "")).lower().strip()
        if val not in allowed:
            errors.append(f"'{field}' must be one of {allowed}")

    return errors


# ═════════════════════════════════════════════════════════════════════════════
#  ENCODING
# ═════════════════════════════════════════════════════════════════════════════

# Bone density T-score midpoints for numeric encoding
_BONE_MAP = {"normal": 0.5, "low": -1.5, "very_low": -2.8}

_BINARY = {
    "gender":            {"male": 0, "female": 1},
    "physical_activity": {"active": 0, "sedentary": 1},
    "smoking":           {"no": 0, "yes": 1},
    "alcohol":           {"no": 0, "yes": 1},
    "prior_fractures":   {"no": 0, "yes": 1},
    "family_history":    {"no": 0, "yes": 1},
}


def _encode(raw: dict) -> dict:
    enc = {
        "age":             int(raw["age"]),
        "gender":          _BINARY["gender"][raw["gender"].lower()],
        "bmi":             float(raw["bmi"]),
        "bone_density":    _BONE_MAP[raw["bone_density"].lower()],
        "physical_activity": _BINARY["physical_activity"][raw["physical_activity"].lower()],
        "smoking":         _BINARY["smoking"][raw["smoking"].lower()],
        "alcohol":         _BINARY["alcohol"][raw["alcohol"].lower()],
        "prior_fractures": _BINARY["prior_fractures"][raw["prior_fractures"].lower()],
        "family_history":  _BINARY["family_history"][raw["family_history"].lower()],
    }
    return enc


# ═════════════════════════════════════════════════════════════════════════════
#  RULE-BASED ENGINE
# ═════════════════════════════════════════════════════════════════════════════

# Each entry: (label, condition_fn, weight, explanation_template)
_RULES = [
    ("age_65+",       lambda e: e["age"] >= 65,                    15,
     lambda e: f"Age {e['age']} — bone density drops sharply after 65"),

    ("age_50-64",     lambda e: 50 <= e["age"] < 65,               8,
     lambda e: f"Age {e['age']} — natural bone loss has started"),

    ("female",        lambda e: e["gender"] == 1,                   5,
     lambda e: "Female sex — women lose bone mass faster, especially post-menopause"),

    ("low_bmi",       lambda e: e["bmi"] < 18.5,                   10,
     lambda e: f"BMI {e['bmi']:.1f} (underweight) — low body mass reduces bone-protective load"),

    ("overweight",    lambda e: e["bmi"] >= 30,                    -3,   # protective
     lambda e: f"BMI {e['bmi']:.1f} — higher body weight is mildly protective for bones"),

    ("very_low_bone", lambda e: e["bone_density"] <= -2.5,         25,
     lambda e: "Bone density T-score ≤ −2.5 — osteoporosis range, high fracture risk"),

    ("low_bone",      lambda e: -2.5 < e["bone_density"] <= -1.0,  15,
     lambda e: "Bone density T-score between −1.0 and −2.5 — osteopenia stage"),

    ("sedentary",     lambda e: e["physical_activity"] == 1,        8,
     lambda e: "Sedentary lifestyle — weight-bearing exercise is essential for bone strength"),

    ("smoking",       lambda e: e["smoking"] == 1,                  7,
     lambda e: "Smoking — reduces calcium absorption and accelerates bone loss"),

    ("alcohol",       lambda e: e["alcohol"] == 1,                  5,
     lambda e: "Alcohol use — interferes with bone formation and calcium balance"),

    ("fractures",     lambda e: e["prior_fractures"] == 1,         12,
     lambda e: "Prior fractures — strong predictor of future fracture risk"),

    ("family",        lambda e: e["family_history"] == 1,           8,
     lambda e: "Family history of osteoporosis — genetic predisposition present"),
]

# Max possible positive score (sum of all positive weights)
_MAX_RULE_SCORE = sum(w for _, _, w, _ in _RULES if w > 0)


def _rule_engine(enc: dict) -> tuple[float, list[str]]:
    """
    Returns
    -------
    rule_pct : float  0–100
    factors  : list of triggered factor descriptions
    """
    raw_score = 0
    factors   = []

    for key, cond, weight, explain in _RULES:
        if cond(enc):
            raw_score += weight
            if weight > 0:          # only report risk-increasing factors
                factors.append(explain(enc))

    # Normalise to 0–100
    pct = round(min(max(raw_score / _MAX_RULE_SCORE * 100, 0), 100), 1)
    return pct, factors


# ═════════════════════════════════════════════════════════════════════════════
#  ML ENGINE
# ═════════════════════════════════════════════════════════════════════════════

def _ml_engine(enc: dict) -> tuple[float, float]:
    """
    Returns
    -------
    ml_pct        : float  0–100  (probability of High class mapped to 0-100)
    ml_confidence : float  0–100  (max class probability)
    """
    if _model is None or _scaler is None or _feature_cols is None:
        return None, None

    vec = np.array([[enc[c] for c in _feature_cols]])
    vec_s = _scaler.transform(vec)

    proba = _model.predict_proba(vec_s)[0]   # [P(Low), P(Med), P(High)]
    # Map to 0-100: Low→0-33, Med→34-66, High→67-100
    ml_pct = round(
        proba[0] * 16.5 +    # Low  → centre 16.5
        proba[1] * 50.0 +    # Med  → centre 50
        proba[2] * 83.5,     # High → centre 83.5
        1
    )
    confidence = round(float(max(proba)) * 100, 1)
    return ml_pct, confidence


# ═════════════════════════════════════════════════════════════════════════════
#  HYBRID COMBINER
# ═════════════════════════════════════════════════════════════════════════════

# Weights: ML slightly higher because it was trained on the same scoring logic
_ALPHA = 0.45   # rule-based weight
_BETA  = 0.55   # ML weight


def _combine(rule_pct: float, ml_pct: Optional[float]) -> tuple[float, str, str]:
    if ml_pct is None:
        final = rule_pct
        source = "Rule-Based Only (ML model unavailable)"
    else:
        final = round(_ALPHA * rule_pct + _BETA * ml_pct, 1)
        source = f"Hybrid (Rule {int(_ALPHA * 100)}% + ML {int(_BETA * 100)}%)"

    if final <= 33:
        category = "LOW"
    elif final <= 66:
        category = "MEDIUM"
    else:
        category = "HIGH"

    return final, category, source


# ═════════════════════════════════════════════════════════════════════════════
#  RECOMMENDATIONS
# ═════════════════════════════════════════════════════════════════════════════

def _recommendations(enc: dict, category: str) -> list[str]:
    recs = []

    if enc["smoking"] == 1:
        recs.append("Quit smoking — it directly accelerates bone loss")
    if enc["alcohol"] == 1:
        recs.append("Reduce alcohol — limit to ≤1 drink/day for bone health")
    if enc["physical_activity"] == 1:
        recs.append("Start 30 min weight-bearing exercise daily (walking, yoga)")
    if enc["bmi"] < 18.5:
        recs.append("Increase caloric intake with calcium-rich foods to reach healthy BMI")
    if enc["bone_density"] <= -1.0:
        recs.append("Get a DEXA scan and discuss bisphosphonate therapy with your doctor")

    if category == "HIGH":
        recs += [
            "Consult a doctor within 2 weeks for bone medication review",
            "Diet: 3 glasses milk + 100 g paneer + ragi roti daily (1200 mg Ca)",
            "Exercise: 20–30 min gentle walking + chair yoga (avoid high-impact)",
            "Fall-proof your home: remove loose rugs, install handrails",
        ]
    elif category == "MEDIUM":
        recs += [
            "Schedule annual bone density (DEXA) scan",
            "Diet: 2 glasses milk + curd + almonds + ragi 3×/week (1000 mg Ca)",
            "Exercise: brisk walk 30–45 min, 5 days/week + yoga twice weekly",
        ]
    else:
        recs += [
            "Maintain 1000 mg calcium/day from food (milk, curd, paneer)",
            "Stay active: walking, sports, or strength training",
            "15–20 min morning sunlight for vitamin D synthesis",
        ]

    return recs


# ═════════════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═════════════════════════════════════════════════════════════════════════════

def predict_hybrid(raw: dict) -> dict:
    """
    Full hybrid prediction pipeline.

    Parameters
    ----------
    raw : dict  — validated raw input (string values as sent by the API)

    Returns
    -------
    {
        risk_percentage : float   0–100
        risk_category   : str     LOW | MEDIUM | HIGH
        rule_score      : float   rule-based component (0–100)
        ml_score        : float | None
        ml_confidence   : float | None
        source          : str
        risk_factors    : list[str]
        recommendations : list[str]
        breakdown       : dict    per-factor detail
    }
    """
    enc = _encode(raw)

    # ── Rule engine ───────────────────────────────────────────────────────────
    rule_pct, factors = _rule_engine(enc)

    # ── ML engine ─────────────────────────────────────────────────────────────
    ml_pct, ml_conf = _ml_engine(enc)

    # ── Combine ───────────────────────────────────────────────────────────────
    final_pct, category, source = _combine(rule_pct, ml_pct)

    # ── Recommendations ───────────────────────────────────────────────────────
    recs = _recommendations(enc, category)

    # ── Per-factor breakdown (for UI display) ─────────────────────────────────
    breakdown = {}
    for key, cond, weight, explain in _RULES:
        if weight > 0:
            breakdown[key] = {
                "triggered": bool(cond(enc)),
                "weight":    weight,
                "max_weight": _MAX_RULE_SCORE,
                "contribution_pct": round(weight / _MAX_RULE_SCORE * 100, 1),
            }

    logger.info(
        f"PREDICT  age={enc['age']}  bmi={enc['bmi']}  "
        f"bone={raw.get('bone_density')}  "
        f"rule={rule_pct}%  ml={ml_pct}%  final={final_pct}%  cat={category}"
    )

    return {
        "risk_percentage":  final_pct,
        "risk_category":    category,
        "rule_score":       rule_pct,
        "ml_score":         ml_pct,
        "ml_confidence":    ml_conf,
        "source":           source,
        "risk_factors":     factors if factors else ["No major risk factors detected"],
        "recommendations":  recs,
        "breakdown":        breakdown,
    }