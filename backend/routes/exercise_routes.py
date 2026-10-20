"""
Exercise Routes - API endpoints for exercise and walking tracker persistence
Stores all exercise sessions, walking sessions, and progress history
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from extensions import db
from models_db.exercise_model import ExerciseSession, WalkingSession, ExerciseStats
from models_db.auth_model import User
from utils.logger import logger
import json

exercise_bp = Blueprint('exercise', __name__, url_prefix='/api/exercise')

# ══════════════════════════════════════════════════════════════════════════════
# EXERCISE SESSION ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@exercise_bp.route('/sessions', methods=['POST'])
def save_exercise_session():
    """Save a completed exercise session"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['userId', 'exerciseId', 'exerciseName', 'category', 'durationMinutes', 'difficulty', 'date']
        missing = [field for field in required if field not in data]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
        
        # Check if user exists
        user = User.query.get(data['userId'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create session record
        session = ExerciseSession(
            id=data.get('id', str(datetime.now().timestamp())),
            user_id=data['userId'],
            exercise_id=data['exerciseId'],
            exercise_name=data['exerciseName'],
            category=data['category'],
            duration_minutes=data['durationMinutes'],
            difficulty=data['difficulty'],
            completed_at=datetime.fromisoformat(data['completedAt']) if 'completedAt' in data else datetime.utcnow(),
            date=data['date']
        )
        
        db.session.add(session)
        
        # Update daily stats
        stats = ExerciseStats.query.filter_by(
            user_id=data['userId'],
            date=data['date']
        ).first()
        
        if stats:
            stats.total_sessions += 1
            stats.total_minutes += data['durationMinutes']
            categories = json.loads(stats.categories_completed) if stats.categories_completed else []
            if data['category'] not in categories:
                categories.append(data['category'])
            stats.categories_completed = json.dumps(categories)
        else:
            stats = ExerciseStats(
                user_id=data['userId'],
                date=data['date'],
                total_sessions=1,
                total_minutes=data['durationMinutes'],
                categories_completed=json.dumps([data['category']])
            )
            db.session.add(stats)
        
        db.session.commit()
        
        logger.info(f"💪 Exercise session saved: {data['exerciseName']} for user {data['userId']}")
        
        return jsonify({
            'success': True,
            'session': session.to_dict(),
            'stats': stats.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving exercise session: {str(e)}")
        return jsonify({'error': 'Failed to save exercise session'}), 500


@exercise_bp.route('/sessions/<user_id>', methods=['GET'])
def get_exercise_sessions(user_id):
    """Get all exercise sessions for a user"""
    try:
        # Optional date filter
        date_filter = request.args.get('date')
        
        query = ExerciseSession.query.filter_by(user_id=user_id)
        
        if date_filter:
            query = query.filter_by(date=date_filter)
        
        sessions = query.order_by(ExerciseSession.completed_at.desc()).all()
        
        return jsonify({
            'success': True,
            'sessions': [session.to_dict() for session in sessions],
            'count': len(sessions)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching exercise sessions: {str(e)}")
        return jsonify({'error': 'Failed to fetch exercise sessions'}), 500


@exercise_bp.route('/stats/<user_id>', methods=['GET'])
def get_exercise_stats(user_id):
    """Get exercise statistics for a user"""
    try:
        # Optional date range filter
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        query = ExerciseStats.query.filter_by(user_id=user_id)
        
        if start_date:
            query = query.filter(ExerciseStats.date >= start_date)
        if end_date:
            query = query.filter(ExerciseStats.date <= end_date)
        
        stats = query.order_by(ExerciseStats.date.desc()).all()
        
        # Calculate totals
        total_sessions = sum(s.total_sessions for s in stats)
        total_minutes = sum(s.total_minutes for s in stats)
        
        return jsonify({
            'success': True,
            'stats': [stat.to_dict() for stat in stats],
            'totals': {
                'totalSessions': total_sessions,
                'totalMinutes': total_minutes,
                'daysActive': len(stats)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching exercise stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch exercise stats'}), 500


# ══════════════════════════════════════════════════════════════════════════════
# WALKING TRACKER ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@exercise_bp.route('/walking/sessions', methods=['POST'])
def save_walking_session():
    """Save a completed walking session"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['userId', 'date', 'duration', 'steps', 'distance', 'calories', 'startTime', 'endTime', 'riskCategory']
        missing = [field for field in required if field not in data]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
        
        # Check if user exists
        user = User.query.get(data['userId'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create walking session record
        session = WalkingSession(
            id=data.get('id', str(datetime.now().timestamp())),
            user_id=data['userId'],
            date=data['date'],
            duration=data['duration'],
            steps=data['steps'],
            distance=data['distance'],
            calories=data['calories'],
            start_time=datetime.fromisoformat(data['startTime']),
            end_time=datetime.fromisoformat(data['endTime']),
            risk_category=data['riskCategory']
        )
        
        db.session.add(session)
        db.session.commit()
        
        logger.info(f"🚶 Walking session saved: {data['steps']} steps for user {data['userId']}")
        
        return jsonify({
            'success': True,
            'session': session.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving walking session: {str(e)}")
        return jsonify({'error': 'Failed to save walking session'}), 500


@exercise_bp.route('/walking/sessions/<user_id>', methods=['GET'])
def get_walking_sessions(user_id):
    """Get all walking sessions for a user"""
    try:
        # Optional date filter
        date_filter = request.args.get('date')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        query = WalkingSession.query.filter_by(user_id=user_id)
        
        if date_filter:
            query = query.filter_by(date=date_filter)
        elif start_date and end_date:
            query = query.filter(WalkingSession.date >= start_date, WalkingSession.date <= end_date)
        
        sessions = query.order_by(WalkingSession.start_time.desc()).all()
        
        # Calculate totals
        total_steps = sum(s.steps for s in sessions)
        total_distance = sum(s.distance for s in sessions)
        total_calories = sum(s.calories for s in sessions)
        total_duration = sum(s.duration for s in sessions)
        
        return jsonify({
            'success': True,
            'sessions': [session.to_dict() for session in sessions],
            'totals': {
                'totalSteps': total_steps,
                'totalDistance': round(total_distance, 2),
                'totalCalories': total_calories,
                'totalDuration': total_duration,
                'sessionCount': len(sessions)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching walking sessions: {str(e)}")
        return jsonify({'error': 'Failed to fetch walking sessions'}), 500


@exercise_bp.route('/walking/daily-stats/<user_id>', methods=['GET'])
def get_walking_daily_stats(user_id):
    """Get aggregated daily walking statistics"""
    try:
        # Get date range (default to last 30 days)
        from datetime import date, timedelta
        
        end_date = request.args.get('endDate', date.today().isoformat())
        start_date = request.args.get('startDate', (date.today() - timedelta(days=30)).isoformat())
        
        sessions = WalkingSession.query.filter(
            WalkingSession.user_id == user_id,
            WalkingSession.date >= start_date,
            WalkingSession.date <= end_date
        ).all()
        
        # Group by date
        daily_stats = {}
        for session in sessions:
            if session.date not in daily_stats:
                daily_stats[session.date] = {
                    'date': session.date,
                    'totalSteps': 0,
                    'totalDistance': 0,
                    'totalCalories': 0,
                    'totalDuration': 0,
                    'sessions': []
                }
            
            daily_stats[session.date]['totalSteps'] += session.steps
            daily_stats[session.date]['totalDistance'] += session.distance
            daily_stats[session.date]['totalCalories'] += session.calories
            daily_stats[session.date]['totalDuration'] += session.duration
            daily_stats[session.date]['sessions'].append(session.to_dict())
        
        # Convert to list and sort by date
        result = sorted(daily_stats.values(), key=lambda x: x['date'], reverse=True)
        
        return jsonify({
            'success': True,
            'dailyStats': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching walking daily stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch walking daily stats'}), 500


# ══════════════════════════════════════════════════════════════════════════════
# COMBINED PROGRESS ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@exercise_bp.route('/progress/<user_id>', methods=['GET'])
def get_user_progress(user_id):
    """Get comprehensive exercise and walking progress for a user"""
    try:
        from datetime import date, timedelta
        
        # Get date range (default to last 7 days for weekly view)
        days = int(request.args.get('days', 7))
        end_date = date.today().isoformat()
        start_date = (date.today() - timedelta(days=days)).isoformat()
        
        # Get exercise sessions
        exercise_sessions = ExerciseSession.query.filter(
            ExerciseSession.user_id == user_id,
            ExerciseSession.date >= start_date,
            ExerciseSession.date <= end_date
        ).order_by(ExerciseSession.completed_at.desc()).all()
        
        # Get walking sessions
        walking_sessions = WalkingSession.query.filter(
            WalkingSession.user_id == user_id,
            WalkingSession.date >= start_date,
            WalkingSession.date <= end_date
        ).order_by(WalkingSession.start_time.desc()).all()
        
        # Calculate exercise totals
        exercise_totals = {
            'totalSessions': len(exercise_sessions),
            'totalMinutes': sum(s.duration_minutes for s in exercise_sessions),
            'categoriesCompleted': list(set(s.category for s in exercise_sessions))
        }
        
        # Calculate walking totals
        walking_totals = {
            'totalSteps': sum(s.steps for s in walking_sessions),
            'totalDistance': round(sum(s.distance for s in walking_sessions), 2),
            'totalCalories': sum(s.calories for s in walking_sessions),
            'totalDuration': sum(s.duration for s in walking_sessions),
            'sessionCount': len(walking_sessions)
        }
        
        return jsonify({
            'success': True,
            'exercise': {
                'sessions': [s.to_dict() for s in exercise_sessions],
                'totals': exercise_totals
            },
            'walking': {
                'sessions': [s.to_dict() for s in walking_sessions],
                'totals': walking_totals
            },
            'dateRange': {
                'startDate': start_date,
                'endDate': end_date,
                'days': days
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching user progress: {str(e)}")
        return jsonify({'error': 'Failed to fetch user progress'}), 500


# ══════════════════════════════════════════════════════════════════════════════
# BULK SYNC ENDPOINT (for migrating localStorage data)
# ══════════════════════════════════════════════════════════════════════════════

@exercise_bp.route('/sync', methods=['POST'])
def sync_exercise_data():
    """Bulk sync exercise and walking data from localStorage to database"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'error': 'userId is required'}), 400
        
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        synced = {
            'exerciseSessions': 0,
            'walkingSessions': 0,
            'errors': []
        }
        
        # Sync exercise sessions
        if 'exerciseSessions' in data:
            for session_data in data['exerciseSessions']:
                try:
                    # Check if session already exists
                    existing = ExerciseSession.query.get(session_data['id'])
                    if not existing:
                        session = ExerciseSession(
                            id=session_data['id'],
                            user_id=user_id,
                            exercise_id=session_data['exerciseId'],
                            exercise_name=session_data['exerciseName'],
                            category=session_data['category'],
                            duration_minutes=session_data['durationMinutes'],
                            difficulty=session_data['difficulty'],
                            completed_at=datetime.fromisoformat(session_data['completedAt']),
                            date=session_data['date']
                        )
                        db.session.add(session)
                        synced['exerciseSessions'] += 1
                except Exception as e:
                    synced['errors'].append(f"Exercise session {session_data.get('id')}: {str(e)}")
        
        # Sync walking sessions
        if 'walkingSessions' in data:
            for session_data in data['walkingSessions']:
                try:
                    # Check if session already exists
                    existing = WalkingSession.query.get(session_data['id'])
                    if not existing:
                        session = WalkingSession(
                            id=session_data['id'],
                            user_id=user_id,
                            date=session_data['date'],
                            duration=session_data['duration'],
                            steps=session_data['steps'],
                            distance=session_data['distance'],
                            calories=session_data['calories'],
                            start_time=datetime.fromisoformat(session_data['startTime']),
                            end_time=datetime.fromisoformat(session_data['endTime']),
                            risk_category=session_data.get('riskCategory', 'MEDIUM')
                        )
                        db.session.add(session)
                        synced['walkingSessions'] += 1
                except Exception as e:
                    synced['errors'].append(f"Walking session {session_data.get('id')}: {str(e)}")
        
        db.session.commit()
        
        logger.info(f"📊 Synced data for user {user_id}: {synced['exerciseSessions']} exercise sessions, {synced['walkingSessions']} walking sessions")
        
        return jsonify({
            'success': True,
            'synced': synced
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error syncing exercise data: {str(e)}")
        return jsonify({'error': 'Failed to sync exercise data'}), 500
