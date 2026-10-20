"""Shared pytest fixtures. Uses a throw-away SQLite file; never touches backend/database/db.sqlite3."""
import os
import sys
import tempfile

import pytest

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)
sys.path.insert(0, os.path.join(BACKEND, "ml"))

_tmp = tempfile.mkdtemp(prefix="caremend_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp, 'test.db')}"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")

VALID = {
    "age": 62, "gender": "female", "menopause_status": "postmenopausal",
    "height_cm": 160, "weight_kg": 58,
    "fragility_fracture": "no", "parent_hip_fracture": "yes", "smoking": "no", "alcohol": "none_low",
    "physical_activity": "occasional", "calcium_intake": "possibly_inadequate", "vitamin_d_status": "adequate",
    "corticosteroids_long_term": "no", "rheumatoid_arthritis": "no", "dxa_result": "unknown",
}


@pytest.fixture(scope="session")
def app():
    from app import create_app
    application = create_app()
    application.config["TESTING"] = True
    return application


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def user_id(app):
    """A fresh user row."""
    from extensions import db
    from models_db.auth_model import User
    with app.app_context():
        n = User.query.count()
        u = User(full_name="Test User", email=f"t{n}@example.com", username=f"tester{n}", password_hash="x")
        db.session.add(u)
        db.session.commit()
        return u.id


@pytest.fixture()
def valid_payload():
    return dict(VALID)
