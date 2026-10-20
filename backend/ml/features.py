"""
[LEGACY — the ML demo no longer scores anyone; see services/risk_screening.py]
ml/features.py — single source of truth for the model's input contract.

Used by:
  * ml/train_osteoporosis_model.py  (cleaning + training)
  * services/osteoporosis_model.py  (API validation + inference)
  * tests/                          (frontend <-> backend field-name checks)

Why these features (and not the others) — see ml/reports/data_quality_report.md:

  USED      age, gender, family_history, body_weight, calcium_intake,
            vitamin_d_intake, physical_activity, smoking, prior_fractures
  EXCLUDED  id                   identifier, not a feature
            hormonal_changes     not collected by CareMend; also internally
                                 inconsistent in the data (males labelled
                                 "Postmenopausal")
            race_ethnicity       not collected by CareMend; the dataset has no
                                 Indian category, so it cannot be applied fairly
            alcohol_consumption  valid answers (None/Moderate) but see ablation; not deployed
            medications          valid answers (None/Corticosteroids); see ablation; not deployed
            medical_conditions   valid answers; not collected by CareMend; see ablation
"""

from __future__ import annotations

TARGET_CSV = "Osteoporosis"

# name: canonical API / pipeline column name (lower snake_case)
# csv:  column name in osteoporosis.csv
# kind: "numeric" | "categorical"
# required: must be supplied by the client. Optional fields may be omitted or
#           sent as null / "unknown"; they are then filled with the most
#           frequent training value and the response says so.
FEATURES = [
    {
        "name": "age", "csv": "Age", "kind": "numeric", "required": True,
        "min": 18, "max": 100,
        "description": "Age in years (training data covers 18-90).",
    },
    {
        "name": "gender", "csv": "Gender", "kind": "categorical", "required": True,
        "allowed": ["female", "male"],
        "description": "Sex as recorded in the dataset (female/male).",
    },
    {
        "name": "family_history", "csv": "Family History", "kind": "categorical",
        "required": True, "allowed": ["no", "yes"],
        "description": "Family history of osteoporosis.",
    },
    {
        "name": "body_weight", "csv": "Body Weight", "kind": "categorical",
        "required": False, "allowed": ["normal", "underweight"],
        "description": "Derived from BMI by the frontend: underweight if BMI < 18.5, else normal.",
    },
    {
        "name": "calcium_intake", "csv": "Calcium Intake", "kind": "categorical",
        "required": False, "allowed": ["adequate", "low"],
        "description": "Self-reported dietary calcium intake.",
    },
    {
        "name": "vitamin_d_intake", "csv": "Vitamin D Intake", "kind": "categorical",
        "required": False, "allowed": ["sufficient", "insufficient"],
        "description": "Self-reported vitamin D intake / status.",
    },
    {
        "name": "physical_activity", "csv": "Physical Activity", "kind": "categorical",
        "required": False, "allowed": ["active", "sedentary"],
        "description": "Habitual physical activity.",
    },
    {
        "name": "smoking", "csv": "Smoking", "kind": "categorical", "required": False,
        "allowed": ["no", "yes"],
        "description": "Current smoker.",
    },
    {
        "name": "prior_fractures", "csv": "Prior Fractures", "kind": "categorical",
        "required": True, "allowed": ["no", "yes"],
        "description": "Any previous fracture.",
    },
]

FEATURE_NAMES = [f["name"] for f in FEATURES]
NUMERIC = [f["name"] for f in FEATURES if f["kind"] == "numeric"]
CATEGORICAL = [f["name"] for f in FEATURES if f["kind"] == "categorical"]
REQUIRED = [f["name"] for f in FEATURES if f["required"]]
OPTIONAL = [f["name"] for f in FEATURES if not f["required"]]
BY_NAME = {f["name"]: f for f in FEATURES}

# Tokens a client may send for "I don't know" on an optional field.
UNKNOWN_TOKENS = {"", "unknown", "not_sure", "not sure", "none_provided"}

# Columns present in the CSV but deliberately not used, with the reason.
EXCLUDED_COLUMNS = {
    "Id": "identifier, not a feature",
    "Hormonal Changes": "not collected by CareMend; inconsistent with Gender in the data",
    "Race/Ethnicity": "not collected by CareMend; no Indian category in the dataset",
    "Alcohol Consumption": "valid (\"None\"/\"Moderate\") but only two levels, not a CareMend question in this form; ablation shows no reliable gain (see evaluation report)",
    "Medications": "valid (\"None\"/\"Corticosteroids\"); ablation shows no reliable gain; CareMend does not ask for a medication list",
    "Medical Conditions": "valid (None/Rheumatoid Arthritis/Hyperthyroidism); not collected by CareMend; ablation shows no reliable gain",
}
