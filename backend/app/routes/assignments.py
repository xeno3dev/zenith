from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.assignment import Assignment
from app.utils.helpers import parse_iso_date

assignments_bp = Blueprint("assignments", __name__)


@assignments_bp.route("/assignments", methods=["GET"])
@jwt_required()
def list_assignments():
    user_id = get_jwt_identity()
    query = Assignment.query.filter_by(user_id=user_id)

    subject_id = request.args.get("subject_id")
    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)

    status = request.args.get("status")
    if status:
        query = query.filter(Assignment.status == status)

    due_before = request.args.get("due_before")
    if due_before:
        try:
            due_before_dt = parse_iso_date(due_before)
        except ValueError:
            return jsonify({"error": "due_before must be a valid ISO date"}), 400
        query = query.filter(Assignment.due_date <= due_before_dt)

    assignments = query.order_by(Assignment.due_date).all()
    return jsonify([a.to_dict() for a in assignments]), 200


@assignments_bp.route("/assignments", methods=["POST"])
@jwt_required()
def create_assignment():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    if not data.get("title") or not data.get("due_date"):
        return jsonify({"error": "title and due_date are required"}), 400

    try:
        due_date = parse_iso_date(data["due_date"])
    except ValueError:
        return jsonify({"error": "due_date must be a valid ISO date"}), 400

    assignment = Assignment(
        user_id=user_id,
        subject_id=data.get("subject_id"),
        title=data["title"],
        description=data.get("description"),
        due_date=due_date,
        priority=data.get("priority", 2),
        status=data.get("status", "todo"),
    )
    db.session.add(assignment)
    db.session.commit()
    return jsonify(assignment.to_dict()), 201


@assignments_bp.route("/assignments/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment(assignment_id):
    user_id = get_jwt_identity()
    assignment = Assignment.query.filter_by(id=assignment_id, user_id=user_id).first()
    if assignment is None:
        return jsonify({"error": "Assignment not found"}), 404
    return jsonify(assignment.to_dict()), 200


@assignments_bp.route("/assignments/<int:assignment_id>", methods=["PUT"])
@jwt_required()
def update_assignment(assignment_id):
    user_id = get_jwt_identity()
    assignment = Assignment.query.filter_by(id=assignment_id, user_id=user_id).first()
    if assignment is None:
        return jsonify({"error": "Assignment not found"}), 404

    data = request.get_json(silent=True) or {}

    if "due_date" in data:
        try:
            assignment.due_date = parse_iso_date(data["due_date"])
        except ValueError:
            return jsonify({"error": "due_date must be a valid ISO date"}), 400

    for field in ("subject_id", "title", "description", "priority", "status"):
        if field in data:
            setattr(assignment, field, data[field])

    db.session.commit()
    return jsonify(assignment.to_dict()), 200


@assignments_bp.route("/assignments/<int:assignment_id>", methods=["DELETE"])
@jwt_required()
def delete_assignment(assignment_id):
    user_id = get_jwt_identity()
    assignment = Assignment.query.filter_by(id=assignment_id, user_id=user_id).first()
    if assignment is None:
        return jsonify({"error": "Assignment not found"}), 404

    db.session.delete(assignment)
    db.session.commit()
    return jsonify({"message": "Assignment deleted"}), 200
