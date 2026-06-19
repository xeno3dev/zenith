"""
AI service wrapping the Anthropic Claude API for Zenith's study features:
podcast script generation, quiz generation, topic explanations, and general
study-assistant chat with tool use so Claude can read and act on the student's
actual data inside Zenith.
"""
import json
import re
from collections import defaultdict
from datetime import datetime, timedelta

import anthropic
from flask import current_app


def _generate_flashcards_from_text(text: str, topic: str) -> list:
    """Generate flashcard front/back pairs from extracted resource text."""
    client, model = _get_client()
    system = (
        "You are a flashcard generator. Given source text, create concise question/answer "
        "flashcard pairs that test key concepts. Respond ONLY with a raw JSON array like: "
        '[{"front": "...", "back": "..."}]. Generate 5-10 cards.'
    )
    try:
        response = client.messages.create(
            model=model,
            max_tokens=2048,
            system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": f"Topic: {topic}\n\nSource text:\n{text[:8000]}"}],
        )
        raw = "".join(b.text for b in response.content if hasattr(b, "text"))
        return _extract_json(raw)
    except Exception as exc:
        raise RuntimeError(f"Flashcard generation failed: {exc}")


def _resource_summary(r) -> dict:
    return {
        "id": r.id,
        "original_name": r.original_name,
        "mime_type": r.mime_type,
        "entity_type": r.entity_type,
        "entity_id": r.entity_id,
        "has_text": bool(r.extracted_text),
        "anthropic_file_id": r.anthropic_file_id,
    }


def _get_client():
    api_key = current_app.config.get("ANTHROPIC_API_KEY")
    model = current_app.config.get("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")
    return anthropic.Anthropic(api_key=api_key), model


def _extract_json(text: str):
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


# ---------------------------------------------------------------------------
# Tool definitions for the agentic chat endpoint
# ---------------------------------------------------------------------------

_TOOLS = [
    {
        "name": "get_assignments",
        "description": (
            "Fetch the student's assignments from Zenith. Call this when they ask "
            "about homework, tasks, deadlines, or what they need to do. "
            "Returns a list with title, status, due_date, and priority."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["todo", "in_progress", "done"],
                    "description": "Filter by status. Omit to return all statuses.",
                }
            },
        },
    },
    {
        "name": "get_upcoming_exams",
        "description": (
            "Fetch exams coming up in the next 30 days. Call this when the student "
            "asks about upcoming tests, exams, or revision deadlines."
        ),
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_grades_summary",
        "description": (
            "Get a per-subject summary of the student's grades: weighted average "
            "percentage and predicted letter grade. Call this when they ask how "
            "they're doing, what their grades look like, or which subject needs work."
        ),
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_due_flashcards",
        "description": (
            "Return the number of flashcards due for review today, broken down by "
            "deck. Call this when the student asks about their flashcard review queue "
            "or how many cards are due."
        ),
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_decks",
        "description": (
            "List all the student's flashcard decks with their names, card counts, "
            "and deck IDs. Call this before add_flashcard so you know which deck ID "
            "to use, or when the student asks what decks they have."
        ),
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "create_assignment",
        "description": (
            "Create a new assignment for the student in Zenith. Only call this when "
            "the student explicitly asks you to add or create an assignment. "
            "Confirm what you created in your reply."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Assignment title"},
                "due_date": {
                    "type": "string",
                    "description": "Due date in ISO 8601 format (YYYY-MM-DD)",
                },
                "priority": {
                    "type": "integer",
                    "enum": [1, 2, 3],
                    "description": "1 = low, 2 = medium (default), 3 = high",
                },
                "description": {
                    "type": "string",
                    "description": "Optional extra notes about the assignment",
                },
            },
            "required": ["title", "due_date"],
        },
    },
    {
        "name": "add_flashcard",
        "description": (
            "Add a single flashcard to one of the student's decks. Only call this "
            "when the student explicitly asks you to add a card. Call list_decks "
            "first if you don't know the deck ID. Confirm what you added."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "deck_id": {
                    "type": "integer",
                    "description": "ID of the deck to add the card to",
                },
                "front": {"type": "string", "description": "Question / prompt side"},
                "back": {"type": "string", "description": "Answer side"},
            },
            "required": ["deck_id", "front", "back"],
        },
    },
    {
        "name": "get_study_time",
        "description": (
            "Get a summary of how much time the student has studied in the last 7 days, "
            "broken down by subject. Call this when they ask about study habits, how long "
            "they've studied, or their Pomodoro history."
        ),
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_resources",
        "description": (
            "List files/attachments the student has uploaded to a subject, assignment, "
            "or exam. Call this when they mention 'my notes', 'my PDF', 'my files', or "
            "ask about documents attached to an entity."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "entity_type": {
                    "type": "string",
                    "enum": ["subject", "assignment", "exam"],
                    "description": "The type of entity to list resources for",
                },
                "entity_id": {
                    "type": "integer",
                    "description": "The numeric ID of the entity",
                },
            },
            "required": ["entity_type", "entity_id"],
        },
    },
    {
        "name": "read_resource",
        "description": (
            "Read / summarise the content of a specific uploaded file. For PDFs and "
            "images with a stored Anthropic file_id, Claude reads them natively. For "
            "Word and plain-text files the extracted text is returned. Call this when "
            "the student asks you to read, summarise, or quiz them on a document."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "resource_id": {
                    "type": "integer",
                    "description": "The resource ID from list_resources",
                },
            },
            "required": ["resource_id"],
        },
    },
    {
        "name": "generate_flashcards_from_resource",
        "description": (
            "Generate flashcard question/answer pairs from the text of an uploaded "
            "resource. Use this when the student asks to create flashcards from a "
            "document or notes. Requires the resource to have extracted text. "
            "Returns a list of {front, back} pairs to show the student."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "resource_id": {
                    "type": "integer",
                    "description": "The resource ID to generate cards from",
                },
                "topic": {
                    "type": "string",
                    "description": "The topic/subject name to focus the flashcards on",
                },
            },
            "required": ["resource_id", "topic"],
        },
    },
]

_SYSTEM_PROMPT = (
    "You are Zenith, a warm and encouraging AI study assistant embedded in a student "
    "productivity app. You have access to the student's real academic data through "
    "tools — assignments, exams, grades, flashcard decks, study time, and uploaded "
    "resources — and you can also take actions on their behalf when they ask.\n\n"
    "Use your tools proactively when the student's question implies you should check "
    "their data. For example:\n"
    "- 'what homework do I have?' → call get_assignments\n"
    "- 'how are my grades?' → call get_grades_summary\n"
    "- 'any exams coming up?' → call get_upcoming_exams\n"
    "- 'how many cards are due?' → call get_due_flashcards\n"
    "- 'add this to my deck' → call list_decks, then add_flashcard\n"
    "- 'how long have I studied?' → call get_study_time\n"
    "- 'read my notes for maths' → call list_resources, then read_resource\n"
    "- 'make flashcards from my PDF' → call list_resources, read_resource, then generate_flashcards_from_resource\n\n"
    "When you create something for the student, say clearly what you did.\n"
    "Keep replies warm but concise. No markdown — plain conversational text only."
)


def _execute_tool(name: str, inputs: dict, user_id: str):
    """Run a single tool call and return a JSON-serialisable result."""
    from app.extensions import db
    from app.models.assignment import Assignment
    from app.models.deck import Deck
    from app.models.exam import Exam
    from app.models.flashcard import Flashcard
    from app.models.grade import Grade
    from app.models.resource import Resource
    from app.models.study_session import StudySession
    from app.services import srs_service

    if name == "get_assignments":
        q = Assignment.query.filter_by(user_id=user_id)
        if inputs.get("status"):
            q = q.filter_by(status=inputs["status"])
        items = q.order_by(Assignment.due_date).all()
        return [
            {
                "title": a.title,
                "status": a.status,
                "due_date": a.due_date.isoformat() if a.due_date else None,
                "priority": a.priority,
            }
            for a in items
        ]

    if name == "get_upcoming_exams":
        now = datetime.utcnow()
        cutoff = now + timedelta(days=30)
        items = (
            Exam.query.filter_by(user_id=user_id)
            .filter(Exam.exam_date >= now, Exam.exam_date <= cutoff)
            .order_by(Exam.exam_date)
            .all()
        )
        return [
            {
                "title": e.title,
                "exam_date": e.exam_date.isoformat(),
                "exam_type": e.exam_type,
            }
            for e in items
        ]

    if name == "get_grades_summary":
        grades = Grade.query.filter_by(user_id=user_id).all()
        by_subject: dict = defaultdict(list)
        for g in grades:
            by_subject[g.subject_id].append(g)

        # Map predicted letter grades the same way the grades route does
        def predict_grade(pct):
            if pct >= 90:
                return "A"
            if pct >= 80:
                return "B"
            if pct >= 70:
                return "C"
            if pct >= 55:
                return "D"
            if pct >= 40:
                return "E"
            return "F"

        summary = []
        for subject_id, gs in by_subject.items():
            total_weight = sum(g.weight for g in gs)
            if total_weight > 0:
                avg = sum((g.score / g.max_score) * g.weight for g in gs) / total_weight * 100
            else:
                avg = 0.0
            summary.append(
                {
                    "subject_id": subject_id,
                    "weighted_average": round(avg, 1),
                    "predicted_grade": predict_grade(avg),
                }
            )
        return summary

    if name == "get_due_flashcards":
        due = srs_service.get_due_cards(user_id)
        counts: dict = defaultdict(int)
        deck_names: dict = {}
        for c in due:
            counts[c.deck_id] += 1
        # Fetch deck names for the IDs we found
        deck_ids = list(counts.keys())
        if deck_ids:
            decks = Deck.query.filter(Deck.id.in_(deck_ids), Deck.user_id == user_id).all()
            deck_names = {d.id: d.name for d in decks}
        return [
            {"deck_id": did, "deck_name": deck_names.get(did, "Unknown"), "due_count": cnt}
            for did, cnt in counts.items()
        ]

    if name == "list_decks":
        decks = Deck.query.filter_by(user_id=user_id).order_by(Deck.created_at.desc()).all()
        return [{"id": d.id, "name": d.name, "card_count": len(d.flashcards)} for d in decks]

    if name == "create_assignment":
        try:
            due_dt = datetime.fromisoformat(inputs["due_date"])
        except (ValueError, KeyError):
            return {"error": "Invalid due_date format. Use YYYY-MM-DD."}
        a = Assignment(
            user_id=user_id,
            title=inputs["title"],
            due_date=due_dt,
            priority=inputs.get("priority", 2),
            description=inputs.get("description"),
            status="todo",
        )
        db.session.add(a)
        db.session.commit()
        return {"created": True, "id": a.id, "title": a.title, "due_date": inputs["due_date"]}

    if name == "add_flashcard":
        deck = Deck.query.filter_by(id=inputs["deck_id"], user_id=user_id).first()
        if deck is None:
            return {"error": f"Deck {inputs['deck_id']} not found or not owned by you."}
        card = Flashcard(
            deck_id=inputs["deck_id"],
            front=inputs["front"],
            back=inputs["back"],
        )
        db.session.add(card)
        db.session.commit()
        return {"created": True, "card_id": card.id, "deck_name": deck.name}

    if name == "get_study_time":
        since = datetime.utcnow() - timedelta(days=7)
        sessions = (
            StudySession.query
            .filter(StudySession.user_id == user_id,
                    StudySession.completed_at >= since)
            .all()
        )
        by_subject: dict = defaultdict(int)
        total = 0
        for s in sessions:
            by_subject[s.subject_name or "Other"] += s.duration_minutes
            total += s.duration_minutes
        return {
            "total_minutes": total,
            "session_count": len(sessions),
            "by_subject": sorted(
                [{"subject": k, "minutes": v} for k, v in by_subject.items()],
                key=lambda x: -x["minutes"],
            ),
        }

    if name == "list_resources":
        entity_type = inputs.get("entity_type")
        entity_id = inputs.get("entity_id")
        resources = (
            Resource.query
            .filter_by(user_id=user_id, entity_type=entity_type, entity_id=entity_id)
            .order_by(Resource.created_at.desc())
            .all()
        )
        return [_resource_summary(r) for r in resources]

    if name == "read_resource":
        resource = Resource.query.filter_by(
            id=inputs.get("resource_id"), user_id=user_id
        ).first()
        if resource is None:
            return {"error": "Resource not found"}

        if resource.anthropic_file_id:
            return [
                {
                    "type": "text",
                    "text": (
                        f"Reading {resource.original_name} via Files API "
                        f"(file_id={resource.anthropic_file_id}):"
                    ),
                },
                {
                    "type": "document",
                    "source": {
                        "type": "file",
                        "file_id": resource.anthropic_file_id,
                    },
                },
            ]

        if resource.extracted_text:
            return {
                "resource": _resource_summary(resource),
                "text": resource.extracted_text[:12000],
            }

        return {
            "resource": _resource_summary(resource),
            "error": "No readable content available for this file type",
        }

    if name == "generate_flashcards_from_resource":
        resource = Resource.query.filter_by(
            id=inputs.get("resource_id"), user_id=user_id
        ).first()
        if resource is None:
            return {"error": "Resource not found"}
        if not resource.extracted_text:
            return {"error": "This resource has no extracted text. Only PDFs, Word, and plain-text files are supported."}
        topic = inputs.get("topic", resource.original_name)
        try:
            cards = _generate_flashcards_from_text(resource.extracted_text, topic)
            return {"cards": cards, "count": len(cards)}
        except RuntimeError as exc:
            return {"error": str(exc)}

    return {"error": f"Unknown tool: {name}"}


def chat_with_tools(messages: list, user_id: str) -> dict:
    """
    Agentic chat loop: pass the conversation to Claude with tools, execute any
    tool calls, feed results back, and repeat until Claude returns a text reply.

    Returns {"reply": str, "actions": list[dict]} where actions is a list of
    {tool, result} dicts — useful for the frontend to show what Zenith did.
    """
    client, model = _get_client()

    # Build the initial Claude message list from the frontend conversation.
    # Only user/assistant turns with text content are passed; tool-call history
    # is not preserved across requests (the AI's text response already
    # summarises what it found).
    claude_messages = []
    for m in messages:
        role = m.get("role")
        content = m.get("content", "")
        if role in ("user", "assistant") and isinstance(content, str):
            claude_messages.append({"role": role, "content": content})

    actions = []

    # Run the tool loop (capped at 8 iterations to avoid runaway tool chains)
    for _ in range(8):
        try:
            response = client.messages.create(
                model=model,
                max_tokens=1024,
                tools=_TOOLS,
                system=[
                    {
                        "type": "text",
                        "text": _SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=claude_messages,
            )
        except Exception as exc:
            raise RuntimeError(f"Claude API error: {exc}")

        if response.stop_reason == "end_turn":
            reply = "".join(
                block.text for block in response.content if hasattr(block, "text")
            )
            return {"reply": reply, "actions": actions}

        if response.stop_reason == "tool_use":
            tool_blocks = [b for b in response.content if b.type == "tool_use"]
            tool_results = []
            for tb in tool_blocks:
                result = _execute_tool(tb.name, tb.input, user_id)
                actions.append({"tool": tb.name, "result": result})
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tb.id,
                        "content": result if isinstance(result, list) else json.dumps(result),
                    }
                )
            # Append the assistant turn (with tool_use blocks) and the tool results
            claude_messages.append({"role": "assistant", "content": response.content})
            claude_messages.append({"role": "user", "content": tool_results})
        else:
            # Unexpected stop reason — extract whatever text is available
            reply = "".join(
                block.text for block in response.content if hasattr(block, "text")
            )
            return {"reply": reply or "Something went wrong. Please try again.", "actions": actions}

    return {
        "reply": "I needed too many steps to answer that. Could you rephrase?",
        "actions": actions,
    }


# ---------------------------------------------------------------------------
# Remaining non-chat AI functions (unchanged)
# ---------------------------------------------------------------------------

def generate_podcast_script(content: str, subject: str) -> list:
    system_prompt = (
        "You are a professional podcast script writer for Zenith, an AI study "
        "app for students. You write engaging, natural-sounding two-host "
        "educational podcast scripts in the style of NotebookLM's "
        "'Deep Dive' podcasts.\n\n"
        "The two hosts are:\n"
        "- Ari: analytical, explains concepts clearly and methodically, loves breaking "
        "things down step by step.\n"
        "- Sol: curious, asks great follow-up questions, brings energy and relatable "
        "framing, occasionally plays devil's advocate.\n\n"
        "Write a script that:\n"
        "- Has a clear arc: hook -> context -> deep dive -> 'why does this matter' -> "
        "real-world tie-in -> wrap-up.\n"
        "- Uses natural, conversational speech: contractions, occasional '...' for "
        "pauses, NO markdown formatting, no stage directions, no asterisks.\n"
        "- Includes concrete examples and analogies to make ideas memorable.\n"
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
        client, model = _get_client()
        response = client.messages.create(
            model=model,
            max_tokens=4096,
            system=[{"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}],
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
        "You are Zenith's quiz generator. Given a set of "
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
        client, model = _get_client()
        response = client.messages.create(
            model=model,
            max_tokens=2048,
            system=[{"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}],
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
    system_prompt = (
        "You are Zenith's friendly study assistant. Explain topics clearly, using "
        "simple language and concrete examples where it helps understanding. "
        "Avoid markdown formatting — write in plain conversational prose suitable "
        "for direct display in a chat UI."
    )
    user_prompt = (
        f"Explain the topic '{topic}' from the subject '{subject}' at a level "
        f"appropriate for: {level}. Be thorough but clear."
    )

    try:
        client, model = _get_client()
        response = client.messages.create(
            model=model,
            max_tokens=1500,
            system=[{"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(block.text for block in response.content if hasattr(block, "text"))
    except Exception as exc:
        raise RuntimeError(f"Failed to get explanation from Claude: {exc}")
