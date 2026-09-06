import { TTSConfig, TTSResult, TTSVoice } from '../types/tts';
import { ElevenLabsTTSClient } from './elevenlabs';
import { WebSpeechTTSClient } from './webspeech';

export class TTSManager {
  private config: TTSConfig;
  private elevenLabsClient: ElevenLabsTTSClient;
  private webSpeechClient: WebSpeechTTSClient;
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking: boolean = false;

  private onStartListeners: Array<() => void> = [];
  private onEndListeners: Array<() => void> = [];
  private onErrorListeners: Array<(err: Error) => void> = [];

  constructor(config: TTSConfig) {
    this.config = config;
    this.elevenLabsClient = new ElevenLabsTTSClient(config);
    this.webSpeechClient = new WebSpeechTTSClient(config);
  }

  public updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.elevenLabsClient.updateConfig(this.config);
    this.webSpeechClient.updateConfig(this.config);
  }

  public onStart(listener: () => void): () => void {
    this.onStartListeners.push(listener);
    return () => {
      this.onStartListeners = this.onStartListeners.filter(l => l !== listener);
    };
  }

  public onEnd(listener: () => void): () => void {
    this.onEndListeners.push(listener);
    return () => {
      this.onEndListeners = this.onEndListeners.filter(l => l !== listener);
    };
  }

  public onError(listener: (err: Error) => void): () => void {
    this.onErrorListeners.push(listener);
    return () => {
      this.onErrorListeners = this.onErrorListeners.filter(l => l !== listener);
    };
  }

  private emitStart(): void {
    this.isSpeaking = true;
    this.onStartListeners.forEach(cb => cb());
  }

  private emitEnd(): void {
    this.isSpeaking = false;
    this.onEndListeners.forEach(cb => cb());
  }

  private emitError(err: Error): void {
    this.onErrorListeners.forEach(cb => cb(err));
  }

  public async speak(text: string, language?: string): Promise<TTSResult> {
    this.stop();

    if (!text || !text.trim()) {
      return {};
    }

    if (this.config.provider === 'elevenlabs') {
      try {
        const result = await this.elevenLabsClient.synthesize(text, this.config.voiceId);
        if (result.audioUrl && typeof window !== 'undefined') {
          return new Promise<TTSResult>((resolve, reject) => {
            const audio = new Audio(result.audioUrl);
            this.currentAudio = audio;

            audio.onplay = () => {
              this.emitStart();
            };

            audio.onended = () => {
              this.emitEnd();
              this.currentAudio = null;
              resolve(result);
            };

            audio.onerror = (e) => {
              this.emitEnd();
              this.currentAudio = null;
              const err = new Error('Audio playback failed');
              this.emitError(err);
              reject(err);
            };

            audio.play().catch(err => {
              console.warn('ElevenLabs playback interrupted or blocked:', err);
              // Fallback to browser TTS if audio playback fails
              this.webSpeechClient
                .speak(text, language, () => this.emitStart(), () => this.emitEnd())
                .then(resolve)
                .catch(reject);
            });
          });
        }
        return result;
      } catch (err: any) {
        console.warn('ElevenLabs synthesis failed, falling back to Web Speech Synthesis:', err);
        // Seamless fallback to WebSpeech
      }
    }

    // Web Speech fallback or default
    return this.webSpeechClient.speak(
      text,
      language,
      () => this.emitStart(),
      () => this.emitEnd()
    );
  }

  public stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
    this.webSpeechClient.stop();
    if (this.isSpeaking) {
      this.emitEnd();
    }
  }

  public getStatus(): boolean {
    return this.isSpeaking;
  }

  public getAvailableBrowserVoices(): TTSVoice[] {
    return this.webSpeechClient.getAvailableVoices();
  }
}

export * from './elevenlabs';
export * from './webspeech';
