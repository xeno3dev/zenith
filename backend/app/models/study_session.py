from datetime import datetime
from app.extensions import db


class StudySession(db.Model):
    __tablename__ = 'study_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.String(36), db.ForeignKey('users.id'), nullable=False, index=True
    )
    subject_id = db.Column(
        db.Integer, db.ForeignKey('subjects.id'), nullable=True
    )
    subject_name = db.Column(db.String(120), nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
