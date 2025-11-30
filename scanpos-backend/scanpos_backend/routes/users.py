from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from scanpos_backend.models import User
from scanpos_backend.extensions import db
import traceback

users_bp = Blueprint('users', __name__)


def require_admin():
    """Decorator to check if user is admin"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    return None


@users_bp.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        search = request.args.get('search', '', type=str)
        
        query = User.query
        
        # Search filter
        if search:
            query = query.filter(
                (User.name.ilike(f'%{search}%')) |
                (User.email.ilike(f'%{search}%'))
            )
        
        # Pagination
        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=page_size, error_out=False
        )
        
        users = [{
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if user.created_at else None
        } for user in pagination.items]
        
        return jsonify({
            'users': users,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@users_bp.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user by ID (admin only)"""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@users_bp.route('/api/users', methods=['POST'])
@jwt_required()
def create_user():
    """Create new user (admin only)"""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['name', 'email', 'password', 'role']):
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 409
        
        # Validate role
        if data['role'] not in ['admin', 'cashier']:
            return jsonify({'message': 'Invalid role. Must be admin or cashier'}), 400
        
        # Create new user
        user = User(
            name=data['name'],
            email=data['email'],
            role=data['role'],
            is_active=data.get('is_active', True)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'message': str(e)}), 500


@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user (admin only)"""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # Prevent admin from changing their own role
        current_user_id = int(get_jwt_identity())
        if user_id == current_user_id and 'role' in data and data['role'] != user.role:
            return jsonify({'message': 'Cannot change your own role'}), 400
        
        # Update fields
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            # Check if new email already exists
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user_id:
                return jsonify({'message': 'Email already exists'}), 409
            user.email = data['email']
        if 'role' in data:
            if data['role'] not in ['admin', 'cashier']:
                return jsonify({'message': 'Invalid role'}), 400
            user.role = data['role']
        if 'is_active' in data:
            # Prevent admin from deactivating themselves
            if user_id == current_user_id and not data['is_active']:
                return jsonify({'message': 'Cannot deactivate yourself'}), 400
            user.is_active = data['is_active']
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500


@users_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete user (admin only)"""
    admin_check = require_admin()
    if admin_check:
        return admin_check
    
    try:
        # Prevent admin from deleting themselves
        current_user_id = int(get_jwt_identity())
        if user_id == current_user_id:
            return jsonify({'message': 'Cannot delete yourself'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500
