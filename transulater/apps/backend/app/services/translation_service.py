import json
import re
from typing import Dict, Any
from anthropic import AsyncAnthropic
from app.config import settings

SAMPLE_TRANSLATIONS = {
    ("en", "es"): {"hello": "hola", "how are you": "¿cómo estás?", "good morning": "buenos días", "thank you": "gracias"},
    ("en", "fr"): {"hello": "bonjour", "how are you": "comment allez-vous?", "good morning": "bonjour", "thank you": "merci"},
    ("en", "de"): {"hello": "hallo", "how are you": "wie geht es dir?", "good morning": "guten morgen", "thank you": "danke"},
    ("en", "ja"): {"hello": "こんにちは", "how are you": "お元気ですか？", "good morning": "おはようございます", "thank you": "ありがとう"},
    ("en", "hi"): {"hello": "नमस्ते", "how are you": "आप कैसे हैं?", "good morning": "शुभ प्रभात", "thank you": "धन्यवाद"},
}

class TranslationService:
    def __init__(self):
        self.api_key = settings.anthropic_api_key
        self.client = AsyncAnthropic(api_key=self.api_key) if self.api_key else None

    async def translate(
        self,
        text: str,
        source_lang: str = "auto",
        target_lang: str = "es",
    ) -> Dict[str, Any]:
        if not text.strip():
            return {
                "original_text": "",
                "translated_text": "",
                "source_lang": source_lang,
                "target_lang": target_lang,
                "detected_source_lang": source_lang,
                "confidence": 1.0,
            }

        # If Anthropic Claude is available, use Claude for high-quality translation
        if self.client and self.api_key:
            try:
                system_prompt = (
                    "You are an expert multilingual translator. "
                    "Translate the provided text faithfully into the target language. "
                    "Detect the source language if set to 'auto'. "
                    "Respond ONLY with a valid JSON object in this format:\n"
                    "{\"translated_text\": \"...\", \"detected_source_lang\": \"<ISO code>\", \"confidence\": 0.99}\n"
                    "Do not include markdown or extra explanations."
                )

                user_prompt = f"Target Language: {target_lang}\nSource Language: {source_lang}\nText to translate:\n{text}"

                response = await self.client.messages.create(
                    model=settings.anthropic_model,
                    max_tokens=1000,
                    temperature=0.2,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}],
                )

                content = response.content[0].text.strip()
                # Parse json from response
                match = re.search(r"\{.*\}", content, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    return {
                        "original_text": text,
                        "translated_text": parsed.get("translated_text", text),
                        "source_lang": source_lang,
                        "target_lang": target_lang,
                        "detected_source_lang": parsed.get("detected_source_lang", "en"),
                        "confidence": parsed.get("confidence", 0.99),
                    }
            except Exception as e:
                print(f"[Translation Exception via Claude]: {e}")

        # Fallback offline dictionary / phrase translation
        cleaned = text.lower().strip()
        pair = (source_lang if source_lang != "auto" else "en", target_lang)
        translated = None

        if pair in SAMPLE_TRANSLATIONS and cleaned in SAMPLE_TRANSLATIONS[pair]:
            translated = SAMPLE_TRANSLATIONS[pair][cleaned]
        else:
            # Universal fallback representation
            translated = f"[{target_lang.upper()}]: {text}"

        return {
            "original_text": text,
            "translated_text": translated,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "detected_source_lang": "en" if source_lang == "auto" else source_lang,
            "confidence": 0.9,
        }

translation_service = TranslationService()
