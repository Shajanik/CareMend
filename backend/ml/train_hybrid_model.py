"""
ml/train_hybrid_model.py
========================
Trains the hybrid osteoporosis risk model on a richer feature set:
  Age, Gender, BMI, Bone Density, Physical Activity,
  Smoking, Alcohol, Prior Fractures, Family History

Steps
-----
1. Generate a realistic synthetic dataset (no external CSV needed)
2. Compute rule-based risk score per row (ground truth proxy)
3. Train Logistic Regression on those features
4. Evaluate and save model + scaler + feature list

Run:
    python backend/ml/train_hybrid_model.py
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR  = os.path.join(BASE_DIR, "models")
MODEL_FILE  = os.path.join(MODELS_DIR, "hybrid_model.pkl")
SCALER_FILE = os.path.join(MODELS_DIR, "hybrid_scaler.pkl")
COLS_FILE   = os.path.join(MODELS_DIR, "hybrid_feature_cols.pkl")

os.makedirs(MODELS_DIR, exist_ok=True)

# ── Feature columns (order matters for inference) ─────────────────────────────
FEATURE_COLS = [
    "age", "gender", "bmi", "bone_density",
    "physical_activity", "smoking", "alcohol",
    "prior_fractures", "family_history",
]

# ── 1. Synthetic dataset ──────────────────────────────────────────────────────
np.random.seed(42)
N = 2000

def _synthetic_dataset(n: int) -> pd.DataFrame:
    age     = np.random.randint(18, 91, n)
    gender  = np.random.randint(0, 2, n)          # 0=male 1=female
    bmi     = np.round(np.random.normal(24, 5, n).clip(14, 45), 1)
    # bone density: T-score proxy  (-3 worst → +2 best)
    bone_density = np.round(np.random.normal(0, 1.2, n).clip(-3.5, 2.5), 2)
    physical_activity = np.random.randint(0, 2, n)  # 0=active 1=sedentary
    smoking  = np.random.randint(0, 2, n)
    alcohol  = np.random.randint(0, 2, n)
    prior_fractures = np.random.randint(0, 2, n)
    family_history  = np.random.randint(0, 2, n)

    return pd.DataFrame({
        "age": age, "gender": gender, "bmi": bmi,
        "bone_density": bone_density,
        "physical_activity": physical_activity,
        "smoking": smoking, "alcohol": alcohol,
        "prior_fractures": prior_fractures,
        "family_history": family_history,
    })

df = _synthetic_dataset(N)

# ── 2. Rule-based labels (ground truth) ───────────────────────────────────────
# Each factor adds to a raw score; score → 3-class label
WEIGHTS = {
    # (condition_fn, points)
    "age_65":        (lambda r: r["age"] >= 65,                    15),
    "age_50":        (lambda r: (r["age"] >= 50) & (r["age"] < 65), 8),
    "female":        (lambda r: r["gender"] == 1,                   5),
    "low_bmi":       (lambda r: r["bmi"] < 18.5,                   10),
    "low_bone":      (lambda r: r["bone_density"] < -1.0,          20),
    "very_low_bone": (lambda r: r["bone_density"] < -2.5,          15),  # extra
    "sedentary":     (lambda r: r["physical_activity"] == 1,        8),
    "smoking":       (lambda r: r["smoking"] == 1,                  7),
    "alcohol":       (lambda r: r["alcohol"] == 1,                  5),
    "fractures":     (lambda r: r["prior_fractures"] == 1,         12),
    "family":        (lambda r: r["family_history"] == 1,           8),
}

def _rule_score(row: pd.Series) -> float:
    total = sum(pts for _, (cond, pts) in WEIGHTS.items() if cond(row))
    return min(total, 100)   # cap at 100

df["rule_score"] = df.apply(_rule_score, axis=1)

# 0–33 → Low(0)  34–66 → Medium(1)  67+ → High(2)
def _label(score: float) -> int:
    if score <= 33:  return 0
    if score <= 66:  return 1
    return 2

df["label"] = df["rule_score"].apply(_label)

print("Label distribution:")
print(df["label"].value_counts().rename({0: "Low", 1: "Medium", 2: "High"}))

# ── 3. Train / test split ─────────────────────────────────────────────────────
X = df[FEATURE_COLS].values
y = df["label"].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── 4. Scale (important for LR with mixed numeric ranges) ────────────────────
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

# ── 5. Train Logistic Regression ─────────────────────────────────────────────
model = LogisticRegression(
    max_iter=1000,
    C=1.0,
    class_weight="balanced",
    random_state=42,
    solver="lbfgs",
)
model.fit(X_train_s, y_train)

# ── 6. Evaluate ───────────────────────────────────────────────────────────────
y_pred   = model.predict(X_test_s)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy : {accuracy * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["Low", "Medium", "High"]))

# ── 7. Save artefacts ─────────────────────────────────────────────────────────
joblib.dump(model,        MODEL_FILE)
joblib.dump(scaler,       SCALER_FILE)
joblib.dump(FEATURE_COLS, COLS_FILE)

print(f"\nSaved model  → {MODEL_FILE}")
print(f"Saved scaler → {SCALER_FILE}")
print(f"Saved cols   → {COLS_FILE}")
