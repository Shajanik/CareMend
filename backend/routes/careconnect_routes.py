"""
routes/careconnect_routes.py — CareConnect API endpoints
======================================================
AI-assisted doctor-patient guidance system endpoints.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
from extensions import db
from models_db.careconnect_model import CareConnectQuery, CareConnectCategory, CareConnectDoctor
from models_db.user_model import UserProfile, CareConnectConversation
from utils.logger import logger

careconnect_bp = Blueprint('careconnect', __name__)


@careconnect_bp.route('/api/careconnect/ask-and-save', methods=['POST'])
def ask_and_save_query():
    """
    DEPRECATED: This endpoint is no longer used.
    All queries now go directly to doctors via submit-to-doctor.
    This is kept for backwards compatibility.
    """
    return jsonify({
        'success': False,
        'error': 'This endpoint is deprecated. Please use /api/careconnect/submit-to-doctor instead.',
        'code': 'ENDPOINT_DEPRECATED'
    }), 410


@careconnect_bp.route('/api/careconnect/submit-to-doctor', methods=['POST'])
def submit_to_doctor():
    """
    Submit a query to doctor for review.
    Can be a new question or an existing query.
    
    Expected JSON:
    {
        "userId": 123,
        "question": "I have severe pain...",
        "queryId": 456  // Optional: if updating existing query
    }
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        question = data.get('question', '').strip()
        query_id = data.get('queryId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required', 'code': 'NO_USER_ID'}), 400
        
        if not question and not query_id:
            return jsonify({'error': 'Question or Query ID is required', 'code': 'NO_QUESTION'}), 400
        
        # Get user profile
        user_profile = UserProfile.query.filter_by(user_id=user_id).order_by(UserProfile.created_at.desc()).first()
        
        if query_id:
            # Update existing query
            query = CareConnectQuery.query.get(query_id)
            if not query:
                return jsonify({'error': 'Query not found', 'code': 'QUERY_NOT_FOUND'}), 404
            
            if query.user_id != user_id:
                return jsonify({'error': 'Unauthorized', 'code': 'UNAUTHORIZED'}), 403
            
            query.submitted_to_doctor = True
            query.status = 'pending_doctor'
            query.reviewed_at = datetime.utcnow()
        else:
            # Create new query for doctor
            ai_category = categorize_query(question)
            ai_summary = generate_ai_summary(question, user_profile)
            
            query = CareConnectQuery(
                user_id=user_id,
                question=question,
                category=ai_category,
                ai_summary=ai_summary,
                status='pending_doctor',
                submitted_to_doctor=True,
                reviewed_at=datetime.utcnow()
            )
            db.session.add(query)
        
        db.session.commit()
        
        logger.info(f"Query submitted to doctor - Query ID: {query.id}, User: {user_id}")
        
        return jsonify({
            'success': True,
            'queryId': query.id,
            'category': query.category,
            'status': 'pending_doctor',
            'estimatedResponseTime': '24-48 hours',
            'message': 'Your query has been submitted to a healthcare professional'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Submit to doctor error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to submit query',
            'code': 'SUBMISSION_ERROR'
        }), 500


@careconnect_bp.route('/api/careconnect/queries/<int:user_id>', methods=['GET'])
def get_user_queries(user_id):
    """
    Get all queries for a specific user.
    """
    try:
        queries = CareConnectQuery.query.filter_by(user_id=user_id)\
                                      .order_by(CareConnectQuery.created_at.desc())\
                                      .all()
        
        return jsonify({
            'success': True,
            'queries': [query.to_dict() for query in queries]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching user queries: {str(e)}")
        return jsonify({'error': 'Failed to fetch queries'}), 500


@careconnect_bp.route('/api/careconnect/query/<int:query_id>', methods=['GET'])
def get_query_details(query_id):
    """
    Get detailed information about a specific query.
    """
    try:
        query = CareConnectQuery.query.get(query_id)
        
        if not query:
            return jsonify({'error': 'Query not found'}), 404
        
        return jsonify({
            'success': True,
            'query': query.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching query details: {str(e)}")
        return jsonify({'error': 'Failed to fetch query details'}), 500


@careconnect_bp.route('/api/careconnect/categories', methods=['GET'])
def get_categories():
    """
    Get all available query categories.
    """
    try:
        categories = CareConnectCategory.query.all()
        
        # If no categories exist, create default ones
        if not categories:
            default_categories = [
                {'name': 'Exercise Safety', 'description': 'Questions about safe physical activities', 'icon': 'fa-dumbbell', 'color': 'blue'},
                {'name': 'Nutrition & Diet', 'description': 'Dietary questions and nutrition guidance', 'icon': 'fa-apple-alt', 'color': 'green'},
                {'name': 'Medication', 'description': 'Questions about medications and supplements', 'icon': 'fa-pills', 'color': 'purple'},
                {'name': 'Symptoms', 'description': 'Health symptoms and concerns', 'icon': 'fa-stethoscope', 'color': 'red'},
                {'name': 'Lifestyle', 'description': 'Daily living and lifestyle modifications', 'icon': 'fa-heart', 'color': 'pink'},
                {'name': 'General Health', 'description': 'General health and wellness questions', 'icon': 'fa-user-md', 'color': 'teal'}
            ]
            
            for cat_data in default_categories:
                category = CareConnectCategory(**cat_data)
                db.session.add(category)
            
            db.session.commit()
            categories = CareConnectCategory.query.all()
        
        return jsonify({
            'success': True,
            'categories': [cat.to_dict() for cat in categories]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return jsonify({'error': 'Failed to fetch categories'}), 500


@careconnect_bp.route('/api/careconnect/test-groq', methods=['GET'])
def test_groq():
    """
    Test endpoint to verify Groq API is working.
    """
    try:
        from services.groq_service import generate_careconnect_response
        
        # Simple test
        response = generate_careconnect_response({}, "Can walking improve bone health?", [])
        
        return jsonify({
            'success': True,
            'answer': response.get('answer', 'Unable to generate response'),
            'source': response.get('source', 'unknown')
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'type': type(e).__name__
        }), 500


@careconnect_bp.route('/api/careconnect/cleanup-ai-responses', methods=['POST'])
def cleanup_ai_responses():
    """
    Admin endpoint to delete all AI-replied queries from the database.
    This removes the historical AI-only responses that were saved before
    the system was changed to only support doctor submissions.
    """
    try:
        # Find all queries with ai_replied status or those that have ai_response but weren't submitted to doctor
        ai_only_queries = CareConnectQuery.query.filter(
            (CareConnectQuery.status == 'ai_replied') |
            ((CareConnectQuery.ai_response != None) & (CareConnectQuery.submitted_to_doctor == False))
        ).all()
        
        count = len(ai_only_queries)
        
        if count == 0:
            return jsonify({
                'success': True,
                'message': 'No AI-only queries found to clean up',
                'deletedCount': 0
            }), 200
        
        # Delete the queries
        for query in ai_only_queries:
            db.session.delete(query)
        
        db.session.commit()
        
        logger.info(f"Cleaned up {count} AI-replied queries from database")
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted {count} AI-replied queries',
            'deletedCount': count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Cleanup error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to cleanup AI responses',
            'code': 'CLEANUP_ERROR'
        }), 500


@careconnect_bp.route('/api/careconnect/ask', methods=['POST'])
def ask_groq_ai():
    """
    Real conversational AI using Groq for CareConnect guidance.
    Provides intelligent responses based on user health profile.
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        question = data.get('question', '').strip()
        conversation_history = data.get('conversationHistory', [])
        
        logger.info(f"CareConnect AI request - User: {user_id}, Question: {question[:50]}...")
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Get user profile for personalization
        user_profile = None
        if user_id:
            from models_db.user_model import UserProfile
            user_profile = UserProfile.query.filter_by(user_id=user_id).order_by(UserProfile.created_at.desc()).first()
            logger.info(f"User profile found: {user_profile is not None}")
        
        # Use Groq service for AI response
        from services.groq_service import generate_careconnect_response
        
        response_data = generate_careconnect_response(
            user_profile.to_dict() if user_profile else {},
            question,
            conversation_history
        )
        
        logger.info(f"Groq response received - Source: {response_data.get('source', 'unknown')}")
        
        return jsonify({
            'success': True,
            'answer': response_data.get('answer', 'Unable to generate response'),
            'suggestedPrompts': [
                "What exercises are safe for my bone health?",
                "Which foods are rich in calcium?",
                "How often should I exercise?",
                "Can yoga help with osteoporosis?",
                "What vitamin D levels do I need?"
            ]
        }), 200
            
    except Exception as e:
        logger.error(f"Groq AI error: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            'success': True,
            'answer': "I'm experiencing technical difficulties. Please try again later or submit your question to a healthcare professional.",
            'suggestedPrompts': []
        }), 200


# ── AI Helper Functions ──────────────────────────────────────────────────────

def categorize_query(question: str) -> str:
    """
    AI-assisted query categorization based on content analysis.
    """
    question_lower = question.lower()
    
    # Exercise and physical activity
    if any(word in question_lower for word in ['exercise', 'walk', 'yoga', 'gym', 'physical', 'activity', 'movement']):
        return 'Exercise Safety'
    
    # Nutrition and diet
    elif any(word in question_lower for word in ['eat', 'food', 'diet', 'nutrition', 'calcium', 'vitamin', 'supplement']):
        return 'Nutrition & Diet'
    
    # Medications
    elif any(word in question_lower for word in ['medication', 'medicine', 'drug', 'pill', 'prescription', 'dosage']):
        return 'Medication'
    
    # Symptoms
    elif any(word in question_lower for word in ['pain', 'hurt', 'ache', 'symptom', 'feel', 'dizzy', 'tired']):
        return 'Symptoms'
    
    # Lifestyle
    elif any(word in question_lower for word in ['lifestyle', 'daily', 'routine', 'sleep', 'stress', 'work']):
        return 'Lifestyle'
    
    else:
        return 'General Health'


def generate_ai_summary(question: str, user_profile) -> str:
    """
    Generate AI summary of query with user context.
    """
    summary_parts = []
    
    # Add user context
    if user_profile:
        summary_parts.append(f"Patient Profile: {user_profile.risk_level} risk, Age {user_profile.age}")
        if user_profile.physical_activity:
            summary_parts.append(f"Activity Level: {user_profile.physical_activity}")
    
    # Add query category
    category = categorize_query(question)
    summary_parts.append(f"Query Category: {category}")
    
    # Add question length indicator
    if len(question) > 200:
        summary_parts.append("Detailed inquiry requiring comprehensive response")
    else:
        summary_parts.append("Concise question")
    
    return " | ".join(summary_parts)


def generate_ai_guidance(question: str, user_profile) -> dict:
    """
    Generate intelligent, conversational AI-assisted educational guidance.
    Answers the user's actual question with personalized context when relevant.
    """
    question_lower = question.lower().strip()
    
    # Detect question intent and category
    intent_category = detect_question_intent(question_lower)
    
    # Generate conversational response based on intent
    if intent_category == 'diet_nutrition':
        response = generate_diet_guidance(question_lower, user_profile)
    elif intent_category == 'exercise_activity':
        response = generate_exercise_guidance(question_lower, user_profile)
    elif intent_category == 'risk_assessment':
        response = generate_risk_guidance(question_lower, user_profile)
    elif intent_category == 'medication':
        response = generate_medication_guidance(question_lower, user_profile)
    elif intent_category == 'symptoms':
        response = generate_symptom_guidance(question_lower, user_profile)
    elif intent_category == 'general_education':
        response = generate_education_guidance(question_lower, user_profile)
    else:
        response = generate_general_guidance(question_lower, user_profile)
    
    return {
        'category': intent_category.replace('_', ' ').title(),
        'response': response,
        'disclaimer': get_appropriate_disclaimer(intent_category)
    }


def detect_question_intent(question: str) -> str:
    """
    Detect the user's question intent for appropriate response generation.
    """
    # Diet and nutrition keywords
    if any(word in question for word in [
        'coffee', 'drink', 'food', 'eat', 'diet', 'calcium', 'vitamin', 'nutrition',
        'milk', 'supplement', 'alcohol', 'caffeine', 'meal', 'dairy'
    ]):
        return 'diet_nutrition'
    
    # Exercise and activity keywords
    elif any(word in question for word in [
        'exercise', 'walk', 'yoga', 'gym', 'activity', 'movement', 'run', 'swim',
        'weight', 'strength', 'balance', 'dance', 'sport', 'physical'
    ]):
        return 'exercise_activity'
    
    # Risk assessment keywords
    elif any(word in question for word in [
        'risk', 'score', 'assessment', 'fracture', 'break', 'chance', 'probability',
        'likely', 'percentage', 'high risk', 'low risk', 'medium risk'
    ]):
        return 'risk_assessment'
    
    # Medication keywords
    elif any(word in question for word in [
        'medication', 'medicine', 'drug', 'pill', 'prescription', 'treatment',
        'therapy', 'bisphosphonate', 'hormone', 'supplement'
    ]):
        return 'medication'
    
    # Symptoms keywords
    elif any(word in question for word in [
        'pain', 'hurt', 'ache', 'symptom', 'feel', 'dizzy', 'tired', 'weak',
        'sore', 'stiff', 'swollen', 'numb'
    ]):
        return 'symptoms'
    
    # General education keywords
    elif any(word in question for word in [
        'what is', 'what causes', 'how does', 'why does', 'when does', 'osteoporosis',
        'bone density', 'bone loss', 'menopause', 'aging'
    ]):
        return 'general_education'
    
    else:
        return 'general_health'


def generate_diet_guidance(question: str, user_profile) -> str:
    """Generate conversational guidance for diet and nutrition questions."""
    
    # Coffee/caffeine questions
    if 'coffee' in question or 'caffeine' in question:
        response = "Yes, moderate coffee intake is generally safe for bone health. Around 1-2 cups daily is usually considered acceptable for most adults. Excessive caffeine may slightly reduce calcium absorption, so it's important to maintain adequate calcium and vitamin D intake."
        
        # Add personalization if relevant
        if user_profile and hasattr(user_profile, 'calcium_intake') and user_profile.calcium_intake == 'low':
            response += "\n\nSince your assessment showed low calcium intake, ensuring enough calcium-rich foods alongside coffee would be especially beneficial for you."
    
    # Calcium questions
    elif 'calcium' in question:
        if 'how much' in question or 'need' in question:
            response = "Adults typically need 1,000-1,200mg of calcium daily for optimal bone health. Good sources include dairy products, leafy greens, fortified foods, and canned fish with bones. It's best to get calcium from food sources when possible."
        else:
            response = "Calcium is essential for bone strength and density. Your body needs adequate calcium throughout life to build and maintain strong bones. Dairy products, leafy greens, almonds, and fortified foods are excellent sources."
        
        if user_profile and hasattr(user_profile, 'calcium_intake') and user_profile.calcium_intake == 'low':
            response += f"\n\nYour assessment indicated low calcium intake, so focusing on calcium-rich foods would be particularly important for your bone health."
    
    # Alcohol questions
    elif 'alcohol' in question:
        response = "Moderate alcohol consumption (up to 1 drink per day for women, 2 for men) is generally acceptable for bone health. However, excessive alcohol can interfere with bone formation and increase fracture risk by affecting balance and increasing fall risk."
    
    # General diet questions
    elif any(word in question for word in ['food', 'eat', 'diet', 'nutrition']):
        response = "A bone-healthy diet includes adequate calcium (1,000-1,200mg daily), vitamin D, protein, and other nutrients like magnesium and vitamin K. Focus on dairy products, leafy greens, fish, nuts, and fortified foods while limiting excessive salt, caffeine, and alcohol."
    
    # Vitamin D questions
    elif 'vitamin d' in question:
        response = "Vitamin D is crucial for calcium absorption and bone health. Adults need 600-800 IU daily. Sources include sunlight exposure, fatty fish, fortified foods, and supplements. Many people have insufficient vitamin D, especially in winter months."
        
        if user_profile and hasattr(user_profile, 'vitamin_d_intake') and user_profile.vitamin_d_intake == 'low':
            response += "\n\nYour assessment showed low vitamin D intake, so consider discussing supplementation with your healthcare provider."
    
    else:
        response = "A balanced diet rich in calcium, vitamin D, protein, and other bone-supporting nutrients is essential for maintaining strong bones throughout life."
    
    return response


def generate_exercise_guidance(question: str, user_profile) -> str:
    """Generate conversational guidance for exercise and activity questions."""
    
    # Walking questions
    if 'walk' in question:
        response = "Yes, walking is excellent for bone health! It's a weight-bearing exercise that helps stimulate bone formation and maintain density. Aim for at least 30 minutes most days of the week. Brisk walking is more beneficial than leisurely strolling."
        
        # Personalize based on risk level
        if user_profile and hasattr(user_profile, 'risk_level'):
            if user_profile.risk_level.upper() == 'HIGH':
                response += "\n\nGiven your higher fracture risk, start gradually and consider using supportive footwear. Walking on even surfaces can help reduce fall risk while still providing bone benefits."
            elif user_profile.risk_level.upper() == 'LOW':
                response += "\n\nWith your lower fracture risk, you can be more active with walking routines and even consider adding hills or inclines for additional bone-loading benefits."
    
    # Yoga questions
    elif 'yoga' in question:
        response = "Yoga can be beneficial for bone health, particularly poses that involve weight-bearing and balance. However, avoid extreme spinal flexion (forward bending) if you have osteoporosis, as this can increase fracture risk."
        
        if user_profile and hasattr(user_profile, 'risk_level') and user_profile.risk_level.upper() == 'HIGH':
            response += "\n\nGiven your higher fracture risk, focus on gentle, supported yoga poses and avoid deep forward bends or twisting movements. Consider chair yoga or wall-supported poses."
    
    # General exercise questions
    elif any(word in question for word in ['exercise', 'activity', 'physical']):
        response = "Weight-bearing and resistance exercises are most effective for bone health. These include walking, stair climbing, resistance bands, and balance exercises. They help stimulate bone formation and reduce fracture risk."
        
        # Add personalized recommendations
        if user_profile:
            if hasattr(user_profile, 'physical_activity') and user_profile.physical_activity == 'sedentary':
                response += "\n\nSince your assessment showed low activity levels, start with gentle weight-bearing exercises like walking and gradually increase intensity as you build strength."
            elif hasattr(user_profile, 'balance_problems') and user_profile.balance_problems:
                response += "\n\nYour assessment indicated balance concerns, so incorporating balance-focused exercises like heel-to-toe walking or supported standing exercises would be particularly beneficial."
    
    # Strength training questions
    elif 'strength' in question or 'weight' in question:
        response = "Resistance training is excellent for bone health. It stimulates bone formation and builds muscle strength, which supports bones and reduces fall risk. Use resistance bands, light weights, or bodyweight exercises 2-3 times per week."
    
    else:
        response = "Regular physical activity, especially weight-bearing and resistance exercises, is one of the most effective ways to maintain and improve bone health throughout life."
    
    return response


def generate_risk_guidance(question: str, user_profile) -> str:
    """Generate guidance for risk assessment questions using actual user data."""
    
    if not user_profile:
        return "To provide personalized risk information, please complete your bone health assessment first."
    
    risk_level = getattr(user_profile, 'risk_level', 'unknown').upper()
    
    if 'what is my risk' in question or 'my risk' in question:
        response = (f"Your latest CareMend assessment gave a {risk_level.lower()} result from an experimental "
                    "machine-learning demonstration. It is not a diagnosis and not a probability. ")
        
        if risk_level == 'LOW':
            response += "A low result does not rule out osteoporosis. Continue preventive measures like regular exercise and adequate nutrition, and speak to a doctor if you have concerns."
        elif risk_level == 'MEDIUM':
            response += "Focus on bone-strengthening activities, ensure adequate calcium and vitamin D, and consider discussing prevention strategies with your healthcare provider."
        elif risk_level == 'HIGH':
            response += "Consider discussing bone health and a DEXA scan with a doctor, who can advise on lifestyle changes and whether any treatment is appropriate."
    
    elif 'why' in question and 'risk' in question:
        risk_factors = getattr(user_profile, 'risk_factors', [])
        if risk_factors:
            response = f"Your {risk_level.lower()} risk is based on several factors identified in your assessment: {', '.join(risk_factors[:3])}. These factors can influence bone density and fracture probability."
        else:
            response = f"Your {risk_level.lower()} risk assessment is based on factors like age, gender, lifestyle habits, and medical history that influence bone health."
    
    else:
        response = f"Your latest CareMend result is {risk_level.lower()} (experimental model, not a diagnosis). Only a DEXA scan interpreted by a doctor can assess your bone health."
    
    return response


def generate_medication_guidance(question: str, user_profile) -> str:
    """Generate guidance for medication questions."""
    
    response = "Medication questions should always be discussed with your healthcare provider or pharmacist, as they can provide personalized advice based on your complete medical history."
    
    if 'supplement' in question:
        response += "\n\nFor bone health supplements, calcium and vitamin D are most commonly recommended. However, the appropriate dosage depends on your dietary intake, blood levels, and individual needs."
    
    return response


def generate_symptom_guidance(question: str, user_profile) -> str:
    """Generate guidance for symptom-related questions."""
    
    if 'pain' in question:
        response = "Bone or joint pain can have many causes and should be evaluated by a healthcare professional, especially if it's persistent or severe. While some discomfort during exercise is normal, sharp or persistent pain warrants medical attention."
    else:
        response = "Symptoms related to bone health or general wellness should be discussed with your healthcare provider for proper evaluation and guidance."
    
    return response


def generate_education_guidance(question: str, user_profile) -> str:
    """Generate educational responses for general knowledge questions."""
    
    if 'what is osteoporosis' in question or 'osteoporosis' in question:
        response = "Osteoporosis is a condition where bones become weak and brittle due to loss of bone density. It often develops silently over years, which is why it's called the 'silent disease.' The condition significantly increases fracture risk, especially in the spine, hips, and wrists."
    
    elif 'what causes' in question:
        response = "Bone loss is caused by an imbalance between bone formation and bone breakdown. Factors include aging, hormonal changes (especially menopause), inadequate nutrition, lack of physical activity, certain medications, and genetic factors."
    
    elif 'when does bone loss' in question or 'when does' in question:
        response = "Bone density typically peaks around age 30, then gradually declines. Women experience accelerated bone loss during menopause due to decreased estrogen. Men also experience bone loss with aging, but usually at a slower rate."
    
    elif 'can bone density improve' in question or 'improve' in question:
        response = "Yes, bone density can improve with proper intervention! Weight-bearing exercise, resistance training, adequate nutrition (calcium and vitamin D), and sometimes medication can help maintain or even increase bone density, especially when started early."
    
    else:
        response = "Bone health is influenced by many factors including genetics, nutrition, physical activity, hormones, and lifestyle choices. Understanding these factors helps in developing effective prevention and treatment strategies."
    
    return response


def generate_general_guidance(question: str, user_profile) -> str:
    """Generate guidance for general health questions."""
    
    response = "For comprehensive bone health, focus on regular weight-bearing exercise, adequate calcium and vitamin D intake, avoiding smoking and excessive alcohol, and maintaining a healthy lifestyle."
    
    if user_profile and hasattr(user_profile, 'risk_level'):
        risk_level = user_profile.risk_level.upper()
        if risk_level == 'HIGH':
            response += "\n\nGiven your higher fracture risk, working closely with your healthcare provider on a comprehensive bone health plan would be particularly beneficial."
    
    return response


def get_appropriate_disclaimer(intent_category: str) -> str:
    """
    Return appropriate disclaimer based on question category.
    """
    if intent_category in ['medication', 'symptoms']:
        return "This information is for educational purposes only. Always consult with your healthcare provider for medical advice, diagnosis, or treatment."
    elif intent_category == 'risk_assessment':
        return "This assessment is based on general risk factors and should not replace professional medical evaluation."
    else:
        return "This educational information should complement, not replace, professional medical advice."


# ── Doctor/Admin Routes (for future implementation) ──────────────────────────

@careconnect_bp.route('/api/careconnect/admin/pending-queries', methods=['GET'])
def get_pending_queries():
    """
    Get all pending queries for doctor review (admin endpoint).
    """
    try:
        queries = CareConnectQuery.query.filter_by(status='pending')\
                                      .order_by(CareConnectQuery.created_at.asc())\
                                      .all()
        
        return jsonify({
            'success': True,
            'queries': [query.to_dict() for query in queries]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching pending queries: {str(e)}")
        return jsonify({'error': 'Failed to fetch pending queries'}), 500


@careconnect_bp.route('/api/careconnect/admin/reply', methods=['POST'])
def submit_doctor_reply():
    """
    Submit doctor reply to a patient query (admin endpoint).
    """
    try:
        data = request.get_json() or {}
        query_id = data.get('queryId')
        doctor_reply = data.get('doctorReply', '').strip()
        doctor_name = data.get('doctorName', 'Healthcare Professional')
        doctor_specialty = data.get('doctorSpecialty', 'General Medicine')
        
        if not query_id or not doctor_reply:
            return jsonify({'error': 'Query ID and doctor reply are required'}), 400
        
        query = CareConnectQuery.query.get(query_id)
        if not query:
            return jsonify({'error': 'Query not found'}), 404
        
        # Update query with doctor response
        query.doctor_reply = doctor_reply
        query.doctor_name = doctor_name
        query.doctor_specialty = doctor_specialty
        query.status = 'replied'
        query.replied_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"Doctor reply submitted for query {query_id} by {doctor_name}")
        
        return jsonify({
            'success': True,
            'message': 'Doctor reply submitted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error submitting doctor reply: {str(e)}")
        return jsonify({'error': 'Failed to submit reply'}), 500


# ── Conversation History Endpoints ───────────────────────────────────────────

@careconnect_bp.route('/api/careconnect/conversation/save', methods=['POST'])
def save_conversation():
    """
    Save conversation history to database.
    
    Expected JSON:
    {
        "userId": 123,
        "messages": [
            {"role": "user", "content": "Can I drink coffee?"},
            {"role": "assistant", "content": "Yes, moderate coffee..."}
        ]
    }
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        messages = data.get('messages', [])
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        if not messages:
            return jsonify({'error': 'No messages to save'}), 400
        
        # Save each message
        saved_count = 0
        for msg in messages:
            conversation = CareConnectConversation(
                user_id=user_id,
                role=msg.get('role'),
                content=msg.get('content')
            )
            db.session.add(conversation)
            saved_count += 1
        
        db.session.commit()
        
        logger.info(f"Saved {saved_count} conversation messages for user {user_id}")
        
        return jsonify({
            'success': True,
            'savedCount': saved_count,
            'message': f'Saved {saved_count} messages'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving conversation: {str(e)}")
        return jsonify({'error': 'Failed to save conversation'}), 500


@careconnect_bp.route('/api/careconnect/conversation/<int:user_id>', methods=['GET'])
def get_conversation_history(user_id):
    """
    Get conversation history for a user.
    
    Query params:
    - limit: number of messages to return (default: 50)
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        
        conversations = CareConnectConversation.query.filter_by(user_id=user_id)\
                                                    .order_by(CareConnectConversation.timestamp.desc())\
                                                    .limit(limit)\
                                                    .all()
        
        # Reverse to get chronological order
        conversations.reverse()
        
        return jsonify({
            'success': True,
            'messages': [conv.to_dict() for conv in conversations]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching conversation history: {str(e)}")
        return jsonify({'error': 'Failed to fetch conversation history'}), 500


@careconnect_bp.route('/api/careconnect/conversation/<int:user_id>', methods=['DELETE'])
def clear_conversation_history(user_id):
    """
    Clear conversation history for a user.
    """
    try:
        deleted_count = CareConnectConversation.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        logger.info(f"Cleared {deleted_count} conversation messages for user {user_id}")
        
        return jsonify({
            'success': True,
            'deletedCount': deleted_count,
            'message': f'Cleared {deleted_count} messages'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error clearing conversation history: {str(e)}")
        return jsonify({'error': 'Failed to clear conversation history'}), 500


def get_appropriate_disclaimer(intent_category: str) -> str:
    """Get appropriate disclaimer based on question category."""
    if intent_category in ['medication', 'symptoms']:
        return "This information is educational only. Please consult your healthcare provider for medical advice."
    else:
        return "This guidance is for educational purposes. For personalized medical advice, consult a healthcare professional."


# ── Doctor Dashboard Endpoints ───────────────────────────────────────────────

@careconnect_bp.route('/api/careconnect/doctor/queries', methods=['GET'])
def get_doctor_queries():
    """
    Get all queries submitted to doctors.
    
    Query params:
    - status: filter by status (pending_doctor, doctor_replied, closed)
    - limit: number of queries to return (default: 50)
    """
    try:
        status_filter = request.args.get('status')
        limit = request.args.get('limit', 50, type=int)
        
        query = CareConnectQuery.query.filter_by(submitted_to_doctor=True)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        queries = query.order_by(CareConnectQuery.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'success': True,
            'queries': [q.to_dict() for q in queries],
            'count': len(queries)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching doctor queries: {str(e)}")
        return jsonify({'error': 'Failed to fetch queries'}), 500


@careconnect_bp.route('/api/careconnect/doctor/reply', methods=['POST'])
def doctor_reply_to_query():
    """
    Doctor replies to a patient query.
    
    Expected JSON:
    {
        "queryId": 123,
        "doctorReply": "Based on your condition...",
        "doctorName": "Dr. Smith",
        "doctorSpecialty": "Orthopedics"
    }
    """
    try:
        data = request.get_json() or {}
        query_id = data.get('queryId')
        doctor_reply = data.get('doctorReply', '').strip()
        doctor_name = data.get('doctorName', 'Healthcare Professional')
        doctor_specialty = data.get('doctorSpecialty', 'General Medicine')
        
        if not query_id or not doctor_reply:
            return jsonify({'error': 'Query ID and reply are required'}), 400
        
        query = CareConnectQuery.query.get(query_id)
        if not query:
            return jsonify({'error': 'Query not found'}), 404
        
        # Update query with doctor reply
        query.doctor_reply = doctor_reply
        query.doctor_name = doctor_name
        query.doctor_specialty = doctor_specialty
        query.status = 'doctor_replied'
        query.replied_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"Doctor replied to query {query_id}")
        
        return jsonify({
            'success': True,
            'queryId': query.id,
            'status': 'doctor_replied',
            'message': 'Reply sent successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Doctor reply error: {str(e)}")
        return jsonify({'error': 'Failed to send reply'}), 500


@careconnect_bp.route('/api/careconnect/query/<int:query_id>/close', methods=['POST'])
def close_query(query_id):
    """
    Close a query (mark as resolved).
    """
    try:
        query = CareConnectQuery.query.get(query_id)
        if not query:
            return jsonify({'error': 'Query not found'}), 404
        
        query.status = 'closed'
        query.closed_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"Query {query_id} closed")
        
        return jsonify({
            'success': True,
            'queryId': query.id,
            'status': 'closed',
            'message': 'Query closed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Close query error: {str(e)}")
        return jsonify({'error': 'Failed to close query'}), 500


# ── Generic Chat Endpoint (for QueryChatbox component) ────────────────────────

@careconnect_bp.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """
    Generic chat endpoint for CareConnect AI chatting.
    Wrapper around Gemini service for frontend compatibility.
    
    Used by: QueryChatbox.tsx for real-time AI conversations
    
    Expected JSON:
    {
        "message": "Can I drink coffee?",
        "context": {
            "user_profile": {
                "risk_level": "HIGH",
                "age": 65,
                "gender": "Female",
                "risk_factors": [...],
                "recommendations": [...]
            },
            "health_data": {...}
        },
        "conversationHistory": [
            {"role": "user", "content": "What helps bones?"},
            {"role": "assistant", "content": "Exercise and calcium..."}
        ]
    }
    
    Returns:
    {
        "response": "Yes, moderate coffee intake...",
        "suggestedPrompts": ["What about tea?", "How much caffeine?"]
    }
    """
    try:
        data = request.get_json() or {}
        message = data.get('message', '').strip()
        context = data.get('context', {})
        conversation_history = data.get('conversationHistory', [])
        user_profile = context.get('user_profile', {})
        
        if not message:
            return jsonify({'error': 'Message is required', 'response': 'Please type a message'}), 400
        
        logger.info(f"Chat API - Message: {message[:50]}..., Profile: {user_profile is not None}")
        
        # Call Gemini AI service via Node.js bridge
        import subprocess
        import json
        import os
        
        gemini_input = {
            'userProfile': user_profile,
            'userQuestion': message,
            'conversationHistory': conversation_history
        }
        
        # Get path to Gemini bridge script
        node_script = os.path.join(os.path.dirname(__file__), '..', 'services', 'gemini_bridge.js')
        logger.info(f"Calling Gemini bridge: {node_script}")
        
        # Call Node.js Gemini service
        result = subprocess.run(
            ['node', node_script],
            input=json.dumps(gemini_input),
            text=True,
            capture_output=True,
            timeout=30
        )
        
        logger.info(f"Gemini service return code: {result.returncode}")
        
        if result.returncode == 0:
            try:
                # Parse the last line of stdout as JSON (in case there are debug logs before it)
                stdout_lines = result.stdout.strip().split('\n')
                json_line = None
                
                # Find the JSON response (should be the last line that starts with {)
                for line in reversed(stdout_lines):
                    line = line.strip()
                    if line.startswith('{') and line.endswith('}'):
                        json_line = line
                        break
                
                if json_line:
                    response_data = json.loads(json_line)
                    logger.info(f"Chat response successful - Answer length: {len(response_data.get('answer', ''))}")
                    return jsonify({
                        'response': response_data.get('answer', 'Unable to generate response'),
                        'suggestedPrompts': response_data.get('suggestedPrompts', [])
                    }), 200
                else:
                    logger.error("No valid JSON found in Gemini response")
                    logger.error(f"Raw stdout: {result.stdout}")
                    return jsonify({
                        'response': "I'm having trouble processing the response. Please try again.",
                        'suggestedPrompts': []
                    }), 200
                    
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response JSON: {e}")
                logger.error(f"Raw stdout: {result.stdout}")
                return jsonify({
                    'response': "I'm having trouble processing the response. Please try again.",
                    'suggestedPrompts': []
                }), 200
        else:
            logger.error(f"Gemini service failed - Return code: {result.returncode}")
            logger.error(f"Stderr: {result.stderr}")
            return jsonify({
                'response': "I'm having trouble generating a response right now. Please try again.",
                'suggestedPrompts': []
            }), 200
            
    except subprocess.TimeoutExpired:
        logger.error("Chat API timeout after 30 seconds")
        return jsonify({
            'response': "The AI service is taking too long to respond. Please try again with a shorter question.",
            'suggestedPrompts': []
        }), 200
    except Exception as e:
        logger.error(f"Chat API error: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            'response': "I'm experiencing technical difficulties. Please try again later.",
            'suggestedPrompts': []
        }), 200
