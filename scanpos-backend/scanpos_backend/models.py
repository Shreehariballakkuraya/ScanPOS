from .extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    """User model for authentication and authorization"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='cashier')  # 'admin' or 'cashier'
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        """Hash and set the password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary (excluding password)"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Product(db.Model):
    """Product model for inventory management"""
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    barcode = db.Column(db.String(100), unique=True, nullable=True, index=True)
    price = db.Column(db.Float, nullable=False)
    tax_percent = db.Column(db.Float, default=0.0)
    stock_qty = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to invoice items
    invoice_items = db.relationship('InvoiceItem', back_populates='product', lazy='dynamic')
    
    def to_dict(self):
        """Convert product to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'barcode': self.barcode,
            'price': self.price,
            'tax_percent': self.tax_percent,
            'stock_qty': self.stock_qty,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Customer(db.Model):
    """Customer model (optional for v1)"""
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to invoices
    invoices = db.relationship('Invoice', back_populates='customer', lazy='dynamic')
    
    def to_dict(self):
        """Convert customer to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Invoice(db.Model):
    """Invoice model for billing"""
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    status = db.Column(db.String(20), default='draft')  # 'draft', 'completed', 'cancelled'
    subtotal_amount = db.Column(db.Float, default=0.0)
    total_tax = db.Column(db.Float, default=0.0)
    discount_amount = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = db.relationship('Customer', back_populates='invoices')
    items = db.relationship('InvoiceItem', back_populates='invoice', lazy='dynamic', cascade='all, delete-orphan')
    
    def calculate_totals(self):
        """Calculate and update invoice totals from items"""
        self.subtotal_amount = sum(item.line_subtotal for item in self.items)
        self.total_tax = sum(item.line_tax for item in self.items)
        self.total_amount = self.subtotal_amount + self.total_tax - self.discount_amount
    
    def to_dict(self, include_items=False):
        """Convert invoice to dictionary"""
        data = {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'customer_id': self.customer_id,
            'status': self.status,
            'subtotal_amount': self.subtotal_amount,
            'total_tax': self.total_tax,
            'discount_amount': self.discount_amount,
            'total_amount': self.total_amount,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        if self.customer:
            data['customer'] = self.customer.to_dict()
        return data


class InvoiceItem(db.Model):
    """Invoice item model for line items"""
    __tablename__ = 'invoice_items'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Float, nullable=False)
    tax_percent = db.Column(db.Float, default=0.0)
    line_subtotal = db.Column(db.Float, default=0.0)
    line_tax = db.Column(db.Float, default=0.0)
    line_total = db.Column(db.Float, default=0.0)
    
    # Relationships
    invoice = db.relationship('Invoice', back_populates='items')
    product = db.relationship('Product', back_populates='invoice_items')
    
    def calculate_line_totals(self):
        """Calculate line item totals"""
        self.line_subtotal = self.quantity * self.unit_price
        self.line_tax = self.line_subtotal * (self.tax_percent / 100)
        self.line_total = self.line_subtotal + self.line_tax
    
    def to_dict(self):
        """Convert invoice item to dictionary"""
        data = {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'tax_percent': self.tax_percent,
            'line_subtotal': self.line_subtotal,
            'line_tax': self.line_tax,
            'line_total': self.line_total
        }
        if self.product:
            data['product'] = self.product.to_dict()
        return data
