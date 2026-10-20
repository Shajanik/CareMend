"""
models_db/user_model.py — SQLAlchemy ORM models.

Tables:
  UserProfile  — stores each risk assessment submission
  ChatHistory  — stores each chatbot message + response
"""

from datetime import datetime
from extensions import db


class UserProfile(db.Model):
    """One row per risk assessment submitted by a user."""

    __tablename__ = "user_profiles"

    id                = db.Column(db.Integer, primary_key=True)
    user_id           = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # Link to authenticated user
    age               = db.Column(db.Integer, nullable=False)
    gender            = db.Column(db.String(10), nullable=False)
    hormonal_changes  = db.Column(db.String(20), nullable=False)
    family_history    = db.Column(db.String(5),  nullable=False)
    body_weight       = db.Column(db.String(15), nullable=False)
    calcium_intake    = db.Column(db.String(15), nullable=False)
    vitamin_d_intake  = db.Column(db.String(15), nullable=False)
    physical_activity = db.Column(db.String(15), nullable=False)
    risk_score        = db.Column(db.Integer,    nullable=False)   # 0/1/2 (legacy)
    risk_level        = db.Column(db.String(10), nullable=False)   # LOW/MEDIUM/HIGH
    risk_percentage   = db.Column(db.Float,      nullable=True)    # Exact percentage (0-100)
    created_at        = db.Column(db.DateTime,   default=datetime.utcnow)

    # Relationship: one profile → many chat messages
    chats = db.relationship("ChatHistory", backref="profile", lazy=True)

    def to_dict(self):
        return {
            "id":                self.id,
            "user_id":           self.user_id,
            "age":               self.age,
            "gender":            self.gender,
            "hormonal_changes":  self.hormonal_changes,
            "family_history":    self.family_history,
            "body_weight":       self.body_weight,
            "calcium_intake":    self.calcium_intake,
            "vitamin_d_intake":  self.vitamin_d_intake,
            "physical_activity": self.physical_activity,
            "risk_score":        self.risk_score,
            "risk_level":        self.risk_level,
            "risk_percentage":   self.risk_percentage,
            "created_at":        self.created_at.isoformat(),
        }


class AssessmentResult(db.Model):
    """
    Full ML response for one assessment (explanation, inputs actually used, model version).
    A separate table so the legacy `user_profiles` schema does not need a migration.
    """

    __tablename__ = "assessment_results"

    id             = db.Column(db.Integer, primary_key=True)
    profile_id     = db.Column(db.Integer, db.ForeignKey("user_profiles.id"), nullable=False, unique=True)
    model_version  = db.Column(db.String(40), nullable=False)
    score          = db.Column(db.Float, nullable=False)          # uncalibrated model score, 0-1
    response_json  = db.Column(db.Text, nullable=False)           # structured API response
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)


class ChatHistory(db.Model):
    """One row per chatbot exchange."""

    __tablename__ = "chat_history"

    id         = db.Column(db.Integer,  primary_key=True)
    user_id    = db.Column(db.Integer,  db.ForeignKey("user_profiles.id"), nullable=True)
    message    = db.Column(db.Text,     nullable=False)
    response   = db.Column(db.Text,     nullable=False)
    timestamp  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":        self.id,
            "user_id":   self.user_id,
            "message":   self.message,
            "response":  self.response,
            "timestamp": self.timestamp.isoformat(),
        }


class CareConnectConversation(db.Model):
    """Store CareConnect AI conversation history."""

    __tablename__ = "careconnect_conversations"

    id         = db.Column(db.Integer,  primary_key=True)
    user_id    = db.Column(db.Integer,  db.ForeignKey("users.id"), nullable=False)
    role       = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content    = db.Column(db.Text,     nullable=False)
    timestamp  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":        self.id,
            "user_id":   self.user_id,
            "role":      self.role,
            "content":   self.content,
            "timestamp": self.timestamp.isoformat(),
        }
