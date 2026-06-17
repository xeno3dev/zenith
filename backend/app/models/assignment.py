from datetime import datetime

from app.extensions import db


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=False)
    priority = db.Column(db.Integer, default=2)  # 1=low, 2=medium, 3=high
    status = db.Column(db.String(20), default="todo")  # todo|in_progress|done
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subject = db.relationship("Subject", lazy=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
