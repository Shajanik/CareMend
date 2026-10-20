"""
routes/forum_routes.py — Community Forum API endpoints
======================================================
Endpoints for forum posts, comments, and replies with persistence.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from extensions import db
from models_db.forum_model import ForumPost, ForumComment, ForumLike
from models_db.auth_model import User
from utils.logger import logger

forum_bp = Blueprint('forum', __name__)


@forum_bp.route('/api/forum/posts', methods=['GET'])
def get_all_posts():
    """
    Get all forum posts with pagination.
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Get posts ordered by pinned first, then by creation date
        posts_query = ForumPost.query.filter_by(is_deleted=False)\
                                    .order_by(ForumPost.is_pinned.desc(), ForumPost.created_at.desc())
        
        posts = posts_query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'posts': [post.to_dict(include_user=True) for post in posts.items],
            'total': posts.total,
            'page': page,
            'pages': posts.pages,
            'hasNext': posts.has_next,
            'hasPrev': posts.has_prev
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching forum posts: {str(e)}")
        return jsonify({'error': 'Failed to fetch posts'}), 500


@forum_bp.route('/api/forum/posts/user/<int:user_id>', methods=['GET'])
def get_user_posts(user_id):
    """
    Get all posts by a specific user.
    """
    try:
        posts = ForumPost.query.filter_by(user_id=user_id, is_deleted=False)\
                              .order_by(ForumPost.created_at.desc())\
                              .all()
        
        return jsonify({
            'success': True,
            'posts': [post.to_dict(include_user=True) for post in posts],
            'total': len(posts)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching user posts: {str(e)}")
        return jsonify({'error': 'Failed to fetch user posts'}), 500


@forum_bp.route('/api/forum/posts', methods=['POST'])
def create_post():
    """
    Create a new forum post.
    
    Expected JSON:
    {
        "userId": 123,
        "content": "Post content here",
        "postType": "text"
    }
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        content = data.get('content', '').strip()
        post_type = data.get('postType', 'text')
        
        if not user_id:
            return jsonify({'error': 'User ID is required', 'code': 'NO_USER_ID'}), 400
        
        if not content:
            return jsonify({'error': 'Content is required', 'code': 'NO_CONTENT'}), 400
        
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found', 'code': 'USER_NOT_FOUND'}), 404
        
        # Create post
        post = ForumPost(
            user_id=user_id,
            content=content,
            post_type=post_type
        )
        
        db.session.add(post)
        db.session.commit()
        
        logger.info(f"Forum post created - Post ID: {post.id}, User: {user_id}")
        
        return jsonify({
            'success': True,
            'post': post.to_dict(include_user=True),
            'message': 'Post created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating forum post: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': 'Failed to create post',
            'code': 'CREATION_ERROR'
        }), 500


@forum_bp.route('/api/forum/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    """
    Update an existing forum post.
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        content = data.get('content', '').strip()
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        if not content:
            return jsonify({'error': 'Content is required'}), 400
        
        post = ForumPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Verify ownership
        if post.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        post.content = content
        post.edited = True
        post.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"Forum post updated - Post ID: {post_id}")
        
        return jsonify({
            'success': True,
            'post': post.to_dict(include_user=True),
            'message': 'Post updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating forum post: {str(e)}")
        return jsonify({'error': 'Failed to update post'}), 500


@forum_bp.route('/api/forum/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    """
    Soft delete a forum post.
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        post = ForumPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Verify ownership
        if post.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        post.is_deleted = True
        db.session.commit()
        
        logger.info(f"Forum post deleted - Post ID: {post_id}")
        
        return jsonify({
            'success': True,
            'message': 'Post deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting forum post: {str(e)}")
        return jsonify({'error': 'Failed to delete post'}), 500


@forum_bp.route('/api/forum/posts/<int:post_id>/comments', methods=['GET'])
def get_post_comments(post_id):
    """
    Get all comments for a specific post.
    """
    try:
        # Get top-level comments (no parent)
        comments = ForumComment.query.filter_by(post_id=post_id, parent_comment_id=None, is_deleted=False)\
                                    .order_by(ForumComment.created_at.asc())\
                                    .all()
        
        return jsonify({
            'success': True,
            'comments': [comment.to_dict(include_user=True, include_replies=True) for comment in comments]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching post comments: {str(e)}")
        return jsonify({'error': 'Failed to fetch comments'}), 500


@forum_bp.route('/api/forum/comments', methods=['POST'])
def create_comment():
    """
    Create a new comment or reply.
    
    Expected JSON:
    {
        "userId": 123,
        "postId": 456,
        "content": "Comment content",
        "parentCommentId": 789  // Optional, for replies
    }
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        post_id = data.get('postId')
        content = data.get('content', '').strip()
        parent_comment_id = data.get('parentCommentId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        if not post_id:
            return jsonify({'error': 'Post ID is required'}), 400
        
        if not content:
            return jsonify({'error': 'Content is required'}), 400
        
        # Verify post exists
        post = ForumPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Check if user is a doctor (you can add logic to determine this)
        user = User.query.get(user_id)
        is_doctor = user.email.startswith('dr.') if user else False  # Simple check
        
        # Create comment
        comment = ForumComment(
            post_id=post_id,
            user_id=user_id,
            content=content,
            parent_comment_id=parent_comment_id,
            is_doctor_reply=is_doctor
        )
        
        db.session.add(comment)
        
        # Update post comment count
        post.comments_count += 1
        
        db.session.commit()
        
        logger.info(f"Forum comment created - Comment ID: {comment.id}, Post: {post_id}, User: {user_id}")
        
        return jsonify({
            'success': True,
            'comment': comment.to_dict(include_user=True),
            'message': 'Comment created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating forum comment: {str(e)}")
        return jsonify({'error': 'Failed to create comment'}), 500


@forum_bp.route('/api/forum/comments/<int:comment_id>', methods=['PUT'])
def update_comment(comment_id):
    """
    Update an existing comment.
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        content = data.get('content', '').strip()
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        if not content:
            return jsonify({'error': 'Content is required'}), 400
        
        comment = ForumComment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404
        
        # Verify ownership
        if comment.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        comment.content = content
        comment.edited = True
        comment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"Forum comment updated - Comment ID: {comment_id}")
        
        return jsonify({
            'success': True,
            'comment': comment.to_dict(include_user=True),
            'message': 'Comment updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating forum comment: {str(e)}")
        return jsonify({'error': 'Failed to update comment'}), 500


@forum_bp.route('/api/forum/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    """
    Soft delete a comment.
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        comment = ForumComment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404
        
        # Verify ownership
        if comment.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        comment.is_deleted = True
        
        # Update post comment count
        post = ForumPost.query.get(comment.post_id)
        if post and post.comments_count > 0:
            post.comments_count -= 1
        
        db.session.commit()
        
        logger.info(f"Forum comment deleted - Comment ID: {comment_id}")
        
        return jsonify({
            'success': True,
            'message': 'Comment deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting forum comment: {str(e)}")
        return jsonify({'error': 'Failed to delete comment'}), 500


@forum_bp.route('/api/forum/posts/<int:post_id>/like', methods=['POST'])
def toggle_like(post_id):
    """
    Toggle like on a post.
    """
    try:
        data = request.get_json() or {}
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        post = ForumPost.query.get(post_id)
        if not post:
            return jsonify({'error': 'Post not found'}), 404
        
        # Check if already liked
        existing_like = ForumLike.query.filter_by(post_id=post_id, user_id=user_id).first()
        
        if existing_like:
            # Unlike
            db.session.delete(existing_like)
            post.likes_count = max(0, post.likes_count - 1)
            action = 'unliked'
        else:
            # Like
            like = ForumLike(post_id=post_id, user_id=user_id)
            db.session.add(like)
            post.likes_count += 1
            action = 'liked'
        
        db.session.commit()
        
        logger.info(f"Post {action} - Post ID: {post_id}, User: {user_id}")
        
        return jsonify({
            'success': True,
            'action': action,
            'likesCount': post.likes_count,
            'message': f'Post {action} successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error toggling like: {str(e)}")
        return jsonify({'error': 'Failed to toggle like'}), 500


@forum_bp.route('/api/forum/user/<int:user_id>/activity', methods=['GET'])
def get_user_activity(user_id):
    """
    Get user's forum activity (posts and comments).
    """
    try:
        # Get user's posts
        posts = ForumPost.query.filter_by(user_id=user_id, is_deleted=False)\
                              .order_by(ForumPost.created_at.desc())\
                              .all()
        
        # Get user's comments
        comments = ForumComment.query.filter_by(user_id=user_id, is_deleted=False)\
                                    .order_by(ForumComment.created_at.desc())\
                                    .all()
        
        return jsonify({
            'success': True,
            'posts': [post.to_dict(include_user=True) for post in posts],
            'comments': [comment.to_dict(include_user=True) for comment in comments],
            'totalPosts': len(posts),
            'totalComments': len(comments)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching user activity: {str(e)}")
        return jsonify({'error': 'Failed to fetch user activity'}), 500
