"""
Vercel Serverless Function Entrypoint for FastAPI backend.
"""

import sys
from pathlib import Path

# Ensure root and tts-agent paths are available for imports
ROOT_DIR = Path(__file__).resolve().parent.parent
TTS_AGENT_DIR = ROOT_DIR / "tts-agent"

for p in (str(ROOT_DIR), str(TTS_AGENT_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.main import app
