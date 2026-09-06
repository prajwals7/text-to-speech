import React from 'react';
import { AssistantState } from '@voice-assistant/core';
import { StatusBadge } from './StatusBadge';
import { Theme } from '../hooks/useTheme';
import { Settings, Sun, Moon, Trash2, Mic2 } from 'lucide-react';

interface HeaderProps {
  state: AssistantState;
  wakeWord?: string | null;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onClearChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  wakeWord,
  theme,
  onToggleTheme,
  onOpenSettings,
  onClearChat,
}) => {
  return (
    <header className="sticky top-0 z-20 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-3 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
          <Mic2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
            Aura Voice AI
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Multilingual
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Powered by Whisper, Claude & ElevenLabs
          </p>
        </div>
      </div>

      {/* Center Status */}
      <div className="hidden md:flex items-center">
        <StatusBadge state={state} wakeWord={wakeWord} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onClearChat}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
          title="Settings & API Keys"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
