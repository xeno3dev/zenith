import uuid
from datetime import datetime

from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    school = db.Column(db.String(255), nullable=True)
    grade_level = db.Column(db.String(50), nullable=True)  # e.g. "Form 4"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subjects = db.relationship(
        "Subject", backref="user", cascade="all, delete-orphan", lazy=True
    )
    assignments = db.relationship(
        "Assignment", backref="user", cascade="all, delete-orphan", lazy=True
    )
    exams = db.relationship(
        "Exam", backref="user", cascade="all, delete-orphan", lazy=True
    )
    decks = db.relationship(
        "Deck", backref="user", cascade="all, delete-orphan", lazy=True
    )
    grades = db.relationship(
        "Grade", backref="user", cascade="all, delete-orphan", lazy=True
    )
    podcasts = db.relationship(
        "Podcast", backref="user", cascade="all, delete-orphan", lazy=True
    )

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "school": self.school,
            "grade_level": self.grade_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
