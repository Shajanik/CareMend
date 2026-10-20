"""[LEGACY ML DEMO — no longer used for scoring; kept to document why it was retired.]
Unit tests: saved artifacts, preprocessing hygiene, inference, validation."""
import hashlib
import json
import math
import os

import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.model_selection import train_test_split

import features as F
from conftest import BACKEND

# The legacy ML demo (not used for scoring any more) keeps its own input contract.
VALID = {
    "age": 62, "gender": "female", "family_history": "yes", "prior_fractures": "no",
    "body_weight": "normal", "calcium_intake": "low", "vitamin_d_intake": "sufficient",
    "physical_activity": "sedentary", "smoking": "no",
}
from services import osteoporosis_model as om

ART = os.path.join(BACKEND, "models", "osteoporosis")
CSV = os.path.join(BACKEND, "data", "osteoporosis.csv")
CLEAN = os.path.join(BACKEND, "data", "osteoporosis_model_input.csv")


@pytest.fixture(scope="module")
def meta():
    with open(os.path.join(ART, "model_metadata.json")) as fh:
        return json.load(fh)


@pytest.fixture(scope="module")
def pipe():
    return joblib.load(os.path.join(ART, "model.joblib"))


@pytest.fixture(scope="module")
def split(meta):
    df = pd.read_csv(CLEAN)
    X, y = df[F.FEATURE_NAMES], df["osteoporosis"].to_numpy()
    return train_test_split(X, y, test_size=0.2, stratify=y, random_state=meta["random_seed"])


# ── artifacts ─────────────────────────────────────────────────────────────────
def test_artifacts_and_metadata_complete(meta):
    for f in ("model.joblib", "model_metadata.json"):
        assert os.path.exists(os.path.join(ART, f))
    for key in ("model_version", "trained_at_utc", "library_versions", "features", "feature_names",
                "metrics", "limitations", "decision_threshold", "calibrated", "dataset", "status"):
        assert key in meta, key
    assert meta["calibrated"] is False
    assert meta["feature_names"] == F.FEATURE_NAMES
    assert 0 < meta["decision_threshold"] < 1
    assert any("not clinically validated" in l.lower() or "not a diagnostic" in l.lower() for l in meta["limitations"])


def test_metadata_matches_original_csv_which_is_unchanged(meta):
    sha = hashlib.sha256(open(CSV, "rb").read()).hexdigest()
    assert sha == meta["dataset"]["sha256"], "CSV changed since the model was trained → re-train"


def test_pipeline_expects_exactly_the_contract_columns(pipe):
    assert list(pipe.named_steps["prep"].feature_names_in_) == F.FEATURE_NAMES


def test_excluded_columns_are_not_model_inputs(pipe):
    names = " ".join(pipe.named_steps["prep"].get_feature_names_out()).lower()
    for bad in ("id", "race", "hormonal", "alcohol", "medication", "medical_conditions"):
        assert bad not in names.replace("vitamin_d", "").replace("prior_fractures", ""), bad


# ── leakage / train-only fitting ──────────────────────────────────────────────
def test_preprocessing_statistics_come_from_training_rows_only(pipe, meta, split):
    X_tr, X_te, _, _ = split
    prep = pipe.named_steps["prep"]
    rows = pd.read_csv(CLEAN)[F.FEATURE_NAMES] if meta["refit_on_full_data"] else X_tr
    assert prep.named_transformers_["num"].named_steps["scale"].mean_[0] == pytest.approx(rows["age"].mean())
    modes = {c: rows[c].mode().iloc[0] for c in F.CATEGORICAL}
    stats = prep.named_transformers_["cat"].named_steps["impute"].statistics_
    assert dict(zip(F.CATEGORICAL, stats)) == modes
    assert meta["dataset"]["n_train"] + meta["dataset"]["n_test"] == meta["dataset"]["n_rows_after_cleaning"]


def test_reported_holdout_metrics_reproduce_from_untouched_test_rows(pipe, meta, split):
    """The numbers in metadata are test-set numbers: recompute them from the held-out rows only."""
    if meta["refit_on_full_data"]:
        pytest.skip("deployed model was refit on all rows; holdout numbers belong to the train-split model")
    _, X_te, _, y_te = split
    score = pipe.predict_proba(X_te)[:, 1]
    pred = (score >= meta["decision_threshold"]).astype(int)
    m = meta["metrics"]["holdout_test_at_chosen_threshold"]
    tp = int(((pred == 1) & (y_te == 1)).sum()); fn = int(((pred == 0) & (y_te == 1)).sum())
    tn = int(((pred == 0) & (y_te == 0)).sum()); fp = int(((pred == 1) & (y_te == 0)).sum())
    assert (tp, fn, tn, fp) == (m["tp"], m["fn"], m["tn"], m["fp"])
    assert m["n_test"] == len(y_te)


# ── inference ─────────────────────────────────────────────────────────────────
def test_predict_structure_and_threshold_semantics(meta):
    om.load_model()
    r = om.predict(dict(VALID))
    p = r["prediction"]
    assert 0 <= p["score"] <= 1
    assert p["category"] == ("HIGH" if p["score"] >= meta["decision_threshold"] else "LOW")
    assert p["score_is_calibrated_probability"] is False
    assert r["disclaimer"] and r["limitations"] and r["model"]["version"] == meta["model_version"]
    assert "probability" not in json.dumps(r["prediction"]["meaning"]).lower()


def test_prediction_is_deterministic():
    a, b = om.predict(dict(VALID)), om.predict(dict(VALID))
    assert a["prediction"] == b["prediction"]


def test_inference_uses_the_same_transformations_as_training(pipe):
    """Direct pipeline call on a raw DataFrame must equal the service's score."""
    row = pd.DataFrame([VALID])[F.FEATURE_NAMES]
    direct = float(pipe.predict_proba(row)[0, 1])
    assert om.predict(dict(VALID))["prediction"]["score"] == pytest.approx(direct, abs=1e-4)


def test_unknown_optional_fields_use_training_mode_and_are_reported(meta):
    defaults = meta["imputation_defaults_for_unknown_optional_fields"]
    p_unknown = dict(VALID, **{k: "unknown" for k in F.OPTIONAL})
    r = om.predict(p_unknown)
    assert {a["field"] for a in r["assumed_defaults"]} == set(F.OPTIONAL)
    p_explicit = dict(VALID, **{k: defaults[k] for k in F.OPTIONAL})
    assert om.predict(p_explicit)["prediction"]["score"] == pytest.approx(r["prediction"]["score"], abs=1e-9)
    assert om.predict(p_explicit)["assumed_defaults"] == []


def test_omitted_and_null_optional_fields_are_accepted():
    p = {k: v for k, v in VALID.items() if k in F.REQUIRED}
    assert len(om.predict(p)["assumed_defaults"]) == len(F.OPTIONAL)
    p2 = dict(p, smoking=None, calcium_intake="Not sure")
    assert {a["field"] for a in om.predict(p2)["assumed_defaults"]} >= {"smoking", "calcium_intake"}


def test_contributions_are_consistent_with_the_score(meta):
    ex = meta["explain"]
    if not ex:
        pytest.skip("non-linear model: no per-feature contributions")
    r = om.predict(dict(VALID))
    base = ex["intercept"] + float(np.dot(ex["coef"], ex["train_mean_transformed"]))
    logit = base + sum(d["contribution"] for d in r["explanation"]["drivers"])
    assert 1 / (1 + math.exp(-logit)) == pytest.approx(r["prediction"]["score"], abs=0.01)


def test_input_is_case_and_whitespace_insensitive():
    a = om.predict(dict(VALID))["prediction"]["score"]
    b = om.predict(dict(VALID, gender=" FEMALE ", smoking="No", age="62"))["prediction"]["score"]
    assert a == b


# ── validation ────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("field,bad", [
    ("age", 17), ("age", 101), ("age", "abc"), ("age", 55.5), ("age", True), ("age", None), ("age", float("nan")),
    ("gender", "other"), ("gender", None), ("family_history", "maybe"), ("prior_fractures", 1),
    ("smoking", "sometimes"), ("calcium_intake", "medium"), ("vitamin_d_intake", "low"),
    ("physical_activity", "high"), ("body_weight", "overweight"),
])
def test_validation_rejects_bad_values(field, bad):
    with pytest.raises(om.InputValidationError) as e:
        om.validate_input(dict(VALID, **{field: bad}))
    assert any(err["field"] == field for err in e.value.errors)


def test_validation_reports_every_problem_at_once():
    with pytest.raises(om.InputValidationError) as e:
        om.validate_input({"age": 5, "gender": "x"})
    fields = {err["field"] for err in e.value.errors}
    assert {"age", "gender", "family_history", "prior_fractures"} <= fields


def test_validation_rejects_non_object():
    with pytest.raises(om.InputValidationError):
        om.validate_input([1, 2, 3])


def test_age_above_training_range_is_flagged():
    _, _, warnings = om.validate_input(dict(VALID, age=95))
    assert warnings and "extrapolation" in warnings[0]
