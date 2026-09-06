import React from 'react';
import { TranslationMode } from '@voice-assistant/core';
import { Bot, FileText, Volume2 } from 'lucide-react';

interface TranslationModeBarProps {
  currentMode: TranslationMode;
  onModeChange: (mode: TranslationMode) => void;
}

export const TranslationModeBar: React.FC<TranslationModeBarProps> = ({
  currentMode,
  onModeChange,
}) => {
  const modes: Array<{
    id: TranslationMode;
    label: string;
    icon: React.ReactNode;
    desc: string;
  }> = [
    {
      id: 'assistant',
      label: 'Assistant',
      icon: <Bot className="w-4 h-4" />,
      desc: 'Conversational Claude AI with memory',
    },
    {
      id: 'text_to_text',
      label: 'Text Translate',
      icon: <FileText className="w-4 h-4" />,
      desc: 'Multilingual text translation',
    },
    {
      id: 'voice_to_voice',
      label: 'Voice-to-Voice',
      icon: <Volume2 className="w-4 h-4" />,
      desc: 'Spoken translation with voice output',
    },
  ];

  return (
    <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-300/40 dark:border-slate-700/40">
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={mode.desc}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};
