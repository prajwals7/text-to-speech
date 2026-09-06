export type STTProvider = 'whisper' | 'deepgram' | 'browser';

export interface STTConfig {
  provider: STTProvider;
  language?: string; // ISO 639-1 code or 'auto'
  continuous?: boolean;
  interimResults?: boolean;
  endpointUrl?: string; // For backend Whisper proxy
  apiKey?: string;      // Deepgram or direct key
}

export interface STTResult {
  text: string;
  isFinal: boolean;
  detectedLanguage?: string;
  confidence?: number;
  duration?: number;
}
