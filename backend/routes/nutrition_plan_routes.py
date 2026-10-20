"""
routes/nutrition_plan_routes.py — Nutrition Plan API endpoints
==============================================================
Personalized nutrition plan generation and management.
Uses personalized_plan_service for risk-stratified recommendations.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from extensions import db
from models_db.nutrition_model import NutritionPlan
from models_db.user_model import UserProfile
from models_db.auth_model import User
from services.personalized_plan_service import NutritionPlanGenerator
from utils.logger import logger

nutrition_plan_bp = Blueprint('nutrition_plan', __name__)


@nutrition_plan_bp.route('/api/nutrition/plan/<int:user_id>', methods=['GET'])
def get_nutrition_plan(user_id):
    """
    Get personalized nutrition plan for a user.
    
    ✓ Validates user exists
    ✓ Fetches latest risk assessment
    ✓ Generates fully personalized plan based on risk level
    ✓ Returns different plans for LOW/MEDIUM/HIGH risk
    
    Returns:
        {
            'success': bool,
            'plan': {...personalized nutrition plan...},
            'riskLevel': str,
            'personalizationScore': float (0-100),
            'source': str,
            'warnings': list[str],
            'lastAssessmentDate': str
        }
    """
    try:
        logger.info(f"🍽️ GET /api/nutrition/plan/{user_id} - Fetching nutrition plan")
        
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
        result = NutritionPlanGenerator.generate_plan(user_id)
        
        if not result:
            logger.error(f"Nutrition plan generation returned None for user {user_id}")
            return jsonify({
                'error': 'Failed to generate nutrition plan',
                'code': 'GENERATION_ERROR'
            }), 500
        
        # Log result
        if result['success']:
            logger.info(f"✅ Nutrition plan generated for user {user_id}: "
                       f"risk={result['riskLevel']}, personalization={result['personalizationScore']}%")
        else:
            logger.warning(f"⚠️ Fallback nutrition plan used for user {user_id}: {result['source']}")
        
        return jsonify(result), 200 if result['success'] else 206
        
    except Exception as e:
        logger.error(f"❌ Error getting nutrition plan for user {user_id}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Failed to get nutrition plan',
            'code': 'SERVER_ERROR',
            'details': str(e)
        }), 500


@nutrition_plan_bp.route('/api/nutrition/plan/<int:user_id>/regenerate', methods=['POST'])
def regenerate_nutrition_plan(user_id):
    """
    Regenerate nutrition plan for a user.
    Forces fresh plan generation from latest assessment.
    """
    try:
        logger.info(f"🔄 Regenerating nutrition plan for user {user_id}")
        
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
        result = NutritionPlanGenerator.generate_plan(user_id)
        
        if not result or not result['success']:
            logger.error(f"Failed to regenerate nutrition plan for user {user_id}")
            return jsonify({
                'error': 'Failed to regenerate nutrition plan',
                'code': 'REGENERATION_ERROR'
            }), 500
        
        logger.info(f"✅ Nutrition plan regenerated for user {user_id}")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"❌ Error regenerating nutrition plan for user {user_id}: {str(e)}")
        return jsonify({
            'error': 'Failed to regenerate nutrition plan',
            'code': 'REGENERATION_ERROR'
        }), 500


@nutrition_plan_bp.route('/api/nutrition/plan/<int:user_id>', methods=['DELETE'])
def delete_nutrition_plan(user_id):
    """
    Delete nutrition plan for a user.
    Plan will be regenerated on next access.
    """
    try:
        logger.info(f"🗑️ Deleting nutrition plan for user {user_id}")
        
        plan = NutritionPlan.query.filter_by(user_id=user_id).first()
        if plan:
            db.session.delete(plan)
            db.session.commit()
            logger.info(f"✅ Nutrition plan deleted for user {user_id}")
            return jsonify({
                'success': True,
                'message': 'Plan deleted. New plan will be generated on next access.'
            }), 200
        else:
            logger.warning(f"Plan not found for user {user_id}")
            return jsonify({
                'error': 'Plan not found'
            }), 404
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error deleting plan for user {user_id}: {str(e)}")
        return jsonify({
            'error': 'Failed to delete plan'
        }), 500
