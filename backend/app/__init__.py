from dotenv import load_dotenv
from flask import Flask, jsonify

from app.config import config_by_name
from app.extensions import db, migrate, jwt, cors

load_dotenv()


def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # Ensure models are imported so Flask-Migrate can detect them
    with app.app_context():
        from app import models  # noqa: F401

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.subjects import subjects_bp
    from app.routes.assignments import assignments_bp
    from app.routes.exams import exams_bp
    from app.routes.flashcards import flashcards_bp
    from app.routes.grades import grades_bp
    # from app.routes.ai import ai_bp  # Phase 3
    # from app.routes.podcasts import podcasts_bp  # Phase 4

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(subjects_bp, url_prefix="/api")
    app.register_blueprint(assignments_bp, url_prefix="/api")
    app.register_blueprint(exams_bp, url_prefix="/api")
    # flashcards_bp defines full paths for both /decks and /cards resources
    app.register_blueprint(flashcards_bp, url_prefix="/api")
    app.register_blueprint(grades_bp, url_prefix="/api")
    # app.register_blueprint(ai_bp, url_prefix="/api/ai")  # Phase 3
    # app.register_blueprint(podcasts_bp, url_prefix="/api")  # Phase 4

    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({"error": getattr(error, 'description', 'Bad request')}), 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        return jsonify({"error": getattr(error, 'description', 'Unauthorized')}), 401

    @app.errorhandler(422)
    def unprocessable_entity_error(error):
        return jsonify({"error": getattr(error, 'description', 'Invalid request')}), 422

    @app.route("/health", methods=["GET"])
    def health():
        db_status = "ok"
        try:
            db.session.execute(db.text("SELECT 1"))
        except Exception as exc:
            db_status = f"error: {exc}"

        return jsonify({"status": "ok", "database": db_status}), 200

    return app
