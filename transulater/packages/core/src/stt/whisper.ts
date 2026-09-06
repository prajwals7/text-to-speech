import { STTConfig, STTResult } from '../types/stt';

export class WhisperSTTClient {
  private config: STTConfig;

  constructor(config: STTConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: Partial<STTConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public async transcribeAudio(audioBlob: Blob): Promise<STTResult> {
    const endpoint = this.config.endpointUrl || 'http://localhost:8000/api/stt/transcribe';
    const formData = new FormData();
    formData.append('audio', audioBlob, 'speech.webm');
    
    if (this.config.language && this.config.language !== 'auto') {
      formData.append('language', this.config.language);
    }

    try {
      const headers: Record<string, string> = {};
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper STT failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return {
        text: data.text || '',
        isFinal: true,
        detectedLanguage: data.detected_language || data.language || 'en',
        confidence: data.confidence ?? 0.95,
        duration: data.duration,
      };
    } catch (err: any) {
      console.error('Whisper STT request error:', err);
      throw err;
    }
  }
}
