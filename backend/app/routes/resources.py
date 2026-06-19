import logging
import os
import threading
import uuid

from flask import Blueprint, current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.resource import Resource

logger = logging.getLogger(__name__)

resources_bp = Blueprint('resources', __name__)

ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
}

# PDFs + images benefit from Anthropic Files API (Claude reads them natively)
FILES_API_MIME_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def _resource_dict(r):
    return {
        'id': r.id,
        'original_name': r.original_name,
        'mime_type': r.mime_type,
        'file_size': r.file_size,
        'has_text': bool(r.extracted_text),
        'anthropic_file_id': r.anthropic_file_id,
        'entity_type': r.entity_type,
        'entity_id': r.entity_id,
        'created_at': r.created_at.isoformat(),
    }


def _extract_text(file_path: str, mime_type: str, content: bytes):
    """Option B: extract plain text from PDF, Word, or plain-text files."""
    try:
        if mime_type == 'application/pdf':
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                pages = [page.extract_text() or '' for page in pdf.pages]
            return '\n'.join(pages).strip() or None

        if mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            import io
            from docx import Document
            doc = Document(io.BytesIO(content))
            return '\n'.join(p.text for p in doc.paragraphs if p.text).strip() or None

        if mime_type == 'text/plain':
            return content.decode('utf-8', errors='replace').strip() or None

    except Exception as exc:
        logger.warning("Text extraction failed (%s): %s", file_path, exc)

    return None


def _background_upload_to_files_api(resource_id: int, app):
    """Option C: upload the file to Anthropic Files API and cache the file_id."""
    with app.app_context():
        resource = Resource.query.get(resource_id)
        if resource is None or resource.anthropic_file_id:
            return
        api_key = app.config.get('ANTHROPIC_API_KEY', '')
        if not api_key:
            return
        try:
            import anthropic as anthropic_lib
            client = anthropic_lib.Anthropic(api_key=api_key)
            with open(resource.file_path, 'rb') as f:
                response = client.beta.files.upload(
                    file=(resource.original_name, f, resource.mime_type),
                )
            resource.anthropic_file_id = response.id
            db.session.commit()
            logger.info(
                "Files API upload complete: resource=%s file_id=%s",
                resource_id, response.id,
            )
        except Exception as exc:
            logger.warning(
                "Files API background upload failed for resource %s: %s",
                resource_id, exc,
            )


@resources_bp.route('/resources', methods=['POST'])
@jwt_required()
def upload_resource():
    user_id = get_jwt_identity()

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    entity_type = request.form.get('entity_type', '')
    entity_id_str = request.form.get('entity_id', '')

    if entity_type not in ('subject', 'assignment', 'exam'):
        return jsonify({'error': 'entity_type must be subject, assignment, or exam'}), 400
    if not entity_id_str:
        return jsonify({'error': 'entity_id is required'}), 400

    content = file.read()
    if len(content) > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large (max 20 MB)'}), 413

    mime_type = file.content_type or 'application/octet-stream'
    if mime_type not in ALLOWED_MIME_TYPES:
        return jsonify({'error': f'Unsupported file type: {mime_type}'}), 415

    storage_path = current_app.config.get('RESOURCE_STORAGE_PATH', 'resource_storage')
    os.makedirs(storage_path, exist_ok=True)
    ext = os.path.splitext(file.filename or '')[1].lower()
    saved_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(storage_path, saved_name)
    with open(file_path, 'wb') as fh:
        fh.write(content)

    extracted_text = _extract_text(file_path, mime_type, content)

    resource = Resource(
        user_id=user_id,
        entity_type=entity_type,
        entity_id=int(entity_id_str),
        original_name=file.filename or saved_name,
        file_path=file_path,
        mime_type=mime_type,
        file_size=len(content),
        extracted_text=extracted_text,
    )
    db.session.add(resource)
    db.session.commit()

    if mime_type in FILES_API_MIME_TYPES:
        threading.Thread(
            target=_background_upload_to_files_api,
            args=(resource.id, current_app._get_current_object()),
            daemon=True,
        ).start()

    return jsonify(_resource_dict(resource)), 201


@resources_bp.route('/resources', methods=['GET'])
@jwt_required()
def list_resources():
    user_id = get_jwt_identity()
    entity_type = request.args.get('entity_type')
    entity_id = request.args.get('entity_id')

    q = Resource.query.filter_by(user_id=user_id)
    if entity_type:
        q = q.filter_by(entity_type=entity_type)
    if entity_id:
        q = q.filter_by(entity_id=int(entity_id))

    return jsonify([_resource_dict(r) for r in q.order_by(Resource.created_at.desc()).all()]), 200


@resources_bp.route('/resources/<int:resource_id>/file', methods=['GET'])
@jwt_required()
def serve_resource(resource_id):
    user_id = get_jwt_identity()
    resource = Resource.query.filter_by(id=resource_id, user_id=user_id).first_or_404()
    return send_file(
        resource.file_path,
        mimetype=resource.mime_type,
        download_name=resource.original_name,
    )


@resources_bp.route('/resources/<int:resource_id>', methods=['DELETE'])
@jwt_required()
def delete_resource(resource_id):
    user_id = get_jwt_identity()
    resource = Resource.query.filter_by(id=resource_id, user_id=user_id).first_or_404()
    try:
        os.remove(resource.file_path)
    except OSError:
        pass
    db.session.delete(resource)
    db.session.commit()
    return jsonify({'deleted': True}), 200
