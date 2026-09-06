from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.services.whisper_service import whisper_service

router = APIRouter(prefix="/api/stt", tags=["Speech-to-Text"])

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    try:
        content = await audio.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty audio file provided")

        result = await whisper_service.transcribe(
            audio_bytes=content,
            filename=audio.filename or "speech.webm",
            language=language,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
