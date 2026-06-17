from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.deck import Deck
from app.models.flashcard import Flashcard
from app.services import srs_service

# Single blueprint covering both /decks and /cards routes, registered with
# no extra prefix at the app factory level (full paths defined here).
flashcards_bp = Blueprint("flashcards", __name__)


# ---------- Decks ----------


@flashcards_bp.route("/decks", methods=["GET"])
@jwt_required()
def list_decks():
    user_id = get_jwt_identity()
    decks = Deck.query.filter_by(user_id=user_id).order_by(Deck.created_at.desc()).all()
    return jsonify([d.to_dict() for d in decks]), 200


@flashcards_bp.route("/decks", methods=["POST"])
@jwt_required()
def create_deck():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    deck = Deck(
        user_id=user_id,
        subject_id=data.get("subject_id"),
        name=data["name"],
        description=data.get("description"),
    )
    db.session.add(deck)
    db.session.commit()
    return jsonify(deck.to_dict()), 201


@flashcards_bp.route("/decks/<int:deck_id>", methods=["GET"])
@jwt_required()
def get_deck(deck_id):
    user_id = get_jwt_identity()
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first()
    if deck is None:
        return jsonify({"error": "Deck not found"}), 404
    return jsonify(deck.to_dict()), 200


@flashcards_bp.route("/decks/<int:deck_id>", methods=["PUT"])
@jwt_required()
def update_deck(deck_id):
    user_id = get_jwt_identity()
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first()
    if deck is None:
        return jsonify({"error": "Deck not found"}), 404

    data = request.get_json(silent=True) or {}
    for field in ("name", "description", "subject_id"):
        if field in data:
            setattr(deck, field, data[field])

    db.session.commit()
    return jsonify(deck.to_dict()), 200


@flashcards_bp.route("/decks/<int:deck_id>", methods=["DELETE"])
@jwt_required()
def delete_deck(deck_id):
    user_id = get_jwt_identity()
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first()
    if deck is None:
        return jsonify({"error": "Deck not found"}), 404

    db.session.delete(deck)
    db.session.commit()
    return jsonify({"message": "Deck deleted"}), 200


# ---------- Cards within a deck ----------


@flashcards_bp.route("/decks/<int:deck_id>/cards", methods=["GET"])
@jwt_required()
def list_cards(deck_id):
    user_id = get_jwt_identity()
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first()
    if deck is None:
        return jsonify({"error": "Deck not found"}), 404

    cards = Flashcard.query.filter_by(deck_id=deck_id).all()
    return jsonify([c.to_dict() for c in cards]), 200


@flashcards_bp.route("/decks/<int:deck_id>/cards", methods=["POST"])
@jwt_required()
def create_card(deck_id):
    user_id = get_jwt_identity()
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first()
    if deck is None:
        return jsonify({"error": "Deck not found"}), 404

    data = request.get_json(silent=True) or {}
    if not data.get("front") or not data.get("back"):
        return jsonify({"error": "front and back are required"}), 400

    card = Flashcard(deck_id=deck_id, front=data["front"], back=data["back"])
    db.session.add(card)
    db.session.commit()
    return jsonify(card.to_dict()), 201


# ---------- Individual cards ----------


@flashcards_bp.route("/cards/due", methods=["GET"])
@jwt_required()
def due_cards():
    user_id = get_jwt_identity()
    deck_id = request.args.get("deck_id", type=int)
    cards = srs_service.get_due_cards(user_id, deck_id=deck_id)
    return jsonify([c.to_dict() for c in cards]), 200


@flashcards_bp.route("/cards/<int:card_id>", methods=["GET"])
@jwt_required()
def get_card(card_id):
    user_id = get_jwt_identity()
    card = Flashcard.query.filter_by(id=card_id).first()
    if card is None or card.deck.user_id != user_id:
        return jsonify({"error": "Card not found"}), 404
    return jsonify(card.to_dict()), 200


@flashcards_bp.route("/cards/<int:card_id>", methods=["PUT"])
@jwt_required()
def update_card(card_id):
    user_id = get_jwt_identity()
    card = Flashcard.query.filter_by(id=card_id).first()
    if card is None or card.deck.user_id != user_id:
        return jsonify({"error": "Card not found"}), 404

    data = request.get_json(silent=True) or {}
    for field in ("front", "back"):
        if field in data:
            setattr(card, field, data[field])

    db.session.commit()
    return jsonify(card.to_dict()), 200


@flashcards_bp.route("/cards/<int:card_id>", methods=["DELETE"])
@jwt_required()
def delete_card(card_id):
    user_id = get_jwt_identity()
    card = Flashcard.query.filter_by(id=card_id).first()
    if card is None or card.deck.user_id != user_id:
        return jsonify({"error": "Card not found"}), 404

    db.session.delete(card)
    db.session.commit()
    return jsonify({"message": "Card deleted"}), 200


@flashcards_bp.route("/cards/<int:card_id>/review", methods=["POST"])
@jwt_required()
def review_card(card_id):
    user_id = get_jwt_identity()
    card = Flashcard.query.filter_by(id=card_id).first()
    if card is None or card.deck.user_id != user_id:
        return jsonify({"error": "Card not found"}), 404

    data = request.get_json(silent=True) or {}
    quality = data.get("quality")
    if quality is None:
        return jsonify({"error": "quality (0-5) is required"}), 400

    try:
        quality = int(quality)
        srs_service.update_card(card, quality)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    db.session.commit()
    return jsonify(card.to_dict()), 200
