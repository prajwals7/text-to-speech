export type WakeWordEngineType = 'porcupine' | 'web_keyword' | 'custom';

export interface WakeWordConfig {
  enabled: boolean;
  engine: WakeWordEngineType;
  keyword: string;
  sensitivity?: number; // 0.0 to 1.0
  accessKey?: string;   // For Picovoice Porcupine
  modelPath?: string;
}

export interface WakeWordDetectionResult {
  keyword: string;
  confidence: number;
  timestamp: number;
}
