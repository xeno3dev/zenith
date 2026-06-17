"""Small shared helper functions used across route modules."""
from datetime import datetime
from typing import Iterable, Optional


def parse_iso_date(value: Optional[str]) -> Optional[datetime]:
    """
    Parse an ISO-8601 date/datetime string into a datetime object.
    Returns None if value is falsy. Raises ValueError if malformed.
    Accepts both 'YYYY-MM-DD' and full ISO datetime strings, including
    those with a trailing 'Z' (converted to +00:00 for fromisoformat).
    """
    if not value:
        return None
    cleaned = value.strip()
    if cleaned.endswith("Z"):
        cleaned = cleaned[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(cleaned)
    except ValueError:
        # Fall back to date-only parsing e.g. "2026-06-17"
        return datetime.strptime(cleaned, "%Y-%m-%d")


def to_dict_list(items: Iterable) -> list:
    """Convert an iterable of model instances (each with .to_dict()) to a list of dicts."""
    return [item.to_dict() for item in items]
