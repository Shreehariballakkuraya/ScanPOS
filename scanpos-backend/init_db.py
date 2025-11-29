"""Initialize database and create tables"""
from scanpos_backend import create_app
from scanpos_backend.extensions import db

app = create_app()

with app.app_context():
    # Create all tables
    db.create_all()
    print("✓ Database tables created successfully!")
    
    # Show created tables
    print("\nCreated tables:")
    print(f"  - users")
    print(f"  - products")
    print(f"  - customers")
    print(f"  - invoices")
    print(f"  - invoice_items")
