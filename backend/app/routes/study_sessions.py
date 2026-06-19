from collections import defaultdict
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.study_session import StudySession

study_sessions_bp = Blueprint('study_sessions', __name__)


@study_sessions_bp.route('/study-sessions', methods=['POST'])
@jwt_required()
def create_session():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    session = StudySession(
        user_id=user_id,
        subject_id=data.get('subject_id') or None,
        subject_name=data.get('subject_name') or None,
        duration_minutes=int(data.get('duration_minutes', 25)),
    )
    db.session.add(session)
    db.session.commit()
    return jsonify({'id': session.id}), 201


@study_sessions_bp.route('/study-sessions/summary', methods=['GET'])
@jwt_required()
def summary():
    user_id = get_jwt_identity()
    since = datetime.utcnow() - timedelta(days=7)
    sessions = (
        StudySession.query
        .filter(StudySession.user_id == user_id,
                StudySession.completed_at >= since)
        .all()
    )
    by_subject: dict = defaultdict(int)
    total = 0
    for s in sessions:
        name = s.subject_name or 'Other'
        by_subject[name] += s.duration_minutes
        total += s.duration_minutes

    return jsonify({
        'total_minutes': total,
        'session_count': len(sessions),
        'by_subject': sorted(
            [{'subject': k, 'minutes': v} for k, v in by_subject.items()],
            key=lambda x: -x['minutes'],
        ),
    }), 200
