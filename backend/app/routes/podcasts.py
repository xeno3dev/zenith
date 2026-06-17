import os
import threading

from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.podcast import Podcast
from app.services import podcast_service

podcasts_bp = Blueprint("podcasts", __name__)


@podcasts_bp.route("/podcasts", methods=["GET"])
@jwt_required()
def list_podcasts():
    user_id = get_jwt_identity()
    podcasts = (
        Podcast.query.filter_by(user_id=user_id)
        .order_by(Podcast.created_at.desc())
        .all()
    )
    return jsonify([p.to_dict() for p in podcasts]), 200


@podcasts_bp.route("/podcasts", methods=["POST"])
@jwt_required()
def create_podcast():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    title = data.get("title")
    source_type = data.get("source_type")
    source_content = data.get("source_content")

    if not title or not source_type or not source_content:
        return jsonify({"error": "title, source_type, and source_content are required"}), 400

    podcast = Podcast(
        user_id=user_id,
        title=title,
        source_type=source_type,
        source_content=source_content,
        status="pending",
    )
    db.session.add(podcast)
    db.session.commit()

    app_instance = current_app._get_current_object()
    threading.Thread(
        target=podcast_service.generate_podcast,
        args=(podcast.id, app_instance),
        daemon=True,
    ).start()

    return jsonify(podcast.to_dict()), 202


@podcasts_bp.route("/podcasts/<int:podcast_id>", methods=["GET"])
@jwt_required()
def get_podcast(podcast_id):
    user_id = get_jwt_identity()
    podcast = Podcast.query.filter_by(id=podcast_id, user_id=user_id).first()
    if podcast is None:
        return jsonify({"error": "Podcast not found"}), 404
    return jsonify(podcast.to_dict()), 200


@podcasts_bp.route("/podcasts/<int:podcast_id>/audio", methods=["GET"])
@jwt_required()
def get_podcast_audio(podcast_id):
    user_id = get_jwt_identity()
    podcast = Podcast.query.filter_by(id=podcast_id, user_id=user_id).first()
    if podcast is None:
        return jsonify({"error": "Podcast not found"}), 404

    if podcast.status != "ready" or not podcast.audio_path or not os.path.exists(podcast.audio_path):
        return jsonify({"error": "Podcast audio is not ready yet"}), 404

    return send_file(podcast.audio_path, mimetype="audio/mpeg")


@podcasts_bp.route("/podcasts/<int:podcast_id>", methods=["DELETE"])
@jwt_required()
def delete_podcast(podcast_id):
    user_id = get_jwt_identity()
    podcast = Podcast.query.filter_by(id=podcast_id, user_id=user_id).first()
    if podcast is None:
        return jsonify({"error": "Podcast not found"}), 404

    if podcast.audio_path and os.path.exists(podcast.audio_path):
        try:
            os.remove(podcast.audio_path)
        except OSError:
            current_app.logger.warning(
                "Could not remove audio file at %s", podcast.audio_path
            )

    db.session.delete(podcast)
    db.session.commit()
    return jsonify({"message": "Podcast deleted"}), 200
