import json
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.timetable import Timetable

timetable_bp = Blueprint("timetable", __name__)

@timetable_bp.route("/timetable", methods=["GET"])
@jwt_required()
def get_timetable():
    user_id = get_jwt_identity()
    row = Timetable.query.filter_by(user_id=user_id).first()
    data = json.loads(row.data) if row else {}
    return jsonify(data), 200

@timetable_bp.route('/timetable', methods=['PUT'])
@jwt_required()
def save_timetable():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    row = Timetable.query.filter_by(user_id=user_id).first()
    if row:
        row.data = json.dumps(data)
    else:
        row = Timetable(user_id=user_id, data=json.dumps(data))
        db.session.add(row)
    db.session.commit()
    return jsonify(data), 200