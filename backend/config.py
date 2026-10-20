"""
config.py — Central configuration for CareMend backend.
All paths, constants, and settings live here.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Database ──────────────────────────────────────────────────────────────────
# Support SQLite (development / demo) and PostgreSQL (production)
# Priority: DATABASE_URL env var → SQLite

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production: Use PostgreSQL from environment variable
    DATABASE_URI = DATABASE_URL

    # Render/Heroku sometimes give "postgres://", which SQLAlchemy does not accept
    if DATABASE_URI.startswith("postgres://"):
        DATABASE_URI = DATABASE_URI.replace("postgres://", "postgresql://", 1)

    # Handle postgresql:// vs postgresql+psycopg2://
    if DATABASE_URI.startswith("postgresql://"):
        DATABASE_URI = DATABASE_URI.replace("postgresql://", "postgresql+psycopg2://", 1)
else:
    # Development / demo: use SQLite.
    # The "database" folder is not in the repo, so create it. If the folder
    # cannot be written (e.g. read-only disk on a host), fall back to /tmp,
    # which is always writable on Render.
    _db_dir = os.path.join(BASE_DIR, "database")
    try:
        os.makedirs(_db_dir, exist_ok=True)
        _probe = os.path.join(_db_dir, ".write_test")
        open(_probe, "w").close()
        os.remove(_probe)
    except OSError:
        _db_dir = "/tmp"
    DATABASE_URI = f"sqlite:///{os.path.join(_db_dir, 'db.sqlite3')}"

# ── Firebase Configuration ─────────────────────────────────────────────────────
# Firebase is deprecated - not used anymore

# ── Groq AI Configuration ──────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ── ML Model ──────────────────────────────────────────────────────────────────
# Osteoporosis model pipeline (model.joblib + model_metadata.json).
# Override with CAREMEND_MODEL_DIR when artifacts live outside the repo (e.g. a mounted volume).
OSTEOPOROSIS_MODEL_DIR = os.getenv(
    "CAREMEND_MODEL_DIR", os.path.join(BASE_DIR, "models", "osteoporosis")
)

# Legacy paths (old synthetic-data models; no longer used by the assessment flow)
MODEL_PATH       = os.path.join(BASE_DIR, "models", "risk_model.pkl")
FEATURE_COLS_PATH = os.path.join(BASE_DIR, "models", "feature_cols.pkl")
SCALER_PATH      = os.path.join(BASE_DIR, "models", "scaler.pkl")

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_FILE = os.path.join(BASE_DIR, "caremend.log")

# ── Risk label map ────────────────────────────────────────────────────────────
RISK_LABELS = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}

# ── Valid categorical values (used for input validation) ─────────────────────
VALID_VALUES = {
    "gender":            ["male", "female"],
    "hormonal_changes":  ["normal", "postmenopausal"],
    "family_history":    ["yes", "no"],
    "body_weight":       ["normal", "underweight"],
    "calcium_intake":    ["adequate", "low"],
    "vitamin_d_intake":  ["sufficient", "insufficient"],
    "physical_activity": ["active", "sedentary"],
}
