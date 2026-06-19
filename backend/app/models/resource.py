from datetime import datetime
from app.extensions import db


class Resource(db.Model):
    __tablename__ = 'resources'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.String(36), db.ForeignKey('users.id'), nullable=False, index=True
    )
    entity_type = db.Column(db.String(32), nullable=False)   # subject|assignment|exam
    entity_id = db.Column(db.Integer, nullable=False, index=True)
    original_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    mime_type = db.Column(db.String(128), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    anthropic_file_id = db.Column(db.String(128), nullable=True)  # Files API cache (Option C)
    extracted_text = db.Column(db.Text, nullable=True)             # text extraction (Option B)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
