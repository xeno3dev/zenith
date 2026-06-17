"""
Text-to-speech abstraction layer. Dispatches to either a self-hosted Kokoro
TTS server or the ElevenLabs API, based on app config TTS_PROVIDER.

Voice mapping:
  Ari (analytical host, male-leaning voice)   -> kokoro: "am_adam"
  Sol (curious host, female-leaning voice)    -> kokoro: "af_sky"

For ElevenLabs, voice IDs are read from environment variables
ELEVENLABS_VOICE_ARI / ELEVENLABS_VOICE_SOL (with fallback placeholder IDs);
set these in your .env to real ElevenLabs voice IDs for production use.
"""
import os

import requests
from flask import current_app

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
    POST to a self-hosted Kokoro-FastAPI style server at {KOKORO_URL}/tts.
    Expected request body: {"text": ..., "voice": ..., "speed": 1.0}
    Expected response: raw audio bytes (mp3) in the response body.
    """
    kokoro_url = current_app.config.get("KOKORO_URL", "http://localhost:8880")
    voice = KOKORO_VOICE_MAP.get(speaker, "am_adam")

    response = requests.post(
        f"{kokoro_url}/tts",
        json={"text": text, "voice": voice, "speed": 1.0},
        timeout=120,
    )
    response.raise_for_status()
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
