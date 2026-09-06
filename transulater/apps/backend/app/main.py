from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes_stt import router as stt_router
from app.api.routes_llm import router as llm_router
from app.api.routes_tts import router as tts_router
from app.api.routes_translate import router as translate_router

app = FastAPI(
    title="Multilingual AI Voice Assistant API",
    description="High-performance backend for Speech-to-Text (Whisper), Conversational AI (Claude), Text-to-Speech (ElevenLabs), and Live Translation",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(stt_router)
app.include_router(llm_router)
app.include_router(tts_router)
app.include_router(translate_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Multilingual AI Voice Assistant Backend",
        "version": "1.0.0",
        "features": {
            "anthropic_configured": bool(settings.anthropic_api_key),
            "whisper_configured": bool(settings.openai_api_key),
            "elevenlabs_configured": bool(settings.elevenlabs_api_key),
            "picovoice_configured": bool(settings.picovoice_access_key),
        },
    }

@app.get("/")
async def root():
    return {
        "message": "Multilingual AI Voice Assistant API is running.",
        "docs": "/docs",
        "health": "/api/health",
    }
