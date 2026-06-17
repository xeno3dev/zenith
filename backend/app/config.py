"""
Class-based configuration for Scholara backend.

Reads from environment variables (loaded via python-dotenv in app/__init__.py
or by the shell/Docker environment in production).
"""
import os


def _parse_cors_origins(frontend_url: str) -> list:
    """Parse CORS_ORIGINS env var (comma-separated) or fall back to FRONTEND_URL."""
    raw = os.environ.get("CORS_ORIGINS")
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [frontend_url] if frontend_url else ["*"]


class Config:
    """Base configuration shared by all environments."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///scholara.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    # JWT
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    JWT_REFRESH_TOKEN_EXPIRES = int(
        os.environ.get("JWT_REFRESH_TOKEN_EXPIRES", 2592000)
    )

    # AI / Anthropic
    ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

    # Text-to-speech
    TTS_PROVIDER = os.environ.get("TTS_PROVIDER", "kokoro")  # kokoro | elevenlabs
    KOKORO_URL = os.environ.get("KOKORO_URL", "http://localhost:8880")
    ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")

    # Audio storage
    AUDIO_STORAGE_PATH = os.environ.get(
        "AUDIO_STORAGE_PATH", os.path.join(os.getcwd(), "audio_storage")
    )

    # Frontend / CORS
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    CORS_ORIGINS = _parse_cors_origins(FRONTEND_URL)

    DEBUG = False
    TESTING = False


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False

    @classmethod
    def validate(cls):
        """Optional helper to assert required secrets are set in prod."""
        required = ["JWT_SECRET_KEY", "SECRET_KEY", "DATABASE_URL"]
        missing = [name for name in required if not os.environ.get(name)]
        if missing:
            raise RuntimeError(
                f"Missing required production environment variables: {missing}"
            )


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
