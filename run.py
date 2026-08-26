"""
Root launcher for TTS Agent Studio.
Launches the FastAPI backend on http://127.0.0.1:8000
"""

import os
import sys
from pathlib import Path

# Add tts-agent to Python path
tts_dir = Path(__file__).resolve().parent / "tts-agent"
if str(tts_dir) not in sys.path:
    sys.path.insert(0, str(tts_dir))

import uvicorn

if __name__ == "__main__":
    port = 8000
    host = "127.0.0.1"
    print(f"\n=======================================================")
    print(f"  Starting AuraVoice Studio on http://{host}:{port}")
    print(f"=======================================================\n")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True, app_dir=str(tts_dir))
