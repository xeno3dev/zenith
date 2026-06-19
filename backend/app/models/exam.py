from datetime import datetime

from app.extensions import db


class Exam(db.Model):
    __tablename__ = "exams"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    exam_date = db.Column(db.DateTime, nullable=False)
    exam_type = db.Column(db.String(20), default="internal")  # internal|external|mock
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subject = db.relationship("Subject", lazy=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "title": self.title,
            "exam_date": self.exam_date.isoformat() if self.exam_date else None,
            "exam_type": self.exam_type,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
