from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from scanpos_backend.extensions import db
from scanpos_backend.models import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user (admin only in production)"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    
    # Create new user
    user = User(
        name=data.get('name', 'User'),
        email=data['email'],
        role=data.get('role', 'cashier')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400
    
    # Find user
    user = User.query.filter_by(email=data['email']).first()
    
    # Check credentials
    if not user or not user.check_password(data['password']):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    # Create access token (identity must be string)
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info from JWT token"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200
