"""
models_db/nutrition_model.py — Nutrition Plan Models
====================================================
Data models for personalized nutrition plans.
"""

from extensions import db
from datetime import datetime
from sqlalchemy import Text, Integer, String, DateTime, JSON


class NutritionPlan(db.Model):
    """
    Model for storing personalized nutrition plans.
    """
    __tablename__ = 'nutrition_plans'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Risk assessment data
    risk_level = db.Column(String(50), nullable=False)  # Low, Moderate, High, Severe
    risk_percentage = db.Column(db.Float, nullable=True)
    
    # Patient profile data
    age = db.Column(Integer, nullable=True)
    gender = db.Column(String(20), nullable=True)
    weight = db.Column(db.Float, nullable=True)
    height = db.Column(db.Float, nullable=True)
    
    # Meal plan (stored as JSON)
    meal_plan_json = db.Column(JSON, nullable=False)
    
    # Timestamps
    generated_at = db.Column(DateTime, default=datetime.utcnow)
    last_updated = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert nutrition plan to dictionary for API responses."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'riskLevel': self.risk_level,
            'riskPercentage': self.risk_percentage,
            'age': self.age,
            'gender': self.gender,
            'weight': self.weight,
            'height': self.height,
            'mealPlan': self.meal_plan_json,
            'generatedAt': self.generated_at.isoformat() if self.generated_at else None,
            'lastUpdated': self.last_updated.isoformat() if self.last_updated else None
        }
