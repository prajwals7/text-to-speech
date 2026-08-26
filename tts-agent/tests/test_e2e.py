"""
End-to-end tests for TTS Agent:
- Tests all curated voices
- Tests prosody adjustments (rate & pitch)
- Verifies static frontend assets
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_frontend_static_serving():
    """Verify frontend HTML, CSS, and JS are served properly at root and /static."""
    res_index = client.get("/")
    assert res_index.status_code == 200
    assert "AuraVoice" in res_index.text
    assert "waveform-canvas" in res_index.text

    res_css_root = client.get("/style.css")
    assert res_css_root.status_code == 200
    assert "--accent-amber" in res_css_root.text

    res_js_root = client.get("/app.js")
    assert res_js_root.status_code == 200
    assert "handleGenerateAudio" in res_js_root.text

    res_css = client.get("/static/style.css")
    assert res_css.status_code == 200
    assert "--accent-amber" in res_css.text

    res_js = client.get("/static/app.js")
    assert res_js.status_code == 200
    assert "handleGenerateAudio" in res_js.text



def test_all_curated_voices():
    """Verify synthesis works across all curated shortlist voices."""
    voices_res = client.get("/api/voices")
    voices = voices_res.json()["voices"]

    for voice in voices:
        voice_id = voice["id"]
        res = client.post(
            "/api/tts",
            json={
                "text": f"Testing synthesis for voice {voice['name']}.",
                "voice": voice_id,
                "rate": "-5%",
                "pitch": "-5Hz",
            },
        )
        assert res.status_code == 200
        assert res.headers["content-type"] == "audio/mpeg"
        assert len(res.content) > 1000
        # MP3 file header check (Sync word 0xFF 0xFB / 0xFA / ID3 tag 'ID3')
        is_id3 = res.content[:3] == b"ID3"
        is_mp3_sync = res.content[0] == 0xFF and (res.content[1] & 0xE0) == 0xE0
        assert is_id3 or is_mp3_sync, f"Output for {voice_id} is not valid MP3 format"


def test_custom_prosody_bounds():
    """Verify varied prosody rate and pitch parameters."""
    res = client.post(
        "/api/tts",
        json={
            "text": "Testing prosody with custom parameters.",
            "voice": "en-US-GuyNeural",
            "rate": "-10%",
            "pitch": "-10Hz",
        },
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "audio/mpeg"
    assert len(res.content) > 1000
