"""
Import all models here so Flask-Migrate can detect them when generating
migrations (Alembic inspects db.metadata, which is only populated once
each model module has been imported at least once).
"""
from app.models.user import User
from app.models.subject import Subject
from app.models.assignment import Assignment
from app.models.exam import Exam
from app.models.deck import Deck
from app.models.flashcard import Flashcard
from app.models.grade import Grade
from app.models.podcast import Podcast
from app.models.timetable import Timetable

__all__ = [
    "User",
    "Subject",
    "Assignment",
    "Exam",
    "Deck",
    "Flashcard",
    "Grade",
    "Podcast",
    "Timetable",
]
