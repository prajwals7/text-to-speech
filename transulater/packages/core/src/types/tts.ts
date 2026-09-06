export type TTSProvider = 'elevenlabs' | 'browser';

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  provider: TTSProvider;
  gender?: 'male' | 'female' | 'neutral';
  previewUrl?: string;
}

export interface TTSConfig {
  provider: TTSProvider;
  voiceId?: string;
  speed?: number;       // 0.5 to 2.0
  pitch?: number;       // 0.5 to 2.0
  stability?: number;   // 0.0 to 1.0 (ElevenLabs)
  similarityBoost?: number; // 0.0 to 1.0 (ElevenLabs)
  endpointUrl?: string; // For backend ElevenLabs proxy
  apiKey?: string;
}

export interface TTSResult {
  audioBlob?: Blob;
  audioUrl?: string;
  duration?: number;
}
