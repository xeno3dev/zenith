from datetime import datetime

from app.extensions import db


class Deck(db.Model):
    __tablename__ = "decks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    flashcards = db.relationship(
        "Flashcard", backref="deck", cascade="all, delete-orphan", lazy=True
    )
    subject = db.relationship("Subject", lazy=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "name": self.name,
            "description": self.description,
            "card_count": len(self.flashcards),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
