import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-5-sonnet-20241022"

    # Speech to Text (Whisper / Deepgram)
    openai_api_key: str = ""
    deepgram_api_key: str = ""
    stt_provider: str = "whisper"

    # Text to Speech (ElevenLabs)
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    tts_provider: str = "elevenlabs"

    # Picovoice (Wake Word)
    picovoice_access_key: str = ""

    # Server & Networking
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,*"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = [".env", "../../.env", "../.env"]
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
