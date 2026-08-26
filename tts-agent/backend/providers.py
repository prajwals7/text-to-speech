"""
TTS Provider abstraction and Edge-TTS implementation.
Supports pluggable providers (e.g. EdgeTTSProvider, OpenAITTSProvider, ElevenLabsTTSProvider).
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
import edge_tts


class VoiceInfo(BaseModel):
    id: str = Field(..., description="Unique voice identifier")
    name: str = Field(..., description="Human-friendly voice name")
    locale: str = Field(..., description="Language and region code, e.g. en-US")
    gender: str = Field(..., description="Male or Female")
    tag: str = Field(..., description="Short personality/tone descriptor")
    description: str = Field(..., description="Detailed voice description")
    is_default: bool = Field(default=False, description="Whether this voice is the default")


class TTSProvider(ABC):
    """Abstract Base Class for Text-to-Speech Providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the TTS provider."""
        pass

    @property
    @abstractmethod
    def default_voice(self) -> str:
        """Default voice ID."""
        pass

    @property
    @abstractmethod
    def default_rate(self) -> str:
        """Default speech rate."""
        pass

    @property
    @abstractmethod
    def default_pitch(self) -> str:
        """Default speech pitch."""
        pass

    @abstractmethod
    def get_voices(self) -> List[VoiceInfo]:
        """Returns the curated list of available voices."""
        pass

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
        pitch: Optional[str] = None,
    ) -> bytes:
        """
        Synthesizes text into audio bytes (audio/mpeg).
        """
        pass


class EdgeTTSProvider(TTSProvider):
    """
    Microsoft Edge TTS Provider with curated high-quality voices
    and tuned prosody for deep, warm, natural clarity.
    """

    DEFAULT_VOICE = "en-US-GuyNeural"
    DEFAULT_RATE = "-5%"    # Slightly slower for unhurried clarity
    DEFAULT_PITCH = "-5Hz"  # Slightly lower pitch for deep, warm presence

    # Curated high-quality shortlist: deep/warm male voices first, followed by clear female voices
    CURATED_VOICES: List[VoiceInfo] = [
        VoiceInfo(
            id="en-US-GuyNeural",
            name="Guy (US)",
            locale="en-US",
            gender="Male",
            tag="Deep & Clear",
            description="Warm, clear, and resonant baritone. Perfect for narrations and explainers.",
            is_default=True,
        ),
        VoiceInfo(
            id="en-GB-RyanNeural",
            name="Ryan (UK)",
            locale="en-GB",
            gender="Male",
            tag="Warm & Resonant",
            description="Deep British accent with sophisticated and calm pacing.",
            is_default=False,
        ),
        VoiceInfo(
            id="en-US-ChristopherNeural",
            name="Christopher (US)",
            locale="en-US",
            gender="Male",
            tag="Smooth & Authoritative",
            description="Confident, broadcast-quality male voice with great gravitas.",
            is_default=False,
        ),
        VoiceInfo(
            id="en-GB-ThomasNeural",
            name="Thomas (UK)",
            locale="en-GB",
            gender="Male",
            tag="Rich & Distinguished",
            description="Classic British tone with rich acoustic depth and elegance.",
            is_default=False,
        ),
        VoiceInfo(
            id="en-US-JennyNeural",
            name="Jenny (US)",
            locale="en-US",
            gender="Female",
            tag="Natural & Friendly",
            description="Clear, engaging, and articulate American female voice.",
            is_default=False,
        ),
        VoiceInfo(
            id="en-US-AriaNeural",
            name="Aria (US)",
            locale="en-US",
            gender="Female",
            tag="Expressive & Polished",
            description="Crisp, versatile voice ideal for storytelling and audiobooks.",
            is_default=False,
        ),
        VoiceInfo(
            id="en-GB-SoniaNeural",
            name="Sonia (UK)",
            locale="en-GB",
            gender="Female",
            tag="Calm & Articulate",
            description="Poised and melodic British female voice for tutorials and presentations.",
            is_default=False,
        ),
    ]

    @property
    def provider_name(self) -> str:
        return "edge-tts"

    @property
    def default_voice(self) -> str:
        return self.DEFAULT_VOICE

    @property
    def default_rate(self) -> str:
        return self.DEFAULT_RATE

    @property
    def default_pitch(self) -> str:
        return self.DEFAULT_PITCH

    def get_voices(self) -> List[VoiceInfo]:
        return self.CURATED_VOICES

    def _normalize_prosody_param(self, value: Optional[str], default: str, unit: str = "%") -> str:
        """Sanitizes and formats rate/pitch values (e.g. '+0%', '-5%', '+2Hz', '-5Hz')."""
        if not value:
            return default
        val = str(value).strip()
        if not val:
            return default
        # If user passed number like -5, attach unit
        if re_match := None:
            pass
        if val.lstrip("+-").isdigit():
            if not val.startswith("+") and not val.startswith("-"):
                val = f"+{val}"
            val = f"{val}{unit}"
        return val

    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
        pitch: Optional[str] = None,
    ) -> bytes:
        """
        Synthesizes normalized text using edge-tts with prosody tuning.
        """
        selected_voice = voice if voice and voice.strip() else self.DEFAULT_VOICE
        selected_rate = rate if rate and rate.strip() else self.DEFAULT_RATE
        selected_pitch = pitch if pitch and pitch.strip() else self.DEFAULT_PITCH

        # Stream audio chunks directly in memory
        communicate = edge_tts.Communicate(
            text=text,
            voice=selected_voice,
            rate=selected_rate,
            pitch=selected_pitch,
        )

        audio_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.extend(chunk["data"])

        if not audio_buffer:
            raise RuntimeError("TTS synthesis produced empty audio stream.")

        return bytes(audio_buffer)


class OpenAITTSProvider(TTSProvider):
    """Placeholder stub for OpenAI TTS provider extension."""

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def default_voice(self) -> str:
        return "onyx"

    @property
    def default_rate(self) -> str:
        return "+0%"

    @property
    def default_pitch(self) -> str:
        return "+0Hz"

    def get_voices(self) -> List[VoiceInfo]:
        return [
            VoiceInfo(id="onyx", name="Onyx", locale="en-US", gender="Male", tag="Deep & Resonant", description="Deep, authoritative tone", is_default=True),
            VoiceInfo(id="alloy", name="Alloy", locale="en-US", gender="Neutral", tag="Balanced & Clear", description="Versatile neutral voice", is_default=False),
            VoiceInfo(id="echo", name="Echo", locale="en-US", gender="Male", tag="Warm & Soft", description="Warm conversational voice", is_default=False),
            VoiceInfo(id="nova", name="Nova", locale="en-US", gender="Female", tag="Energetic & Bright", description="Dynamic female voice", is_default=False),
        ]

    async def synthesize(self, text: str, voice: Optional[str] = None, rate: Optional[str] = None, pitch: Optional[str] = None) -> bytes:
        raise NotImplementedError("OpenAI TTS provider requires OPENAI_API_KEY configuration.")


class ElevenLabsTTSProvider(TTSProvider):
    """Placeholder stub for ElevenLabs TTS provider extension."""

    @property
    def provider_name(self) -> str:
        return "elevenlabs"

    @property
    def default_voice(self) -> str:
        return "adam"

    @property
    def default_rate(self) -> str:
        return "+0%"

    @property
    def default_pitch(self) -> str:
        return "+0Hz"

    def get_voices(self) -> List[VoiceInfo]:
        return [
            VoiceInfo(id="adam", name="Adam", locale="en-US", gender="Male", tag="Deep & Grounded", description="Deep American male voice", is_default=True),
            VoiceInfo(id="antoni", name="Antoni", locale="en-US", gender="Male", tag="Warm & Narrative", description="Friendly storytelling tone", is_default=False),
            VoiceInfo(id="rachel", name="Rachel", locale="en-US", gender="Female", tag="Calm & Natural", description="Calm clear female voice", is_default=False),
        ]

    async def synthesize(self, text: str, voice: Optional[str] = None, rate: Optional[str] = None, pitch: Optional[str] = None) -> bytes:
        raise NotImplementedError("ElevenLabs TTS provider requires ELEVENLABS_API_KEY configuration.")
