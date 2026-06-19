import json
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.services import ai_service

ai_bp = Blueprint("ai", __name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _session_dict(session, include_messages=False):
    d = {
        "id": session.id,
        "title": session.title,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
        "message_count": len(session.messages),
    }
    if include_messages:
        d["messages"] = [
            {
                "id": m.id,
                "role": m.role,
                "content": json.loads(m.content_json),
                "created_at": m.created_at.isoformat(),
            }
            for m in session.messages
        ]
    return d


# ---------------------------------------------------------------------------
# Session CRUD
# ---------------------------------------------------------------------------

@ai_bp.route("/sessions", methods=["GET"])
@jwt_required()
def list_sessions():
    from app.models.chat_session import ChatSession
    user_id = get_jwt_identity()
    sessions = (
        ChatSession.query
        .filter_by(user_id=user_id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return jsonify([_session_dict(s) for s in sessions]), 200


@ai_bp.route("/sessions", methods=["POST"])
@jwt_required()
def create_session():
    from app.models.chat_session import ChatSession
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    session = ChatSession(
        user_id=user_id,
        title=data.get("title", "New conversation"),
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(_session_dict(session, include_messages=True)), 201


@ai_bp.route("/sessions/<int:session_id>", methods=["GET"])
@jwt_required()
def get_session(session_id):
    from app.models.chat_session import ChatSession
    user_id = get_jwt_identity()
    session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()
    return jsonify(_session_dict(session, include_messages=True)), 200


@ai_bp.route("/sessions/<int:session_id>", methods=["PATCH"])
@jwt_required()
def update_session(session_id):
    from app.models.chat_session import ChatSession
    user_id = get_jwt_identity()
    session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()
    data = request.get_json(silent=True) or {}
    if "title" in data:
        session.title = str(data["title"])[:255]
    session.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(_session_dict(session)), 200


@ai_bp.route("/sessions/<int:session_id>", methods=["DELETE"])
@jwt_required()
def delete_session(session_id):
    from app.models.chat_session import ChatSession
    user_id = get_jwt_identity()
    session = ChatSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()
    db.session.delete(session)
    db.session.commit()
    return jsonify({"deleted": True}), 200


# ---------------------------------------------------------------------------
# Chat  (session-aware)
# ---------------------------------------------------------------------------

@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    """
    Session-aware study-assistant chat with tool use.

    New protocol  (preferred):
      { "session_id": int, "message": str | list }
      → loads history from DB, appends message, runs tool loop, persists reply

    Legacy protocol (backward compat):
      { "messages": [ {role, content}, … ] }
      → stateless, no persistence

    Response: { "reply": str, "actions": […], "session_id": int, "session_title": str }
    """
    from app.models.chat_session import ChatSession
    from app.models.chat_message import ChatMessage

    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    session_id = data.get("session_id")
    new_message = data.get("message")   # str or multimodal list
    legacy_messages = data.get("messages")  # legacy list

    # ---- Session-based flow ------------------------------------------------
    if session_id is not None:
        session = ChatSession.query.filter_by(
            id=session_id, user_id=user_id
        ).first_or_404()

        # Count existing messages BEFORE adding the new one (for auto-title)
        existing_count = len(session.messages)

        # Build history from DB
        history = [
            {"role": m.role, "content": json.loads(m.content_json)}
            for m in session.messages
        ]

        if new_message is None:
            return jsonify({"error": "message is required when using session_id"}), 400

        # Append new user turn
        history.append({"role": "user", "content": new_message})

        # Persist the user message
        db.session.add(ChatMessage(
            session_id=session_id,
            role="user",
            content_json=json.dumps(new_message),
        ))

        try:
            result = ai_service.chat_with_tools(history, user_id)
        except RuntimeError as exc:
            db.session.rollback()
            return jsonify({"error": str(exc)}), 500

        # Persist assistant reply
        db.session.add(ChatMessage(
            session_id=session_id,
            role="assistant",
            content_json=json.dumps(result["reply"]),
        ))

        # Auto-title from the first user message
        if existing_count == 0:
            first_text = (
                new_message if isinstance(new_message, str)
                else next(
                    (b.get("text", "") for b in new_message if b.get("type") == "text"),
                    "Chat",
                ) if isinstance(new_message, list) else "Chat"
            )
            session.title = (first_text[:57] + "…") if len(first_text) > 57 else first_text

        session.updated_at = datetime.utcnow()
        db.session.commit()

        result["session_id"] = session_id
        result["session_title"] = session.title
        return jsonify(result), 200

    # ---- Legacy stateless flow ---------------------------------------------
    messages = legacy_messages
    if not messages or not isinstance(messages, list):
        return jsonify({"error": "session_id + message, or legacy messages list required"}), 400

    try:
        result = ai_service.chat_with_tools(messages, user_id)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify(result), 200


# ---------------------------------------------------------------------------
# Other AI endpoints
# ---------------------------------------------------------------------------

@ai_bp.route("/explain", methods=["POST"])
@jwt_required()
def explain():
    data = request.get_json(silent=True) or {}
    topic = data.get("topic")
    subject = data.get("subject")
    level = data.get("level", "High School")

    if not topic or not subject:
        return jsonify({"error": "topic and subject are required"}), 400

    try:
        explanation = ai_service.explain_topic(topic, subject, level)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify({"explanation": explanation}), 200


@ai_bp.route("/quiz", methods=["POST"])
@jwt_required()
def quiz():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    deck_id = data.get("deck_id")

    if not deck_id:
        return jsonify({"error": "deck_id is required"}), 400

    try:
        quiz_data = ai_service.quiz_me(deck_id, user_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify(quiz_data), 200
