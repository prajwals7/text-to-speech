import asyncio
import io
import sys
import os

# Ensure backend directory in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def test_api():
    client = TestClient(app)

    print("\n=== 1. Testing GET /api/health ===")
    res = client.get("/api/health")
    print(f"Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    print("\n=== 2. Testing POST /api/translate ===")
    res = client.post("/api/translate", json={
        "text": "Hello",
        "source_lang": "en",
        "target_lang": "es"
    })
    print(f"Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 200
    assert "translated_text" in res.json()

    print("\n=== 3. Testing POST /api/stt/transcribe ===")
    dummy_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    res = client.post(
        "/api/stt/transcribe",
        files={"audio": ("test.wav", dummy_audio, "audio/wav")},
        data={"language": "en"}
    )
    print(f"Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 200
    assert "text" in res.json()

    print("\n=== 4. Testing POST /api/llm/chat/stream ===")
    res = client.post("/api/llm/chat/stream", json={
        "messages": [{"role": "user", "content": "Tell me a short greeting"}],
        "temperature": 0.7
    })
    print(f"Status: {res.status_code}, Stream content snippet: {res.text[:120]}...")
    assert res.status_code == 200
    assert "data: " in res.text

    print("\n=== ALL FASTAPI BACKEND TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_api()
