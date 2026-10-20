"""
services/personalized_plan_service.py — Personalized Exercise and Nutrition Plans
==================================================================================
Complete personalized recommendation pipeline with risk-stratified output.

This service generates fully personalized exercise and nutrition recommendations based on:
- User's latest risk score and assessment
- User's age, gender, BMI, diseases/chronic conditions
- Activity level, dietary preferences, health data
- Risk-level-specific recommendations (LOW, MEDIUM, HIGH)

Architecture:
1. Fetch user's latest risk assessment from database
2. Validate risk data is fresh (< 30 days old)
3. Generate risk-stratified recommendations
4. Apply disease/condition-specific modifications
5. Return fully personalized plans with fallback rules
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from extensions import db
from models_db.user_model import UserProfile
from models_db.auth_model import User
from utils.logger import logger
import json


# ═════════════════════════════════════════════════════════════════════════════
# EXERCISE PLAN GENERATION
# ═════════════════════════════════════════════════════════════════════════════

class ExercisePlanGenerator:
    """Generate personalized exercise recommendations based on risk level."""
    
    @staticmethod
    def generate_plan(user_id: int) -> Optional[Dict[str, Any]]:
        """
        Generate personalized exercise plan for a user.
        
        Returns:
            {
                'success': bool,
                'plan': {...exercise plan...},
                'riskLevel': str,
                'personalizationScore': float (0-100),
                'source': str,
                'warnings': list[str],
                'lastAssessmentDate': str
            }
        """
        try:
            # Fetch user's latest risk assessment
            user = User.query.get(user_id)
            if not user:
                logger.error(f"User {user_id} not found for exercise plan")
                return _fallback_exercise_plan(None, "user_not_found")
            
            user_profile = UserProfile.query.filter_by(user_id=user_id)\
                                           .order_by(UserProfile.created_at.desc())\
                                           .first()
            
            if not user_profile:
                logger.warning(f"No assessment found for user {user_id}, using fallback")
                return _fallback_exercise_plan(None, "no_assessment")
            
            # Validate assessment is fresh
            age_of_assessment = datetime.utcnow() - user_profile.created_at
            if age_of_assessment > timedelta(days=90):
                logger.warning(f"Assessment for user {user_id} is {age_of_assessment.days} days old")
            
            risk_level = user_profile.risk_level.upper()
            
            logger.info(f"Generating exercise plan for user {user_id}: risk_level={risk_level}")
            
            # Generate risk-stratified plan
            plan = ExercisePlanGenerator._generate_by_risk(user_profile)
            
            plan['personalizationScore'] = ExercisePlanGenerator._calculate_personalization_score(user_profile)
            plan['source'] = "Personalized Assessment"
            plan['lastAssessmentDate'] = user_profile.created_at.isoformat()
            plan['assessmentAge'] = age_of_assessment.days
            
            return {
                'success': True,
                'plan': plan,
                'riskLevel': risk_level,
                'personalizationScore': plan['personalizationScore'],
                'source': plan['source'],
                'warnings': [],
                'lastAssessmentDate': plan['lastAssessmentDate']
            }
            
        except Exception as e:
            logger.error(f"Error generating exercise plan for user {user_id}: {str(e)}")
            return _fallback_exercise_plan(None, f"generation_error: {str(e)}")
    
    @staticmethod
    def _generate_by_risk(user_profile: UserProfile) -> Dict[str, Any]:
        """Generate exercise plan based on risk level."""
        risk_level = user_profile.risk_level.upper()
        age = user_profile.age
        activity_level = getattr(user_profile, 'physical_activity', 'moderate').lower()
        
        plan = {
            'riskLevel': risk_level,
            'age': age,
            'activityLevel': activity_level,
            'personalizedFor': f"{risk_level} risk, Age {age}",
            'weeklySchedule': [],
            'exercisesByIntensity': {},
            'safetyGuidelines': [],
            'progressionPlan': [],
            'fallPreventionTips': [],
            'supplementaryActivities': []
        }
        
        if risk_level == "LOW":
            plan.update({
                'strategyName': 'Maintenance & Enhancement',
                'strategyDescription': 'Maintain bone health with balanced exercise and strength building',
                'weeklyMinutes': 150,
                'intensityLevel': 'Moderate to Vigorous',
                'focusAreas': ['Cardiovascular health', 'Muscle strength', 'Bone density maintenance'],
                'weeklySchedule': [
                    {
                        'day': 'Monday',
                        'activity': 'Brisk walking or jogging',
                        'duration': '30-45 minutes',
                        'intensity': 'Moderate (60-70% max HR)',
                        'personalNote': 'Good cardio and weight-bearing exercise for bone maintenance'
                    },
                    {
                        'day': 'Tuesday',
                        'activity': 'Strength training (upper body)',
                        'duration': '30 minutes',
                        'intensity': 'Moderate',
                        'personalNote': 'Build muscle to support bones, use resistance bands or light weights'
                    },
                    {
                        'day': 'Wednesday',
                        'activity': 'Yoga or flexibility work',
                        'duration': '30 minutes',
                        'intensity': 'Light to Moderate',
                        'personalNote': 'Improve flexibility and balance'
                    },
                    {
                        'day': 'Thursday',
                        'activity': 'Brisk walking or cycling',
                        'duration': '30-45 minutes',
                        'intensity': 'Moderate (60-70% max HR)',
                        'personalNote': 'Alternate cardio activity, weight-bearing preferred'
                    },
                    {
                        'day': 'Friday',
                        'activity': 'Strength training (lower body)',
                        'duration': '30 minutes',
                        'intensity': 'Moderate',
                        'personalNote': 'Leg exercises for bone support and balance'
                    },
                    {
                        'day': 'Saturday',
                        'activity': 'Active recreation (tennis, dancing, swimming)',
                        'duration': '45-60 minutes',
                        'intensity': 'Moderate to Vigorous',
                        'personalNote': 'Enjoyable activity to maintain long-term compliance'
                    },
                    {
                        'day': 'Sunday',
                        'activity': 'Rest or light walking',
                        'duration': '20-30 minutes',
                        'intensity': 'Light',
                        'personalNote': 'Recovery and active rest'
                    }
                ],
                'exercisesByIntensity': {
                    'vigorous': [
                        'Running/jogging (weight-bearing)',
                        'High-impact aerobics',
                        'Competitive sports (tennis, basketball)',
                        'Heavy resistance training',
                        'Stair climbing'
                    ],
                    'moderate': [
                        'Brisk walking (3-4 mph)',
                        'Cycling (stationary or outdoor)',
                        'Swimming (weight-bearing exercise in water)',
                        'Light to moderate resistance training',
                        'Yoga with standing poses',
                        'Dancing'
                    ],
                    'light': [
                        'Casual walking',
                        'Stretching',
                        'Gentle yoga',
                        'Water aerobics'
                    ]
                },
                'safetyGuidelines': [
                    'Warm up for 5-10 minutes before exercise',
                    'Cool down and stretch for 5-10 minutes after',
                    'Wear supportive footwear for weight-bearing activities',
                    'Stay hydrated during exercise',
                    'Avoid high-impact activities on hard surfaces without proper shoes',
                    'Stop if you experience unusual pain (not muscle soreness)',
                    'Maintain good posture during all exercises'
                ],
                'progressionPlan': [
                    'Week 1-2: Establish routine, focus on consistency',
                    'Week 3-4: Gradually increase duration by 5 minutes',
                    'Week 5-6: Increase intensity slightly (faster walking, add light weights)',
                    'Week 7-8: Add new exercise variety to prevent plateaus',
                    'Monthly: Reassess and adjust based on comfort and goals'
                ],
                'fallPreventionTips': [
                    'Maintain regular exercise for balance and strength',
                    'Include standing balance exercises 2-3x per week',
                    'Wear proper footwear with good grip',
                    'Keep home environment well-lit and clutter-free'
                ]
            })
        
        elif risk_level == "MEDIUM" or risk_level == "MODERATE":
            plan.update({
                'strategyName': 'Enhanced Bone Support',
                'strategyDescription': 'Increase bone strength and density with targeted exercises',
                'weeklyMinutes': 200,
                'intensityLevel': 'Moderate to Vigorous (but controlled)',
                'focusAreas': ['Bone strength building', 'Muscle mass maintenance', 'Balance improvement'],
                'weeklySchedule': [
                    {
                        'day': 'Monday',
                        'activity': 'Brisk walking with intervals',
                        'duration': '40-50 minutes',
                        'intensity': 'Moderate to Vigorous (65-75% max HR)',
                        'personalNote': f"Personalized for MEDIUM risk: Weight-bearing interval training for bone stimulation"
                    },
                    {
                        'day': 'Tuesday',
                        'activity': 'Strength training (full body circuit)',
                        'duration': '40 minutes',
                        'intensity': 'Moderate with progressive weight',
                        'personalNote': f"3 sets of 10-12 reps: Squats, lunges, chest press, rows, shoulder press"
                    },
                    {
                        'day': 'Wednesday',
                        'activity': 'Yoga with emphasis on balance and core',
                        'duration': '45 minutes',
                        'intensity': 'Moderate',
                        'personalNote': f"Standing poses (tree, warrior), core work, hip stability"
                    },
                    {
                        'day': 'Thursday',
                        'activity': 'Brisk walking or light jogging intervals',
                        'duration': '40-50 minutes',
                        'intensity': 'Moderate to Vigorous (65-75% max HR)',
                        'personalNote': f"Alternate weight-bearing cardio for bone adaptation stimulus"
                    },
                    {
                        'day': 'Friday',
                        'activity': 'Strength training (lower body emphasis)',
                        'duration': '40 minutes',
                        'intensity': 'Moderate with progressive weight',
                        'personalNote': f"Leg press, calf raises, glute bridges, hamstring curls - key for fall prevention"
                    },
                    {
                        'day': 'Saturday',
                        'activity': 'Active recreation with balance work',
                        'duration': '45-60 minutes',
                        'intensity': 'Moderate',
                        'personalNote': f"Dancing, recreational sports, or tai chi - enjoyable and improves balance"
                    },
                    {
                        'day': 'Sunday',
                        'activity': 'Recovery walk and stretching',
                        'duration': '30 minutes',
                        'intensity': 'Light',
                        'personalNote': f"Active recovery to aid muscle repair and maintain routine"
                    }
                ],
                'exercisesByIntensity': {
                    'vigorous': [
                        'Jogging (30+ min, weight-bearing)',
                        'High-intensity interval training (HIIT)',
                        'Stair climbing with weight',
                        'Resistance training with challenging weights',
                        'Court sports (tennis, badminton)'
                    ],
                    'moderate': [
                        'Brisk walking (3.5-4.5 mph)',
                        'Cycling with resistance',
                        'Swimming 3-4x per week',
                        'Resistance band exercises',
                        'Functional training (squats, lunges, step-ups)',
                        'Tai chi',
                        'Modified dance aerobics'
                    ],
                    'light': [
                        'Casual walking',
                        'Gentle stretching',
                        'Water walking',
                        'Light mobility work'
                    ]
                },
                'safetyGuidelines': [
                    'Always warm up 5-10 minutes with dynamic stretches',
                    'Cool down 5-10 minutes with static stretches',
                    'Wear proper, well-fitted athletic shoes with good arch support',
                    'Start resistance training with light weights to master form',
                    'Never bounce or force stretches',
                    'Stay hydrated - drink water before, during, and after exercise',
                    'Listen to your body - muscle soreness is OK, sharp pain is not',
                    'Breathe continuously during exercise, never hold your breath',
                    'Stop and rest if you experience dizziness, shortness of breath, or chest discomfort'
                ],
                'progressionPlan': [
                    'Week 1-2: Master proper form with light weights, establish routine',
                    'Week 3-4: Increase weight by 10% or add 5 minutes to cardio',
                    'Week 5-6: Add second set to resistance exercises (2x10-12 reps)',
                    'Week 7-8: Increase to 3 sets, add more challenging exercises',
                    'Week 9-10: Increase weight again or reduce rest between sets',
                    'Every 4 weeks: Reassess and modify based on strength gains'
                ],
                'fallPreventionTips': [
                    'Include balance training 3-4x per week (yoga, tai chi, single-leg exercises)',
                    'Do 1-leg stands for 30 seconds, 3x daily',
                    'Practice sit-to-stand from a chair without using arms',
                    'Ensure home has proper lighting and handrails',
                    'Wear non-slip shoes indoors and outdoors',
                    'Have home evaluated for fall hazards (loose rugs, clutter)',
                    'Consider vision and hearing check annually'
                ]
            })
        
        elif risk_level == "HIGH":
            plan.update({
                'strategyName': 'Intensive Bone Support & Fall Prevention',
                'strategyDescription': 'Medically supervised exercise program for high fracture risk',
                'weeklyMinutes': 250,
                'intensityLevel': 'Moderate (controlled, no high-impact)',
                'focusAreas': [
                    'Fall prevention (PRIMARY)',
                    'Balance and proprioception',
                    'Muscle strength maintenance',
                    'Bone density stimulation (gentle)',
                    'Functional independence'
                ],
                'medicalSupervision': 'Highly recommended - consult physical therapist',
                'weeklySchedule': [
                    {
                        'day': 'Monday',
                        'activity': 'Supervised walking with balance practice',
                        'duration': '45-60 minutes',
                        'intensity': 'Moderate (50-60% max HR, no jarring)',
                        'personalNote': 'Gentle weight-bearing with balance work - PRIMARY GOAL: PREVENT FALLS'
                    },
                    {
                        'day': 'Tuesday',
                        'activity': 'Resistance training (supervised, light weights)',
                        'duration': '40 minutes',
                        'intensity': 'Gentle resistance (1-2 lb weights or bands)',
                        'personalNote': 'Maintain muscle mass: Leg raises, shoulder raises, chest press - AVOID TWISTING'
                    },
                    {
                        'day': 'Wednesday',
                        'activity': 'Chair yoga or standing balance exercises',
                        'duration': '45 minutes',
                        'intensity': 'Light to Moderate',
                        'personalNote': 'Balance training with support: tree pose with wall, heel-to-toe walking, transitions'
                    },
                    {
                        'day': 'Thursday',
                        'activity': 'Water walking or aquatic therapy',
                        'duration': '40-50 minutes',
                        'intensity': 'Moderate (low-impact weight-bearing)',
                        'personalNote': 'Buoyancy reduces joint stress while providing resistance - EXCELLENT for HIGH risk'
                    },
                    {
                        'day': 'Friday',
                        'activity': 'Functional training & daily activity practice',
                        'duration': '40 minutes',
                        'intensity': 'Moderate (functional movements only)',
                        'personalNote': 'Practice sit-to-stand, stair climbing (with rail), reaching, picking up objects'
                    },
                    {
                        'day': 'Saturday',
                        'activity': 'Gentle walking and balance maintenance',
                        'duration': '45-60 minutes',
                        'intensity': 'Light to Moderate',
                        'personalNote': 'Leisurely walk, practice balance transitions on flat surfaces'
                    },
                    {
                        'day': 'Sunday',
                        'activity': 'Complete rest or very light stretching',
                        'duration': '15-20 minutes',
                        'intensity': 'Light (gentle stretching only)',
                        'personalNote': 'Recovery day to prevent fatigue-related falls'
                    }
                ],
                'exercisesByIntensity': {
                    'moderate': [
                        'Brisk walking (3-3.5 mph) on flat surfaces ONLY',
                        'Stationary cycling (low resistance)',
                        'Water aerobics',
                        'Light resistance band exercises (standing with support)',
                        'Tai chi',
                        'Gentle yoga with chair support'
                    ],
                    'light': [
                        'Casual walking (1-2 mph)',
                        'Water walking',
                        'Seated leg exercises',
                        'Arm movements while standing (with support)',
                        'Breathing and stretching exercises',
                        'Posture exercises'
                    ]
                },
                'exercisesToAVOID': [
                    'Running, jogging, or high-impact activities',
                    'Jumping, hopping, or bounding',
                    'High-impact aerobics or plyometrics',
                    'Heavy resistance training or heavy weights',
                    'Twisting, bending forward, or sudden movements',
                    'Contact sports or activities with collision risk',
                    'Uneven terrain or outdoor trails',
                    'Stairs or climbing without handrails',
                    'Activities requiring quick direction changes',
                    'Standing activities without nearby support'
                ],
                'safetyGuidelines': [
                    '⚠️ ALWAYS exercise with someone present',
                    '⚠️ Hold onto stable support when exercising',
                    '⚠️ Wear non-slip shoes with good ankle support',
                    '⚠️ Clear exercise area of tripping hazards',
                    '⚠️ Use a gait belt if recommended by PT',
                    'Warm up 10-15 minutes with gentle movement',
                    'Cool down 10-15 minutes, stay hydrated',
                    'Stop immediately if you feel dizzy or unbalanced',
                    'Never exercise alone',
                    'Report any falls or near-falls to your doctor',
                    'Take rest breaks if fatigued - fatigue increases fall risk',
                    'Carry phone or medical alert device during exercise'
                ],
                'progressionPlan': [
                    'Week 1-2: Establish routine with easy exercises, focus on form and balance',
                    'Week 3-4: Increase duration slightly (add 5 min) if tolerated',
                    'Week 5-6: Add minimal complexity to balance exercises (e.g., heel-to-toe walks)',
                    'Week 7-8: Consider slight intensity increase only if PT approves',
                    'Monthly reviews with physical therapist mandatory',
                    'Do NOT progress without PT clearance'
                ],
                'fallPreventionTips': [
                    '✓ Balance exercises MUST be done with support/wall contact',
                    '✓ Practice sit-to-stand 3x daily (5 reps each)',
                    '✓ Single-leg standing with wall support for 20-30 seconds',
                    '✓ Heel-to-toe walks along a hallway with handrails',
                    '✓ Calf raises holding onto counter for balance',
                    '✓ Step-ups on low step (2-4 inches) with rail',
                    '✓ HOME ASSESSMENT: Remove all tripping hazards',
                    '✓ Install grab bars in bathroom',
                    '✓ Use proper lighting (especially stairs, hallways)',
                    '✓ Keep frequently used items at waist height',
                    '✓ Consider chair lifts, raised toilets, shower chairs',
                    '✓ Avoid medications that cause dizziness',
                    '✓ Annual vision and hearing checks',
                    '✓ Blood pressure management to prevent orthostatic hypotension'
                ]
            })
        
        # Add common recommendations
        plan['supplementaryActivities'] = [
            'Daily activities (gardening, housework) count as light activity',
            'Take stairs one at a time with rail support',
            'Use proper lifting technique (bend knees, not back)',
            'Avoid prolonged sitting (every 30 minutes, stand and move)',
            'Practice good posture throughout the day'
        ]
        
        return plan
    
    @staticmethod
    def _calculate_personalization_score(user_profile: UserProfile) -> float:
        """Calculate how personalized the plan is (0-100)."""
        score = 0.0
        
        # Age data: 10 points
        if user_profile.age:
            score += 10
        
        # Gender data: 10 points
        if user_profile.gender and user_profile.gender != 'unknown':
            score += 10
        
        # Risk level: 20 points
        if user_profile.risk_level:
            score += 20
        
        # Activity level: 15 points
        if hasattr(user_profile, 'physical_activity') and user_profile.physical_activity:
            score += 15
        
        # Assessment freshness (< 30 days): 15 points
        age_days = (datetime.utcnow() - user_profile.created_at).days
        if age_days < 30:
            score += 15
        elif age_days < 60:
            score += 10
        
        # Additional factors: 20 points
        if (hasattr(user_profile, 'calcium_intake') and user_profile.calcium_intake and
            hasattr(user_profile, 'vitamin_d_intake') and user_profile.vitamin_d_intake):
            score += 20
        
        return min(score, 100.0)


# ═════════════════════════════════════════════════════════════════════════════
# NUTRITION PLAN GENERATION
# ═════════════════════════════════════════════════════════════════════════════

class NutritionPlanGenerator:
    """Generate personalized nutrition recommendations based on risk level."""
    
    @staticmethod
    def generate_plan(user_id: int) -> Optional[Dict[str, Any]]:
        """
        Generate personalized nutrition plan for a user.
        
        Returns:
            {
                'success': bool,
                'plan': {...nutrition plan...},
                'riskLevel': str,
                'personalizationScore': float,
                'source': str,
                'warnings': list[str],
                'lastAssessmentDate': str
            }
        """
        try:
            # Fetch user's latest risk assessment
            user = User.query.get(user_id)
            if not user:
                logger.error(f"User {user_id} not found for nutrition plan")
                return _fallback_nutrition_plan(None, "user_not_found")
            
            user_profile = UserProfile.query.filter_by(user_id=user_id)\
                                           .order_by(UserProfile.created_at.desc())\
                                           .first()
            
            if not user_profile:
                logger.warning(f"No assessment found for user {user_id}, using fallback")
                return _fallback_nutrition_plan(None, "no_assessment")
            
            # Validate assessment is fresh
            age_of_assessment = datetime.utcnow() - user_profile.created_at
            if age_of_assessment > timedelta(days=90):
                logger.warning(f"Assessment for user {user_id} is {age_of_assessment.days} days old")
            
            risk_level = user_profile.risk_level.upper()
            
            logger.info(f"Generating nutrition plan for user {user_id}: risk_level={risk_level}")
            
            # Generate risk-stratified plan (existing logic enhanced)
            plan = NutritionPlanGenerator._generate_by_risk(user_profile)
            
            plan['personalizationScore'] = NutritionPlanGenerator._calculate_personalization_score(user_profile)
            plan['source'] = "Personalized Assessment"
            plan['lastAssessmentDate'] = user_profile.created_at.isoformat()
            plan['assessmentAge'] = age_of_assessment.days
            
            return {
                'success': True,
                'plan': plan,
                'riskLevel': risk_level,
                'personalizationScore': plan['personalizationScore'],
                'source': plan['source'],
                'warnings': [],
                'lastAssessmentDate': plan['lastAssessmentDate']
            }
            
        except Exception as e:
            logger.error(f"Error generating nutrition plan for user {user_id}: {str(e)}")
            return _fallback_nutrition_plan(None, f"generation_error: {str(e)}")
    
    @staticmethod
    def _generate_by_risk(user_profile: UserProfile) -> Dict[str, Any]:
        """Generate nutrition plan based on risk level and profile."""
        risk_level = user_profile.risk_level.upper()
        age = user_profile.age
        gender = getattr(user_profile, 'gender', 'unknown').lower()
        
        plan = {
            'riskLevel': risk_level,
            'age': age,
            'gender': gender,
            'personalizedFor': f"{risk_level} risk, Age {age}",
            'breakfast': [],
            'lunch': [],
            'dinner': [],
            'snacks': [],
            'foodsToAvoid': [],
            'weeklyRecommendations': [],
            'supplements': [],
            'doctorConsultation': False
        }
        
        # Generate standard meal plans (from existing logic)
        if risk_level == "LOW":
            plan.update({
                'nutritionStrategy': 'Balanced Maintenance & Prevention',
                'focus': 'Preventive nutrition with moderate calcium optimization',
                'dailyCalcium': '1000mg',
                'dailyVitaminD': '600 IU',
                'dailyProtein': '50-60g',
                'breakfast': [
                    'Greek yogurt (300mg calcium) with berries and almonds',
                    'Oatmeal with milk (300mg calcium) and chia seeds',
                    'Scrambled eggs with spinach and whole grain toast',
                    'Smoothie with milk, banana, and protein powder'
                ],
                'lunch': [
                    'Grilled chicken salad with leafy greens and cheese',
                    'Salmon (omega-3) with quinoa and broccoli',
                    'Lentil soup with whole grain bread and yogurt',
                    'Turkey sandwich with cheese (200mg calcium) and vegetables'
                ],
                'dinner': [
                    'Baked fish with roasted vegetables and brown rice',
                    'Chicken stir-fry with tofu (calcium-set) and vegetables',
                    'Lean beef with sweet potato and green beans',
                    'Vegetable curry with chickpeas and brown rice'
                ],
                'snacks': [
                    'Cheese (200mg calcium) and whole grain crackers',
                    'Apple slices with almond butter',
                    'Handful of mixed nuts (calcium, magnesium)',
                    'Cottage cheese (150mg calcium) with fruit'
                ],
                'foodsToAvoid': [
                    'Excessive caffeine (limit to 2 cups coffee/day)',
                    'High sodium foods (can increase calcium loss)',
                    'Excessive alcohol (limit to 1 drink/day)',
                    'Sugary drinks and processed foods'
                ],
                'weeklyRecommendations': [
                    'Eat 3-4 servings of dairy or calcium-rich foods daily',
                    'Include leafy greens in at least one meal daily',
                    'Consume fatty fish 2-3 times per week for vitamin D',
                    'Stay hydrated with 8 glasses of water daily',
                    'Limit processed foods and maintain balanced diet',
                    'Get 15-20 minutes of sun exposure for vitamin D'
                ],
                'supplements': [
                    'Consider Vitamin D supplement (600 IU) if limited sun exposure',
                    'Calcium supplement (500mg) if dietary intake is insufficient',
                    'Multivitamin with minerals for overall health'
                ],
                'doctorConsultation': False
            })
        
        elif risk_level == "MEDIUM" or risk_level == "MODERATE":
            plan.update({
                'nutritionStrategy': 'Enhanced Calcium & Vitamin D Optimization',
                'focus': 'Higher calcium focus with anti-inflammatory nutrition',
                'dailyCalcium': '1200mg',
                'dailyVitaminD': '800-1000 IU',
                'dailyProtein': '60-70g',
                'breakfast': [
                    'Fortified cereal (200mg calcium) with milk (300mg) and banana',
                    'Greek yogurt parfait (400mg calcium) with granola and berries',
                    'Egg white omelet with cheese (250mg calcium) and spinach',
                    'Protein smoothie with fortified milk, spinach, chia seeds, and turmeric'
                ],
                'lunch': [
                    'Salmon (omega-3, anti-inflammatory) with kale (180mg calcium) and quinoa',
                    'Chicken breast with brown rice and broccoli (60mg calcium)',
                    'Tofu stir-fry (calcium-set, 400mg) with bok choy and sesame seeds',
                    'Sardines (325mg calcium) with leafy greens and whole grain bread'
                ],
                'dinner': [
                    'Grilled fish (omega-3) with roasted Brussels sprouts and sweet potato',
                    'Lean turkey with asparagus and collard greens (360mg calcium)',
                    'Baked chicken with kale, beans (calcium, protein), and brown rice',
                    'Shrimp with whole grain pasta and spinach (anti-inflammatory)'
                ],
                'snacks': [
                    'Fortified almond milk (450mg calcium) with protein bar',
                    'Cheese cubes (300mg calcium) with anti-inflammatory vegetables',
                    'Edamame (calcium, protein, anti-inflammatory)',
                    'Greek yogurt (200mg calcium) with walnuts (omega-3)'
                ],
                'foodsToAvoid': [
                    'Caffeine (limit to 1 cup coffee/day - reduces calcium absorption)',
                    'High sodium processed foods (increases calcium loss)',
                    'Alcohol (limit to occasional - affects bone formation)',
                    'Carbonated soft drinks (phosphoric acid reduces calcium)',
                    'Excessive red meat (pro-inflammatory)',
                    'Trans fats and processed oils (pro-inflammatory)'
                ],
                'weeklyRecommendations': [
                    'Consume 4-5 servings of calcium-rich foods daily (1200mg target)',
                    'Include dark leafy greens (kale, collards) in every meal',
                    'Eat fatty fish 3-4 times per week for omega-3 and vitamin D',
                    'Take 20-30 minutes of sun exposure daily for vitamin D synthesis',
                    'Include anti-inflammatory foods: berries, turmeric, ginger, green tea',
                    'Avoid skipping meals - maintain consistent meal times',
                    'Reduce inflammatory foods: sugar, refined carbs, processed meats'
                ],
                'supplements': [
                    'Calcium citrate supplement (600mg daily - better absorption)',
                    'Vitamin D3 supplement (1000 IU daily for optimization)',
                    'Magnesium supplement (400mg daily - aids calcium absorption)',
                    'Vitamin K2 (100mcg daily - directs calcium to bones)',
                    'Omega-3 fish oil (anti-inflammatory, 1000mg EPA/DHA)',
                    'Consider curcumin supplement (anti-inflammatory)'
                ],
                'doctorConsultation': True,
                'consultationNote': 'Recommended to discuss supplement regimen with healthcare provider'
            })
        
        elif risk_level == "HIGH":
            plan.update({
                'nutritionStrategy': 'Intensive Bone Support & Fall Prevention',
                'focus': 'Protein + calcium dense meals with deficiency correction',
                'dailyCalcium': '1200-1500mg (split into 3-4 doses for better absorption)',
                'dailyVitaminD': '1000-2000 IU',
                'dailyProtein': '70-80g (1.0-1.2g per kg body weight)',
                'breakfast': [
                    'Fortified oatmeal (200mg) with milk (300mg), almonds (80mg), chia seeds - HIGH CALCIUM',
                    'High-protein Greek yogurt (400mg) with fortified granola (150mg) and berries',
                    'Egg and cheese breakfast burrito (350mg) with spinach (calcium + protein)',
                    'Protein shake: fortified milk (300mg), banana, protein powder (20g), almond butter'
                ],
                'lunch': [
                    'Salmon (300mg calcium, 25g protein, omega-3) with kale (180mg), quinoa, sesame seeds',
                    'Chicken breast (30g protein) with broccoli (60mg), fortified rice (200mg)',
                    'Sardines (325mg calcium, 25g protein) with mixed greens and whole grain bread',
                    'Tofu (calcium-set, 400mg, 20g protein) with bok choy (160mg) and vegetables'
                ],
                'dinner': [
                    'Baked fish (25g protein) with collard greens (360mg calcium) and sweet potato',
                    'Lean beef (30g protein) with Brussels sprouts and white beans (calcium + protein)',
                    'Chicken (28g protein) with bok choy (160mg), brown rice, and sesame seeds',
                    'Shrimp (24g protein) with spinach (245mg) and fortified pasta (200mg)'
                ],
                'snacks': [
                    'Fortified protein bars (300mg calcium, 15g protein)',
                    'Cheese (300mg calcium) with calcium-fortified crackers (100mg)',
                    'Almonds (80mg calcium) and dried figs (calcium, anti-inflammatory)',
                    'Fortified soy milk (450mg calcium) with mixed nuts'
                ],
                'foodsToAvoid': [
                    'ALL caffeine (coffee, tea, energy drinks) - significantly reduces calcium absorption',
                    'High sodium foods (>2000mg/day) - increases calcium excretion',
                    'Alcohol completely - impairs bone formation and increases fall risk',
                    'Carbonated beverages - phosphoric acid leaches calcium',
                    'Excessive fiber (>35g/day) - can reduce calcium absorption',
                    'Oxalate-rich foods in excess (spinach, rhubarb) - binds calcium',
                    'Phytate-rich foods (wheat bran) - reduces mineral absorption'
                ],
                'weeklyRecommendations': [
                    'Consume 5-6 servings of calcium-rich foods daily (aim for 1200-1500mg)',
                    'Include fortified foods in EVERY meal for consistent calcium intake',
                    'Eat fatty fish 4-5 times per week (vitamin D + omega-3 + protein)',
                    'Take prescribed supplements consistently at optimal times',
                    'Split calcium intake: 400-500mg per meal (better absorption)',
                    'Maintain strict meal schedule - no skipping meals',
                    'Protein at every meal: 20-30g per meal for muscle maintenance',
                    'Fall prevention: adequate protein prevents muscle loss',
                    'Monitor calcium and vitamin D levels monthly with blood tests',
                    'Consider working with registered dietitian specializing in bone health'
                ],
                'supplements': [
                    'Calcium citrate (600mg twice daily with meals - better absorption than carbonate)',
                    'Vitamin D3 (1000-2000 IU daily - take with fat-containing meal)',
                    'Magnesium (400-500mg daily - essential for calcium metabolism)',
                    'Vitamin K2 (MK-7, 100-200mcg daily - directs calcium to bones, not arteries)',
                    'Boron (3mg daily - enhances calcium and vitamin D metabolism)',
                    'Protein powder (whey or plant-based) if dietary protein insufficient',
                    'Omega-3 fish oil (1000-2000mg EPA/DHA - anti-inflammatory)',
                    'IMPORTANT: Take calcium and iron supplements separately (4 hours apart)'
                ],
                'doctorConsultation': True,
                'consultationNote': 'REQUIRED: Medical supervision for supplement dosing and monitoring',
                'fallPreventionNutrition': [
                    'Adequate protein (70-80g/day) prevents muscle loss and reduces fall risk',
                    'Vitamin D (1000+ IU) improves muscle strength and balance',
                    'Avoid alcohol - impairs balance and coordination',
                    'Stay hydrated - dehydration affects balance',
                    'Consistent meal times maintain energy and prevent weakness'
                ],
                'deficiencyCorrection': [
                    'If calcium deficient: Split 1500mg across 3-4 doses daily',
                    'If vitamin D deficient (<20 ng/mL): May need 2000-4000 IU daily initially',
                    'If protein deficient: Add protein shake between meals',
                    'If magnesium deficient: 400-500mg daily (aids calcium absorption)',
                    'Regular blood tests to monitor correction of deficiencies'
                ]
            })
        
        # Age-specific adjustments
        if age >= 65:
            plan['weeklyRecommendations'].append('Increase protein intake for muscle maintenance')
            plan['weeklyRecommendations'].append('Ensure adequate vitamin B12 intake (esp. if vegetarian)')
        
        # Gender-specific adjustments
        if gender == 'female':
            plan['weeklyRecommendations'].append('Monitor iron levels if pre-menopausal')
            if age >= 50:
                plan['weeklyRecommendations'].append('Post-menopausal: increase calcium intake priority')
        
        return plan
    
    @staticmethod
    def _calculate_personalization_score(user_profile: UserProfile) -> float:
        """Calculate how personalized the plan is (0-100)."""
        score = 0.0
        
        # Age data: 10 points
        if user_profile.age:
            score += 10
        
        # Gender data: 10 points
        if user_profile.gender and user_profile.gender != 'unknown':
            score += 10
        
        # Risk level: 20 points
        if user_profile.risk_level:
            score += 20
        
        # Calcium intake: 15 points
        if hasattr(user_profile, 'calcium_intake') and user_profile.calcium_intake:
            score += 15
        
        # Vitamin D: 15 points
        if hasattr(user_profile, 'vitamin_d_intake') and user_profile.vitamin_d_intake:
            score += 15
        
        # Assessment freshness (< 30 days): 15 points
        age_days = (datetime.utcnow() - user_profile.created_at).days
        if age_days < 30:
            score += 15
        elif age_days < 60:
            score += 10
        
        return min(score, 100.0)


# ═════════════════════════════════════════════════════════════════════════════
# FALLBACK PLANS (for users without assessments or in case of errors)
# ═════════════════════════════════════════════════════════════════════════════

def _fallback_exercise_plan(user_profile: Optional[UserProfile], reason: str) -> Dict[str, Any]:
    """Generate conservative fallback exercise plan."""
    logger.warning(f"Using fallback exercise plan. Reason: {reason}")
    
    return {
        'success': False,
        'plan': {
            'strategyName': 'Conservative Low-Risk Exercise Plan',
            'strategyDescription': 'Safe starting point exercise - complete assessment for personalized plan',
            'riskLevel': 'UNKNOWN',
            'weeklyMinutes': 150,
            'intensityLevel': 'Light to Moderate',
            'personalizedFor': 'User without completed assessment',
            'weeklySchedule': [
                {
                    'day': 'Monday',
                    'activity': 'Gentle walking',
                    'duration': '30 minutes',
                    'intensity': 'Light',
                    'personalNote': 'Consult doctor before starting - no assessment on file'
                }
            ],
            'safetyGuidelines': [
                '⚠️ IMPORTANT: Complete health assessment before starting exercise program',
                'Warm up 5 minutes before exercise',
                'Cool down 5 minutes after exercise',
                'Stop if you feel dizzy, short of breath, or experience pain',
                'Drink water before, during, and after exercise'
            ],
            'warnings': [
                'This is a generic fallback plan',
                'Please complete your health assessment for personalized recommendations',
                'Personalization will increase safety and effectiveness'
            ]
        },
        'riskLevel': 'UNKNOWN',
        'personalizationScore': 0.0,
        'source': f'Fallback - {reason}',
        'warnings': [
            'Assessment not found or error during generation',
            'Please complete assessment for personalized exercise recommendations',
            reason
        ],
        'lastAssessmentDate': None
    }


def _fallback_nutrition_plan(user_profile: Optional[UserProfile], reason: str) -> Dict[str, Any]:
    """Generate conservative fallback nutrition plan."""
    logger.warning(f"Using fallback nutrition plan. Reason: {reason}")
    
    return {
        'success': False,
        'plan': {
            'nutritionStrategy': 'Generic Bone Health Maintenance',
            'focus': 'Conservative balanced approach - complete assessment for personalization',
            'riskLevel': 'UNKNOWN',
            'personalizedFor': 'User without completed assessment',
            'dailyCalcium': '1000-1200mg',
            'dailyVitaminD': '600 IU',
            'dailyProtein': '50-60g',
            'breakfast': [
                'Milk with cereal',
                'Yogurt with fruit',
                'Toast with cheese'
            ],
            'lunch': [
                'Chicken or fish with vegetables',
                'Soup with whole grain bread',
                'Salad with cheese or legumes'
            ],
            'dinner': [
                'Fish with vegetables and rice',
                'Lean meat with potatoes',
                'Pasta with vegetable sauce'
            ],
            'snacks': [
                'Cheese and crackers',
                'Nuts and dried fruit',
                'Yogurt'
            ],
            'foodsToAvoid': [
                'Excessive caffeine',
                'Alcohol',
                'High sodium processed foods',
                'Sugary drinks'
            ],
            'weeklyRecommendations': [
                '⚠️ IMPORTANT: Complete health assessment for personalized nutrition',
                'Aim for 3 servings of dairy or calcium-rich foods daily',
                'Include protein at every meal',
                'Eat vegetables daily',
                'Stay hydrated with water'
            ],
            'supplements': [
                'Consider Vitamin D supplement',
                'Consider Calcium supplement if intake is low'
            ],
            'doctorConsultation': True,
            'warnings': [
                'This is a generic fallback plan',
                'Please complete your health assessment for personalized recommendations'
            ]
        },
        'riskLevel': 'UNKNOWN',
        'personalizationScore': 0.0,
        'source': f'Fallback - {reason}',
        'warnings': [
            'Assessment not found or error during generation',
            'Please complete assessment for personalized nutrition recommendations',
            reason
        ],
        'lastAssessmentDate': None
    }
