import { WakeWordConfig, WakeWordDetectionResult } from '../types/wakeword';

export class WebKeywordSpotter {
  private config: WakeWordConfig;
  private isListening: boolean = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private recognition: any = null;
  private onDetectedCallback: ((result: WakeWordDetectionResult) => void) | null = null;
  private lastTriggerTime: number = 0;
  private readonly cooldownMs: number = 2500;

  constructor(config: WakeWordConfig) {
    this.config = config;
  }

  public setCallback(callback: (result: WakeWordDetectionResult) => void): void {
    this.onDetectedCallback = callback;
  }

  public updateConfig(newConfig: Partial<WakeWordConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public async start(stream?: MediaStream): Promise<void> {
    if (this.isListening) return;

    const SpeechRecognition =
      (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          if (!this.isListening) return;
          const keyword = (this.config.keyword || 'hey assistant').toLowerCase().trim();
          const targetVariations = [
            keyword,
            keyword.replace(/hey\s+/i, ''),
            'hey assistant',
            'assistant',
            'jarvis',
            'computer',
          ];

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase();
            const now = Date.now();

            const isMatched = targetVariations.some(v => v.length > 2 && transcript.includes(v));

            if (isMatched && (now - this.lastTriggerTime > this.cooldownMs)) {
              this.lastTriggerTime = now;
              if (this.onDetectedCallback) {
                this.onDetectedCallback({
                  keyword: this.config.keyword,
                  confidence: 0.95,
                  timestamp: now,
                });
              }
              break;
            }
          }
        };

        this.recognition.onerror = (err: any) => {
          // Continuous recognition auto-restarts silently on minor errors unless aborted
          if (err.error !== 'aborted' && this.isListening) {
            setTimeout(() => {
              if (this.isListening && this.recognition) {
                try {
                  this.recognition.start();
                } catch {}
              }
            }, 500);
          }
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch {}
          }
        };

        this.recognition.start();
        this.isListening = true;
        return;
      } catch (e) {
        console.warn('Web Speech recognition not available for wake word, falling back to audio energy spotter', e);
      }
    }

    // AudioContext Fallback for environments where Web Speech recognition is unavailable
    if (typeof window !== 'undefined') {
      try {
        this.mediaStream = stream || (await navigator.mediaDevices.getUserMedia({ audio: true }));
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const buffer = new Uint8Array(analyser.frequencyBinCount);
        this.isListening = true;

        const checkAudio = () => {
          if (!this.isListening) return;
          analyser.getByteFrequencyData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i];
          }
          const avg = sum / buffer.length;
          // Threshold check
          const threshold = (1 - (this.config.sensitivity || 0.7)) * 120 + 35;
          const now = Date.now();

          if (avg > threshold && (now - this.lastTriggerTime > this.cooldownMs)) {
            this.lastTriggerTime = now;
            if (this.onDetectedCallback) {
              this.onDetectedCallback({
                keyword: this.config.keyword,
                confidence: Math.min(1.0, avg / 128),
                timestamp: now,
              });
            }
          }

          if (this.isListening) {
            requestAnimationFrame(checkAudio);
          }
        };

        requestAnimationFrame(checkAudio);
      } catch (err) {
        this.isListening = false;
        throw err;
      }
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }

  public getStatus(): boolean {
    return this.isListening;
  }
}
