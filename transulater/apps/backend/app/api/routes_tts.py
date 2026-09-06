from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
from app.services.elevenlabs_service import elevenlabs_service

router = APIRouter(prefix="/api/tts", tags=["Text-to-Speech"])

class SynthesizeRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    stability: Optional[float] = 0.75
    similarity_boost: Optional[float] = 0.75
    speed: Optional[float] = 1.0

@router.post("/synthesize")
async def synthesize_speech(request: SynthesizeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    audio_bytes = await elevenlabs_service.synthesize(
        text=request.text,
        voice_id=request.voice_id,
        stability=request.stability or 0.75,
        similarity_boost=request.similarity_boost or 0.75,
    )

    if audio_bytes is None:
        raise HTTPException(
            status_code=503,
            detail="ElevenLabs TTS is unavailable or ELEVENLABS_API_KEY is not configured.",
        )

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=speech.mp3"},
    )
