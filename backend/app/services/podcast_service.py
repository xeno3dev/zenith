"""
Orchestrates the full study-podcast generation pipeline:
  1. Generate a two-host script via ai_service (Claude).
  2. Synthesize audio for each line via tts_service (Kokoro/ElevenLabs).
  3. Stitch all audio clips together with short pauses via pydub.
  4. Export the final MP3 and update the Podcast row.

Designed to run in a background thread (see app/routes/podcasts.py), hence
the explicit Flask app instance argument and use of app.app_context().
"""
import io
import logging
import os

from pydub import AudioSegment

from app.extensions import db
from app.models.podcast import Podcast
from app.services import ai_service, tts_service

logger = logging.getLogger(__name__)

SILENCE_BETWEEN_TURNS_MS = 300


def generate_podcast(podcast_id, app):
    """
    Run the full pipeline for the Podcast identified by `podcast_id`.
    Must be called with the real Flask app instance since this typically
    runs in a background thread without an active app/request context.
    """
    with app.app_context():
        podcast = Podcast.query.get(podcast_id)
        if podcast is None:
            logger.error("generate_podcast: Podcast %s not found", podcast_id)
            return None

        try:
            podcast.status = "generating"
            db.session.commit()

            # 1. Generate script
            script = ai_service.generate_podcast_script(
                podcast.source_content, podcast.title or "General Study Topic"
            )
            podcast.script = script
            db.session.commit()

            # 2. Synthesize audio per line and stitch together
            combined = AudioSegment.silent(duration=0)
            silence = AudioSegment.silent(duration=SILENCE_BETWEEN_TURNS_MS)

            for line in script:
                speaker = line.get("speaker", "Ari")
                text = line.get("text", "")
                if not text.strip():
                    continue

                audio_bytes = tts_service.synthesize(text, speaker)
                # Assumption: both Kokoro and ElevenLabs are configured to
                # return MP3-encoded audio bytes.
                segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format="mp3")
                combined += segment + silence

            # 3. Export final audio
            storage_path = app.config.get("AUDIO_STORAGE_PATH", "audio_storage")
            os.makedirs(storage_path, exist_ok=True)
            output_path = os.path.join(storage_path, f"{podcast_id}.mp3")
            combined.export(output_path, format="mp3")

            podcast.audio_path = output_path
            podcast.duration_seconds = int(len(combined) / 1000)
            podcast.status = "ready"
            db.session.commit()

        except Exception as exc:
            logger.exception("Podcast generation failed for podcast_id=%s", podcast_id)
            try:
                podcast.status = "failed"
                podcast.error_message = str(exc)
                db.session.commit()
            except Exception:
                logger.exception(
                    "Failed to persist failure status for podcast_id=%s", podcast_id
                )

        return podcast
