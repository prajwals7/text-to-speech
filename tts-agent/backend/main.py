"""
FastAPI Backend Application for TTS Agent.
Provides endpoints for audio synthesis (/api/tts), voice listings (/api/voices),
health check (/api/health), and serves the frontend web interface.
"""

import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.normalizer import normalize_text
from backend.providers import EdgeTTSProvider, TTSProvider

# Initialize application and active provider
app = FastAPI(
    title="TTS Agent API",
    description="High Quality Deep Voice Text-to-Speech API with Edge-TTS and Prosody Tuning",
    version="1.0.0",
)

# Enable CORS for frontend integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def handle_vercel_rewrites(request: Request, call_next):
    """
    Normalizes request paths when running behind Vercel serverless rewrites.
    """
    path_param = request.query_params.get("path")
    if path_param:
        clean = path_param if path_param.startswith("/") else f"/{path_param}"
        request.scope["path"] = f"/api{clean}" if not clean.startswith("/api") else clean
    elif request.headers.get("x-matched-path"):
        request.scope["path"] = request.headers["x-matched-path"]
    return await call_next(request)

# Active TTS Provider instance
provider: TTSProvider = EdgeTTSProvider()

# Request & Response schemas
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to synthesize into speech")
    voice: Optional[str] = Field(None, description="Voice ID to use (defaults to en-US-GuyNeural)")
    rate: Optional[str] = Field(None, description="SSML rate parameter, e.g. -5%, +0%, +10%")
    pitch: Optional[str] = Field(None, description="SSML pitch parameter, e.g. -5Hz, +0Hz, +5Hz")


class NormalizeRequest(BaseModel):
    text: str = Field(..., description="Raw text to normalize")


@app.get("/api/health")
@app.get("/health")
async def health_check():
    """Health check and provider info."""
    return {
        "status": "ok",
        "provider": provider.provider_name,
        "default_voice": provider.default_voice,
        "default_rate": provider.default_rate,
        "default_pitch": provider.default_pitch,
    }


@app.get("/api/voices")
@app.get("/voices")
async def list_voices():
    """Returns curated shortlist of high quality voices."""
    voices = provider.get_voices()
    return {
        "voices": [v.model_dump() for v in voices],
        "default_voice": provider.default_voice,
        "default_rate": provider.default_rate,
        "default_pitch": provider.default_pitch,
    }


@app.post("/api/normalize")
@app.post("/normalize")
async def normalize_endpoint(req: NormalizeRequest):
    """Utility endpoint to preview text normalization."""
    normalized = normalize_text(req.text)
    return {"original": req.text, "normalized": normalized}


@app.post("/api/tts")
@app.post("/tts")
async def synthesize_speech(req: TTSRequest):
    """
    Synthesizes speech from text.
    1. Normalizes text (expands abbreviations, cleans whitespace, completes punctuation).
    2. Invokes TTS Provider with prosody tuning.
    3. Returns audio/mpeg binary stream.
    """
    raw_text = req.text.strip()
    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty or whitespace only.",
        )

    # Clean and normalize text for natural pauses and clear pronunciation
    normalized_text = normalize_text(raw_text)
    if not normalized_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Normalized text is empty.",
        )

    voice = req.voice or provider.default_voice
    rate = req.rate or provider.default_rate
    pitch = req.pitch or provider.default_pitch

    try:
        audio_bytes = await provider.synthesize(
            text=normalized_text,
            voice=voice,
            rate=rate,
            pitch=pitch,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech synthesis failed: {str(e)}",
        )

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="speech.mp3"',
            "X-Voice-Used": voice,
            "X-Normalized-Length": str(len(normalized_text)),
            "Cache-Control": "no-cache",
        },
    )


# Serve Frontend UI (only when running locally, Vercel edge serves public/)
if not os.environ.get("VERCEL"):
    FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
    if FRONTEND_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
        app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


