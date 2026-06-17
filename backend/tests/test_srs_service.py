"""
Unit tests for the SM-2 spaced repetition algorithm in app/services/srs_service.py.

These tests use a plain stub object (not a real Flask-SQLAlchemy model) since
update_card() only touches attributes, not the database — no app context or
DB fixture is needed.
"""
import os
import sys
import unittest
from datetime import datetime, timedelta

# Ensure the backend root (parent of app/) is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import srs_service


class FakeCard:
    """A minimal stand-in for the Flashcard model with the SM-2 fields."""

    def __init__(self, ease_factor=2.5, interval=1, repetitions=0, next_review=None):
        self.ease_factor = ease_factor
        self.interval = interval
        self.repetitions = repetitions
        self.next_review = next_review or datetime.utcnow()


class TestSRSService(unittest.TestCase):
    def test_low_quality_resets_repetitions_and_interval(self):
        card = FakeCard(ease_factor=2.5, interval=10, repetitions=4)
        srs_service.update_card(card, quality=1)

        self.assertEqual(card.repetitions, 0)
        self.assertEqual(card.interval, 1)
        # next_review should be ~1 day out
        delta = card.next_review - datetime.utcnow()
        self.assertTrue(timedelta(hours=23) < delta <= timedelta(days=1, minutes=1))

    def test_quality_two_also_resets(self):
        card = FakeCard(ease_factor=2.0, interval=6, repetitions=2)
        srs_service.update_card(card, quality=2)

        self.assertEqual(card.repetitions, 0)
        self.assertEqual(card.interval, 1)

    def test_interval_grows_correctly_across_repetitions(self):
        card = FakeCard()

        # First successful review -> interval becomes 1, repetitions = 1
        srs_service.update_card(card, quality=5)
        self.assertEqual(card.repetitions, 1)
        self.assertEqual(card.interval, 1)

        # Second successful review -> interval becomes 6, repetitions = 2
        srs_service.update_card(card, quality=5)
        self.assertEqual(card.repetitions, 2)
        self.assertEqual(card.interval, 6)

        # Third successful review -> interval = round(previous_interval * ease_factor)
        previous_interval = card.interval
        previous_ef = card.ease_factor
        srs_service.update_card(card, quality=5)
        self.assertEqual(card.repetitions, 3)
        self.assertEqual(card.interval, round(previous_interval * previous_ef))

    def test_ease_factor_never_drops_below_minimum(self):
        card = FakeCard(ease_factor=1.3, interval=1, repetitions=0)
        # Repeatedly fail to try to push ease factor down past the floor
        for _ in range(20):
            srs_service.update_card(card, quality=0)

        self.assertGreaterEqual(card.ease_factor, srs_service.MIN_EASE_FACTOR)

    def test_ease_factor_increases_with_perfect_recall(self):
        card = FakeCard(ease_factor=2.5)
        srs_service.update_card(card, quality=5)
        # quality=5 -> ef' = ef + (0.1 - 0*(0.08+0*0.02)) = ef + 0.1
        self.assertAlmostEqual(card.ease_factor, 2.6, places=4)

    def test_invalid_quality_raises(self):
        card = FakeCard()
        with self.assertRaises(ValueError):
            srs_service.update_card(card, quality=6)
        with self.assertRaises(ValueError):
            srs_service.update_card(card, quality=-1)


if __name__ == "__main__":
    unittest.main()
