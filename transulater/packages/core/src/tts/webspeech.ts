import { TTSConfig, TTSResult, TTSVoice } from '../types/tts';

export class WebSpeechTTSClient {
  private config: TTSConfig;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;

  constructor(config: TTSConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getAvailableVoices(): TTSVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices().map(v => ({
      id: v.voiceURI,
      name: `${v.name} (${v.lang})`,
      language: v.lang,
      provider: 'browser',
      gender: 'neutral',
    }));
  }

  public async speak(
    text: string,
    language?: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<TTSResult> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      throw new Error('Web Speech Synthesis is not supported in this environment');
    }

    this.stop();

    return new Promise<TTSResult>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      if (language && language !== 'auto') {
        utterance.lang = language;
      }

      utterance.rate = this.config.speed ?? 1.0;
      utterance.pitch = this.config.pitch ?? 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (this.config.voiceId && this.config.voiceId !== 'browser-default') {
        const matchingVoice = voices.find(v => v.voiceURI === this.config.voiceId);
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      } else if (language && language !== 'auto') {
        const langVoice = voices.find(v => v.lang.startsWith(language));
        if (langVoice) {
          utterance.voice = langVoice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        onEnd?.();
        resolve({});
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        onEnd?.();
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          reject(new Error(`SpeechSynthesis error: ${e.error}`));
        } else {
          resolve({});
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public getStatus(): boolean {
    return this.isSpeaking;
  }
}
