"""
services/risk_screening.py — transparent, rule-based osteoporosis risk SCREENING.

Why this replaces the machine-learning score
--------------------------------------------
The only data CareMend had was a binary "Osteoporosis" label with no DXA/T-score
provenance.  In that file every person aged 39+ is positive and the under-39s are
~22% positive at random, with no link to any other feature (see
ml/reports/model_evaluation_report.md).  A model trained on it can only learn
"age >= 39", so it flagged healthy 29-year-olds HIGH.  There is no defensible way
to train a Low/Medium/High model on those labels, and labels must not be invented.

So this module follows "Option B": a small, readable rule set based on widely
recognised risk factors (older age, menopause, low BMI, previous fragility fracture,
parental hip fracture, smoking, higher alcohol intake, long-term corticosteroids,
rheumatoid arthritis, low activity, poor calcium / vitamin D, DXA result).

IMPORTANT — what this is NOT
----------------------------
* It is NOT a validated clinical scoring system and NOT FRAX.  The cut-offs below
  (e.g. "3 or more factors = HIGH") are project design choices that still need
  clinical review.  They are listed in one place (RULES / HIGH_FACTOR_COUNT).
* It does not estimate fracture probability.
* DXA T-scores are diagnostic measurements, not questionnaire answers; if the user
  has one it is used only as an extra indicator, never to lower a result.
* Unanswered questions are never guessed.  They are reported back, and the result may
  under-estimate risk when many are missing.
"""

from __future__ import annotations

import math
from typing import Any

RULESET_VERSION = "rules-0.2.0"

# Project design choice (needs clinical review): this many counted factors => HIGH.
HIGH_FACTOR_COUNT = 3

UNKNOWN_TOKENS = {"", "unknown", "not_sure", "not sure", "none_provided"}
UNDERWEIGHT_BMI = 18.5

# ── input contract ────────────────────────────────────────────────────────────
# name, kind, required, allowed/min/max, label.  Served by GET /api/model/schema.
FEATURES: list[dict] = [
    {"name": "age", "kind": "numeric", "required": True, "min": 18, "max": 100, "label": "Age"},
    {"name": "gender", "kind": "categorical", "required": True, "allowed": ["female", "male"], "label": "Sex"},
    {"name": "menopause_status", "kind": "categorical", "required": False,
     "allowed": ["premenopausal", "postmenopausal"], "label": "Menopause status",
     "description": "Asked only when sex is female."},
    {"name": "height_cm", "kind": "numeric", "required": False, "min": 100, "max": 230, "label": "Height (cm)"},
    {"name": "weight_kg", "kind": "numeric", "required": False, "min": 25, "max": 250, "label": "Weight (kg)"},
    {"name": "fragility_fracture", "kind": "categorical", "required": False, "allowed": ["no", "yes"],
     "label": "Previous fragility fracture",
     "description": "A bone broken from a fall from standing height or lower, or from a minor knock."},
    {"name": "parent_hip_fracture", "kind": "categorical", "required": False, "allowed": ["no", "yes"],
     "label": "Parent had a hip fracture"},
    {"name": "smoking", "kind": "categorical", "required": False, "allowed": ["no", "yes"], "label": "Current smoker"},
    {"name": "alcohol", "kind": "categorical", "required": False, "allowed": ["none_low", "higher"],
     "label": "Alcohol use", "description": "'higher' = about 3 or more standard drinks per day."},
    {"name": "physical_activity", "kind": "categorical", "required": False,
     "allowed": ["regular", "occasional", "inactive"], "label": "Physical activity"},
    {"name": "calcium_intake", "kind": "categorical", "required": False,
     "allowed": ["adequate", "possibly_inadequate"], "label": "Calcium intake"},
    {"name": "vitamin_d_status", "kind": "categorical", "required": False,
     "allowed": ["adequate", "deficient"], "label": "Vitamin D status"},
    {"name": "corticosteroids_long_term", "kind": "categorical", "required": False, "allowed": ["no", "yes"],
     "label": "Long-term corticosteroid use",
     "description": "Steroid tablets (e.g. prednisolone) for about 3 months or more."},
    {"name": "rheumatoid_arthritis", "kind": "categorical", "required": False, "allowed": ["no", "yes"],
     "label": "Rheumatoid arthritis"},
    {"name": "dxa_result", "kind": "categorical", "required": False,
     "allowed": ["normal", "osteopenia", "osteoporosis"], "label": "Previous DXA result",
     "description": "Lowest T-score: normal >= -1.0; osteopenia between -1.0 and -2.5; osteoporosis <= -2.5."},
]
FEATURE_NAMES = [f["name"] for f in FEATURES]
BY_NAME = {f["name"]: f for f in FEATURES}
LABELS = {f["name"]: f["label"] for f in FEATURES}

# Questions that should be answered for a reliable result (reported when missing).
EXPECTED_ANSWERS = [
    "fragility_fracture", "parent_hip_fracture", "smoking", "alcohol", "physical_activity",
    "calcium_intake", "vitamin_d_status", "corticosteroids_long_term", "rheumatoid_arthritis",
]


# ── exceptions (mapped to HTTP codes in routes/assessment_routes.py) ──────────
class InputValidationError(ValueError):
    """Client input invalid → HTTP 400. `.errors` is a list of {field, message}."""

    def __init__(self, errors: list[dict]):
        super().__init__("; ".join(f"{e['field']}: {e['message']}" for e in errors))
        self.errors = errors


class PredictionError(RuntimeError):
    """Unexpected failure while screening → HTTP 500."""


class ModelUnavailableError(RuntimeError):
    """Kept for API compatibility; the rule set has no artifact that can be missing."""


# ── validation ────────────────────────────────────────────────────────────────
def _norm(v: Any) -> Any:
    return v.strip().lower().replace(" ", "_") if isinstance(v, str) else v


def _is_unknown(raw: Any) -> bool:
    return raw is None or (isinstance(raw, str) and _norm(raw) in {u.replace(" ", "_") for u in UNKNOWN_TOKENS})


def validate_input(payload: Any) -> tuple[dict, list[str]]:
    """Return (clean, warnings). clean[name] is a value or None (= not answered)."""
    if not isinstance(payload, dict):
        raise InputValidationError([{"field": "body", "message": "JSON object expected"}])

    errors: list[dict] = []
    clean: dict[str, Any] = {}
    warnings: list[str] = []

    for f in FEATURES:
        name, raw = f["name"], payload.get(f["name"])
        if _is_unknown(raw):
            if f["required"]:
                errors.append({"field": name, "message": "required"})
            else:
                clean[name] = None
            continue
        if f["kind"] == "numeric":
            if isinstance(raw, bool):
                errors.append({"field": name, "message": "must be a number"})
                continue
            try:
                num = float(raw)
            except (TypeError, ValueError):
                errors.append({"field": name, "message": "must be a number"})
                continue
            if not math.isfinite(num):
                errors.append({"field": name, "message": "must be a number"})
                continue
            if name == "age" and num != int(num):
                errors.append({"field": name, "message": "must be a whole number"})
                continue
            if not (f["min"] <= num <= f["max"]):
                errors.append({"field": name, "message": f"must be between {f['min']} and {f['max']}"})
                continue
            clean[name] = int(num) if name == "age" else num
        else:
            val = _norm(raw)
            if not isinstance(val, str) or val not in f["allowed"]:
                errors.append({"field": name, "message": f"must be one of {f['allowed']}"})
                continue
            clean[name] = val

    if (clean.get("height_cm") is None) != (clean.get("weight_kg") is None):
        errors.append({"field": "height_cm", "message": "give both height and weight, or neither"})
    if errors:
        raise InputValidationError(errors)

    if clean["gender"] == "male":
        if clean.get("menopause_status") is not None:
            warnings.append("Menopause status was ignored because sex is male.")
        clean["menopause_status"] = None
    return clean, warnings


# ── BMI ───────────────────────────────────────────────────────────────────────
def bmi_info(height_cm: float | None, weight_kg: float | None) -> dict:
    if not height_cm or not weight_kg:
        return {"value": None, "category": "unknown"}
    bmi = weight_kg / ((height_cm / 100) ** 2)
    if bmi < UNDERWEIGHT_BMI:
        cat = "underweight"
    elif bmi < 25:
        cat = "normal"
    elif bmi < 30:
        cat = "overweight"
    else:
        cat = "obese"
    return {"value": round(bmi, 1), "category": cat}


# ── rules ─────────────────────────────────────────────────────────────────────
# STRONG indicators: any one of these => HIGH, and nothing else can lower it.
# FACTORS: each present one is counted; 1-2 => MEDIUM, HIGH_FACTOR_COUNT or more => HIGH.
def _strong(c: dict) -> list[dict]:
    out = []
    if c.get("fragility_fracture") == "yes":
        out.append({"key": "fragility_fracture", "label": "Previous fragility fracture",
                    "detail": "A fracture from a minor fall or knock is an important indicator of low bone strength."})
    if c.get("dxa_result") == "osteoporosis":
        out.append({"key": "dxa_osteoporosis", "label": "Previous DXA result in the osteoporosis range",
                    "detail": "A T-score of -2.5 or lower is the diagnostic threshold; this needs clinical follow-up."})
    return out


def _factors(c: dict, bmi: dict) -> list[dict]:
    f: list[dict] = []

    def add(key: str, label: str, detail: str) -> None:
        f.append({"key": key, "label": label, "detail": detail})

    if c["age"] >= 65:
        add("age_65_plus", "Age 65 or older", "Bone loss and fracture risk generally rise with age.")
    if c["gender"] == "female" and c.get("menopause_status") == "postmenopausal":
        add("postmenopausal", "Post-menopausal", "Falling oestrogen after menopause can speed up bone loss.")
    if bmi["category"] == "underweight":
        add("underweight", f"Low body weight (BMI {bmi['value']})", "A BMI under 18.5 is a recognised risk factor.")
    if c.get("parent_hip_fracture") == "yes":
        add("parent_hip_fracture", "Parent had a hip fracture", "This can indicate higher inherited fracture risk.")
    if c.get("smoking") == "yes":
        add("smoking", "Current smoker", "Smoking is associated with poorer bone health.")
    if c.get("alcohol") == "higher":
        add("alcohol", "Higher alcohol use", "Heavy regular drinking can increase fracture risk.")
    if c.get("physical_activity") == "inactive":
        add("inactive", "Physically inactive", "Little weight-bearing activity can contribute to bone loss.")
    if c.get("calcium_intake") == "possibly_inadequate":
        add("calcium", "Calcium intake possibly inadequate", "Low intake may affect bone health.")
    if c.get("vitamin_d_status") == "deficient":
        add("vitamin_d", "Vitamin D deficiency", "Deficiency can impair bone mineralisation.")
    if c.get("corticosteroids_long_term") == "yes":
        add("corticosteroids", "Long-term corticosteroid use", "Certain steroid medicines increase bone-loss risk.")
    if c.get("rheumatoid_arthritis") == "yes":
        add("rheumatoid_arthritis", "Rheumatoid arthritis", "A recognised risk factor for osteoporosis.")
    if c.get("dxa_result") == "osteopenia":
        add("dxa_osteopenia", "Previous DXA result in the osteopenia range", "Lower than normal bone density.")
    return f


CATEGORY_MEANING = {
    "LOW": "No major risk factors were found in the answers you gave. This is a preliminary screening result, "
           "not confirmation of healthy bones.",
    "MEDIUM": "One or more risk factors were found. It is worth discussing bone health with a doctor, "
              "who can decide whether further assessment is needed.",
    "HIGH": "Significant risk factors were found. Please arrange a clinical assessment of your bone health "
            "with a doctor. This is not a diagnosis.",
}

LIMITATIONS = [
    "Rule-based screening prototype. The cut-offs are project design choices that have not been clinically "
    "reviewed or validated against DXA or fracture outcomes.",
    "This is not FRAX and it does not estimate your chance of a fracture. A clinician can use FRAX together "
    "with a DXA scan.",
    "A LOW result does not mean your bones are healthy, and a HIGH result is not a diagnosis. Only a "
    "clinician, usually with a DXA scan, can assess bone health.",
    "Questions you skip are not guessed or counted, so the result may under-estimate your risk.",
    "A previous fragility fracture or a DXA result in the osteoporosis range always gives HIGH; other "
    "reassuring answers cannot lower it.",
    "BMI uses standard WHO categories; the rules have not been checked for Indian populations.",
    "An earlier machine-learning demonstration was removed from scoring: its training labels only showed an "
    "age pattern, so it could not make meaningful individual predictions.",
]

DISCLAIMER = (
    "CareMend is an experimental student project. This is a preliminary, rule-based screening result based on "
    "recognised risk factors. It is not a diagnosis, is not a validated clinical tool, and does not guide "
    "treatment. Only a bone-density (DXA) scan interpreted by a doctor can assess your bone health."
)


# ── public API ────────────────────────────────────────────────────────────────
def predict(payload: dict) -> dict:
    """Validate answers, apply the rules, return the structured response."""
    clean, warnings = validate_input(payload)
    try:
        bmi = bmi_info(clean.get("height_cm"), clean.get("weight_kg"))
        strong = _strong(clean)
        factors = _factors(clean, bmi)

        if strong or len(factors) >= HIGH_FACTOR_COUNT:
            category = "HIGH"
        elif factors:
            category = "MEDIUM"
        else:
            category = "LOW"

        if strong:
            reasoning = "HIGH because of: " + "; ".join(s["label"].lower() for s in strong) + "."
        elif category == "HIGH":
            reasoning = f"HIGH because {len(factors)} risk factors were found (HIGH starts at {HIGH_FACTOR_COUNT})."
        elif category == "MEDIUM":
            reasoning = f"MEDIUM because {len(factors)} risk factor{'s were' if len(factors) != 1 else ' was'} found."
        else:
            reasoning = "LOW because none of the questionnaire risk factors were found."

        asked = list(EXPECTED_ANSWERS)
        if clean["gender"] == "female":
            asked.append("menopause_status")
        asked.append("height_cm")  # BMI
        unanswered = [{"field": n, "label": LABELS[n] if n != "height_cm" else "Height and weight (BMI)"}
                      for n in asked if clean.get(n) is None]
    except Exception as exc:  # noqa: BLE001
        raise PredictionError("screening failed") from exc

    return {
        "prediction": {
            "category": category,
            "meaning": CATEGORY_MEANING[category],
            "method": "rule_based",
            "ruleset_version": RULESET_VERSION,
            "clinically_validated": False,
        },
        "explanation": {
            "reasoning": reasoning,
            "strong_indicators": strong,
            "risk_factors": strong + factors,
            "factor_count": len(strong) + len(factors),
            "high_factor_threshold": HIGH_FACTOR_COUNT,
            "unanswered": unanswered,
            "answers_complete": not unanswered,
        },
        "bmi": bmi,
        "input_warnings": warnings,
        "inputs_used": dict(clean),
        "model": {"version": RULESET_VERSION, "type": "rule_based_screening", "status": "experimental"},
        "limitations": LIMITATIONS,
        "disclaimer": DISCLAIMER,
    }


def model_status() -> dict:
    return {"ready": True, "version": RULESET_VERSION, "type": "rule_based_screening",
            "status": "experimental", "error": None}


def input_schema() -> list[dict]:
    return [dict(f) for f in FEATURES]
