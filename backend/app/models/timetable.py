from app.extensions import db

class Timetable(db.Model):
    __tablename__ = 'timetables'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), unique=True, nullable=False, index=True)
    data = db.Column(db.Text, nullable=False, default='{}')