from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from learning_progress import learning_manager, UserLearningProfile
import asyncio
from functools import wraps

# Create blueprint for learning routes
learning_bp = Blueprint('learning', __name__, url_prefix='/api/learning')

def async_route(f):
    """Decorator to handle async routes in Flask."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(f(*args, **kwargs))
        finally:
            loop.close()
    return wrapper

@learning_bp.route('/profile/<user_id>', methods=['GET'])
@cross_origin()
@async_route
async def get_user_learning_profile(user_id):
    """Get user's learning profile with progress and stats."""
    try:
        profile = await learning_manager.get_user_profile(user_id)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'User profile not found'
            }), 404
        
        # Get user's rank
        rank = await learning_manager.get_user_rank(user_id)
        
        # Convert to dict and add rank
        profile_data = profile.dict()
        profile_data['rank'] = rank
        
        return jsonify({
            'success': True,
            'data': profile_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get user profile: {str(e)}'
        }), 500

@learning_bp.route('/profile', methods=['POST'])
@cross_origin()
@async_route
async def create_user_profile():
    """Create a new user learning profile."""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'username', 'email']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: user_id, username, email'
            }), 400
        
        profile = await learning_manager.create_user_profile(
            user_id=data['user_id'],
            username=data['username'],
            email=data['email']
        )
        
        return jsonify({
            'success': True,
            'data': profile.dict(),
            'message': 'Profile created successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to create profile: {str(e)}'
        }), 500

@learning_bp.route('/progress', methods=['PUT'])
@cross_origin()
@async_route
async def update_course_progress():
    """Update progress for a specific course."""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'course_id', 'progress_percentage']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: user_id, course_id, progress_percentage'
            }), 400
        
        # Validate progress percentage
        progress = data['progress_percentage']
        if not isinstance(progress, int) or progress < 0 or progress > 100:
            return jsonify({
                'success': False,
                'error': 'Progress percentage must be an integer between 0 and 100'
            }), 400
        
        progress_data = {
            'progress_percentage': progress,
            'title': data.get('title', ''),
            'provider': data.get('provider', ''),
            'time_spent': data.get('time_spent', 0)
        }
        
        success = await learning_manager.update_course_progress(
            user_id=data['user_id'],
            course_id=data['course_id'],
            progress_data=progress_data
        )
        
        if success:
            # Get updated profile to return latest data
            profile = await learning_manager.get_user_profile(data['user_id'])
            return jsonify({
                'success': True,
                'data': profile.dict() if profile else None,
                'message': 'Progress updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update progress'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to update progress: {str(e)}'
        }), 500

@learning_bp.route('/leaderboard', methods=['GET'])
@cross_origin()
@async_route
async def get_leaderboard():
    """Get leaderboard with top learners."""
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(max(limit, 1), 50)  # Ensure limit is between 1 and 50
        
        leaderboard_data = await learning_manager.get_leaderboard(limit)
        
        return jsonify({
            'success': True,
            'data': leaderboard_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get leaderboard: {str(e)}'
        }), 500

@learning_bp.route('/rank/<user_id>', methods=['GET'])
@cross_origin()
@async_route
async def get_user_rank(user_id):
    """Get user's current rank in leaderboard."""
    try:
        rank = await learning_manager.get_user_rank(user_id)
        
        if rank is None:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {'rank': rank}
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get user rank: {str(e)}'
        }), 500

@learning_bp.route('/reset/<user_id>', methods=['POST'])
@cross_origin()
@async_route
async def reset_progress(user_id):
    """Reset all learning progress for a user."""
    try:
        success = await learning_manager.reset_user_progress(user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Progress reset successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to reset progress'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to reset progress: {str(e)}'
        }), 500

@learning_bp.route('/badge', methods=['POST'])
@cross_origin()
@async_route
async def award_badge():
    """Award a badge to a user."""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'badge_id', 'badge_name']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: user_id, badge_id, badge_name'
            }), 400
        
        success = await learning_manager.award_badge(
            user_id=data['user_id'],
            badge_id=data['badge_id'],
            badge_name=data['badge_name']
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Badge "{data["badge_name"]}" awarded successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to award badge'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to award badge: {str(e)}'
        }), 500

@learning_bp.route('/analytics/<user_id>', methods=['GET'])
@cross_origin()
@async_route
async def get_learning_analytics(user_id):
    """Get comprehensive learning analytics for a user."""
    try:
        analytics = await learning_manager.get_learning_analytics(user_id)
        
        if not analytics:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': analytics
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get analytics: {str(e)}'
        }), 500

@learning_bp.route('/courses/progress/<user_id>', methods=['GET'])
@cross_origin()
@async_route
async def get_courses_progress(user_id):
    """Get progress for all courses for a specific user."""
    try:
        profile = await learning_manager.get_user_profile(user_id)
        
        if not profile:
            return jsonify({
                'success': False,
                'error': 'User profile not found'
            }), 404
        
        # Format course progress data
        courses_progress = {}
        for course_prog in profile.course_progress:
            courses_progress[course_prog.course_id] = {
                'progress_percentage': course_prog.progress_percentage,
                'completed': course_prog.completed,
                'completion_date': course_prog.completion_date.isoformat() if course_prog.completion_date else None,
                'time_spent': course_prog.time_spent,
                'last_accessed': course_prog.last_accessed.isoformat() if course_prog.last_accessed else None,
                'certificate_earned': course_prog.certificate_earned
            }
        
        return jsonify({
            'success': True,
            'data': {
                'courses_progress': courses_progress,
                'completed_courses': profile.completed_courses,
                'total_courses_completed': profile.courses_completed
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get courses progress: {str(e)}'
        }), 500

@learning_bp.route('/stats/global', methods=['GET'])
@cross_origin()
@async_route
async def get_global_stats():
    """Get global learning statistics."""
    try:
        # These would be calculated from the database in a real implementation
        stats = {
            'total_users': 15420,
            'total_courses_completed': 45678,
            'total_certificates_earned': 23456,
            'average_completion_rate': 68.5,
            'most_popular_course': 'Financial Markets - Yale University',
            'top_learning_streak': 127,
            'total_learning_time': 234567,  # in minutes
            'active_learners_this_week': 2341
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get global stats: {str(e)}'
        }), 500

# Error handlers
@learning_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@learning_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500