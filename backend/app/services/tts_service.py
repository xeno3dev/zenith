"""
Text-to-speech abstraction layer. Dispatches to either a self-hosted Kokoro
TTS server or the ElevenLabs API, based on app config TTS_PROVIDER.

Voice mapping:
  Ari (analytical host, male-leaning voice)   -> kokoro: "am_adam"
  Sol (curious host, female-leaning voice)    -> kokoro: "af_sky"

For ElevenLabs, voice IDs are read from environment variables
ELEVENLABS_VOICE_ARI / ELEVENLABS_VOICE_SOL (with fallback placeholder IDs);
set these in your .env to real ElevenLabs voice IDs for production use.

Kokoro API: uses the OpenAI-compatible /v1/audio/speech endpoint.
  POST /v1/audio/speech  {"model": "kokoro", "input": ..., "voice": ...,
                          "response_format": "mp3", "speed": 1.0, "stream": false}
"""
import logging
import os

import requests
from flask import current_app

logger = logging.getLogger(__name__)

KOKORO_VOICE_MAP = {
    "Ari": "am_adam",
    "Sol": "af_sky",
}

# Fallback voice IDs are placeholders — override via env vars in production.
ELEVENLABS_VOICE_MAP = {
    "Ari": os.environ.get("ELEVENLABS_VOICE_ARI", "21m00Tcm4TlvDq8ikWAM"),
    "Sol": os.environ.get("ELEVENLABS_VOICE_SOL", "EXAVITQu4vr4xnSDxMaL"),
}


def _synthesize_kokoro(text: str, speaker: str) -> bytes:
    """
    POST to a self-hosted Kokoro-FastAPI server using the OpenAI-compatible
    /v1/audio/speech endpoint.
    Body: {"model": "kokoro", "input": <text>, "voice": <voice>,
           "response_format": "mp3", "speed": 1.0, "stream": false}
    Response: raw MP3 bytes.
    """
    kokoro_url = current_app.config.get("KOKORO_URL", "http://localhost:8880")
    voice = KOKORO_VOICE_MAP.get(speaker, "am_adam")
    endpoint = f"{kokoro_url}/v1/audio/speech"

    logger.debug("TTS kokoro: speaker=%s voice=%s text_len=%d url=%s",
                 speaker, voice, len(text), endpoint)

    response = requests.post(
        endpoint,
        json={
            "model": "kokoro",
            "input": text,
            "voice": voice,
            "response_format": "mp3",
            "speed": 1.0,
            "stream": False,
        },
        timeout=120,
    )

    if not response.ok:
        logger.error("Kokoro TTS error %s: %s", response.status_code, response.text[:500])
    response.raise_for_status()

    logger.debug("TTS kokoro: received %d bytes", len(response.content))
    return response.content


def _synthesize_elevenlabs(text: str, speaker: str) -> bytes:
    """
    POST to ElevenLabs text-to-speech endpoint for the given speaker's voice.
    """
    api_key = current_app.config.get("ELEVENLABS_API_KEY", "")
    voice_id = ELEVENLABS_VOICE_MAP.get(speaker, ELEVENLABS_VOICE_MAP["Ari"])

    response = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        },
        json={"text": text, "model_id": "eleven_multilingual_v2"},
        timeout=120,
    )
    response.raise_for_status()
    return response.content


def synthesize(text: str, speaker: str) -> bytes:
    """
    Dispatch to the configured TTS provider and return synthesized audio
    bytes (mp3) for `text` spoken by `speaker` ("Ari" or "Sol").
    """
    provider = current_app.config.get("TTS_PROVIDER", "kokoro")

    if provider == "elevenlabs":
        return _synthesize_elevenlabs(text, speaker)
    return _synthesize_kokoro(text, speaker)
