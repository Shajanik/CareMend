"""
Exercise and Walking Tracker Database Models
Stores all exercise sessions, walking sessions, and progress history
"""

from extensions import db
from datetime import datetime

class ExerciseSession(db.Model):
    """Stores completed exercise sessions"""
    __tablename__ = 'exercise_sessions'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    exercise_id = db.Column(db.String(100), nullable=False)
    exercise_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # warmup, weight-bearing, balance, etc.
    duration_minutes = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)  # easy, moderate, difficult
    completed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD format
    
    # Relationship
    user = db.relationship('User', backref=db.backref('exercise_sessions', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'exerciseId': self.exercise_id,
            'exerciseName': self.exercise_name,
            'category': self.category,
            'durationMinutes': self.duration_minutes,
            'difficulty': self.difficulty,
            'completedAt': self.completed_at.isoformat(),
            'date': self.date
        }


class WalkingSession(db.Model):
    """Stores walking tracker sessions"""
    __tablename__ = 'walking_sessions'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD format
    duration = db.Column(db.Integer, nullable=False)  # seconds
    steps = db.Column(db.Integer, nullable=False)
    distance = db.Column(db.Float, nullable=False)  # kilometers
    calories = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    risk_category = db.Column(db.String(20), nullable=False)  # LOW, MEDIUM, HIGH
    
    # Relationship
    user = db.relationship('User', backref=db.backref('walking_sessions', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'date': self.date,
            'duration': self.duration,
            'steps': self.steps,
            'distance': self.distance,
            'calories': self.calories,
            'startTime': self.start_time.isoformat(),
            'endTime': self.end_time.isoformat(),
            'riskCategory': self.risk_category
        }


class ExerciseStats(db.Model):
    """Aggregated daily exercise statistics"""
    __tablename__ = 'exercise_stats'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD format
    total_sessions = db.Column(db.Integer, default=0)
    total_minutes = db.Column(db.Integer, default=0)
    categories_completed = db.Column(db.Text)  # JSON array of categories
    
    # Relationship
    user = db.relationship('User', backref=db.backref('exercise_stats', lazy=True))
    
    # Unique constraint: one stats record per user per day
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='_user_date_uc'),)
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'userId': self.user_id,
            'date': self.date,
            'totalSessions': self.total_sessions,
            'totalMinutes': self.total_minutes,
            'categoriesCompleted': json.loads(self.categories_completed) if self.categories_completed else []
        }
