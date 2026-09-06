import { STTConfig, STTResult } from '../types/stt';

export class DeepgramSTTClient {
  private config: STTConfig;

  constructor(config: STTConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: Partial<STTConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public async transcribeAudio(audioBlob: Blob): Promise<STTResult> {
    if (!this.config.apiKey) {
      throw new Error('Deepgram API key is required to use Deepgram STT');
    }

    const lang = this.config.language && this.config.language !== 'auto' 
      ? this.config.language 
      : 'multi';

    const url = `https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=${lang}&detect_language=true`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.config.apiKey}`,
        'Content-Type': audioBlob.type || 'audio/webm',
      },
      body: audioBlob,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Deepgram STT failed (${response.status}): ${err}`);
    }

    const data = await response.json();
    const transcript =
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const detectedLanguage =
      data.results?.channels?.[0]?.detected_language || this.config.language || 'en';
    const confidence =
      data.results?.channels?.[0]?.alternatives?.[0]?.confidence ?? 0.9;

    return {
      text: transcript,
      isFinal: true,
      detectedLanguage,
      confidence,
      duration: data.metadata?.duration,
    };
  }
}
