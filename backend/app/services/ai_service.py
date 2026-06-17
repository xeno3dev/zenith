"""
AI service wrapping the Anthropic Claude API for Zenith's study features:
podcast script generation, quiz generation, topic explanations, and general
study-assistant chat.
"""
import json
import re

import anthropic
from flask import current_app

MODEL = "claude-sonnet-4-5-20250929"


def _get_client() -> anthropic.Anthropic:
    api_key = current_app.config.get("ANTHROPIC_API_KEY")
    return anthropic.Anthropic(api_key=api_key)


def _extract_json(text: str):
    """
    Strip markdown code fences (```json ... ``` or ``` ... ```) if present,
    then json.loads the remaining text. Raises ValueError with a clear
    message if parsing fails.
    """
    cleaned = text.strip()
    fence_match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", cleaned, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Could not parse JSON from Claude response: {exc}. Raw text: {cleaned[:500]}"
        )


def generate_podcast_script(content: str, subject: str) -> list:
    """
    Generate a NotebookLM-style two-host study podcast script.
    Returns a list of {"speaker": "Ari"|"Sol", "text": str} dicts.
    """
    system_prompt = (
        "You are a professional podcast script writer for Zenith, an AI study "
        "app for Caribbean (CSEC/CAPE) students. You write engaging, natural-sounding "
        "two-host educational podcast scripts in the style of NotebookLM's "
        "'Deep Dive' podcasts.\n\n"
        "The two hosts are:\n"
        "- Ari: analytical, explains concepts clearly and methodically, loves breaking "
        "things down step by step.\n"
        "- Sol: curious, asks great follow-up questions, brings energy and relatable "
        "framing, occasionally plays devil's advocate.\n\n"
        "Write a script that:\n"
        "- Has a clear arc: hook -> context -> deep dive -> 'why does this matter' -> "
        "Caribbean context tie-in -> wrap-up.\n"
        "- Uses natural, conversational speech: contractions, occasional '...' for "
        "pauses, NO markdown formatting, no stage directions, no asterisks.\n"
        "- Includes concrete examples and analogies to make ideas memorable.\n"
        "- Where it fits naturally, ties concepts to Caribbean-relevant context "
        "(mangoes, sugarcane, cricket, regional history, hurricanes, Carnival, etc.) "
        "if the subject is CSEC/CAPE-relevant. Don't force it if it doesn't fit.\n"
        "- Targets roughly 1200-2000 words of total spoken content (about 8-15 minutes "
        "of audio).\n"
        "- Keeps each turn to 2-4 sentences before switching speakers.\n\n"
        "Respond with ONLY a raw JSON array of turns, nothing else — no preamble, no "
        "explanation, no markdown code fences. Format exactly like:\n"
        '[{"speaker": "Ari", "text": "..."}, {"speaker": "Sol", "text": "..."}]'
    )

    user_prompt = (
        f"Subject/topic: {subject}\n\n"
        f"Source material to build the podcast episode from:\n{content}\n\n"
        "Write the full podcast script now, as a raw JSON array only."
    )

    try:
        client = _get_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw_text = "".join(
            block.text for block in response.content if hasattr(block, "text")
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to generate podcast script via Claude: {exc}")

    try:
        script = _extract_json(raw_text)
    except ValueError as exc:
        raise RuntimeError(f"Failed to parse podcast script JSON: {exc}")

    if not isinstance(script, list):
        raise RuntimeError("Podcast script response was not a JSON array as expected")

    return script


def quiz_me(deck_id: int, user_id: str) -> dict:
    """
    Generate a 5-question quiz (mix of MCQ and short answer) that tests the
    concepts in a deck's flashcards without simply copying card text.
    Returns {"questions": [{"question", "type", "options", "answer"}, ...]}.
    """
    from app.models.deck import Deck
    from app.models.flashcard import Flashcard

    deck = Deck.query.get(deck_id)
    if deck is None or deck.user_id != user_id:
        raise ValueError("Deck not found or not owned by this user")

    cards = Flashcard.query.filter_by(deck_id=deck_id).all()
    if not cards:
        raise ValueError("Deck has no flashcards to quiz from")

    card_lines = "\n".join(f"- Front: {c.front} | Back: {c.back}" for c in cards)

    system_prompt = (
        "You are Zenith's quiz generator for CSEC/CAPE students. Given a set of "
        "flashcards, you create NEW quiz questions that test the same underlying "
        "concepts in a different way — never just copy/paste the flashcard text "
        "verbatim as the question.\n\n"
        "Respond with ONLY raw JSON, nothing else, in exactly this shape:\n"
        '{"questions": [{"question": str, "type": "mcq" or "short_answer", '
        '"options": [str, str, str, str] or null, "answer": str}]}\n'
        "Generate exactly 5 questions, a mix of mcq and short_answer types."
    )

    user_prompt = f"Flashcards from deck '{deck.name}':\n{card_lines}\n\nGenerate the quiz now."

    try:
        client = _get_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw_text = "".join(
            block.text for block in response.content if hasattr(block, "text")
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to generate quiz via Claude: {exc}")

    try:
        quiz = _extract_json(raw_text)
    except ValueError as exc:
        raise RuntimeError(f"Failed to parse quiz JSON: {exc}")

    if not isinstance(quiz, dict) or "questions" not in quiz:
        raise RuntimeError("Quiz response did not contain a 'questions' key as expected")

    return quiz


def explain_topic(topic: str, subject: str, level: str) -> str:
    """
    Ask Claude to explain `topic` within `subject` at the given `level`
    (e.g. "CSEC", "CAPE Unit 1", "beginner"). Returns plain text.
    """
    system_prompt = (
        "You are Zenith's friendly study assistant for Caribbean students "
        "preparing for CSEC and CAPE examinations. Explain topics clearly, using "
        "simple language, concrete examples, and Caribbean-relevant context where "
        "it helps understanding. Avoid markdown formatting — write in plain "
        "conversational prose suitable for direct display in a chat UI."
    )
    user_prompt = (
        f"Explain the topic '{topic}' from the subject '{subject}' at a level "
        f"appropriate for: {level}. Be thorough but clear."
    )

    try:
        client = _get_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=1500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(block.text for block in response.content if hasattr(block, "text"))
    except Exception as exc:
        raise RuntimeError(f"Failed to get explanation from Claude: {exc}")


def chat(messages: list, context: str) -> str:
    """
    General study-assistant chat. `messages` is a list of
    {"role": "user"|"assistant", "content": str} dicts (conversation history,
    most recent last). `context` describes the current subject/page to help
    ground the assistant's responses.
    """
    system_prompt = (
        "You are Zenith, a friendly, encouraging AI study assistant for Caribbean "
        "(CSEC/CAPE) students. You help with homework questions, study strategies, "
        "exam prep, and general organization. You're warm but concise, and you draw "
        "on Caribbean-relevant examples when helpful. Avoid markdown formatting; "
        "write plain conversational text.\n\n"
        f"Current context: {context or 'No additional context provided.'}"
    )

    try:
        client = _get_client()
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        return "".join(block.text for block in response.content if hasattr(block, "text"))
    except Exception as exc:
        raise RuntimeError(f"Failed to get chat response from Claude: {exc}")
