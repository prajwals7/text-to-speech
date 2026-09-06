import { TTSConfig, TTSResult } from '../types/tts';

export class ElevenLabsTTSClient {
  private config: TTSConfig;

  constructor(config: TTSConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public async synthesize(text: string, voiceId?: string): Promise<TTSResult> {
    const endpoint = this.config.endpointUrl || 'http://localhost:8000/api/tts/synthesize';
    const targetVoiceId = voiceId || this.config.voiceId || '21m00Tcm4TlvDq8ikWAM';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          voice_id: targetVoiceId,
          stability: this.config.stability ?? 0.75,
          similarity_boost: this.config.similarityBoost ?? 0.75,
          speed: this.config.speed ?? 1.0,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs TTS failed (${response.status}): ${errText}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      return {
        audioBlob: blob,
        audioUrl,
      };
    } catch (err: any) {
      console.error('ElevenLabs synthesis error:', err);
      throw err;
    }
  }
}
