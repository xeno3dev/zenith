from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)

from app.extensions import db
from app.models.user import User
from app.utils.auth import get_current_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    name = data.get("name")

    if not email or not password or not name:
        return jsonify({"error": "email, password, and name are required"}), 400

    if User.query.filter_by(email=email).first() is not None:
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(
        email=email,
        name=name,
        school=data.get("school"),
        grade_level=data.get("grade_level"),
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return (
        jsonify(
            {
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        ),
        201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user is None or not user.check_password(password or ""):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return (
        jsonify(
            {
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        ),
        200,
    )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    new_access_token = create_access_token(identity=identity)
    return jsonify({"access_token": new_access_token}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    if user is None:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Stateless JWT setup: nothing to invalidate server-side. The client is
    # expected to discard its stored tokens upon calling this endpoint.
    return jsonify({"message": "Logged out successfully"}), 200
