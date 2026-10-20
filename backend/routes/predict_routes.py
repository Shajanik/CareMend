"""
routes/predict_routes.py — POST /predict
=========================================
Stateless rule-based screening (nothing is written to the database;
use /api/assessment/submit for a stored, per-user assessment).

Request body = the fields in GET /api/model/schema, e.g.
{
    "age": 65, "gender": "female", "menopause_status": "postmenopausal",
    "fragility_fracture": "no", "parent_hip_fracture": "yes", "smoking": "no"
}
Response: see routes/assessment_routes.py (same structure, without profileId).
"""

from flask import Blueprint, request, jsonify
from services import risk_screening as om
from routes.assessment_routes import model_error_response

predict_bp = Blueprint("predict", __name__)


@predict_bp.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body required"}), 400
    try:
        result = om.predict(data)
    except Exception as exc:  # noqa: BLE001  (mapped to 400 / 503 / 500 safely)
        return model_error_response(exc)
    return jsonify({"riskLevel": result["prediction"]["category"], **result}), 200
