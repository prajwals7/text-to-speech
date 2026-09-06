export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  endpointUrl?: string; // Backend streaming proxy URL
  apiKey?: string;
}

export interface LLMStreamChunk {
  delta: string;
  fullText: string;
  done: boolean;
}
