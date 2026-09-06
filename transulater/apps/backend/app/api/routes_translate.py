from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.translation_service import translation_service

router = APIRouter(prefix="/api/translate", tags=["Translation"])

class TranslateRequest(BaseModel):
    text: str
    source_lang: Optional[str] = "auto"
    target_lang: Optional[str] = "es"

@router.post("")
async def translate_text(request: TranslateRequest):
    try:
        result = await translation_service.translate(
            text=request.text,
            source_lang=request.source_lang or "auto",
            target_lang=request.target_lang or "es",
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")
