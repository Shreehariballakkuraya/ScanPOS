from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200


# Import and expose auth blueprint
from .auth import auth_bp

# Import and expose products blueprint
from .products import products_bp

# Import and expose invoices blueprint
from .invoices import invoices_bp

# Import and expose reports blueprint
from .reports import reports_bp
