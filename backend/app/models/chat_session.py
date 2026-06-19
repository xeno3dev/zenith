from datetime import datetime
from app.extensions import db


class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.String(36), db.ForeignKey('users.id'), nullable=False, index=True
    )
    title = db.Column(db.String(255), nullable=False, default='New conversation')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    messages = db.relationship(
        'ChatMessage',
        backref='session',
        lazy=True,
        cascade='all, delete-orphan',
        order_by='ChatMessage.created_at',
    )
