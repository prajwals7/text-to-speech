import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceAssistantClient,
  AssistantState,
  TranslationMode,
  ChatMessage,
  AssistantError,
  VoiceAssistantConfig,
  DEFAULT_ASSISTANT_CONFIG,
} from '@voice-assistant/core';

export function useVoiceAssistant() {
  const [state, setState] = useState<AssistantState>('idle');
  const [mode, setMode] = useState<TranslationMode>('assistant');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('es');
  const [lastWakeWord, setLastWakeWord] = useState<string | null>(null);
  const [lastError, setLastError] = useState<AssistantError | null>(null);
  const [config, setConfig] = useState<VoiceAssistantConfig>(DEFAULT_ASSISTANT_CONFIG);

  const clientRef = useRef<VoiceAssistantClient | null>(null);

  // Initialize client once
  useEffect(() => {
    const client = new VoiceAssistantClient(config);
    clientRef.current = client;

    // Register event listeners
    const unsubs = [
      client.on('stateChange', (s) => setState(s)),
      client.on('messageAdded', () => setMessages([...client.getMessages()])),
      client.on('llmChunk', () => setMessages([...client.getMessages()])),
      client.on('audioLevel', (lvl) => setAudioLevel(lvl)),
      client.on('wakeWordDetected', (kw) => {
        setLastWakeWord(kw);
        setTimeout(() => setLastWakeWord(null), 3000);
      }),
      client.on('error', (err) => {
        console.error('Assistant error:', err);
        setLastError(err);
      }),
    ];

    // Auto-initialize wake-word or idle
    client.init().catch(err => {
      console.warn('Initial wake word start skipped or failed:', err);
    });

    return () => {
      unsubs.forEach(unsub => unsub());
      client.destroy();
    };
  }, []);

  const startListening = useCallback(async () => {
    setLastError(null);
    if (clientRef.current) {
      await clientRef.current.startListening();
    }
  }, []);

  const stopListeningAndProcess = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.stopListeningAndProcess();
    }
  }, []);

  const cancelCurrentAction = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.cancelCurrentAction();
    }
  }, []);

  const sendTextMessage = useCallback(async (text: string) => {
    setLastError(null);
    if (clientRef.current) {
      await clientRef.current.sendTextMessage(text);
    }
  }, []);

  const handleSetMode = useCallback((newMode: TranslationMode) => {
    setMode(newMode);
    if (clientRef.current) {
      clientRef.current.setMode(newMode);
    }
  }, []);

  const handleSetLanguages = useCallback((source: string, target: string) => {
    setSourceLang(source);
    setTargetLang(target);
    if (clientRef.current) {
      clientRef.current.setLanguages(source, target);
    }
  }, []);

  const updateAssistantConfig = useCallback((newConfig: Partial<VoiceAssistantConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      if (clientRef.current) {
        clientRef.current.updateConfig(updated);
      }
      return updated;
    });
  }, []);

  const replayAudio = useCallback(async (messageId: string) => {
    if (clientRef.current) {
      await clientRef.current.replayMessageAudio(messageId);
    }
  }, []);

  const clearChat = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.clearMessages();
      setMessages([]);
    }
  }, []);

  return {
    state,
    mode,
    messages,
    audioLevel,
    sourceLang,
    targetLang,
    lastWakeWord,
    lastError,
    config,
    startListening,
    stopListeningAndProcess,
    cancelCurrentAction,
    sendTextMessage,
    setMode: handleSetMode,
    setLanguages: handleSetLanguages,
    updateConfig: updateAssistantConfig,
    replayAudio,
    clearChat,
    clearError: () => setLastError(null),
  };
}
