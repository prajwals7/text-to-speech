import { WakeWordConfig, WakeWordDetectionResult } from '../types/wakeword';
import { WebKeywordSpotter } from './web-keyword';
import { PorcupineEngine } from './porcupine';

export class WakeWordManager {
  private config: WakeWordConfig;
  private webSpotter: WebKeywordSpotter;
  private porcupineEngine: PorcupineEngine;
  private onDetectedListeners: Array<(result: WakeWordDetectionResult) => void> = [];
  private isRunning: boolean = false;

  constructor(config: WakeWordConfig) {
    this.config = config;
    this.webSpotter = new WebKeywordSpotter(config);
    this.porcupineEngine = new PorcupineEngine(config);

    const handleDetected = (result: WakeWordDetectionResult) => {
      this.onDetectedListeners.forEach(listener => listener(result));
    };

    this.webSpotter.setCallback(handleDetected);
    this.porcupineEngine.setCallback(handleDetected);
  }

  public onDetected(listener: (result: WakeWordDetectionResult) => void): () => void {
    this.onDetectedListeners.push(listener);
    return () => {
      this.onDetectedListeners = this.onDetectedListeners.filter(l => l !== listener);
    };
  }

  public updateConfig(newConfig: Partial<WakeWordConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.webSpotter.updateConfig(this.config);
    this.porcupineEngine.updateConfig(this.config);
  }

  public async start(stream?: MediaStream): Promise<void> {
    if (!this.config.enabled) return;

    if (this.config.engine === 'porcupine' && this.config.accessKey) {
      try {
        await this.porcupineEngine.start();
        this.isRunning = true;
        return;
      } catch (e) {
        console.warn('Falling back to browser-native keyword spotter', e);
      }
    }

    await this.webSpotter.start(stream);
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
    this.webSpotter.stop();
    this.porcupineEngine.stop();
  }

  public isActive(): boolean {
    return this.isRunning;
  }
}

export * from './porcupine';
export * from './web-keyword';
