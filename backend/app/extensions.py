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

from flask import jsonify


db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()


@jwt.unauthorized_loader
def unauthorized_callback(err):
    return jsonify({"error": err}), 401


@jwt.invalid_token_loader
def invalid_token_callback(err):
    return jsonify({"error": err}), 422


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Token has expired"}), 401


@jwt.needs_fresh_token_loader
def needs_fresh_token_callback(err):
    return jsonify({"error": err}), 401


@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Token has been revoked"}), 401
