"""
models_db/careconnect_model.py — CareConnect Query Management Models
================================================================
Data models for AI-assisted doctor-patient guidance system.
"""

from extensions import db
from datetime import datetime
from sqlalchemy import Text, Integer, String, DateTime, Boolean


class CareConnectQuery(db.Model):
    """
    Model for storing patient queries in CareConnect system.
    Supports AI-assisted guidance and doctor-patient communication.
    """
    __tablename__ = 'careconnect_queries'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Query content
    question = db.Column(Text, nullable=False)
    category = db.Column(String(100), nullable=True)  # AI-categorized
    ai_summary = db.Column(Text, nullable=True)  # AI-generated summary
    ai_response = db.Column(Text, nullable=True)  # AI instant response
    
    # Status tracking
    status = db.Column(String(50), default='pending_doctor')  # pending_doctor, doctor_replied, closed
    priority = db.Column(String(20), default='normal')  # low, normal, high
    
    # Doctor response
    doctor_reply = db.Column(Text, nullable=True)
    doctor_name = db.Column(String(100), nullable=True)
    doctor_specialty = db.Column(String(100), nullable=True)
    
    # Timestamps
    created_at = db.Column(DateTime, default=datetime.utcnow)
    ai_replied_at = db.Column(DateTime, nullable=True)
    reviewed_at = db.Column(DateTime, nullable=True)
    replied_at = db.Column(DateTime, nullable=True)
    closed_at = db.Column(DateTime, nullable=True)
    
    # Metadata
    is_urgent = db.Column(Boolean, default=False)
    submitted_to_doctor = db.Column(Boolean, default=False)
    patient_satisfied = db.Column(Boolean, nullable=True)
    
    def to_dict(self):
        """Convert query to dictionary for API responses."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'question': self.question,
            'category': self.category,
            'aiSummary': self.ai_summary,
            'aiResponse': self.ai_response,
            'status': self.status,
            'priority': self.priority,
            'doctorReply': self.doctor_reply,
            'doctorName': self.doctor_name,
            'doctorSpecialty': self.doctor_specialty,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'aiRepliedAt': self.ai_replied_at.isoformat() if self.ai_replied_at else None,
            'reviewedAt': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'repliedAt': self.replied_at.isoformat() if self.replied_at else None,
            'closedAt': self.closed_at.isoformat() if self.closed_at else None,
            'isUrgent': self.is_urgent,
            'submittedToDoctor': self.submitted_to_doctor,
            'patientSatisfied': self.patient_satisfied
        }


class CareConnectCategory(db.Model):
    """
    Predefined categories for organizing patient queries.
    """
    __tablename__ = 'careconnect_categories'
    
    id = db.Column(Integer, primary_key=True)
    name = db.Column(String(100), nullable=False, unique=True)
    description = db.Column(Text, nullable=True)
    icon = db.Column(String(50), nullable=True)
    color = db.Column(String(20), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color
        }


class CareConnectDoctor(db.Model):
    """
    Doctor profiles for CareConnect system.
    """
    __tablename__ = 'careconnect_doctors'
    
    id = db.Column(Integer, primary_key=True)
    name = db.Column(String(100), nullable=False)
    specialty = db.Column(String(100), nullable=False)
    credentials = db.Column(String(200), nullable=True)
    bio = db.Column(Text, nullable=True)
    
    # Availability
    is_active = db.Column(Boolean, default=True)
    response_time_hours = db.Column(Integer, default=24)
    
    # Statistics
    total_queries_handled = db.Column(Integer, default=0)
    average_rating = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'specialty': self.specialty,
            'credentials': self.credentials,
            'bio': self.bio,
            'isActive': self.is_active,
            'responseTimeHours': self.response_time_hours,
            'totalQueriesHandled': self.total_queries_handled,
            'averageRating': self.average_rating
        }