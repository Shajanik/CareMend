"""
models_db/auth_model.py — User account table.
"""

from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id                = db.Column(db.Integer,     primary_key=True)
    full_name         = db.Column(db.String(120),  nullable=False)
    email             = db.Column(db.String(120),  unique=True, nullable=False, index=True)
    username          = db.Column(db.String(60),   unique=True, nullable=False, index=True)
    password_hash     = db.Column(db.String(256),  nullable=False)
    mobile            = db.Column(db.String(20),   nullable=True)
    # Extended profile fields
    dob               = db.Column(db.String(30),   nullable=True)   # date of birth
    gender            = db.Column(db.String(20),   nullable=True)
    blood_type        = db.Column(db.String(10),   nullable=True)
    emergency_contact = db.Column(db.String(200),  nullable=True)
    allergies         = db.Column(db.Text,         nullable=True)   # comma-separated
    medications       = db.Column(db.Text,         nullable=True)   # comma-separated
    has_completed_assessment = db.Column(db.Boolean, default=False, nullable=False)  # NEW: Track assessment completion
    created_at        = db.Column(db.DateTime,     default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":                self.id,
            "full_name":         self.full_name,
            "email":             self.email,
            "username":          self.username,
            "mobile":            self.mobile,
            "dob":               self.dob,
            "gender":            self.gender,
            "blood_type":        self.blood_type,
            "emergency_contact": self.emergency_contact,
            "allergies":         self.allergies,
            "medications":       self.medications,
            "has_completed_assessment": self.has_completed_assessment,
            "created_at":        self.created_at.isoformat(),
        }
