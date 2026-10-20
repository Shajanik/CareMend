"""
routes/nutrition_routes.py — AI Nutrition Assistant API endpoints
================================================================
Provides personalized weekly diet plans for bone health based on user profile.
"""

from flask import Blueprint, request, jsonify
from services.nutrition_service import nutrition_service
from models_db.user_model import UserProfile
from utils.logger import logger

nutrition_bp = Blueprint('nutrition', __name__)


@nutrition_bp.route('/api/nutrition/weekly-plan', methods=['POST'])
def generate_weekly_plan():
    """
    Generate a personalized weekly diet plan based on user profile.
    
    Expected JSON:
    {
        "user_id": 123,  // Optional: get profile from database
        "user_profile": {  // Optional: provide profile directly
            "risk_level": "MEDIUM",
            "risk_percentage": 65.5,
            "age": 55,
            "gender": "female",
            // ... other profile fields
        }
    }
    
    Returns:
    {
        "user_summary": {
            "risk_level": "MEDIUM",
            "risk_percentage": 65.5,
            "calcium_target": "1000-1200 mg/day",
            "focus": "Increased calcium + vitamin D rich foods"
        },
        "days": {
            "MONDAY": {
                "breakfast": {
                    "vegetarian": "...",
                    "non_vegetarian": "..."
                },
                "lunch": { ... },
                "dinner": { ... },
                "snacks": { ... }
            },
            // ... other days
        },
        "tips": {
            "daily_tips": [...],
            "regenerate_note": "..."
        }
    }
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        user_profile = data.get('user_profile', {})
        
        logger.info(f"Nutrition plan request: user_id={user_id}, has_profile={bool(user_profile)}")
        
        # If user_id provided but no profile, fetch from database
        if user_id and not user_profile:
            try:
                latest_profile = UserProfile.query.filter_by(user_id=user_id)\
                                                 .order_by(UserProfile.created_at.desc())\
                                                 .first()
                
                if latest_profile:
                    user_profile = {
                        'risk_level': latest_profile.risk_level,
                        'risk_percentage': latest_profile.risk_percentage,  # None for ML assessments (score is not a percentage)
                        'age': latest_profile.age,
                        'gender': latest_profile.gender,
                        'calcium_intake': latest_profile.calcium_intake,
                        'vitamin_d_intake': latest_profile.vitamin_d_intake,
                        'physical_activity': latest_profile.physical_activity,
                        'body_weight': latest_profile.body_weight
                    }
                    logger.info(f"Retrieved profile for user {user_id}: {latest_profile.risk_level}")
                else:
                    logger.warning(f"No profile found for user {user_id}")
                    
            except Exception as e:
                logger.error(f"Error fetching user profile: {e}")
        
        # Generate the weekly plan
        weekly_plan = nutrition_service.generate_weekly_plan(user_profile)
        
        # Check for errors
        if 'error' in weekly_plan:
            return jsonify(weekly_plan), 400
        
        logger.info(f"Generated nutrition plan for {user_profile.get('risk_level', 'unknown')} risk user")
        
        return jsonify(weekly_plan), 200
        
    except Exception as e:
        logger.error(f"Nutrition plan generation error: {str(e)}")
        return jsonify({
            'error': 'Failed to generate nutrition plan',
            'message': 'Please try again or contact support'
        }), 500


@nutrition_bp.route('/api/nutrition/quick-tips', methods=['POST'])
def get_quick_tips():
    """
    Get quick nutrition tips based on user's risk level.
    
    Expected JSON:
    {
        "user_id": 123,  // Optional
        "risk_level": "MEDIUM"  // Optional if user_id provided
    }
    
    Returns:
    {
        "risk_level": "MEDIUM",
        "calcium_target": "1000-1200 mg/day",
        "quick_tips": [
            "Drink 2 glasses of milk daily",
            "Include paneer or curd in meals",
            "Get 15-20 minutes morning sunlight"
        ]
    }
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        risk_level = data.get('risk_level', '').upper()
        
        # If user_id provided, fetch risk level from database
        if user_id and not risk_level:
            try:
                latest_profile = UserProfile.query.filter_by(user_id=user_id)\
                                                 .order_by(UserProfile.created_at.desc())\
                                                 .first()
                if latest_profile:
                    risk_level = latest_profile.risk_level.upper()
                    
            except Exception as e:
                logger.error(f"Error fetching user risk level: {e}")
        
        if not risk_level:
            return jsonify({
                'error': 'Please complete your clinical assessment to get personalized tips'
            }), 400
        
        # Get meal configuration for risk level
        config = nutrition_service.meal_templates.get(risk_level, nutrition_service.meal_templates["MEDIUM"])
        
        # Generate quick tips based on risk level
        if risk_level == "HIGH":
            quick_tips = [
                "🥛 Drink 3 glasses of milk daily",
                "🧀 Include 100g paneer in meals",
                "🌾 Add ragi roti to every meal",
                "🌰 Eat sesame seeds (til) daily",
                "☀️ Get 15-20 min morning sunlight",
                "⚠️ See doctor within 2 weeks"
            ]
        elif risk_level == "MEDIUM":
            quick_tips = [
                "🥛 Drink 2 glasses of milk daily",
                "🧀 Include curd or paneer in meals",
                "🥜 Eat almonds and nuts daily",
                "🌾 Add ragi 3-4 times per week",
                "☀️ Get 15-20 min morning sunlight",
                "📅 Schedule annual bone density scan"
            ]
        else:  # LOW
            quick_tips = [
                "🥛 Maintain 2 glasses of milk daily",
                "🧀 Include curd or paneer regularly",
                "🥜 Eat variety of nuts weekly",
                "🥬 Include green leafy vegetables",
                "☀️ Get 15-20 min morning sunlight",
                "🏃 Stay active with regular exercise"
            ]
        
        return jsonify({
            'risk_level': risk_level,
            'calcium_target': config['calcium_target'],
            'focus': config['focus'],
            'quick_tips': quick_tips
        }), 200
        
    except Exception as e:
        logger.error(f"Quick tips error: {str(e)}")
        return jsonify({
            'error': 'Failed to get nutrition tips',
            'message': 'Please try again'
        }), 500


@nutrition_bp.route('/api/nutrition/meal-suggestions', methods=['POST'])
def get_meal_suggestions():
    """
    Get meal suggestions for a specific meal type and risk level.
    
    Expected JSON:
    {
        "meal_type": "breakfast",  // breakfast, lunch, dinner, snacks
        "risk_level": "MEDIUM",
        "dietary_preference": "vegetarian"  // vegetarian, non_vegetarian, both
    }
    
    Returns:
    {
        "meal_type": "breakfast",
        "suggestions": {
            "vegetarian": ["...", "...", "..."],
            "non_vegetarian": ["...", "...", "..."]
        }
    }
    """
    try:
        data = request.get_json() or {}
        meal_type = data.get('meal_type', '').lower()
        risk_level = data.get('risk_level', 'MEDIUM').upper()
        dietary_preference = data.get('dietary_preference', 'both').lower()
        
        if meal_type not in ['breakfast', 'lunch', 'dinner', 'snacks']:
            return jsonify({
                'error': 'Invalid meal type. Use: breakfast, lunch, dinner, or snacks'
            }), 400
        
        # Generate multiple suggestions for the meal type
        suggestions = {}
        
        if meal_type == 'breakfast':
            method = nutrition_service._get_breakfast_options
        elif meal_type == 'lunch':
            method = nutrition_service._get_lunch_options
        elif meal_type == 'dinner':
            method = nutrition_service._get_dinner_options
        else:  # snacks
            method = nutrition_service._get_snack_options
        
        # Get 5 different suggestions
        veg_suggestions = []
        non_veg_suggestions = []
        
        for i in range(5):
            options = method(risk_level, i)
            veg_suggestions.append(options['vegetarian'])
            non_veg_suggestions.append(options['non_vegetarian'])
        
        if dietary_preference == 'vegetarian':
            suggestions['vegetarian'] = veg_suggestions
        elif dietary_preference == 'non_vegetarian':
            suggestions['non_vegetarian'] = non_veg_suggestions
        else:  # both
            suggestions['vegetarian'] = veg_suggestions
            suggestions['non_vegetarian'] = non_veg_suggestions
        
        return jsonify({
            'meal_type': meal_type,
            'risk_level': risk_level,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        logger.error(f"Meal suggestions error: {str(e)}")
        return jsonify({
            'error': 'Failed to get meal suggestions',
            'message': 'Please try again'
        }), 500