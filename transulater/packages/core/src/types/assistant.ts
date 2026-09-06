export type AssistantState =
  | 'idle'
  | 'wake_word_listening'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'translating'
  | 'error';

export type TranslationMode =
  | 'assistant'       // Conversational AI (responds in selected or detected language)
  | 'text_to_text'   // Direct text/speech translation (displayed in chat)
  | 'voice_to_voice'; // Direct speech translation with immediate synthesized voice response

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  originalText?: string;
  detectedLanguage?: string;
  targetLanguage?: string;
  audioBlob?: Blob;
  audioUrl?: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface AssistantError {
  code: string;
  message: string;
  originalError?: unknown;
  timestamp: number;
}

export interface AssistantEventMap {
  stateChange: (state: AssistantState) => void;
  wakeWordDetected: (keyword: string) => void;
  listeningStart: () => void;
  listeningStop: () => void;
  audioLevel: (level: number) => void;
  transcriptReceived: (transcript: string, isFinal: boolean, detectedLanguage?: string) => void;
  llmChunk: (chunk: string, fullText: string) => void;
  llmComplete: (fullText: string) => void;
  translationComplete: (original: string, translated: string, sourceLang: string, targetLang: string) => void;
  ttsStart: () => void;
  ttsEnd: () => void;
  messageAdded: (message: ChatMessage) => void;
  error: (error: AssistantError) => void;
}
