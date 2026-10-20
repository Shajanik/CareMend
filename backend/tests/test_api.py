"""API tests: valid / invalid / unknown inputs, persistence, failure modes, regression of unrelated endpoints."""
import json

import pytest

from conftest import VALID


def post(client, url, body):
    return client.post(url, data=json.dumps(body), content_type="application/json")


# ── /api/assessment/submit ────────────────────────────────────────────────────
def test_submit_valid_returns_structured_result_and_persists(client, app, user_id, valid_payload):
    r = post(client, "/api/assessment/submit", dict(valid_payload, userId=user_id))
    assert r.status_code == 200, r.get_json()
    j = r.get_json()
    assert j["success"] and j["riskLevel"] == j["prediction"]["category"] in ("LOW", "MEDIUM", "HIGH")
    for key in ("prediction", "explanation", "bmi", "input_warnings", "inputs_used", "model", "limitations", "disclaimer"):
        assert key in j
    assert j["prediction"]["clinically_validated"] is False and "score" not in j["prediction"]

    from extensions import db
    from models_db.auth_model import User
    from models_db.user_model import UserProfile, AssessmentResult
    with app.app_context():
        prof = db.session.get(UserProfile, j["profileId"])
        assert prof.user_id == user_id and prof.risk_level == j["riskLevel"]
        assert prof.hormonal_changes == "postmenopausal"
        assert prof.risk_percentage is None                   # not a percentage
        assert AssessmentResult.query.filter_by(profile_id=prof.id).count() == 1
        assert db.session.get(User, user_id).has_completed_assessment is True


def test_submit_unknown_optionals_are_stored_as_unknown_not_invented(client, app, user_id):
    body = {"userId": user_id, "age": 70, "gender": "male"}
    r = post(client, "/api/assessment/submit", body)
    assert r.status_code == 200
    j = r.get_json()
    assert j["prediction"]["category"] == "MEDIUM"              # age 65+ is the only known factor
    assert not j["explanation"]["answers_complete"]
    from extensions import db
    from models_db.user_model import UserProfile
    with app.app_context():
        p = db.session.get(UserProfile, j["profileId"])
        assert (p.body_weight, p.calcium_intake, p.vitamin_d_intake, p.physical_activity) == ("unknown",) * 4
        assert p.family_history == "unknown"


def test_fracture_gives_high_through_the_api(client, user_id, valid_payload):
    j = post(client, "/api/assessment/submit", dict(valid_payload, userId=user_id, age=29,
                                                     fragility_fracture="yes")).get_json()
    assert j["riskLevel"] == "HIGH"


@pytest.mark.parametrize("patch,field", [
    ({"age": 12}, "age"), ({"gender": "robot"}, "gender"), ({"smoking": "maybe"}, "smoking"),
    ({"calcium_intake": "medium"}, "calcium_intake"), ({"alcohol": "lots"}, "alcohol"), ({"age": None}, "age"),
])
def test_submit_invalid_input_is_400_with_field_details(client, user_id, valid_payload, patch, field):
    r = post(client, "/api/assessment/submit", dict(valid_payload, userId=user_id, **patch))
    assert r.status_code == 400
    j = r.get_json()
    assert j["error"] == "Validation failed" and any(d["field"] == field for d in j["details"])
    assert "prediction" not in j


def test_submit_requires_user_and_json(client, valid_payload):
    assert post(client, "/api/assessment/submit", valid_payload).status_code == 400            # no userId
    assert client.post("/api/assessment/submit", data="not json", content_type="text/plain").status_code == 400
    assert post(client, "/api/assessment/submit", dict(valid_payload, userId="abc")).status_code == 400


def test_old_ml_frontend_field_names_are_rejected_not_silently_mapped(client, user_id):
    old = {"userId": user_id, "age": 55, "gender": "female", "smoking": "yes", "prior_fractures": "yes",
           "physical_activity": "sedentary", "calcium_intake": "low"}
    r = post(client, "/api/assessment/submit", old)
    assert r.status_code == 400                       # 'sedentary' / 'low' are no longer valid answers


# ── /predict (stateless) and /api/model/schema ────────────────────────────────
def test_predict_endpoint_is_stateless(client, app, valid_payload):
    from models_db.user_model import UserProfile
    with app.app_context():
        before = UserProfile.query.count()
    r = post(client, "/predict", valid_payload)
    assert r.status_code == 200 and r.get_json()["prediction"]["category"] in ("LOW", "MEDIUM", "HIGH")
    with app.app_context():
        assert UserProfile.query.count() == before


def test_schema_endpoint_lists_the_contract(client):
    j = client.get("/api/model/schema").get_json()
    from services import risk_screening as rs
    assert [f["name"] for f in j["fields"]] == rs.FEATURE_NAMES
    assert j["model"]["ready"] is True and j["model"]["type"] == "rule_based_screening"


# ── regression: unrelated functionality still works ───────────────────────────
def test_regression_health_and_root(client):
    assert client.get("/health").status_code == 200
    assert client.get("/").get_json()["status"] == "operational"
    assert client.get("/nope").status_code == 404


def test_regression_signup_signin_flow(client):
    r = post(client, "/signup", {"full_name": "Reg Test", "email": "reg@example.com", "password": "secret123", "username": "regtest"})
    assert r.status_code in (200, 201), r.get_json()
    assert post(client, "/signup", {"full_name": "Reg Test", "email": "reg@example.com", "password": "secret123", "username": "regtest"}).status_code == 409
    r = post(client, "/signin", {"username": "regtest", "password": "secret123"})
    assert r.status_code == 200 and "token" in json.dumps(r.get_json()).lower()


def test_regression_system_health_reports_screening(client):
    j = client.get("/api/system/health").get_json()
    ca = j["modules"]["clinical_assessment"]
    assert ca["status"] == "operational" and ca["ml_model"]["ready"] is True   # key name kept for compatibility


def test_regression_latest_risk_and_profile_use_stored_result(client, user_id, valid_payload):
    sub = post(client, "/api/assessment/submit", dict(valid_payload, userId=user_id)).get_json()
    lr = client.get(f"/user/{user_id}/latest-risk").get_json()
    assert lr["has_assessment"] and lr["risk_level"] == sub["riskLevel"]
    assert lr["risk_percentage"] is None and lr["model_score"] is None and lr["risk_factor_count"] >= 0
    pr = client.get(f"/profile/{user_id}").get_json()
    assert pr["hasCompletedAssessment"] and pr["latestAssessment"]["assessment_details"]["model"]["version"]
    assert client.get(f"/api/profile/{user_id}").status_code == 200
    assert client.get(f"/user/{user_id}/risk-history").status_code == 200
    assert client.get("/history").status_code == 200
