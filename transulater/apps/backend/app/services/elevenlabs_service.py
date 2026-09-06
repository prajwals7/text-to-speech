import httpx
from typing import Optional
from app.config import settings

class ElevenLabsService:
    def __init__(self):
        self.api_key = settings.elevenlabs_api_key

    async def synthesize(
        self,
        text: str,
        voice_id: Optional[str] = None,
        stability: float = 0.75,
        similarity_boost: float = 0.75,
    ) -> Optional[bytes]:
        if not self.api_key:
            return None

        target_voice_id = voice_id or settings.elevenlabs_voice_id or "21m00Tcm4TlvDq8ikWAM"
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{target_voice_id}"

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key,
        }

        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost,
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)

        if response.status_code == 200:
            return response.content
        else:
            print(f"[ElevenLabs Error] HTTP {response.status_code}: {response.text}")
            return None

elevenlabs_service = ElevenLabsService()
