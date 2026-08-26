"""
Integration tests for FastAPI TTS endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["provider"] == "edge-tts"
    assert data["default_voice"] == "en-US-GuyNeural"
    assert data["default_rate"] == "-5%"
    assert data["default_pitch"] == "-5Hz"


def test_voices_endpoint():
    response = client.get("/api/voices")
    assert response.status_code == 200
    data = response.json()
    assert "voices" in data
    assert len(data["voices"]) >= 5
    # First voice must be the default deep clear voice
    assert data["voices"][0]["id"] == "en-US-GuyNeural"
    assert data["voices"][0]["is_default"] is True
    assert data["default_voice"] == "en-US-GuyNeural"


def test_normalize_endpoint():
    response = client.post("/api/normalize", json={"text": "e.g. Dr. John w/ approx. 20% savings"})
    assert response.status_code == 200
    data = response.json()
    assert "for example" in data["normalized"]
    assert "Doctor John with approximately 20 percent savings." in data["normalized"]


def test_tts_endpoint_empty_text():
    response = client.post("/api/tts", json={"text": "   "})
    assert response.status_code == 400


def test_tts_endpoint_synthesis():
    response = client.post(
        "/api/tts",
        json={
            "text": "Welcome to the deep voice text to speech experience.",
            "voice": "en-US-GuyNeural",
            "rate": "-5%",
            "pitch": "-5Hz",
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert len(response.content) > 1000  # Valid MP3 audio bytes returned
