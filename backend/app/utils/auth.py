"""
Auth helpers built on top of flask_jwt_extended.

Usage pattern in a route file:

    from flask_jwt_extended import jwt_required
    from app.utils.auth import get_current_user

    @some_bp.route("/me-example")
    @jwt_required()
    def me_example():
        user = get_current_user()
        if user is None:
            return jsonify({"error": "User not found"}), 401
        return jsonify(user.to_dict())

Alternatively, use the `jwt_required_user` decorator below which combines
@jwt_required() with the user-existence check and passes the user object
as the first positional argument to the view function.
"""
from functools import wraps

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.user import User


def get_current_user():
    """Return the User object for the current JWT identity, or None."""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return User.query.get(user_id)


def jwt_required_user(fn):
    """
    Decorator combining @jwt_required() with a DB lookup of the current user.
    Injects the resolved User instance as the first argument to the view.
    Returns 401 JSON if the token is valid but the user no longer exists.
    """

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if user is None:
            return jsonify({"error": "User not found"}), 401
        return fn(user, *args, **kwargs)

    return wrapper
