"""
routes/assessment_routes.py — Clinical Assessment API endpoints
================================================================
Handles clinical assessment submission and profile management.
"""

from flask import Blueprint, request, jsonify
from services import risk_screening as om
from services.assessment_store import save_assessment
from utils.logger import logger
from extensions import db
from models_db.user_model import UserProfile
from models_db.auth_model import User

assessment_bp = Blueprint('assessment', __name__)


def model_error_response(exc: Exception):
    """Map service exceptions to safe HTTP responses (never a fabricated prediction)."""
    if isinstance(exc, om.InputValidationError):
        return jsonify({"error": "Validation failed", "details": exc.errors}), 400
    if isinstance(exc, om.ModelUnavailableError):
        logger.error(f"Model unavailable: {exc}")
        return jsonify({"error": "The prediction model is currently unavailable. Please try again later."}), 503
    logger.error(f"Prediction error: {exc}")
    return jsonify({"error": "Prediction failed. Please try again."}), 500


@assessment_bp.route('/api/assessment/submit', methods=['POST'])
def submit_assessment():
    """
    Apply the rule-based screening to the questionnaire answers and store the result.

    Request JSON (field names = services/risk_screening.py FEATURES; GET /api/model/schema lists them):
    {
        "userId": 123,
        "age": 55,                              // required, 18-100
        "gender": "female",                     // required: female | male
        "menopause_status": "postmenopausal",   // optional, females only: premenopausal | postmenopausal
        "height_cm": 160, "weight_kg": 58,      // optional, both or neither (BMI)
        "fragility_fracture": "no",             // yes | no | "unknown"
        "parent_hip_fracture": "no",            // yes | no | "unknown"
        "smoking": "no",                        // yes | no
        "alcohol": "none_low",                  // none_low | higher
        "physical_activity": "occasional",      // regular | occasional | inactive
        "calcium_intake": "adequate",           // adequate | possibly_inadequate
        "vitamin_d_status": "unknown",          // adequate | deficient | "unknown"
        "corticosteroids_long_term": "no",      // yes | no
        "rheumatoid_arthritis": "no",           // yes | no
        "dxa_result": "unknown"                 // normal | osteopenia | osteoporosis | "unknown"
    }

    Response 200: { success, profileId, riskLevel, prediction, explanation, bmi,
                    input_warnings, inputs_used, model, limitations, disclaimer }
    400 validation errors · 503 model unavailable · 500 other failure.
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body required"}), 400

    user_id = data.get('userId')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'User ID must be an integer'}), 400

    try:
        result = om.predict(data)
    except (om.InputValidationError, om.ModelUnavailableError, om.PredictionError) as exc:
        return model_error_response(exc)
    except Exception as exc:  # noqa: BLE001
        return model_error_response(exc)

    try:
        profile = save_assessment(user_id, result)
        user = db.session.get(User, user_id)
        if user:
            user.has_completed_assessment = True
            db.session.add(user)
        db.session.commit()
        logger.info(f"Assessment saved: user={user_id} profile={profile.id} "
                    f"category={result['prediction']['category']} model=v{result['model']['version']}")
    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        logger.error(f"Database save failed: {exc}")
        return jsonify({'error': 'Failed to save assessment data'}), 500

    return jsonify({
        "success": True,
        "profileId": profile.id,
        "riskLevel": result["prediction"]["category"],
        **result,
    }), 200


@assessment_bp.route('/api/model/schema', methods=['GET'])
def model_schema():
    """Public description of the model's input contract and status (no user data)."""
    return jsonify({
        "model": om.model_status(),
        "fields": om.input_schema(),
        "unknown_tokens": ["unknown", "not_sure"],
    }), 200


@assessment_bp.route('/api/profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    """
    Get user profile and assessment status.
    
    Returns:
    {
        "hasCompletedAssessment": true,
        "user": { ... user data ... },
        "latestAssessment": { ... assessment data ... }
    }
    """
    try:
        # Get user data
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get latest assessment
        latest_assessment = UserProfile.query.filter_by(user_id=user_id)\
                                           .order_by(UserProfile.created_at.desc())\
                                           .first()
        
        result = {
            'hasCompletedAssessment': user.has_completed_assessment,
            'user': user.to_dict()
        }
        
        if latest_assessment:
            result['latestAssessment'] = latest_assessment.to_dict()
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Profile retrieval error for user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to retrieve profile'}), 500
