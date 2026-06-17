from datetime import datetime

from app.extensions import db


class Flashcard(db.Model):
    __tablename__ = "flashcards"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    deck_id = db.Column(db.Integer, db.ForeignKey("decks.id"), nullable=False)
    front = db.Column(db.Text, nullable=False)
    back = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # SM-2 spaced repetition fields
    ease_factor = db.Column(db.Float, default=2.5)
    interval = db.Column(db.Integer, default=1)
    repetitions = db.Column(db.Integer, default=0)
    next_review = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "deck_id": self.deck_id,
            "front": self.front,
            "back": self.back,
            "ease_factor": self.ease_factor,
            "interval": self.interval,
            "repetitions": self.repetitions,
            "next_review": self.next_review.isoformat() if self.next_review else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
