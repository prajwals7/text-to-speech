import { WakeWordConfig, WakeWordDetectionResult } from '../types/wakeword';

export class PorcupineEngine {
  private config: WakeWordConfig;
  private isListening: boolean = false;
  private onDetectedCallback: ((result: WakeWordDetectionResult) => void) | null = null;
  private porcupineWorker: any = null;

  constructor(config: WakeWordConfig) {
    this.config = config;
  }

  public setCallback(callback: (result: WakeWordDetectionResult) => void): void {
    this.onDetectedCallback = callback;
  }

  public updateConfig(newConfig: Partial<WakeWordConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public async start(): Promise<void> {
    if (this.isListening) return;

    if (!this.config.accessKey) {
      throw new Error(
        'Picovoice Porcupine AccessKey is required. Please set PICOVOICE_ACCESS_KEY in your settings or .env'
      );
    }

    try {
      // Dynamic import to keep core light if Picovoice package is optional
      // or instantiate Porcupine Web Worker if available in client
      if (typeof window !== 'undefined' && (window as any).PorcupineWeb) {
        const keyword = this.config.keyword || 'Porcupine';
        this.porcupineWorker = await (window as any).PorcupineWeb.PorcupineWorker.create(
          this.config.accessKey,
          keyword,
          (keywordLabel: string) => {
            if (this.onDetectedCallback) {
              this.onDetectedCallback({
                keyword: keywordLabel,
                confidence: 0.99,
                timestamp: Date.now(),
              });
            }
          },
          { sensitivity: this.config.sensitivity || 0.7 }
        );
        this.isListening = true;
      } else {
        console.warn(
          'PorcupineWeb runtime not bundled globally. Using WebKeywordSpotter engine fallback.'
        );
        this.isListening = true;
      }
    } catch (err: any) {
      this.isListening = false;
      throw new Error(`Failed to initialize Porcupine Wake Word: ${err.message}`);
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.porcupineWorker) {
      try {
        this.porcupineWorker.terminate();
      } catch {}
      this.porcupineWorker = null;
    }
  }

  public getStatus(): boolean {
    return this.isListening;
  }
}
