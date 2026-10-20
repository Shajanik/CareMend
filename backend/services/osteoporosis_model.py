"""
services/osteoporosis_model.py — validation + inference for the CareMend ML model.

* The saved sklearn Pipeline (imputer + encoder + scaler + classifier) is loaded ONCE
  (`load_model()` at app start-up, cached afterwards) and used exactly as trained.
* The input contract comes from ml/features.py, the same module the training script uses.
* There is NO fallback scorer: if the artifact is missing or prediction fails, a typed
  exception is raised and the route returns an error — never an invented prediction.
* The score is an UNCALIBRATED model score, not a probability (see model_metadata.json).
"""

from __future__ import annotations

import json
import math
import os
import sys
import threading
from typing import Any, Optional

import numpy as np
import pandas as pd

from config import OSTEOPOROSIS_MODEL_DIR
from utils.logger import logger

_ML_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml")
if _ML_DIR not in sys.path:
    sys.path.insert(0, _ML_DIR)
import features as F  # noqa: E402

DISCLAIMER = (
    "CareMend is an experimental student project. This result comes from a machine-learning "
    "demonstration trained on a small dataset whose labels have not been clinically verified and "
    "which is not known to represent Indian users. It is not a diagnosis, does not guide treatment, "
    "and a low result does not mean you are free of osteoporosis. Only a bone-density (DEXA) scan "
    "interpreted by a doctor can assess your bone health."
)

CATEGORY_MEANING = {
    "HIGH": "The model score is at or above the model's cut-off. Consider discussing bone health "
            "and a DEXA scan with a doctor. This is not a diagnosis.",
    "LOW": "The model score is below the model's cut-off. This does not rule out osteoporosis; "
           "talk to a doctor if you have any concerns.",
}

FEATURE_LABELS = {
    "age": "Age",
    "gender": "Gender",
    "family_history": "Family history",
    "body_weight": "Body weight (from BMI)",
    "calcium_intake": "Calcium intake",
    "vitamin_d_intake": "Vitamin D intake",
    "physical_activity": "Physical activity",
    "smoking": "Smoking",
    "prior_fractures": "Prior fractures",
}

RELIABILITY_NOTE = (
    "These show how each answer moved the model's score compared with the average person in the "
    "training data. They describe the model, not medical cause and effect. Apart from age, the "
    "other answers showed no reliable pattern in the training data, and some point in the opposite "
    "direction to medical expectations."
)


# ── exceptions ────────────────────────────────────────────────────────────────
class ModelUnavailableError(RuntimeError):
    """Model artifact missing / unreadable / incompatible → HTTP 503."""


class InputValidationError(ValueError):
    """Client input invalid → HTTP 400. `.errors` is a list of {field, message}."""

    def __init__(self, errors: list[dict]):
        super().__init__("; ".join(f"{e['field']}: {e['message']}" for e in errors))
        self.errors = errors


class PredictionError(RuntimeError):
    """Unexpected failure while predicting → HTTP 500."""


# ── model loading (once) ──────────────────────────────────────────────────────
_lock = threading.Lock()
_state: dict[str, Any] = {"pipeline": None, "meta": None, "error": None}


def load_model(force: bool = False, model_dir: Optional[str] = None) -> None:
    """Load pipeline + metadata. Safe to call repeatedly; raises ModelUnavailableError on failure."""
    with _lock:
        if _state["pipeline"] is not None and not force:
            return
        d = model_dir or OSTEOPOROSIS_MODEL_DIR
        try:
            import joblib
            import sklearn

            with open(os.path.join(d, "model_metadata.json")) as fh:
                meta = json.load(fh)
            pipe = joblib.load(os.path.join(d, "model.joblib"))
            trained = meta.get("library_versions", {}).get("scikit_learn")
            if trained and trained.split(".")[:2] != sklearn.__version__.split(".")[:2]:
                logger.warning(f"scikit-learn version mismatch: trained {trained}, running {sklearn.__version__}")
            # sanity: the pipeline must accept exactly the contract's columns
            if list(meta.get("feature_names", F.FEATURE_NAMES)) != F.FEATURE_NAMES:
                raise ValueError("feature contract differs between artifact and code")
            _state.update(pipeline=pipe, meta=meta, error=None)
            logger.info(f"Osteoporosis model loaded: v{meta.get('model_version')} ({meta.get('model_type')})")
        except Exception as exc:  # noqa: BLE001
            _state.update(pipeline=None, meta=None, error=f"{type(exc).__name__}: {exc}")
            logger.error(f"Osteoporosis model failed to load: {exc}")
            raise ModelUnavailableError(_state["error"]) from exc


def model_status() -> dict:
    ready = _state["pipeline"] is not None
    meta = _state["meta"] or {}
    return {"ready": ready, "version": meta.get("model_version"), "type": meta.get("model_type"),
            "status": meta.get("status"), "error": None if ready else _state["error"]}


def get_metadata() -> dict:
    load_model()
    return _state["meta"]


def input_schema() -> list[dict]:
    """Public description of the accepted input (served by GET /api/model/schema)."""
    return [dict(f) for f in F.FEATURES]


# ── validation ────────────────────────────────────────────────────────────────
def _norm(v: Any) -> Any:
    if isinstance(v, str):
        return v.strip().lower().replace(" ", "_")
    return v


def validate_input(payload: Any) -> tuple[dict, list[dict], list[str]]:
    """
    Returns (clean, assumed, warnings).
      clean:   {feature: value or None}  — None means 'unknown' (optional fields only)
      assumed: [{field, value}]          — optional fields the pipeline will fill with the training mode
    Raises InputValidationError listing every problem found.
    """
    if not isinstance(payload, dict):
        raise InputValidationError([{"field": "body", "message": "JSON object expected"}])

    errors: list[dict] = []
    clean: dict[str, Any] = {}
    assumed: list[dict] = []
    warnings: list[str] = []

    for f in F.FEATURES:
        name = f["name"]
        raw = payload.get(name)
        unknown = raw is None or (isinstance(raw, str) and _norm(raw) in {u.replace(" ", "_") for u in F.UNKNOWN_TOKENS})

        if unknown:
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
                errors.append({"field": name, "message": "must be a whole number"})
                continue
            if not math.isfinite(num) or num != int(num):
                errors.append({"field": name, "message": "must be a whole number"})
                continue
            if not (f["min"] <= num <= f["max"]):
                errors.append({"field": name, "message": f"must be between {f['min']} and {f['max']}"})
                continue
            clean[name] = int(num)
        else:
            val = _norm(raw)
            if not isinstance(val, str) or val not in f["allowed"]:
                errors.append({"field": name, "message": f"must be one of {f['allowed']}"})
                continue
            clean[name] = val

    if errors:
        raise InputValidationError(errors)

    meta = _state["meta"] or {}
    defaults = meta.get("imputation_defaults_for_unknown_optional_fields", {})
    for name in F.OPTIONAL:
        if clean.get(name) is None:
            assumed.append({"field": name, "label": FEATURE_LABELS[name], "assumed_value": defaults.get(name)})

    trained_max = int(meta.get("dataset", {}).get("age_max", 89))
    if clean["age"] > trained_max:
        warnings.append(f"Age {clean['age']} is above the oldest person in the training data ({trained_max}); the score is an extrapolation.")
    return clean, assumed, warnings


# ── inference ─────────────────────────────────────────────────────────────────
def _contributions(pipe, x_df: pd.DataFrame, meta: dict) -> Optional[list[dict]]:
    ex = meta.get("explain")
    if not ex or ex.get("type") != "logistic_regression_contributions":
        return None
    xt = np.asarray(pipe.named_steps["prep"].transform(x_df), dtype=float)[0]
    names = ex["transformed_feature_names"]
    coef = np.asarray(ex["coef"]); mean = np.asarray(ex["train_mean_transformed"])
    per_col = coef * (xt - mean)
    # a transformed column belongs to the longest feature name it starts with
    out: dict[str, float] = {}
    for col, c in zip(names, per_col):
        owner = max((n for n in F.FEATURE_NAMES if col == n or col.startswith(n + "_")), key=len)
        out[owner] = out.get(owner, 0.0) + float(c)
    return [{"feature": k, "label": FEATURE_LABELS[k], "contribution": round(v, 3)} for k, v in out.items()]


def predict(payload: dict) -> dict:
    """Validate, run the saved pipeline, and build the structured response."""
    load_model()
    pipe, meta = _state["pipeline"], _state["meta"]
    clean, assumed, warnings = validate_input(payload)

    try:
        row = pd.DataFrame([{k: clean[k] for k in F.FEATURE_NAMES}], columns=F.FEATURE_NAMES)
        for c in F.CATEGORICAL:                     # None → NaN so the fitted imputer handles it
            row[c] = row[c].astype(object).where(row[c].notna(), np.nan)
        score = float(pipe.predict_proba(row)[0, 1])
        thr = float(meta["decision_threshold"])
        category = "HIGH" if score >= thr else "LOW"
        contribs = _contributions(pipe, row, meta)
    except ModelUnavailableError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error(f"prediction failed: {exc}", exc_info=True)
        raise PredictionError("prediction failed") from exc

    drivers = []
    if contribs:
        for c in sorted(contribs, key=lambda c: -abs(c["contribution"])):
            c = dict(c)
            c["value"] = clean[c["feature"]] if clean[c["feature"]] is not None else "unknown (assumed)"
            c["effect"] = "raised" if c["contribution"] > 0.05 else ("lowered" if c["contribution"] < -0.05 else "little effect on")
            drivers.append(c)

    age_note = None
    if meta["dataset"].get("age_label_pattern_detected"):
        age_note = (f"In the training data every person aged {meta['dataset']['age_all_positive_from']} or older was labelled "
                    "positive, so this model's score is driven mainly by age.")
    dominant = None
    if drivers:
        tot = sum(abs(d["contribution"]) for d in drivers) or 1.0
        top = drivers[0]
        dominant = {"feature": top["feature"], "share_of_total_effect": round(abs(top["contribution"]) / tot, 2)}

    return {
        "prediction": {
            "category": category,
            "meaning": CATEGORY_MEANING[category],
            "score": round(score, 4),
            "decision_threshold": round(thr, 4),
            "score_is_calibrated_probability": False,
            "score_note": "Model score between 0 and 1. It is NOT the chance of having osteoporosis.",
        },
        "explanation": {
            "drivers": drivers,
            "dominant_driver": dominant,
            "reliability_note": RELIABILITY_NOTE,
            "age_pattern_note": age_note,
        },
        "assumed_defaults": assumed,
        "input_warnings": warnings,
        "inputs_used": {k: v for k, v in clean.items()},
        "model": {
            "version": meta["model_version"], "type": meta["model_type"], "status": meta["status"],
            "trained_at": meta["trained_at_utc"], "n_training_rows": meta["dataset"]["n_train"],
        },
        "limitations": meta["limitations"],
        "disclaimer": DISCLAIMER,
    }
