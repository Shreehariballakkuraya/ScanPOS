from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from scanpos_backend.extensions import db
from scanpos_backend.models import Invoice, InvoiceItem, Product
from datetime import datetime, timedelta
from sqlalchemy import func, desc

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/api/reports/sales', methods=['GET'])
@jwt_required()
def sales_report():
    """Get sales report for a date range"""
    from_date = request.args.get('from')
    to_date = request.args.get('to')
    
    # Default to last 30 days if no dates provided
    if not to_date:
        to_date = datetime.utcnow()
    else:
        try:
            # Try ISO format first (e.g., 2025-11-11T18:30:00.000Z)
            if 'T' in to_date:
                to_date = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
            else:
                # Try YYYY-MM-DD format
                to_date = datetime.strptime(to_date, '%Y-%m-%d')
        except (ValueError, AttributeError):
            return jsonify({'message': 'Invalid to date format. Use YYYY-MM-DD or ISO format'}), 400
    
    if not from_date:
        from_date = to_date - timedelta(days=30)
    else:
        try:
            # Try ISO format first
            if 'T' in from_date:
                from_date = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            else:
                # Try YYYY-MM-DD format
                from_date = datetime.strptime(from_date, '%Y-%m-%d')
        except (ValueError, AttributeError):
            return jsonify({'message': 'Invalid from date format. Use YYYY-MM-DD or ISO format'}), 400
    
    # Add one day to include the entire to_date
    to_date_end = to_date + timedelta(days=1)
    
    # Get completed invoices in date range
    invoices = Invoice.query.filter(
        Invoice.status == 'completed',
        Invoice.created_at >= from_date,
        Invoice.created_at < to_date_end
    ).all()
    
    # Calculate totals
    total_sales = sum(inv.total_amount for inv in invoices)
    total_tax = sum(inv.total_tax for inv in invoices)
    total_discount = sum(inv.discount_amount for inv in invoices)
    invoice_count = len(invoices)
    
    # Get top selling products
    top_products = db.session.query(
        Product.id,
        Product.name,
        func.sum(InvoiceItem.quantity).label('total_quantity'),
        func.sum(InvoiceItem.line_total).label('total_revenue')
    ).join(InvoiceItem).join(Invoice).filter(
        Invoice.status == 'completed',
        Invoice.created_at >= from_date,
        Invoice.created_at < to_date_end
    ).group_by(Product.id, Product.name).order_by(desc('total_quantity')).limit(10).all()
    
    # Get top selling products
    top_products_data = db.session.query(
        Product.id,
        Product.name,
        Product.barcode,
        func.sum(InvoiceItem.quantity).label('total_quantity'),
        func.sum(InvoiceItem.line_total).label('total_revenue')
    ).join(InvoiceItem).join(Invoice).filter(
        Invoice.status == 'completed',
        Invoice.created_at >= from_date,
        Invoice.created_at < to_date_end
    ).group_by(Product.id, Product.name, Product.barcode).order_by(desc('total_quantity')).limit(10).all()
    
    top_products_list = [
        {
            'product_id': p.id,
            'product_name': p.name,
            'sku': p.barcode or '',
            'total_quantity': int(p.total_quantity),
            'total_revenue': float(p.total_revenue)
        }
        for p in top_products_data
    ]
    
    return jsonify({
        'from_date': from_date.strftime('%Y-%m-%d'),
        'to_date': to_date.strftime('%Y-%m-%d'),
        'total_sales': float(total_sales),
        'total_tax': float(total_tax),
        'total_discount': float(total_discount),
        'invoice_count': invoice_count,
        'top_products': top_products_list
    }), 200


@reports_bp.route('/api/reports/dashboard', methods=['GET'])
@jwt_required()
def dashboard_stats():
    """Get dashboard statistics"""
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = datetime(now.year, now.month, 1)
    
    # Today's sales
    today_invoices = Invoice.query.filter(
        Invoice.status == 'completed',
        Invoice.created_at >= today_start
    ).all()
    today_sales = sum(inv.total_amount for inv in today_invoices)
    today_count = len(today_invoices)
    
    # This week's sales
    week_invoices = Invoice.query.filter(
        Invoice.status == 'completed',
        Invoice.created_at >= week_start
    ).all()
    week_sales = sum(inv.total_amount for inv in week_invoices)
    week_count = len(week_invoices)
    
    # This month's sales
    month_invoices = Invoice.query.filter(
        Invoice.status == 'completed',
        Invoice.created_at >= month_start
    ).all()
    month_sales = sum(inv.total_amount for inv in month_invoices)
    month_count = len(month_invoices)
    
    # Total products and low stock alerts
    total_products = Product.query.filter_by(is_active=True).count()
    low_stock_products = Product.query.filter(
        Product.is_active == True,
        Product.stock_qty < 10
    ).all()
    
    low_stock_list = [
        {
            'id': p.id,
            'name': p.name,
            'sku': p.barcode or '',
            'stock_qty': p.stock_qty,
            'price': float(p.price)
        }
        for p in low_stock_products
    ]
    
    # Recent invoices
    recent_invoices = Invoice.query.filter(
        Invoice.status == 'completed'
    ).order_by(Invoice.created_at.desc()).limit(5).all()
    
    recent_list = [
        {
            'id': inv.id,
            'invoice_number': inv.invoice_number,
            'customer_name': inv.customer.name if inv.customer else None,
            'status': inv.status,
            'grand_total': float(inv.total_amount),
            'created_at': inv.created_at.isoformat()
        }
        for inv in recent_invoices
    ]
    
    return jsonify({
        'today': {
            'total_sales': float(today_sales),
            'invoice_count': today_count
        },
        'week': {
            'total_sales': float(week_sales),
            'invoice_count': week_count
        },
        'month': {
            'total_sales': float(month_sales),
            'invoice_count': month_count
        },
        'product_count': total_products,
        'low_stock': low_stock_list,
        'recent_invoices': recent_list
    }), 200
