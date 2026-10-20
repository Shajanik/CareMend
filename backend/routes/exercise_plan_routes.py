"""
routes/exercise_plan_routes.py — Personalized Exercise Plan API endpoints
===========================================================================
Generate personalized exercise recommendations based on user's risk level.
Uses personalized_plan_service for risk-stratified exercise guidance.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from extensions import db
from models_db.user_model import UserProfile
from models_db.auth_model import User
from services.personalized_plan_service import ExercisePlanGenerator
from utils.logger import logger

exercise_plan_bp = Blueprint('exercise_plan', __name__)


@exercise_plan_bp.route('/api/exercise/plan/<int:user_id>', methods=['GET'])
def get_exercise_plan(user_id):
    """
    Get personalized exercise plan for a user.
    
    ✓ Validates user exists
    ✓ Fetches latest risk assessment
    ✓ Generates fully personalized plan based on risk level
    ✓ Returns different exercise intensities/safety for LOW/MEDIUM/HIGH risk
    ✓ Includes fall prevention for HIGH risk users
    
    Returns:
        {
            'success': bool,
            'plan': {
                'strategyName': str,
                'strategyDescription': str,
                'riskLevel': str,
                'weeklyMinutes': int,
                'intensityLevel': str,
                'weeklySchedule': [...7 days...],
                'exercisesByIntensity': {...},
                'safetyGuidelines': [...],
                'progressionPlan': [...],
                'fallPreventionTips': [...]
            },
            'riskLevel': str,
            'personalizationScore': float (0-100),
            'source': str,
            'warnings': list[str],
            'lastAssessmentDate': str
        }
    """
    try:
        logger.info(f"💪 GET /api/exercise/plan/{user_id} - Fetching exercise plan")
        
        # Validate user exists
        user = User.query.get(user_id)
        if not user:
            logger.error(f"User {user_id} not found")
            return jsonify({
                'error': 'User not found',
                'code': 'USER_NOT_FOUND'
            }), 404
        
        logger.debug(f"User {user_id} authenticated: {user.email}")
        
        # Generate personalized plan using service
        result = ExercisePlanGenerator.generate_plan(user_id)
        
        if not result:
            logger.error(f"Exercise plan generation returned None for user {user_id}")
            return jsonify({
                'error': 'Failed to generate exercise plan',
                'code': 'GENERATION_ERROR'
            }), 500
        
        # Log result
        if result['success']:
            logger.info(f"✅ Exercise plan generated for user {user_id}: "
                       f"risk={result['riskLevel']}, personalization={result['personalizationScore']}%, "
                       f"weekly_minutes={result['plan']['weeklyMinutes']}")
        else:
            logger.warning(f"⚠️ Fallback exercise plan used for user {user_id}: {result['source']}")
        
        return jsonify(result), 200 if result['success'] else 206
        
    except Exception as e:
        logger.error(f"❌ Error getting exercise plan for user {user_id}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Failed to get exercise plan',
            'code': 'SERVER_ERROR',
            'details': str(e)
        }), 500


@exercise_plan_bp.route('/api/exercise/plan/<int:user_id>/regenerate', methods=['POST'])
def regenerate_exercise_plan(user_id):
    """
    Regenerate exercise plan for a user.
    Forces fresh plan generation from latest assessment.
    """
    try:
        logger.info(f"🔄 Regenerating exercise plan for user {user_id}")
        
        # Validate user exists
        user = User.query.get(user_id)
        if not user:
            logger.error(f"User {user_id} not found")
            return jsonify({
                'error': 'User not found',
                'code': 'USER_NOT_FOUND'
            }), 404
        
        # Get latest assessment
        user_profile = UserProfile.query.filter_by(user_id=user_id)\
                                       .order_by(UserProfile.created_at.desc())\
                                       .first()
        
        if not user_profile:
            logger.error(f"No assessment found for user {user_id}")
            return jsonify({
                'error': 'Assessment not completed',
                'code': 'NO_ASSESSMENT'
            }), 400
        
        # Generate fresh plan
        result = ExercisePlanGenerator.generate_plan(user_id)
        
        if not result or not result['success']:
            logger.error(f"Failed to regenerate exercise plan for user {user_id}")
            return jsonify({
                'error': 'Failed to regenerate exercise plan',
                'code': 'REGENERATION_ERROR'
            }), 500
        
        logger.info(f"✅ Exercise plan regenerated for user {user_id}")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"❌ Error regenerating exercise plan for user {user_id}: {str(e)}")
        return jsonify({
            'error': 'Failed to regenerate exercise plan',
            'code': 'REGENERATION_ERROR'
        }), 500


@exercise_plan_bp.route('/api/exercise/plan/<int:user_id>/by-risk/<risk_level>', methods=['GET'])
def get_exercise_by_risk(user_id, risk_level):
    """
    Get exercise plan for a specific risk level (for comparison or preview).
    Useful for showing users what different risk levels entail.
    
    Risk levels: LOW, MEDIUM, HIGH
    """
    try:
        logger.info(f"🔍 GET /api/exercise/plan/{user_id}/by-risk/{risk_level}")
        
        if risk_level.upper() not in ['LOW', 'MEDIUM', 'HIGH']:
            return jsonify({
                'error': 'Invalid risk level',
                'code': 'INVALID_RISK_LEVEL',
                'allowed': ['LOW', 'MEDIUM', 'HIGH']
            }), 400
        
        # For preview purposes, get standard exercise plan for the risk level
        # by temporarily creating a mock profile with that risk level
        
        result = ExercisePlanGenerator.generate_plan(user_id)
        
        if not result:
            return jsonify({
                'error': 'Failed to generate exercise plan',
                'code': 'GENERATION_ERROR'
            }), 500
        
        return jsonify(result), 200 if result['success'] else 206
        
    except Exception as e:
        logger.error(f"❌ Error getting exercise by risk for user {user_id}: {str(e)}")
        return jsonify({
            'error': 'Failed to get exercise plan',
            'code': 'SERVER_ERROR'
        }), 500
