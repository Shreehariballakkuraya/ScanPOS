"""Seed some sample products for testing"""
from scanpos_backend import create_app
from scanpos_backend.extensions import db
from scanpos_backend.models import Product

app = create_app()

with app.app_context():
    # Check if products already exist
    if Product.query.count() > 0:
        print("Products already exist in database!")
    else:
        # Create sample products
        products = [
            Product(name='Coca Cola 500ml', barcode='5449000000996', price=50.00, tax_percent=5, stock_qty=100),
            Product(name='Lays Chips 50g', barcode='8901262111119', price=20.00, tax_percent=12, stock_qty=150),
            Product(name='Amul Milk 1L', barcode='8901430001010', price=60.00, tax_percent=0, stock_qty=50),
            Product(name='Parle-G Biscuits', barcode='8901719100109', price=10.00, tax_percent=5, stock_qty=200),
            Product(name='Britannia Bread', barcode='8901063117013', price=35.00, tax_percent=5, stock_qty=75),
        ]
        
        for product in products:
            db.session.add(product)
        
        db.session.commit()
        
        print("✓ Sample products created successfully!")
        print(f"  Created {len(products)} products")
        for p in products:
            print(f"    - {p.name} (₹{p.price})")
