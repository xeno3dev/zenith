from datetime import datetime

from app.extensions import db


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    color = db.Column(db.String(7), default="#4F46E5")  # hex color
    teacher = db.Column(db.String(255), nullable=True)
    room = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "color": self.color,
            "teacher": self.teacher,
            "room": self.room,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
