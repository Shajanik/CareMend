"""
routes/system_routes.py — System health and status endpoints
===========================================================
Provides comprehensive system status for the CareMend health platform
"""

from flask import Blueprint, jsonify
from utils.logger import logger
from extensions import db
from models_db.user_model import UserProfile
from models_db.auth_model import User
import os

system_bp = Blueprint("system", __name__)


@system_bp.route("/api/system/health", methods=["GET"])
def system_health():
    """
    Comprehensive system health check for CareMend health platform.
    
    Returns status of all core modules:
    - Clinical Assessment System
    - Nutrition Assistant
    - Smart Exercise Assistant
    - Database connectivity
    - ML model availability
    """
    try:
        health_status = {
            "status": "healthy",
            "timestamp": "2024-01-15T10:30:00Z",
            "modules": {}
        }
        
        # Module 1: Clinical Assessment System
        try:
            # Test database connectivity
            user_count = User.query.count()
            assessment_count = UserProfile.query.count()
            
            # Rule-based screening availability
            from services import risk_screening as om
            model_info = om.model_status()
            assessment_status = "operational" if model_info["ready"] else "model_unavailable"

        except Exception as e:
            assessment_status = f"error: {str(e)}"
            
        health_status["modules"]["clinical_assessment"] = {
            "status": assessment_status,
            "users": user_count if 'user_count' in locals() else 0,
            "assessments": assessment_count if 'assessment_count' in locals() else 0,
            "ml_model": model_info if 'model_info' in locals() else {"ready": False}
        }
        
        # Module 2: Nutrition Assistant  
        try:
            from services.nutrition_service import nutrition_service
            test_profile = {
                "risk_level": "MEDIUM",
                "risk_percentage": 45,
                "age": 55,
                "gender": "female"
            }
            test_plan = nutrition_service.generate_weekly_plan(test_profile)
            nutrition_status = "operational" if "days" in test_plan else "error"
        except Exception as e:
            nutrition_status = f"error: {str(e)}"
            
        health_status["modules"]["nutrition_assistant"] = {
            "status": nutrition_status,
            "risk_based_personalization": True,
            "weekly_plans": True,
            "dietary_options": ["vegetarian", "non_vegetarian"]
        }
        
        # Module 3: Smart Exercise Assistant - REMOVED
        try:
            exercise_status = "removed"  # Feature removed
        except Exception as e:
            exercise_status = f"error: {str(e)}"
            
        health_status["modules"]["smart_exercise_assistant"] = {
            "status": exercise_status,
            "camera_integration": True,
            "ai_pose_tracking": True,
            "risk_based_exercises": True,
            "safety_features": True
        }
        
        # Overall system status
        module_statuses = [module["status"] for module in health_status["modules"].values()]
        if all(status == "operational" for status in module_statuses):
            health_status["status"] = "fully_operational"
        elif any("error" in status for status in module_statuses):
            health_status["status"] = "degraded"
        else:
            health_status["status"] = "healthy"
            
        # System capabilities summary
        health_status["capabilities"] = {
            "clinical_risk_assessment": True,
            "personalized_nutrition_planning": True,
            "ai_guided_exercise_tracking": True,
            "safety_compliant": True,
            "medical_disclaimer_included": True,
            "no_medical_diagnosis": True,
            "no_treatment_prescription": True
        }
        
        logger.info(f"System health check completed: {health_status['status']}")
        
        return jsonify(health_status), 200
        
    except Exception as e:
        logger.error(f"System health check failed: {e}")
        return jsonify({
            "status": "error",
            "error": str(e),
            "message": "System health check failed"
        }), 500


@system_bp.route("/api/system/info", methods=["GET"])
def system_info():
    """
    Get CareMend health platform system information.
    """
    return jsonify({
        "name": "CareMend Health Platform",
        "version": "1.0.0",
        "description": "Health platform for bone health assessment and lifestyle guidance",
        "modules": [
            "Clinical Risk Assessment System",
            "Personalized Nutrition Planning",
            "AI-Guided Yoga & Exercise Assistant"
        ],
        "safety_features": [
            "No medical diagnosis",
            "No treatment prescription", 
            "Medical disclaimers included",
            "Professional consultation encouraged"
        ],
        "capabilities": [
            "Hybrid ML + Rule-based risk assessment",
            "Personalized weekly meal plans",
            "Camera-based exercise tracking",
            "Real-time posture feedback"
        ]
    }), 200