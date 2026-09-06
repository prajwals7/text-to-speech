import React from 'react';
import { AssistantState } from '@voice-assistant/core';
import { Mic, Volume2, Sparkles, Languages, Radio, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  state: AssistantState;
  wakeWord?: string | null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ state, wakeWord }) => {
  switch (state) {
    case 'listening':
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <Mic className="w-3.5 h-3.5" />
          <span>Listening...</span>
        </div>
      );
    case 'transcribing':
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <Radio className="w-3.5 h-3.5" />
          <span>Transcribing Speech...</span>
        </div>
      );
    case 'thinking':
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Thinking (Claude)...</span>
        </div>
      );
    case 'translating':
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          <Languages className="w-3.5 h-3.5" />
          <span>Translating...</span>
        </div>
      );
    case 'speaking':
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Volume2 className="w-3.5 h-3.5" />
          <span>Speaking...</span>
        </div>
      );
    case 'wake_word_listening':
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>Wake Word Active ({wakeWord || 'Say "Hey Assistant"'})</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Attention Needed</span>
        </div>
      );
    case 'idle':
    default:
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span>Ready</span>
        </div>
      );
  }
};
