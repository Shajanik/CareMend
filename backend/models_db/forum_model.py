"""
models_db/forum_model.py — Community Forum Models
=================================================
Data models for community forum posts, comments, and replies.
"""

from extensions import db
from datetime import datetime
from sqlalchemy import Text, Integer, String, DateTime, Boolean, ForeignKey


class ForumPost(db.Model):
    """
    Model for storing community forum posts.
    """
    __tablename__ = 'forum_posts'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Post content
    content = db.Column(Text, nullable=False)
    post_type = db.Column(String(20), default='text')  # text, image, audio, video
    
    # Metadata
    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    edited = db.Column(Boolean, default=False)
    
    # Engagement
    likes_count = db.Column(Integer, default=0)
    comments_count = db.Column(Integer, default=0)
    
    # Status
    is_pinned = db.Column(Boolean, default=False)
    is_deleted = db.Column(Boolean, default=False)
    
    # Relationships
    comments = db.relationship('ForumComment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('ForumLike', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_user=True):
        """Convert post to dictionary for API responses."""
        result = {
            'id': self.id,
            'userId': self.user_id,
            'content': self.content,
            'postType': self.post_type,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'edited': self.edited,
            'likesCount': self.likes_count,
            'commentsCount': self.comments_count,
            'isPinned': self.is_pinned,
            'isDeleted': self.is_deleted
        }
        
        if include_user:
            from models_db.auth_model import User
            user = User.query.get(self.user_id)
            if user:
                result['user'] = {
                    'id': user.id,
                    'fullName': user.full_name,
                    'username': user.username,
                    'email': user.email
                }
        
        return result


class ForumComment(db.Model):
    """
    Model for storing comments on forum posts.
    """
    __tablename__ = 'forum_comments'
    
    id = db.Column(Integer, primary_key=True)
    post_id = db.Column(Integer, db.ForeignKey('forum_posts.id'), nullable=False)
    user_id = db.Column(Integer, db.ForeignKey('users.id'), nullable=False)
    parent_comment_id = db.Column(Integer, db.ForeignKey('forum_comments.id'), nullable=True)  # For replies
    
    # Comment content
    content = db.Column(Text, nullable=False)
    
    # Metadata
    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    edited = db.Column(Boolean, default=False)
    
    # Status
    is_deleted = db.Column(Boolean, default=False)
    is_doctor_reply = db.Column(Boolean, default=False)  # Badge for doctor replies
    
    # Relationships
    replies = db.relationship('ForumComment', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')
    
    def to_dict(self, include_user=True, include_replies=False):
        """Convert comment to dictionary for API responses."""
        result = {
            'id': self.id,
            'postId': self.post_id,
            'userId': self.user_id,
            'parentCommentId': self.parent_comment_id,
            'content': self.content,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'edited': self.edited,
            'isDeleted': self.is_deleted,
            'isDoctorReply': self.is_doctor_reply
        }
        
        if include_user:
            from models_db.auth_model import User
            user = User.query.get(self.user_id)
            if user:
                result['user'] = {
                    'id': user.id,
                    'fullName': user.full_name,
                    'username': user.username,
                    'email': user.email
                }
        
        if include_replies:
            result['replies'] = [reply.to_dict(include_user=True) for reply in self.replies.filter_by(is_deleted=False).all()]
        
        return result


class ForumLike(db.Model):
    """
    Model for storing likes on forum posts.
    """
    __tablename__ = 'forum_likes'
    
    id = db.Column(Integer, primary_key=True)
    post_id = db.Column(Integer, db.ForeignKey('forum_posts.id'), nullable=False)
    user_id = db.Column(Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate likes
    __table_args__ = (db.UniqueConstraint('post_id', 'user_id', name='unique_post_like'),)
    
    def to_dict(self):
        """Convert like to dictionary for API responses."""
        return {
            'id': self.id,
            'postId': self.post_id,
            'userId': self.user_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
