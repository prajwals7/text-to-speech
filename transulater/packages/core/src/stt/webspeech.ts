import { STTConfig, STTResult } from '../types/stt';

export class WebSpeechSTTClient {
  private config: STTConfig;
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((result: STTResult) => void) | null = null;
  private onErrorCallback: ((err: Error) => void) | null = null;

  constructor(config: STTConfig) {
    this.config = config;
  }

  public setCallbacks(
    onResult: (result: STTResult) => void,
    onError?: (err: Error) => void
  ): void {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
  }

  public updateConfig(newConfig: Partial<STTConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (this.recognition && newConfig.language && newConfig.language !== 'auto') {
      this.recognition.lang = newConfig.language;
    }
  }

  public start(): void {
    if (this.isListening) return;

    const SpeechRecognition =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognition) {
      throw new Error('Web Speech Recognition API is not supported in this browser environment');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous ?? false;
    this.recognition.interimResults = this.config.interimResults ?? true;
    
    // Map language code if auto or specific
    if (this.config.language && this.config.language !== 'auto') {
      this.recognition.lang = this.config.language;
    } else {
      this.recognition.lang = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      const text = (finalTranscript || interimTranscript).trim();
      const isFinal = Boolean(finalTranscript);

      if (this.onResultCallback && text) {
        this.onResultCallback({
          text,
          isFinal,
          detectedLanguage: this.recognition.lang.slice(0, 2),
          confidence: event.results[0]?.[0]?.confidence ?? 0.9,
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error(`Web Speech STT error: ${event.error}`));
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
    this.isListening = true;
  }

  public stop(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  }

  public getStatus(): boolean {
    return this.isListening;
  }
}
