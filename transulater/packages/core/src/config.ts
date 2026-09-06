import {
  SupportedLanguage,
  WakeWordConfig,
  STTConfig,
  TTSConfig,
  LLMConfig,
  TTSVoice,
} from './types';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'auto', name: 'Auto Detect', nativeName: 'Auto Detect', flag: '🌐' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRtl: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
];

export const DEFAULT_PRESET_VOICES: TTSVoice[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Calm & Natural)', language: 'en', provider: 'elevenlabs', gender: 'female' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Empathetic)', language: 'en', provider: 'elevenlabs', gender: 'female' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Warm & Expressive)', language: 'en', provider: 'elevenlabs', gender: 'female' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Smooth & Confident)', language: 'en', provider: 'elevenlabs', gender: 'male' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Crisp & Articulate)', language: 'en', provider: 'elevenlabs', gender: 'male' },
  { id: 'browser-default', name: 'System Default Voice', language: 'auto', provider: 'browser', gender: 'neutral' },
];

export interface VoiceAssistantConfig {
  backendBaseUrl: string;
  wakeWord: WakeWordConfig;
  stt: STTConfig;
  tts: TTSConfig;
  llm: LLMConfig;
  defaultSourceLang: string;
  defaultTargetLang: string;
  silenceTimeoutMs: number;
  autoSpeakResponse: boolean;
}

export const DEFAULT_ASSISTANT_CONFIG: VoiceAssistantConfig = {
  backendBaseUrl: 'http://localhost:8000',
  wakeWord: {
    enabled: true,
    engine: 'web_keyword',
    keyword: 'Hey Assistant',
    sensitivity: 0.7,
  },
  stt: {
    provider: 'whisper',
    language: 'auto',
    continuous: false,
    interimResults: true,
    endpointUrl: 'http://localhost:8000/api/stt/transcribe',
  },
  tts: {
    provider: 'elevenlabs',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    speed: 1.0,
    pitch: 1.0,
    stability: 0.75,
    similarityBoost: 0.75,
    endpointUrl: 'http://localhost:8000/api/tts/synthesize',
  },
  llm: {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 1024,
    systemPrompt: `You are an intelligent, empathetic, and responsive multilingual voice AI assistant. 
Your responses are spoken aloud to the user, so keep them concise, conversational, engaging, and direct. 
Avoid lengthy markdown lists, symbols, or code blocks unless explicitly requested.
If the user speaks or queries in a specific language, respond fluently in that exact language.`,
    endpointUrl: 'http://localhost:8000/api/llm/chat/stream',
  },
  defaultSourceLang: 'auto',
  defaultTargetLang: 'es',
  silenceTimeoutMs: 1800,
  autoSpeakResponse: true,
};
