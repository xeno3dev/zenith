from datetime import datetime

from app.extensions import db


class Grade(db.Model):
    __tablename__ = "grades"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    assessment_name = db.Column(db.String(255), nullable=False)
    score = db.Column(db.Float, nullable=False)
    max_score = db.Column(db.Float, nullable=False)
    weight = db.Column(db.Float, default=1.0)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)

    subject = db.relationship("Subject", lazy=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "assessment_name": self.assessment_name,
            "score": self.score,
            "max_score": self.max_score,
            "weight": self.weight,
            "date": self.date.isoformat() if self.date else None,
            "notes": self.notes,
        }
