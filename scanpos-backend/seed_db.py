"""Seed database with initial admin user"""
from scanpos_backend import create_app
from scanpos_backend.extensions import db
from scanpos_backend.models import User

app = create_app()

with app.app_context():
    # Check if admin already exists
    admin = User.query.filter_by(email='admin@scanpos.com').first()
    
    if admin:
        print("Admin user already exists!")
    else:
        # Create admin user
        admin = User(
            name='Admin User',
            email='admin@scanpos.com',
            role='admin'
        )
        admin.set_password('admin123')  # Change this in production!
        
        db.session.add(admin)
        db.session.commit()
        
        print("✓ Admin user created successfully!")
        print(f"  Email: admin@scanpos.com")
        print(f"  Password: admin123")
        print(f"  Role: admin")
