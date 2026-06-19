from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services import ai_service

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    """
    Unified study-assistant chat with tool use.

    The frontend sends the full conversation history and the backend runs a
    Claude agentic loop that can look up or create the student's Zenith data
    before producing a final text reply.

    Request:  { "messages": [{"role": "user"|"assistant", "content": str}, ...] }
    Response: { "reply": str, "actions": [{"tool": str, "result": any}, ...] }
    """
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    messages = data.get("messages")

    if not messages or not isinstance(messages, list):
        return jsonify({"error": "messages (list) is required"}), 400

    try:
        result = ai_service.chat_with_tools(messages, user_id)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify(result), 200


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
