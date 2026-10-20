"""
services/nutrition_service.py — AI Nutrition Assistant for CareMend
================================================================
Generates personalized weekly diet plans for bone health based on user profile and risk level.
"""

from utils.logger import logger


class NutritionService:
    """
    Profile-aware nutrition assistant that generates personalized weekly diet plans
    for osteoporosis prevention/management based on user's risk level and profile data.
    """

    def __init__(self):
        # Meal templates organized by risk level
        self.meal_templates = {
            "LOW": {
                "calcium_target": "1000 mg/day",
                "focus": "Maintenance diet with balanced nutrition"
            },
            "MEDIUM": {
                "calcium_target": "1000-1200 mg/day", 
                "focus": "Increased calcium + vitamin D rich foods, improved protein"
            },
            "HIGH": {
                "calcium_target": "1200+ mg/day",
                "focus": "Strong calcium-rich + vitamin D + high protein diet with bone-support nutrients"
            }
        }

    def generate_weekly_plan(self, user_profile: dict) -> dict:
        """
        Generate a personalized 7-day diet plan based on user profile.
        
        Parameters:
        -----------
        user_profile : dict
            User's profile data including risk_level, age, gender, etc.
            
        Returns:
        --------
        dict : Complete weekly diet plan with meals for each day
        """
        
        # Validate required profile data
        if not user_profile or not user_profile.get('risk_level'):
            return {
                "error": "Please complete your clinical assessment to get a personalized diet plan."
            }
        
        risk_level = user_profile.get('risk_level', '').upper()
        risk_percentage = user_profile.get('risk_percentage', 0)
        age = user_profile.get('age', 50)
        gender = user_profile.get('gender', 'female')
        
        logger.info(f"Generating nutrition plan for {gender}, age {age}, risk {risk_level}")
        
        # Get meal configuration for risk level
        config = self.meal_templates.get(risk_level, self.meal_templates["MEDIUM"])
        
        # Generate 7-day plan
        weekly_plan = {
            "user_summary": {
                "risk_level": risk_level,
                "risk_percentage": risk_percentage,
                "calcium_target": config["calcium_target"],
                "focus": config["focus"]
            },
            "days": {}
        }
        
        days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
        
        for i, day in enumerate(days):
            weekly_plan["days"][day] = self._generate_day_meals(risk_level, day, i)
        
        # Add tips section
        weekly_plan["tips"] = self._generate_tips(risk_level, config["calcium_target"])
        
        return weekly_plan

    def _generate_day_meals(self, risk_level: str, day: str, day_index: int) -> dict:
        """Generate meals for a specific day based on risk level."""
        
        # Base meals that rotate throughout the week
        breakfast_options = self._get_breakfast_options(risk_level, day_index)
        lunch_options = self._get_lunch_options(risk_level, day_index)
        dinner_options = self._get_dinner_options(risk_level, day_index)
        snack_options = self._get_snack_options(risk_level, day_index)
        
        return {
            "breakfast": breakfast_options,
            "lunch": lunch_options,
            "dinner": dinner_options,
            "snacks": snack_options
        }

    def _get_breakfast_options(self, risk_level: str, day_index: int) -> dict:
        """Get breakfast options based on risk level and day."""
        
        # High calcium breakfast options
        veg_breakfasts = [
            "Ragi porridge with milk + almonds + sesame seeds (High Calcium)",
            "Paneer paratha with curd + glass of milk (High Calcium)", 
            "Oats with milk + chopped almonds + ragi flour (High Calcium)",
            "Idli with sesame chutney + buttermilk (High Calcium)",
            "Ragi dosa with paneer filling + milk (High Calcium)",
            "Upma with vegetables + glass of milk + almonds (High Calcium)",
            "Poha with peanuts + curd + milk (High Calcium)"
        ]
        
        non_veg_breakfasts = [
            "Scrambled eggs with milk + ragi toast + almonds (High Calcium, Vitamin D)",
            "Egg paratha with curd + glass of milk (High Calcium, Vitamin D)",
            "Boiled eggs with ragi porridge + milk (High Calcium, Vitamin D)", 
            "Egg dosa with sesame chutney + buttermilk (High Calcium, Vitamin D)",
            "Omelet with cheese + milk + almonds (High Calcium, Vitamin D)",
            "Egg sandwich with milk + sesame seeds (High Calcium, Vitamin D)",
            "Fish curry with ragi roti + curd (High Calcium, Vitamin D)"
        ]
        
        return {
            "vegetarian": veg_breakfasts[day_index % len(veg_breakfasts)],
            "non_vegetarian": non_veg_breakfasts[day_index % len(non_veg_breakfasts)]
        }

    def _get_lunch_options(self, risk_level: str, day_index: int) -> dict:
        """Get lunch options based on risk level and day."""
        
        veg_lunches = [
            "Dal rice + palak paneer + curd + sesame laddu (High Calcium)",
            "Rajma rice + spinach curry + buttermilk + almonds (High Calcium)",
            "Curd rice + drumstick leaves curry + paneer sabzi (High Calcium)",
            "Ragi roti + dal + green leafy vegetables + curd (High Calcium)",
            "Quinoa pulao + paneer curry + buttermilk + sesame seeds (High Calcium)",
            "Brown rice + moong dal + methi sabzi + curd (High Calcium)",
            "Millet roti + chana dal + spinach + paneer raita (High Calcium)"
        ]
        
        non_veg_lunches = [
            "Fish curry + rice + spinach dal + curd (High Calcium, Vitamin D)",
            "Chicken curry + ragi roti + green vegetables + buttermilk (High Calcium, Vitamin D)",
            "Egg curry + rice + dal + curd + sesame chutney (High Calcium, Vitamin D)",
            "Sardine curry + millet roti + spinach + paneer raita (High Calcium, Vitamin D)",
            "Mutton curry + rice + dal + green leafy vegetables + curd (High Calcium, Vitamin D)",
            "Fish fry + ragi roti + dal + buttermilk + almonds (High Calcium, Vitamin D)",
            "Chicken biryani + raita + spinach curry + milk (High Calcium, Vitamin D)"
        ]
        
        return {
            "vegetarian": veg_lunches[day_index % len(veg_lunches)],
            "non_vegetarian": non_veg_lunches[day_index % len(non_veg_lunches)]
        }

    def _get_dinner_options(self, risk_level: str, day_index: int) -> dict:
        """Get dinner options based on risk level and day."""
        
        veg_dinners = [
            "Ragi roti + dal + paneer curry + milk + almonds (High Calcium)",
            "Quinoa khichdi + curd + green vegetables + sesame seeds (High Calcium)",
            "Millet roti + rajma + spinach + buttermilk (High Calcium)",
            "Brown rice + moong dal + methi sabzi + paneer + milk (High Calcium)",
            "Ragi dosa + sambar + coconut chutney + curd (High Calcium)",
            "Bajra roti + dal + green leafy vegetables + milk (High Calcium)",
            "Oats upma + paneer + curd + almonds + milk (High Calcium)"
        ]
        
        non_veg_dinners = [
            "Grilled fish + ragi roti + dal + curd + milk (High Calcium, Vitamin D)",
            "Chicken curry + millet roti + spinach + buttermilk (High Calcium, Vitamin D)",
            "Egg curry + rice + dal + green vegetables + milk (High Calcium, Vitamin D)",
            "Fish curry + ragi roti + paneer sabzi + curd (High Calcium, Vitamin D)",
            "Chicken soup + ragi roti + dal + milk + almonds (High Calcium, Vitamin D)",
            "Sardine curry + rice + spinach + curd + sesame seeds (High Calcium, Vitamin D)",
            "Mutton curry + millet roti + dal + buttermilk (High Calcium, Vitamin D)"
        ]
        
        return {
            "vegetarian": veg_dinners[day_index % len(veg_dinners)],
            "non_vegetarian": non_veg_dinners[day_index % len(non_veg_dinners)]
        }

    def _get_snack_options(self, risk_level: str, day_index: int) -> dict:
        """Get snack options based on risk level and day."""
        
        veg_snacks = [
            "Handful of almonds + sesame seeds + glass of milk (High Calcium)",
            "Paneer cubes + buttermilk + roasted peanuts (High Calcium)",
            "Curd with fruits + sesame laddu (High Calcium)",
            "Milk shake with almonds + ragi powder (High Calcium)",
            "Cheese sandwich + buttermilk (High Calcium)",
            "Yogurt with nuts + sesame seeds (High Calcium)",
            "Paneer tikka + milk + almonds (High Calcium)"
        ]
        
        non_veg_snacks = [
            "Boiled eggs + milk + almonds + sesame seeds (High Calcium, Vitamin D)",
            "Fish fingers + buttermilk + nuts (High Calcium, Vitamin D)",
            "Egg sandwich + milk + sesame laddu (High Calcium, Vitamin D)",
            "Chicken tikka + curd + almonds (High Calcium, Vitamin D)",
            "Tuna salad + milk + sesame seeds (High Calcium, Vitamin D)",
            "Egg bhurji + ragi roti + buttermilk (High Calcium, Vitamin D)",
            "Fish cutlet + milk + nuts (High Calcium, Vitamin D)"
        ]
        
        return {
            "vegetarian": veg_snacks[day_index % len(veg_snacks)],
            "non_vegetarian": non_veg_snacks[day_index % len(non_veg_snacks)]
        }

    def _generate_tips(self, risk_level: str, calcium_target: str) -> dict:
        """Generate personalized tips based on risk level."""
        
        base_tips = [
            f"🎯 **Calcium Goal**: Aim for {calcium_target} from food sources",
            "☀️ **Daily Sunlight**: Get 15-20 minutes of morning sunlight for vitamin D",
            "💧 **Hydration**: Drink 8-10 glasses of water daily",
            "🥛 **Milk Timing**: Have milk between meals for better calcium absorption"
        ]
        
        if risk_level == "HIGH":
            base_tips.extend([
                "⚠️ **Priority**: Focus on 3 glasses of milk + 100g paneer daily",
                "🌿 **Herbs**: Include sesame seeds (til) and ragi in every meal",
                "🚫 **Avoid**: Tea/coffee with meals (reduces calcium absorption)"
            ])
        elif risk_level == "MEDIUM":
            base_tips.extend([
                "📈 **Increase**: Add 2 glasses milk + curd + almonds daily",
                "🥬 **Greens**: Include spinach, methi, drumstick leaves regularly",
                "⏰ **Timing**: Space calcium-rich foods throughout the day"
            ])
        else:  # LOW
            base_tips.extend([
                "✅ **Maintain**: Continue balanced diet with 2 glasses milk daily",
                "🥜 **Variety**: Include different nuts and seeds weekly",
                "🏃 **Active**: Combine good nutrition with regular exercise"
            ])
        
        return {
            "daily_tips": base_tips,
            "regenerate_note": "💡 You can regenerate this plan anytime based on updated profile."
        }


# Singleton instance
nutrition_service = NutritionService()