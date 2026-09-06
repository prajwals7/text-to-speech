import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '@voice-assistant/core';
import { Bot, User, Volume2, Globe, Sparkles } from 'lucide-react';

interface ChatHistoryProps {
  messages: ChatMessage[];
  onReplayAudio: (messageId: string) => void;
  onSuggestionClick?: (text: string) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  onReplayAudio,
  onSuggestionClick,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    const suggestions = [
      'What are 3 interesting facts about the ocean?',
      'Translate: "Can you recommend a great local coffee shop?" into Japanese',
      'Explain quantum computing in two simple sentences',
      'Translate: "Je voudrais réserver une table pour deux" into English',
    ];

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
          Say "Hey Assistant" or Tap the Mic
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          Speak naturally in any language. The assistant auto-detects your speech, translates in real-time, or converses with Claude.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
          {suggestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick?.(prompt)}
              className="text-left text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-600 dark:text-slate-300 transition shadow-sm hover:shadow"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                isUser
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm ${
                isUser
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
              }`}
            >
              {/* Language Tag if present */}
              {msg.detectedLanguage && (
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider mb-1 opacity-70">
                  <Globe className="w-3 h-3" />
                  <span>Language: {msg.detectedLanguage}</span>
                  {msg.targetLanguage && <span>→ {msg.targetLanguage}</span>}
                </div>
              )}

              {/* Original text (if translation mode) */}
              {msg.originalText && (
                <div className="text-xs mb-1.5 pb-1.5 border-b border-slate-200/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 italic">
                  "{msg.originalText}"
                </div>
              )}

              {/* Message text */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.text}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
                )}
              </p>

              {/* Replay voice button for Assistant */}
              {!isUser && !msg.isStreaming && msg.text && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                  <button
                    onClick={() => onReplayAudio(msg.id)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    title="Speak message aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Replay Voice</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
