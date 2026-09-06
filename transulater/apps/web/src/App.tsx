import React, { useState } from 'react';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { TranslationModeBar } from './components/TranslationModeBar';
import { LanguageSelector } from './components/LanguageSelector';
import { ChatHistory } from './components/ChatHistory';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { MicControl } from './components/MicControl';
import { SettingsModal } from './components/SettingsModal';
import { Send, AlertTriangle, Sparkles, X } from 'lucide-react';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');

  const {
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
    setMode,
    setLanguages,
    updateConfig,
    replayAudio,
    clearChat,
    clearError,
  } = useVoiceAssistant();

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    sendTextMessage(textInput);
    setTextInput('');
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none overflow-hidden">
      {/* Header */}
      <Header
        state={state}
        wakeWord={lastWakeWord}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearChat={clearChat}
      />

      {/* Wake Word Toast Notification */}
      {lastWakeWord && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white shadow-xl animate-bounce text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Wake word heard ("{lastWakeWord}")! Listening now...</span>
        </div>
      )}

      {/* Error / Permission Banner */}
      {lastError && (
        <div className="mx-4 mt-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{lastError.message}</span>
          </div>
          <button
            onClick={clearError}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-500 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-3 sm:p-4 overflow-hidden gap-3">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-2">
          <TranslationModeBar currentMode={mode} onModeChange={setMode} />
          <LanguageSelector
            sourceLang={sourceLang}
            targetLang={targetLang}
            mode={mode}
            onLanguageChange={setLanguages}
          />
        </div>

        {/* Chat History Panel */}
        <div className="flex-1 min-h-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col overflow-hidden">
          <ChatHistory
            messages={messages}
            onReplayAudio={replayAudio}
            onSuggestionClick={(text) => sendTextMessage(text)}
          />

          {/* Real-time Waveform Area */}
          <div className="px-4 pb-2">
            <WaveformVisualizer state={state} audioLevel={audioLevel} />
          </div>
        </div>

        {/* Bottom Interactive Dock */}
        <div className="flex flex-col items-center gap-3">
          {/* Central Microphone Button */}
          <MicControl
            state={state}
            onStartListening={startListening}
            onStopListening={stopListeningAndProcess}
            onCancel={cancelCurrentAction}
          />

          {/* Quick Text Input fallback */}
          <form
            onSubmit={handleSendMessage}
            className="w-full max-w-lg flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                mode === 'assistant'
                  ? 'Or type a query for Claude...'
                  : `Type text to translate to ${targetLang}...`
              }
              className="flex-1 px-3 py-1.5 bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition shadow-sm"
              title="Send text message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={updateConfig}
      />
    </div>
  );
};
