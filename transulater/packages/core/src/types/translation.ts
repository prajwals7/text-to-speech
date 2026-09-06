export interface SupportedLanguage {
  code: string;       // e.g. 'en', 'es', 'fr', 'de', 'ja', 'hi', 'zh', 'ar'
  name: string;       // e.g. 'Spanish'
  nativeName: string; // e.g. 'Español'
  flag?: string;      // emoji flag
  isRtl?: boolean;
}

export interface TranslationRequest {
  text: string;
  sourceLang: string; // 'auto' or ISO code
  targetLang: string; // ISO code
  mode?: 'assistant' | 'text_to_text' | 'voice_to_voice';
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  detectedSourceLanguage?: string;
  confidence?: number;
}
