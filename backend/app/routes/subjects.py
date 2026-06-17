from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.subject import Subject

subjects_bp = Blueprint("subjects", __name__)


@subjects_bp.route("/subjects", methods=["GET"])
@jwt_required()
def list_subjects():
    user_id = get_jwt_identity()
    subjects = Subject.query.filter_by(user_id=user_id).order_by(Subject.name).all()
    return jsonify([s.to_dict() for s in subjects]), 200


@subjects_bp.route("/subjects", methods=["POST"])
@jwt_required()
def create_subject():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    subject = Subject(
        user_id=user_id,
        name=data["name"],
        color=data.get("color", "#4F46E5"),
        teacher=data.get("teacher"),
        room=data.get("room"),
    )
    db.session.add(subject)
    db.session.commit()
    return jsonify(subject.to_dict()), 201


@subjects_bp.route("/subjects/<int:subject_id>", methods=["GET"])
@jwt_required()
def get_subject(subject_id):
    user_id = get_jwt_identity()
    subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first()
    if subject is None:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify(subject.to_dict()), 200


@subjects_bp.route("/subjects/<int:subject_id>", methods=["PUT"])
@jwt_required()
def update_subject(subject_id):
    user_id = get_jwt_identity()
    subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first()
    if subject is None:
        return jsonify({"error": "Subject not found"}), 404

    data = request.get_json(silent=True) or {}
    for field in ("name", "color", "teacher", "room"):
        if field in data:
            setattr(subject, field, data[field])

    db.session.commit()
    return jsonify(subject.to_dict()), 200


@subjects_bp.route("/subjects/<int:subject_id>", methods=["DELETE"])
@jwt_required()
def delete_subject(subject_id):
    user_id = get_jwt_identity()
    subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first()
    if subject is None:
        return jsonify({"error": "Subject not found"}), 404

    db.session.delete(subject)
    db.session.commit()
    return jsonify({"message": "Subject deleted"}), 200
