"""
services/ml_service.py — ML model loading and prediction (FIXED)

Improvements:
  ✔ Consistent feature ordering
  ✔ StandardScaler support
  ✔ Safe input handling
  ✔ Robust fallback
  ✔ Cleaner confidence logic
"""

import numpy as np
import joblib
from config import MODEL_PATH, FEATURE_COLS_PATH, RISK_LABELS, SCALER_PATH
from utils.logger import logger

# ── Load artifacts ───────────────────────────────────────────────────────────
_model        = None
_feature_cols = None
_scaler       = None

try:
    _model        = joblib.load(MODEL_PATH)
    _feature_cols = joblib.load(FEATURE_COLS_PATH)
    _scaler       = joblib.load(SCALER_PATH) if SCALER_PATH else None
    logger.info("ML model + scaler loaded successfully.")
except Exception as e:
    logger.warning(f"ML model not found — rule-based fallback active. ({e})")


# ── Rule-based fallback (same logic as training) ──────────────────────────────
def _rule_based_score(enc: dict) -> int:
    score = 0

    age = enc.get("age", 0)
    score += 2 if age >= 65 else (1 if age >= 50 else 0)
    score += 2 if enc.get("hormonal_changes", 0) == 1 else 0
    score += 1 if enc.get("family_history", 0) == 1 else 0
    score += 1 if enc.get("body_weight", 0) == 1 else 0
    score += 2 if enc.get("calcium_intake", 0) == 1 else 0
    score += 1 if enc.get("vitamin_d_intake", 0) == 1 else 0
    score += 1 if enc.get("physical_activity", 0) == 1 else 0

    if score <= 2:
        return 0
    elif score <= 5:
        return 1
    return 2


# ── Safe feature builder ─────────────────────────────────────────────────────
def _build_feature_vector(encoded: dict) -> np.ndarray:
    key_map = {
        "Age":               "age",
        "Gender":            "gender",
        "Hormonal Changes":  "hormonal_changes",
        "Family History":    "family_history",
        "Body Weight":       "body_weight",
        "Calcium Intake":    "calcium_intake",
        "Vitamin D Intake":  "vitamin_d_intake",
        "Physical Activity": "physical_activity",
    }

    try:
        return np.array([
            [encoded.get(key_map[col], 0) for col in _feature_cols]
        ])
    except Exception as e:
        logger.error(f"Feature mapping failed: {e}")
        raise ValueError("Invalid input format")


# ── Public API ───────────────────────────────────────────────────────────────
def predict_risk(encoded: dict) -> dict:
    """
    Returns:
        {
            risk_score  : int (0=Low, 1=Medium, 2=High)
            risk_level  : str
            confidence  : str
            source      : str
        }
    """

    # ── ML Path ──────────────────────────────────────────────────────────────
    if _model is not None and _feature_cols is not None:
        try:
            features = _build_feature_vector(encoded)

            # Apply scaling if available
            if _scaler is not None:
                features = _scaler.transform(features)

            pred  = int(_model.predict(features)[0])
            proba = _model.predict_proba(features)[0]

            confidence = f"{round(float(max(proba)) * 100, 1)}%"
            source = "ML Model (Logistic Regression)"

            return {
                "risk_score": pred,
                "risk_level": RISK_LABELS[pred],
                "confidence": confidence,
                "source": source,
            }

        except Exception as e:
            logger.error(f"ML prediction failed: {e}")

    # ── Fallback Path ────────────────────────────────────────────────────────
    pred = _rule_based_score(encoded)

    return {
        "risk_score": pred,
        "risk_level": RISK_LABELS[pred],
        "confidence": "N/A",
        "source": "Rule-Based Scoring (Fallback)",
    }