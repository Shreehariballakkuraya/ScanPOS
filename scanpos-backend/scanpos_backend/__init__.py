from flask import Flask
from .extensions import db, migrate, jwt, cors
from .config import Config


def create_app(config_class=Config):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)
    
    # Import models to register them with SQLAlchemy
    from . import models
    
    # Register blueprints
    from .routes import health_bp, auth_bp, products_bp, invoices_bp, reports_bp
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(invoices_bp)
    app.register_blueprint(reports_bp)
    
    return app
