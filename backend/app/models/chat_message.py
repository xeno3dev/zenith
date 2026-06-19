from datetime import datetime
from app.extensions import db


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(
        db.Integer, db.ForeignKey('chat_sessions.id'), nullable=False, index=True
    )
    role = db.Column(db.String(16), nullable=False)   # user | assistant
    content_json = db.Column(db.Text, nullable=False)  # JSON-encoded str or list
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
