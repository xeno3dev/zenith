"""
Module-level singletons for Flask extensions.

These are instantiated here (unbound) and initialized against the actual
Flask app inside app/__init__.py via create_app(). This avoids circular
imports since models/routes can import `db` from here without needing
the app instance itself.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
