"""
services/groq_service.py — Groq AI Integration for CareConnect
================================================================
Using Groq API instead of Gemini for faster AI responses
"""

import os
import json
from config import GROQ_API_KEY
from utils.logger import logger

# Try to import groq library
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    logger.warning("[INFO] Groq library not installed. Install with: pip install groq")
    GROQ_AVAILABLE = False


def generate_personalized_exercise_plan(assessment_data: dict) -> dict:
    """
    Generate personalized exercise plan using Groq API based on assessment
    
    Args:
        assessment_data: User's assessment results with health profile
        
    Returns:
        dict: Exercise plan with daily recommendations
    """
    if not GROQ_AVAILABLE:
        logger.warning("[WARNING] Groq library not available - returning fallback plan")
        return get_fallback_exercise_plan(assessment_data)
    
    if not GROQ_API_KEY:
        logger.warning("[WARNING] GROQ_API_KEY not set - using fallback plan")
        return get_fallback_exercise_plan(assessment_data)
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        # Build profile summary from assessment
        risk_level = assessment_data.get('risk_level', 'MODERATE').upper()
        age = assessment_data.get('age', 50)
        activity_level = assessment_data.get('physical_activity', 'Moderate')
        
        prompt = f"""Based on the following health assessment, create a personalized 7-day exercise plan:

Health Profile:
- Risk Level: {risk_level}
- Age: {age}
- Current Activity Level: {activity_level}
- Family History of Osteoporosis: {assessment_data.get('family_history', 'No')}
- Previous Fractures: {assessment_data.get('previous_fractures', 'No')}

Please provide a structured JSON response with the following format:
{{
    "plan_title": "Your Personalized Exercise Plan",
    "risk_level": "{risk_level}",
    "duration": "7 days",
    "daily_exercises": [
        {{
            "day": "Monday",
            "focus": "Strength training",
            "exercises": [
                {{
                    "name": "Exercise name",
                    "duration": "15 minutes",
                    "reps": "3 sets x 10 reps",
                    "description": "How to perform the exercise",
                    "benefits": "Why this helps bone health"
                }}
            ],
            "total_duration": "45 minutes"
        }}
    ],
    "safety_tips": [
        "Tip 1",
        "Tip 2"
    ],
    "progression": "How to increase difficulty"
}}

Generate realistic, bone-health focused exercises appropriate for {risk_level} risk level."""
        
        response = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2048
        )
        
        # Extract and parse response
        response_text = response.choices[0].message.content
        
        # Try to parse as JSON
        try:
            exercise_plan = json.loads(response_text)
            logger.info(f"[OK] Generated personalized exercise plan using Groq")
            return exercise_plan
        except json.JSONDecodeError:
            # If not valid JSON, wrap in structure
            logger.warning("[WARNING] Response was not valid JSON, wrapping in structure")
            return {
                "plan_title": "Your Personalized Exercise Plan",
                "risk_level": risk_level,
                "recommendations": response_text,
                "source": "groq"
            }
            
    except Exception as e:
        logger.error(f"[ERROR] Groq API error: {str(e)}")
        return get_fallback_exercise_plan(assessment_data)


def generate_personalized_diet_plan(assessment_data: dict) -> dict:
    """
    Generate personalized diet plan using Groq API based on assessment
    
    Args:
        assessment_data: User's assessment results with health profile
        
    Returns:
        dict: Weekly meal plan with nutritional recommendations
    """
    if not GROQ_AVAILABLE:
        logger.warning("[WARNING] Groq library not available - returning fallback plan")
        return get_fallback_diet_plan(assessment_data)
    
    if not GROQ_API_KEY:
        logger.warning("[WARNING] GROQ_API_KEY not set - using fallback plan")
        return get_fallback_diet_plan(assessment_data)
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        # Build profile summary from assessment
        risk_level = assessment_data.get('risk_level', 'MODERATE').upper()
        calcium_level = assessment_data.get('calcium_intake', 'Low')
        vitamin_d = assessment_data.get('vitamin_d_intake', 'Insufficient')
        age = assessment_data.get('age', 50)
        
        prompt = f"""Based on the following health assessment, create a personalized 7-day diet plan for bone health:

Health Profile:
- Risk Level: {risk_level}
- Age: {age}
- Current Calcium Intake: {calcium_level}
- Vitamin D Intake: {vitamin_d}

Please provide a structured JSON response with weekly meal recommendations:
{{
    "plan_title": "Your Personalized Nutrition Plan",
    "risk_level": "{risk_level}",
    "duration": "7 days",
    "daily_meals": [
        {{
            "day": "Monday",
            "breakfast": {{
                "meal": "Meal name",
                "ingredients": ["ingredient 1", "ingredient 2"],
                "calcium_content": "mg",
                "vitamin_d_content": "IU"
            }},
            "lunch": {{ "meal": "...", "ingredients": [...], "calcium_content": "...", "vitamin_d_content": "..." }},
            "dinner": {{ "meal": "...", "ingredients": [...], "calcium_content": "...", "vitamin_d_content": "..." }},
            "snacks": [ {{ "meal": "...", "calcium_content": "..." }} ]
        }}
    ],
    "daily_targets": {{
        "calcium_mg": 1200,
        "vitamin_d_iu": 800,
        "protein_g": 50
    }},
    "foods_to_avoid": ["Food 1", "Food 2"],
    "supplements_recommended": ["Supplement 1"]
}}

Focus on calcium-rich foods, vitamin D sources, and foods that support bone health for someone with {risk_level} osteoporosis risk."""
        
        response = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2048
        )
        
        # Extract and parse response
        response_text = response.choices[0].message.content
        
        # Try to parse as JSON
        try:
            diet_plan = json.loads(response_text)
            logger.info(f"[OK] Generated personalized diet plan using Groq")
            return diet_plan
        except json.JSONDecodeError:
            # If not valid JSON, wrap in structure
            logger.warning("[WARNING] Response was not valid JSON, wrapping in structure")
            return {
                "plan_title": "Your Personalized Nutrition Plan",
                "risk_level": risk_level,
                "recommendations": response_text,
                "source": "groq"
            }
            
    except Exception as e:
        logger.error(f"[ERROR] Groq API error: {str(e)}")
        return get_fallback_diet_plan(assessment_data)


def generate_careconnect_response(user_profile: dict, user_question: str, conversation_history: list = None) -> dict:
    """
    Generate conversational AI response for CareConnect using Groq
    
    Args:
        user_profile: User's health profile
        user_question: Current question from user
        conversation_history: Previous messages in format [{"role": "user/assistant", "content": "..."}]
        
    Returns:
        dict: Response with answer and metadata
    """
    if conversation_history is None:
        conversation_history = []
    
    if not GROQ_AVAILABLE:
        logger.warning("[WARNING] Groq library not available - using fallback")
        return get_fallback_response(user_question)
    
    if not GROQ_API_KEY:
        logger.warning("[WARNING] GROQ_API_KEY not set - using fallback")
        return get_fallback_response(user_question)
    
    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        # Build messages list with system instruction
        messages = [
            {
                "role": "system",
                "content": """You are CareConnect, an AI-assisted healthcare educator specializing in bone health and osteoporosis prevention.

CONVERSATION STYLE:
- Respond naturally and conversationally
- Remember previous messages and build on them
- Use "you" to address the user directly
- Keep responses friendly, warm, and human-like
- Answer the user's actual question first and directly

PERSONALIZATION:
- Use profile data only when relevant
- Do NOT always mention risk scores
- Keep responses practical and educational

SAFETY BOUNDARIES:
- You are NOT a diagnostic system
- Do not prescribe medications or diagnose diseases
- Direct users to healthcare providers for medical decisions
- Maintain professional healthcare educator role"""
            }
        ]
        
        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current question
        messages.append({"role": "user", "content": user_question})
        
        response = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )
        
        answer = response.choices[0].message.content
        logger.info("[OK] Generated CareConnect response using Groq")
        
        return {
            "answer": answer,
            "source": "groq",
            "model": "llama-3.1-70b-versatile"
        }
        
    except Exception as e:
        logger.error(f"[ERROR] Groq API error: {str(e)}")
        return get_fallback_response(user_question)


def get_fallback_exercise_plan(assessment_data: dict) -> dict:
    """Get fallback exercise plan when Groq is unavailable"""
    risk_level = assessment_data.get('risk_level', 'MODERATE').upper()
    
    if risk_level == 'HIGH':
        exercises = [
            {"name": "Walking", "duration": "20 min", "frequency": "Daily", "intensity": "Low"},
            {"name": "Tai Chi", "duration": "30 min", "frequency": "3x/week", "intensity": "Low"},
            {"name": "Water Aerobics", "duration": "30 min", "frequency": "2x/week", "intensity": "Low-Moderate"}
        ]
    elif risk_level == 'MEDIUM':
        exercises = [
            {"name": "Brisk Walking", "duration": "30 min", "frequency": "Daily", "intensity": "Moderate"},
            {"name": "Weight Training", "duration": "20 min", "frequency": "3x/week", "intensity": "Moderate"},
            {"name": "Yoga", "duration": "30 min", "frequency": "3x/week", "intensity": "Moderate"}
        ]
    else:  # LOW
        exercises = [
            {"name": "Jogging/Running", "duration": "30 min", "frequency": "4x/week", "intensity": "Moderate-High"},
            {"name": "Strength Training", "duration": "30 min", "frequency": "3x/week", "intensity": "High"},
            {"name": "Sports", "duration": "45 min", "frequency": "2x/week", "intensity": "High"}
        ]
    
    return {
        "plan_title": "Your Personalized Exercise Plan",
        "risk_level": risk_level,
        "duration": "7 days",
        "daily_exercises": exercises,
        "source": "fallback"
    }


def get_fallback_diet_plan(assessment_data: dict) -> dict:
    """Get fallback diet plan when Groq is unavailable"""
    risk_level = assessment_data.get('risk_level', 'MODERATE').upper()
    
    calcium_foods = [
        "Milk and dairy products",
        "Leafy green vegetables (broccoli, kale)",
        "Fortified plant-based milks",
        "Fish with bones (salmon, sardines)",
        "Almonds and seeds"
    ]
    
    vitamin_d_foods = [
        "Fatty fish (salmon, mackerel, herring)",
        "Egg yolks",
        "Fortified milk and cereals",
        "Mushrooms exposed to sunlight",
        "Fish liver oil"
    ]
    
    return {
        "plan_title": "Your Personalized Nutrition Plan",
        "risk_level": risk_level,
        "daily_targets": {
            "calcium_mg": 1200,
            "vitamin_d_iu": 800,
            "protein_g": 50
        },
        "calcium_rich_foods": calcium_foods,
        "vitamin_d_sources": vitamin_d_foods,
        "foods_to_avoid": ["Excessive caffeine", "High sodium foods", "Alcohol"],
        "source": "fallback"
    }


def get_fallback_response(question: str) -> dict:
    """Get fallback response when Groq is unavailable"""
    fallback_responses = {
        "exercise": "Regular weight-bearing exercises like walking, jogging, and resistance training are excellent for bone health. Aim for 30 minutes most days of the week.",
        "calcium": "Adults need about 1000-1200mg of calcium daily. Good sources include dairy products, leafy greens, fortified plant-based milks, and fish with bones.",
        "vitamin d": "Vitamin D helps your body absorb calcium. Aim for 600-800 IU daily through sunlight exposure, fatty fish, egg yolks, or supplements.",
        "osteoporosis": "Osteoporosis is a condition where bones become weak and brittle. Regular exercise, adequate calcium and vitamin D, and avoiding smoking and excess alcohol can help prevent it.",
    }
    
    question_lower = question.lower()
    for key, response in fallback_responses.items():
        if key in question_lower:
            return {"answer": response, "source": "fallback"}
    
    return {
        "answer": "I can help with questions about bone health, exercise, nutrition, and osteoporosis prevention. Please ask a specific question!",
        "source": "fallback"
    }
