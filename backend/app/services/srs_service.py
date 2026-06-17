"""
SM-2 spaced repetition algorithm implementation.

Reference: SuperMemo SM-2 algorithm.
Quality scale (0-5):
  0-2 -> "failed" recall, reset repetitions and interval
  3-5 -> successful recall with varying ease, grow interval
"""
from datetime import datetime, timedelta

from app.extensions import db
from app.models.flashcard import Flashcard
from app.models.deck import Deck

MIN_EASE_FACTOR = 1.3


def update_card(card, quality: int):
    """
    Apply one SM-2 review step to `card` given a recall `quality` (0-5).
    Mutates and returns `card` in place. Does NOT commit — caller's
    responsibility to db.session.commit().
    """
    if quality is None or quality < 0 or quality > 5:
        raise ValueError("quality must be an integer between 0 and 5")

    if quality < 3:
        card.repetitions = 0
        card.interval = 1
    else:
        card.repetitions = (card.repetitions or 0) + 1

        if card.repetitions == 1:
            card.interval = 1
        elif card.repetitions == 2:
            card.interval = 6
        else:
            previous_interval = card.interval or 1
            card.interval = round(previous_interval * card.ease_factor)

    # Update ease factor using standard SM-2 formula (applies regardless of
    # pass/fail, though failing typically uses q < 3 which lowers it).
    current_ef = card.ease_factor if card.ease_factor else 2.5
    new_ef = current_ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    card.ease_factor = max(MIN_EASE_FACTOR, new_ef)

    card.next_review = datetime.utcnow() + timedelta(days=card.interval)

    return card


def get_due_cards(user_id, deck_id=None):
    """
    Return a list of Flashcard objects belonging to `user_id` (via Deck
    ownership) whose next_review is at or before now. Optionally scoped
    to a single deck_id.
    """
    query = (
        Flashcard.query.join(Deck, Flashcard.deck_id == Deck.id)
        .filter(Deck.user_id == user_id)
        .filter(Flashcard.next_review <= datetime.utcnow())
    )
    if deck_id is not None:
        query = query.filter(Flashcard.deck_id == deck_id)
    return query.all()
