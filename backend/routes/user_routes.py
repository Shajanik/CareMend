"""
routes/user_routes.py — User-specific data endpoints
====================================================
Handles user profile and risk assessment retrieval.
"""

from flask import Blueprint, request, jsonify
from utils.logger import logger
from extensions import db
from models_db.user_model import UserProfile
from models_db.auth_model import User

user_bp = Blueprint("user", __name__)



def _risk_factor_texts(saved):
    """Human-readable risk factors from a stored assessment (new rule-based or older ML rows)."""
    expl = (saved or {}).get("explanation", {})
    if "risk_factors" in expl:
        return [f["label"] for f in expl["risk_factors"]]
    return [f"{d['label']}: {d['value']} ({d['effect']} the model score)" for d in expl.get("drivers", [])]


@user_bp.route("/profile/<int:user_id>", methods=["GET"])
@user_bp.route("/api/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    """
    Get user profile with assessment status and latest assessment data.
    
    Returns:
    {
        "id": user_id,
        "full_name": "John Doe",
        "email": "john@example.com",
        "hasCompletedAssessment": true,
        "latestAssessment": {
            "id": 123,
            "risk_level": "LOW",
            "risk_percentage": 12.5,
            "age": 45,
            "gender": "male",
            "calcium_intake": "normal",
            "vitamin_d_intake": "normal",
            "physical_activity": "moderate",
            "body_weight": "normal"
        }
    }
    """
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get latest assessment profile
        latest_profile = UserProfile.query.filter_by(user_id=user_id)\
                                         .order_by(UserProfile.created_at.desc())\
                                         .first()
        
        response = {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "username": user.username,
            "mobile": user.mobile,
            "hasCompletedAssessment": latest_profile is not None,
            "has_completed_assessment": latest_profile is not None,
        }
        
        # Include latest assessment data if available
        if latest_profile:
            # Stored ML response (explanation drivers, guidance). Legacy rows made before the
            # ML model have none; they are returned without invented factors.
            from services.assessment_store import load_saved_result
            saved = load_saved_result(latest_profile.id)
            risk_factors = _risk_factor_texts(saved)

            response["latestAssessment"] = {
                "id": latest_profile.id,
                "risk_level": latest_profile.risk_level,
                "risk_percentage": latest_profile.risk_percentage,
                "age": latest_profile.age,
                "gender": latest_profile.gender,
                "calcium_intake": latest_profile.calcium_intake,
                "vitamin_d_intake": latest_profile.vitamin_d_intake,
                "physical_activity": latest_profile.physical_activity,
                "body_weight": latest_profile.body_weight,
                "family_history": latest_profile.family_history,
                "hormonal_changes": latest_profile.hormonal_changes,
                "risk_factors": risk_factors,
                "recommendations": [],
                "assessment_details": saved,   # None for legacy (pre-ML) assessments
                "created_at": latest_profile.created_at.isoformat()
            }
        
        logger.info(f"Retrieved profile for user {user_id}: assessment={latest_profile is not None}")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error retrieving profile for user {user_id}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to retrieve profile"}), 500


@user_bp.route("/user/<int:user_id>/latest-risk", methods=["GET"])
def get_latest_risk(user_id):
    """
    Get the latest risk assessment for a user.
    
    Returns:
    {
        "has_assessment": true,
        "profile_id": 123,
        "risk_percentage": 78.5,
        "risk_category": "HIGH",
        "risk_level": "HIGH",  // Legacy compatibility
        "risk_score": 2,       // Legacy compatibility (0-2)
        "age": 65,
        "gender": "female",
        "created_at": "2024-01-15T10:30:00",
        "risk_factors": [...],
        "recommendations": [...]
    }
    """
    try:
        # Get the latest risk assessment for this user
        latest_profile = UserProfile.query.filter_by(user_id=user_id)\
                                         .order_by(UserProfile.created_at.desc())\
                                         .first()
        
        if not latest_profile:
            return jsonify({
                "has_assessment": False,
                "message": "No risk assessment found for this user"
            }), 200
        
        from services.assessment_store import load_saved_result
        saved = load_saved_result(latest_profile.id)   # None for legacy (pre-ML) assessments

        result = {
            "has_assessment": True,
            "profile_id": latest_profile.id,
            "user_id": user_id,
            "risk_percentage": latest_profile.risk_percentage,  # None for ML assessments (score is not a percentage)
            "model_score": None,   # rule-based screening has no score
            "risk_factor_count": (saved or {}).get("explanation", {}).get("factor_count"),
            "risk_category": latest_profile.risk_level,
            "risk_level": latest_profile.risk_level,  # Legacy compatibility
            "risk_score": latest_profile.risk_score,  # Legacy compatibility
            "age": latest_profile.age,
            "gender": latest_profile.gender,
            "hormonal_changes": latest_profile.hormonal_changes,
            "family_history": latest_profile.family_history,
            "body_weight": latest_profile.body_weight,
            "calcium_intake": latest_profile.calcium_intake,
            "vitamin_d_intake": latest_profile.vitamin_d_intake,
            "physical_activity": latest_profile.physical_activity,
            "created_at": latest_profile.created_at.isoformat(),
            "risk_factors": _risk_factor_texts(saved),
            "recommendations": [],
            "source": f"Rule-based screening {saved['model']['version']} (experimental)" if saved else "legacy assessment",
            "assessment_details": saved,
        }
        
        logger.info(f"Retrieved latest risk for user_id={user_id}: {latest_profile.risk_level} ({latest_profile.risk_percentage}%)")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving latest risk for user {user_id}: {e}")
        return jsonify({
            "error": "Failed to retrieve risk assessment",
            "has_assessment": False
        }), 500


@user_bp.route("/user/<int:user_id>/risk-history", methods=["GET"])
def get_risk_history(user_id):
    """
    Get all risk assessments for a user (most recent first).
    
    Query params:
    - limit: number of results (default: 10)
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)  # Cap at 50
        
        profiles = UserProfile.query.filter_by(user_id=user_id)\
                                  .order_by(UserProfile.created_at.desc())\
                                  .limit(limit)\
                                  .all()
        
        if not profiles:
            return jsonify({
                "assessments": [],
                "count": 0,
                "message": "No risk assessments found for this user"
            }), 200
        
        assessments = []
        for profile in profiles:
            assessments.append({
                "profile_id": profile.id,
                "risk_percentage": profile.risk_percentage,
                "risk_category": profile.risk_level,
                "age": profile.age,
                "created_at": profile.created_at.isoformat(),
            })
        
        return jsonify({
            "assessments": assessments,
            "count": len(assessments),
            "user_id": user_id
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving risk history for user {user_id}: {e}")
        return jsonify({
            "error": "Failed to retrieve risk history",
            "assessments": []
        }), 500


@user_bp.route("/user/<int:user_id>/profile", methods=["GET"])
def get_user_profile(user_id):
    """
    Get user account information.
    """
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error retrieving user profile {user_id}: {e}")
        return jsonify({"error": "Failed to retrieve user profile"}), 500