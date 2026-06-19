from datetime import datetime

from app.extensions import db


class Podcast(db.Model):
    __tablename__ = "podcasts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    source_type = db.Column(db.String(20), nullable=False)  # notes|flashcards|pdf
    source_content = db.Column(db.Text, nullable=False)
    script = db.Column(db.JSON, nullable=True)  # [{speaker, text}, ...]
    audio_path = db.Column(db.String(500), nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)
    subject = db.Column(db.String(255), nullable=True)  # optional subject tag
    status = db.Column(db.String(20), default="pending")  # pending|generating|ready|failed
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "subject": self.subject,
            "source_type": self.source_type,
            "source_content": self.source_content,
            "script": self.script,
            "audio_path": self.audio_path,
            "duration_seconds": self.duration_seconds,
            "status": self.status,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
