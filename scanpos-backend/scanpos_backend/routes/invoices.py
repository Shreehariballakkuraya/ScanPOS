from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from scanpos_backend.extensions import db
from scanpos_backend.models import Invoice, InvoiceItem, Product, Customer
from datetime import datetime
from sqlalchemy import or_

invoices_bp = Blueprint('invoices', __name__)

@invoices_bp.route('/api/invoices', methods=['POST'])
@jwt_required()
def create_invoice():
    """Create a new draft invoice"""
    try:
        data = request.get_json() or {}
        
        # Generate invoice number
        # Format: INV-YYYYMMDD-XXXX (e.g., INV-20231129-0001)
        today = datetime.utcnow().strftime('%Y%m%d')
        last_invoice = Invoice.query.filter(
            Invoice.invoice_number.like(f'INV-{today}-%')
        ).order_by(Invoice.id.desc()).first()
        
        if last_invoice:
            # Extract the sequence number and increment
            last_seq = int(last_invoice.invoice_number.split('-')[-1])
            new_seq = last_seq + 1
        else:
            new_seq = 1
        
        invoice_number = f'INV-{today}-{new_seq:04d}'
        
        # Create invoice
        invoice = Invoice(
            invoice_number=invoice_number,
            customer_id=data.get('customer_id'),
            status='draft',
            subtotal_amount=0.0,
            total_tax=0.0,
            discount_amount=0.0,
            total_amount=0.0
        )
        
        db.session.add(invoice)
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice created successfully',
            'invoice': {
                'id': invoice.id,
                'invoice_number': invoice.invoice_number,
                'customer_id': invoice.customer_id,
                'status': invoice.status,
                'subtotal_amount': invoice.subtotal_amount,
                'total_tax': invoice.total_tax,
                'discount_amount': invoice.discount_amount,
                'total_amount': invoice.total_amount,
                'created_at': invoice.created_at.isoformat(),
                'items': []
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@invoices_bp.route('/api/invoices/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    """Get invoice with all items"""
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    items = []
    for item in invoice.items:
        items.append({
            'id': item.id,
            'product_id': item.product_id,
            'product_name': item.product.name if item.product else 'Unknown',
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'tax_percent': item.tax_percent,
            'line_subtotal': item.line_subtotal,
            'line_tax': item.line_tax,
            'line_total': item.line_total
        })
    
    return jsonify({
        'invoice': {
            'id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'customer_id': invoice.customer_id,
            'status': invoice.status,
            'subtotal_amount': invoice.subtotal_amount,
            'total_tax': invoice.total_tax,
            'discount_amount': invoice.discount_amount,
            'total_amount': invoice.total_amount,
            'created_at': invoice.created_at.isoformat(),
            'updated_at': invoice.updated_at.isoformat() if invoice.updated_at else None,
            'items': items
        }
    }), 200

@invoices_bp.route('/api/invoices/<int:invoice_id>/items', methods=['POST'])
@jwt_required()
def add_invoice_item(invoice_id):
    """Add item to invoice by product_id or barcode"""
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    if invoice.status != 'draft':
        return jsonify({'message': 'Cannot modify non-draft invoice'}), 400
    
    data = request.get_json()
    quantity = data.get('quantity', 1)
    
    if quantity <= 0:
        return jsonify({'message': 'Quantity must be greater than 0'}), 400
    
    # Find product by ID or barcode
    product = None
    if 'product_id' in data:
        product = Product.query.get(data['product_id'])
    elif 'barcode' in data:
        product = Product.query.filter_by(barcode=data['barcode'], is_active=True).first()
    
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    if not product.is_active:
        return jsonify({'message': 'Product is not active'}), 400
    
    # Check stock availability
    if product.stock_qty < quantity:
        return jsonify({'message': f'Insufficient stock. Available: {product.stock_qty}'}), 400
    
    # Check if product already exists in invoice
    existing_item = InvoiceItem.query.filter_by(
        invoice_id=invoice_id,
        product_id=product.id
    ).first()
    
    if existing_item:
        # Check if new total quantity exceeds stock
        new_total_qty = existing_item.quantity + quantity
        if product.stock_qty < new_total_qty:
            return jsonify({'message': f'Insufficient stock. Available: {product.stock_qty}, Already in cart: {existing_item.quantity}'}), 400
        
        # Update quantity
        existing_item.quantity = new_total_qty
        existing_item.calculate_line_totals()
        db.session.commit()
        
        item_data = {
            'id': existing_item.id,
            'product_id': existing_item.product_id,
            'product_name': product.name,
            'quantity': existing_item.quantity,
            'unit_price': existing_item.unit_price,
            'tax_percent': existing_item.tax_percent,
            'line_subtotal': existing_item.line_subtotal,
            'line_tax': existing_item.line_tax,
            'line_total': existing_item.line_total
        }
        
        return jsonify({
            'message': 'Item quantity updated',
            'item': item_data
        }), 200
    else:
        # Create new item
        item = InvoiceItem(
            invoice_id=invoice_id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
            tax_percent=product.tax_percent
        )
        item.calculate_line_totals()
        
        db.session.add(item)
        db.session.commit()
        
        item_data = {
            'id': item.id,
            'product_id': item.product_id,
            'product_name': product.name,
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'tax_percent': item.tax_percent,
            'line_subtotal': item.line_subtotal,
            'line_tax': item.line_tax,
            'line_total': item.line_total
        }
        
        return jsonify({
            'message': 'Item added successfully',
            'item': item_data
        }), 201

@invoices_bp.route('/api/invoices/<int:invoice_id>/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_invoice_item(invoice_id, item_id):
    """Update invoice item quantity"""
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    if invoice.status != 'draft':
        return jsonify({'message': 'Cannot modify non-draft invoice'}), 400
    
    item = InvoiceItem.query.filter_by(id=item_id, invoice_id=invoice_id).first()
    if not item:
        return jsonify({'message': 'Item not found'}), 404
    
    data = request.get_json()
    quantity = data.get('quantity')
    
    if quantity is None:
        return jsonify({'message': 'Quantity is required'}), 400
    
    if quantity <= 0:
        # Delete item if quantity is 0 or negative
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item removed'}), 200
    
    # Check stock availability for the new quantity
    product = item.product
    if product and product.stock_qty < quantity:
        return jsonify({'message': f'Insufficient stock. Available: {product.stock_qty}'}), 400
    
    item.quantity = quantity
    item.calculate_line_totals()
    db.session.commit()
    
    return jsonify({
        'message': 'Item updated successfully',
        'item': {
            'id': item.id,
            'product_id': item.product_id,
            'product_name': item.product.name,
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'tax_percent': item.tax_percent,
            'line_subtotal': item.line_subtotal,
            'line_tax': item.line_tax,
            'line_total': item.line_total
        }
    }), 200

@invoices_bp.route('/api/invoices/<int:invoice_id>/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_invoice_item(invoice_id, item_id):
    """Delete invoice item"""
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    if invoice.status != 'draft':
        return jsonify({'message': 'Cannot modify non-draft invoice'}), 400
    
    item = InvoiceItem.query.filter_by(id=item_id, invoice_id=invoice_id).first()
    if not item:
        return jsonify({'message': 'Item not found'}), 404
    
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({'message': 'Item deleted successfully'}), 200

@invoices_bp.route('/api/invoices/<int:invoice_id>/complete', methods=['POST'])
@jwt_required()
def complete_invoice(invoice_id):
    """Complete invoice and calculate final totals"""
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    if invoice.status != 'draft':
        return jsonify({'message': 'Invoice is already ' + invoice.status}), 400
    
    if not invoice.items:
        return jsonify({'message': 'Cannot complete invoice with no items'}), 400
    
    data = request.get_json() or {}
    discount = data.get('discount_amount', 0.0)
    
    if discount < 0:
        return jsonify({'message': 'Discount cannot be negative'}), 400
    
    # Validate stock availability for all items before completing
    for item in invoice.items:
        product = item.product
        if product and product.stock_qty < item.quantity:
            return jsonify({'message': f'Insufficient stock for {product.name}. Available: {product.stock_qty}'}), 400
    
    # Reduce stock quantities
    for item in invoice.items:
        product = item.product
        if product:
            product.stock_qty -= item.quantity
    
    # Calculate totals
    invoice.calculate_totals()
    invoice.discount_amount = discount
    invoice.total_amount = invoice.subtotal_amount + invoice.total_tax - discount
    invoice.status = 'completed'
    invoice.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    items = []
    for item in invoice.items:
        items.append({
            'id': item.id,
            'product_id': item.product_id,
            'product_name': item.product.name if item.product else 'Unknown',
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'tax_percent': item.tax_percent,
            'line_subtotal': item.line_subtotal,
            'line_tax': item.line_tax,
            'line_total': item.line_total
        })
    
    return jsonify({
        'message': 'Invoice completed successfully',
        'invoice': {
            'id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'customer_id': invoice.customer_id,
            'status': invoice.status,
            'subtotal_amount': invoice.subtotal_amount,
            'total_tax': invoice.total_tax,
            'discount_amount': invoice.discount_amount,
            'total_amount': invoice.total_amount,
            'created_at': invoice.created_at.isoformat(),
            'updated_at': invoice.updated_at.isoformat() if invoice.updated_at else None,
            'items': items
        }
    }), 200

@invoices_bp.route('/api/invoices/<int:invoice_id>', methods=['DELETE'])
@jwt_required()
def delete_invoice(invoice_id):
    """Delete an invoice (only drafts or restore stock if deleting completed invoice)"""
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    try:
        # If deleting a completed invoice, restore stock quantities
        if invoice.status == 'completed':
            for item in invoice.items:
                product = item.product
                if product:
                    product.stock_qty += item.quantity
        
        # Delete all items first
        InvoiceItem.query.filter_by(invoice_id=invoice_id).delete()
        # Delete invoice
        db.session.delete(invoice)
        db.session.commit()
        return jsonify({'message': 'Invoice deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@invoices_bp.route('/api/invoices', methods=['GET'])
@jwt_required()
def list_invoices():
    """List invoices with optional date filters"""
    from_date = request.args.get('from')
    to_date = request.args.get('to')
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    
    query = Invoice.query
    
    # Apply filters
    if from_date:
        try:
            from_dt = datetime.strptime(from_date, '%Y-%m-%d')
            query = query.filter(Invoice.created_at >= from_dt)
        except ValueError:
            return jsonify({'message': 'Invalid from date format. Use YYYY-MM-DD'}), 400
    
    if to_date:
        try:
            to_dt = datetime.strptime(to_date, '%Y-%m-%d')
            # Add one day to include the entire to_date
            from datetime import timedelta
            to_dt = to_dt + timedelta(days=1)
            query = query.filter(Invoice.created_at < to_dt)
        except ValueError:
            return jsonify({'message': 'Invalid to date format. Use YYYY-MM-DD'}), 400
    
    if status:
        query = query.filter_by(status=status)
    
    # Order by most recent first
    query = query.order_by(Invoice.created_at.desc())
    
    # Paginate
    pagination = query.paginate(page=page, per_page=page_size, error_out=False)
    
    invoices = []
    for invoice in pagination.items:
        invoices.append({
            'id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'customer_id': invoice.customer_id,
            'status': invoice.status,
            'subtotal_amount': invoice.subtotal_amount,
            'total_tax': invoice.total_tax,
            'discount_amount': invoice.discount_amount,
            'total_amount': invoice.total_amount,
            'created_at': invoice.created_at.isoformat(),
            'updated_at': invoice.updated_at.isoformat() if invoice.updated_at else None,
            'items_count': invoice.items.count()
        })
    
    return jsonify({
        'invoices': invoices,
        'page': page,
        'page_size': page_size,
        'total': pagination.total,
        'pages': pagination.pages
    }), 200
