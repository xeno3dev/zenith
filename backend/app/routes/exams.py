from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.exam import Exam
from app.utils.helpers import parse_iso_date

exams_bp = Blueprint("exams", __name__)


@exams_bp.route("/exams", methods=["GET"])
@jwt_required()
def list_exams():
    user_id = get_jwt_identity()
    query = Exam.query.filter_by(user_id=user_id)

    upcoming = request.args.get("upcoming")
    if upcoming and upcoming.lower() == "true":
        now = datetime.utcnow()
        query = query.filter(
            Exam.exam_date >= now, Exam.exam_date <= now + timedelta(days=30)
        )

    exams = query.order_by(Exam.exam_date.asc()).all()
    return jsonify([e.to_dict() for e in exams]), 200


@exams_bp.route("/exams", methods=["POST"])
@jwt_required()
def create_exam():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    if not data.get("title") or not data.get("exam_date"):
        return jsonify({"error": "title and exam_date are required"}), 400

    try:
        exam_date = parse_iso_date(data["exam_date"])
    except ValueError:
        return jsonify({"error": "exam_date must be a valid ISO date"}), 400

    exam = Exam(
        user_id=user_id,
        subject_id=data.get("subject_id"),
        title=data["title"],
        exam_date=exam_date,
        exam_type=data.get("exam_type", "internal"),
        notes=data.get("notes"),
    )
    db.session.add(exam)
    db.session.commit()
    return jsonify(exam.to_dict()), 201


@exams_bp.route("/exams/<int:exam_id>", methods=["GET"])
@jwt_required()
def get_exam(exam_id):
    user_id = get_jwt_identity()
    exam = Exam.query.filter_by(id=exam_id, user_id=user_id).first()
    if exam is None:
        return jsonify({"error": "Exam not found"}), 404
    return jsonify(exam.to_dict()), 200


@exams_bp.route("/exams/<int:exam_id>", methods=["PUT"])
@jwt_required()
def update_exam(exam_id):
    user_id = get_jwt_identity()
    exam = Exam.query.filter_by(id=exam_id, user_id=user_id).first()
    if exam is None:
        return jsonify({"error": "Exam not found"}), 404

    data = request.get_json(silent=True) or {}

    if "exam_date" in data:
        try:
            exam.exam_date = parse_iso_date(data["exam_date"])
        except ValueError:
            return jsonify({"error": "exam_date must be a valid ISO date"}), 400

    for field in ("subject_id", "title", "exam_type", "notes"):
        if field in data:
            setattr(exam, field, data[field])

    db.session.commit()
    return jsonify(exam.to_dict()), 200


@exams_bp.route("/exams/<int:exam_id>", methods=["DELETE"])
@jwt_required()
def delete_exam(exam_id):
    user_id = get_jwt_identity()
    exam = Exam.query.filter_by(id=exam_id, user_id=user_id).first()
    if exam is None:
        return jsonify({"error": "Exam not found"}), 404

    db.session.delete(exam)
    db.session.commit()
    return jsonify({"message": "Exam deleted"}), 200
