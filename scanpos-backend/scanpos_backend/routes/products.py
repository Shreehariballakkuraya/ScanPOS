from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from scanpos_backend.extensions import db
from scanpos_backend.models import Product
from sqlalchemy import or_

products_bp = Blueprint('products', __name__, url_prefix='/api/products')


@products_bp.route('', methods=['GET'])
@jwt_required()
def get_products():
    """Get all products with optional search and pagination"""
    # Get query parameters
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    
    # Build query
    query = Product.query
    
    # Apply search filter
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f'%{search}%'),
                Product.barcode.ilike(f'%{search}%')
            )
        )
    
    # Only show active products by default (can be overridden)
    show_inactive = request.args.get('show_inactive', 'false').lower() == 'true'
    if not show_inactive:
        query = query.filter(Product.is_active == True)
    
    # Apply pagination
    pagination = query.order_by(Product.created_at.desc()).paginate(
        page=page, 
        per_page=page_size, 
        error_out=False
    )
    
    return jsonify({
        'products': [product.to_dict() for product in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@products_bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    """Create a new product"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('name') or not data.get('price'):
        return jsonify({'message': 'Name and price are required'}), 400
    
    # Check if barcode already exists
    if data.get('barcode'):
        existing = Product.query.filter_by(barcode=data['barcode']).first()
        if existing:
            return jsonify({'message': 'Barcode already exists'}), 400
    
    # Create product
    product = Product(
        name=data['name'],
        barcode=data.get('barcode'),
        price=float(data['price']),
        tax_percent=float(data.get('tax_percent', 0)),
        stock_qty=int(data.get('stock_qty', 0)),
        is_active=data.get('is_active', True)
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'message': 'Product created successfully',
        'product': product.to_dict()
    }), 201


@products_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_product(id):
    """Get a single product by ID"""
    product = Product.query.get(id)
    
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    return jsonify(product.to_dict()), 200


@products_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    """Update a product"""
    product = Product.query.get(id)
    
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    data = request.get_json()
    
    # Check if barcode is being changed and already exists
    if data.get('barcode') and data['barcode'] != product.barcode:
        existing = Product.query.filter_by(barcode=data['barcode']).first()
        if existing:
            return jsonify({'message': 'Barcode already exists'}), 400
    
    # Update fields
    if 'name' in data:
        product.name = data['name']
    if 'barcode' in data:
        product.barcode = data['barcode']
    if 'price' in data:
        product.price = float(data['price'])
    if 'tax_percent' in data:
        product.tax_percent = float(data['tax_percent'])
    if 'stock_qty' in data:
        product.stock_qty = int(data['stock_qty'])
    if 'is_active' in data:
        product.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Product updated successfully',
        'product': product.to_dict()
    }), 200


@products_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    """Soft delete a product"""
    product = Product.query.get(id)
    
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    # Soft delete
    product.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Product deleted successfully'}), 200


@products_bp.route('/by-barcode/<barcode>', methods=['GET'])
@jwt_required()
def get_product_by_barcode(barcode):
    """Get a product by barcode"""
    product = Product.query.filter_by(barcode=barcode, is_active=True).first()
    
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    return jsonify(product.to_dict()), 200
