import { STTConfig, STTResult, STTProvider } from '../types/stt';
import { WhisperSTTClient } from './whisper';
import { DeepgramSTTClient } from './deepgram';
import { WebSpeechSTTClient } from './webspeech';

export class STTManager {
  private config: STTConfig;
  private whisperClient: WhisperSTTClient;
  private deepgramClient: DeepgramSTTClient;
  private webSpeechClient: WebSpeechSTTClient;

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private isRecording: boolean = false;

  private onTranscriptCallbacks: Array<(result: STTResult) => void> = [];
  private onErrorCallbacks: Array<(err: Error) => void> = [];

  constructor(config: STTConfig) {
    this.config = config;
    this.whisperClient = new WhisperSTTClient(config);
    this.deepgramClient = new DeepgramSTTClient(config);
    this.webSpeechClient = new WebSpeechSTTClient(config);

    this.webSpeechClient.setCallbacks(
      (result) => this.emitTranscript(result),
      (err) => this.emitError(err)
    );
  }

  public updateConfig(newConfig: Partial<STTConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.whisperClient.updateConfig(this.config);
    this.deepgramClient.updateConfig(this.config);
    this.webSpeechClient.updateConfig(this.config);
  }

  public onTranscript(listener: (result: STTResult) => void): () => void {
    this.onTranscriptCallbacks.push(listener);
    return () => {
      this.onTranscriptCallbacks = this.onTranscriptCallbacks.filter(l => l !== listener);
    };
  }

  public onError(listener: (err: Error) => void): () => void {
    this.onErrorCallbacks.push(listener);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter(l => l !== listener);
    };
  }

  private emitTranscript(result: STTResult): void {
    this.onTranscriptCallbacks.forEach(cb => cb(result));
  }

  private emitError(err: Error): void {
    this.onErrorCallbacks.forEach(cb => cb(err));
  }

  public async startListening(stream?: MediaStream): Promise<void> {
    if (this.isRecording) return;

    if (this.config.provider === 'browser') {
      try {
        this.webSpeechClient.start();
        this.isRecording = true;
        return;
      } catch (err: any) {
        console.warn('Web Speech API failed, falling back to audio recording + Whisper', err);
      }
    }

    // Audio stream recording for Whisper or Deepgram
    try {
      if (stream) {
        this.mediaStream = stream;
      } else if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } else {
        throw new Error('Microphone access is not supported in this environment');
      }

      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250); // Slice every 250ms
      this.isRecording = true;
    } catch (err: any) {
      this.isRecording = false;
      const errorMsg =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : `Microphone recording error: ${err.message}`;
      const friendlyError = new Error(errorMsg);
      this.emitError(friendlyError);
      throw friendlyError;
    }
  }

  public async stopListening(): Promise<STTResult | null> {
    if (!this.isRecording) return null;
    this.isRecording = false;

    if (this.config.provider === 'browser' && this.webSpeechClient.getStatus()) {
      this.webSpeechClient.stop();
      return null;
    }

    if (!this.mediaRecorder) return null;

    return new Promise<STTResult | null>((resolve, reject) => {
      this.mediaRecorder!.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });

          if (audioBlob.size < 100) {
            resolve(null);
            return;
          }

          let result: STTResult;
          if (this.config.provider === 'deepgram') {
            result = await this.deepgramClient.transcribeAudio(audioBlob);
          } else {
            // Default: Whisper
            result = await this.whisperClient.transcribeAudio(audioBlob);
          }

          this.emitTranscript(result);
          resolve(result);
        } catch (err: any) {
          this.emitError(err);
          reject(err);
        }
      };

      try {
        this.mediaRecorder!.stop();
      } catch (e) {
        resolve(null);
      }
    });
  }

  public getActiveStream(): MediaStream | null {
    return this.mediaStream;
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}

export * from './whisper';
export * from './deepgram';
export * from './webspeech';
