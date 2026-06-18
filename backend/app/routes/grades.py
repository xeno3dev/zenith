from collections import defaultdict

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.grade import Grade
from app.models.subject import Subject

grades_bp = Blueprint("grades", __name__)


def _score_to_letter_grade(percentage: float) -> str:
    """Map a weighted average percentage to a letter grade."""
    if percentage >= 90:
        return "A"
    if percentage >= 80:
        return "B"
    if percentage >= 70:
        return "C"
    if percentage >= 55:
        return "D"
    if percentage >= 40:
        return "E"
    return "F"


@grades_bp.route("/grades", methods=["GET"])
@jwt_required()
def list_grades():
    user_id = get_jwt_identity()
    query = Grade.query.filter_by(user_id=user_id)

    subject_id = request.args.get("subject_id")
    if subject_id:
        query = query.filter(Grade.subject_id == subject_id)

    grades = query.order_by(Grade.date.desc()).all()
    return jsonify([g.to_dict() for g in grades]), 200


@grades_bp.route("/grades/summary", methods=["GET"])
@jwt_required()
def grades_summary():
    user_id = get_jwt_identity()
    grades = Grade.query.filter_by(user_id=user_id).all()

    by_subject = defaultdict(list)
    for g in grades:
        by_subject[g.subject_id].append(g)

    summary = []
    for subject_id, subject_grades in by_subject.items():
        total_weight = sum(g.weight for g in subject_grades)
        if total_weight == 0:
            continue
        weighted_sum = sum(
            (g.score / g.max_score) * g.weight for g in subject_grades if g.max_score
        )
        weighted_average = (weighted_sum / total_weight) * 100

        subject = Subject.query.get(subject_id)
        summary.append(
            {
                "subject_id": subject_id,
                "subject_name": subject.name if subject else None,
                "weighted_average": round(weighted_average, 2),
                "predicted_grade": _score_to_letter_grade(weighted_average),
            }
        )

    return jsonify(summary), 200


@grades_bp.route("/grades", methods=["POST"])
@jwt_required()
def create_grade():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    required = ("subject_id", "assessment_name", "score", "max_score")
    if not all(data.get(field) is not None for field in required):
        return jsonify({"error": f"{', '.join(required)} are required"}), 400

    grade = Grade(
        user_id=user_id,
        subject_id=data["subject_id"],
        assessment_name=data["assessment_name"],
        score=data["score"],
        max_score=data["max_score"],
        weight=data.get("weight", 1.0),
        notes=data.get("notes"),
    )
    db.session.add(grade)
    db.session.commit()
    return jsonify(grade.to_dict()), 201


@grades_bp.route("/grades/<int:grade_id>", methods=["GET"])
@jwt_required()
def get_grade(grade_id):
    user_id = get_jwt_identity()
    grade = Grade.query.filter_by(id=grade_id, user_id=user_id).first()
    if grade is None:
        return jsonify({"error": "Grade not found"}), 404
    return jsonify(grade.to_dict()), 200


@grades_bp.route("/grades/<int:grade_id>", methods=["PUT"])
@jwt_required()
def update_grade(grade_id):
    user_id = get_jwt_identity()
    grade = Grade.query.filter_by(id=grade_id, user_id=user_id).first()
    if grade is None:
        return jsonify({"error": "Grade not found"}), 404

    data = request.get_json(silent=True) or {}
    for field in ("subject_id", "assessment_name", "score", "max_score", "weight", "notes"):
        if field in data:
            setattr(grade, field, data[field])

    db.session.commit()
    return jsonify(grade.to_dict()), 200


@grades_bp.route("/grades/<int:grade_id>", methods=["DELETE"])
@jwt_required()
def delete_grade(grade_id):
    user_id = get_jwt_identity()
    grade = Grade.query.filter_by(id=grade_id, user_id=user_id).first()
    if grade is None:
        return jsonify({"error": "Grade not found"}), 404

    db.session.delete(grade)
    db.session.commit()
    return jsonify({"message": "Grade deleted"}), 200
