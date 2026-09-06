import {
  AssistantState,
  TranslationMode,
  ChatMessage,
  AssistantError,
  AssistantEventMap,
} from './types/assistant';
import { VoiceAssistantConfig, DEFAULT_ASSISTANT_CONFIG } from './config';
import { WakeWordManager } from './wakeword/manager';
import { STTManager } from './stt/manager';
import { TTSManager } from './tts/manager';
import { TranslationManager } from './translation/manager';
import { ClaudeLLMClient } from './llm/claude';

export class VoiceAssistantClient {
  private config: VoiceAssistantConfig;
  private state: AssistantState = 'idle';
  private mode: TranslationMode = 'assistant';
  private sourceLanguage: string = 'auto';
  private targetLanguage: string = 'es';

  private wakeWordManager: WakeWordManager;
  private sttManager: STTManager;
  private ttsManager: TTSManager;
  private translationManager: TranslationManager;
  private llmClient: ClaudeLLMClient;

  private messages: ChatMessage[] = [];
  private eventListeners: { [K in keyof AssistantEventMap]?: Array<AssistantEventMap[K]> } = {};

  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private visualizerInterval: any = null;

  constructor(customConfig?: Partial<VoiceAssistantConfig>) {
    this.config = { ...DEFAULT_ASSISTANT_CONFIG, ...customConfig };
    this.sourceLanguage = this.config.defaultSourceLang;
    this.targetLanguage = this.config.defaultTargetLang;

    this.wakeWordManager = new WakeWordManager(this.config.wakeWord);
    this.sttManager = new STTManager(this.config.stt);
    this.ttsManager = new TTSManager(this.config.tts);
    this.translationManager = new TranslationManager(
      `${this.config.backendBaseUrl}/api/translate`,
      this.sourceLanguage,
      this.targetLanguage
    );
    this.llmClient = new ClaudeLLMClient(this.config.llm);

    this.setupInternalHandlers();
  }

  // ---------------------------------------------------------------------------
  // Event Emitter
  // ---------------------------------------------------------------------------
  public on<K extends keyof AssistantEventMap>(event: K, handler: AssistantEventMap[K]): () => void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event]!.push(handler);
    return () => {
      this.eventListeners[event] = (this.eventListeners[event] as any[])?.filter(h => h !== handler);
    };
  }

  private emit<K extends keyof AssistantEventMap>(event: K, ...args: Parameters<AssistantEventMap[K]>): void {
    const listeners = this.eventListeners[event] as Array<(...a: any[]) => void> | undefined;
    if (listeners) {
      listeners.forEach(fn => {
        try {
          fn(...args);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  private setState(newState: AssistantState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.emit('stateChange', newState);
  }

  public getState(): AssistantState {
    return this.state;
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public getMode(): TranslationMode {
    return this.mode;
  }

  public setMode(mode: TranslationMode): void {
    this.mode = mode;
  }

  public getLanguages(): { source: string; target: string } {
    return { source: this.sourceLanguage, target: this.targetLanguage };
  }

  public setLanguages(source: string, target: string): void {
    this.sourceLanguage = source;
    this.targetLanguage = target;
    this.sttManager.updateConfig({ language: source });
    this.translationManager.setDefaultLanguages(source, target);
  }

  public getConfig(): VoiceAssistantConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<VoiceAssistantConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.wakeWord) this.wakeWordManager.updateConfig(newConfig.wakeWord);
    if (newConfig.stt) this.sttManager.updateConfig(newConfig.stt);
    if (newConfig.tts) this.ttsManager.updateConfig(newConfig.tts);
    if (newConfig.llm) this.llmClient.updateConfig(newConfig.llm);
  }

  // ---------------------------------------------------------------------------
  // Internal Handlers & Pipeline Wiring
  // ---------------------------------------------------------------------------
  private setupInternalHandlers(): void {
    // Wake Word Detected
    this.wakeWordManager.onDetected(async (res) => {
      this.emit('wakeWordDetected', res.keyword);
      // Interrupt any current speech
      this.ttsManager.stop();
      // Transition to listening
      await this.startListening();
    });

    // STT Error
    this.sttManager.onError((err) => {
      this.handleError('STT_ERROR', err.message, err);
    });

    // TTS Events
    this.ttsManager.onStart(() => {
      this.setState('speaking');
      this.emit('ttsStart');
    });

    this.ttsManager.onEnd(() => {
      this.emit('ttsEnd');
      if (this.config.wakeWord.enabled) {
        this.startWakeWordListening().catch(() => this.setState('idle'));
      } else {
        this.setState('idle');
      }
    });

    this.ttsManager.onError((err) => {
      this.handleError('TTS_ERROR', err.message, err);
    });
  }

  // ---------------------------------------------------------------------------
  // Public Lifecycle & Actions
  // ---------------------------------------------------------------------------
  public async init(): Promise<void> {
    if (this.config.wakeWord.enabled) {
      await this.startWakeWordListening();
    } else {
      this.setState('idle');
    }
  }

  public async startWakeWordListening(): Promise<void> {
    try {
      this.ttsManager.stop();
      await this.wakeWordManager.start();
      this.setState('wake_word_listening');
    } catch (err: any) {
      console.warn('Failed to start wake word listening:', err);
      this.setState('idle');
    }
  }

  public async startListening(): Promise<void> {
    try {
      this.wakeWordManager.stop();
      this.ttsManager.stop();
      this.setState('listening');
      this.emit('listeningStart');

      await this.sttManager.startListening();
      this.attachAudioVisualizer(this.sttManager.getActiveStream());
    } catch (err: any) {
      this.handleError('MIC_PERMISSION_ERROR', err.message, err);
    }
  }

  public async stopListeningAndProcess(): Promise<void> {
    if (this.state !== 'listening') return;

    this.detachAudioVisualizer();
    this.setState('transcribing');
    this.emit('listeningStop');

    try {
      const sttResult = await this.sttManager.stopListening();
      if (!sttResult || !sttResult.text.trim()) {
        if (this.config.wakeWord.enabled) {
          await this.startWakeWordListening();
        } else {
          this.setState('idle');
        }
        return;
      }

      const userText = sttResult.text.trim();
      const detectedLang = sttResult.detectedLanguage || this.sourceLanguage;

      // Add user message to history
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'user',
        text: userText,
        detectedLanguage: detectedLang,
        timestamp: Date.now(),
      };
      this.messages.push(userMsg);
      this.emit('messageAdded', userMsg);
      this.emit('transcriptReceived', userText, true, detectedLang);

      // Branch based on selected mode
      if (this.mode === 'text_to_text') {
        await this.handleTextToTextTranslation(userText, detectedLang);
      } else if (this.mode === 'voice_to_voice') {
        await this.handleVoiceToVoiceTranslation(userText, detectedLang);
      } else {
        // Conversational AI mode
        await this.handleConversationalAI(userText, detectedLang);
      }
    } catch (err: any) {
      this.handleError('PROCESSING_ERROR', err.message, err);
    }
  }

  public cancelCurrentAction(): void {
    this.sttManager.stopListening().catch(() => {});
    this.ttsManager.stop();
    this.llmClient.abort();
    this.detachAudioVisualizer();

    if (this.config.wakeWord.enabled) {
      this.startWakeWordListening().catch(() => this.setState('idle'));
    } else {
      this.setState('idle');
    }
  }

  public async sendTextMessage(text: string): Promise<void> {
    if (!text.trim()) return;

    this.ttsManager.stop();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };
    this.messages.push(userMsg);
    this.emit('messageAdded', userMsg);

    if (this.mode === 'text_to_text') {
      await this.handleTextToTextTranslation(userMsg.text, this.sourceLanguage);
    } else if (this.mode === 'voice_to_voice') {
      await this.handleVoiceToVoiceTranslation(userMsg.text, this.sourceLanguage);
    } else {
      await this.handleConversationalAI(userMsg.text, this.sourceLanguage);
    }
  }

  // ---------------------------------------------------------------------------
  // Pipeline Handlers
  // ---------------------------------------------------------------------------
  private async handleConversationalAI(userPrompt: string, detectedLang: string): Promise<void> {
    this.setState('thinking');

    const assistantMsgId = `asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      detectedLanguage: detectedLang,
      timestamp: Date.now(),
      isStreaming: true,
    };
    this.messages.push(assistantMsg);
    this.emit('messageAdded', assistantMsg);

    try {
      const fullResponse = await this.llmClient.streamChat(userPrompt, (chunk) => {
        assistantMsg.text = chunk.fullText;
        this.emit('llmChunk', chunk.delta, chunk.fullText);
      });

      assistantMsg.isStreaming = false;
      this.emit('llmComplete', fullResponse);

      if (this.config.autoSpeakResponse && fullResponse.trim()) {
        await this.ttsManager.speak(fullResponse, detectedLang);
      } else {
        if (this.config.wakeWord.enabled) {
          await this.startWakeWordListening();
        } else {
          this.setState('idle');
        }
      }
    } catch (err: any) {
      assistantMsg.isStreaming = false;
      this.handleError('LLM_ERROR', err.message, err);
    }
  }

  private async handleTextToTextTranslation(text: string, sourceLang: string): Promise<void> {
    this.setState('translating');

    try {
      const transResult = await this.translationManager.translateText(
        text,
        sourceLang,
        this.targetLanguage
      );

      const transMsg: ChatMessage = {
        id: `trans-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'assistant',
        text: transResult.translatedText,
        originalText: text,
        detectedLanguage: transResult.detectedSourceLanguage || sourceLang,
        targetLanguage: this.targetLanguage,
        timestamp: Date.now(),
      };
      this.messages.push(transMsg);
      this.emit('messageAdded', transMsg);
      this.emit(
        'translationComplete',
        text,
        transResult.translatedText,
        sourceLang,
        this.targetLanguage
      );

      if (this.config.wakeWord.enabled) {
        await this.startWakeWordListening();
      } else {
        this.setState('idle');
      }
    } catch (err: any) {
      this.handleError('TRANSLATION_ERROR', err.message, err);
    }
  }

  private async handleVoiceToVoiceTranslation(text: string, sourceLang: string): Promise<void> {
    this.setState('translating');

    try {
      const transResult = await this.translationManager.translateText(
        text,
        sourceLang,
        this.targetLanguage
      );

      const transMsg: ChatMessage = {
        id: `v2v-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'assistant',
        text: transResult.translatedText,
        originalText: text,
        detectedLanguage: transResult.detectedSourceLanguage || sourceLang,
        targetLanguage: this.targetLanguage,
        timestamp: Date.now(),
      };
      this.messages.push(transMsg);
      this.emit('messageAdded', transMsg);
      this.emit(
        'translationComplete',
        text,
        transResult.translatedText,
        sourceLang,
        this.targetLanguage
      );

      // Immediately speak the translated text in the target language!
      await this.ttsManager.speak(transResult.translatedText, this.targetLanguage);
    } catch (err: any) {
      this.handleError('TRANSLATION_ERROR', err.message, err);
    }
  }

  public async replayMessageAudio(messageId: string): Promise<void> {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg || !msg.text) return;

    this.ttsManager.stop();
    const lang = msg.targetLanguage || msg.detectedLanguage || 'en';
    await this.ttsManager.speak(msg.text, lang);
  }

  public clearMessages(): void {
    this.messages = [];
    this.llmClient.clearHistory();
  }

  // ---------------------------------------------------------------------------
  // Audio Level Analyser
  // ---------------------------------------------------------------------------
  private attachAudioVisualizer(stream: MediaStream | null): void {
    if (!stream || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      source.connect(this.analyserNode);

      const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

      this.visualizerInterval = setInterval(() => {
        if (!this.analyserNode) return;
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1.0, avg / 128);
        this.emit('audioLevel', normalized);
      }, 50);
    } catch (err) {
      console.warn('Could not attach audio visualizer:', err);
    }
  }

  private detachAudioVisualizer(): void {
    if (this.visualizerInterval) {
      clearInterval(this.visualizerInterval);
      this.visualizerInterval = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyserNode = null;
    this.emit('audioLevel', 0);
  }

  private handleError(code: string, message: string, originalError?: unknown): void {
    this.setState('error');
    const err: AssistantError = {
      code,
      message,
      originalError,
      timestamp: Date.now(),
    };
    this.emit('error', err);
  }

  public destroy(): void {
    this.detachAudioVisualizer();
    this.wakeWordManager.stop();
    this.sttManager.stopListening().catch(() => {});
    this.ttsManager.stop();
    this.llmClient.abort();
    this.eventListeners = {};
  }
}
