import React from 'react';
import { SUPPORTED_LANGUAGES, TranslationMode } from '@voice-assistant/core';
import { ArrowRightLeft } from 'lucide-react';

interface LanguageSelectorProps {
  sourceLang: string;
  targetLang: string;
  mode: TranslationMode;
  onLanguageChange: (source: string, target: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  sourceLang,
  targetLang,
  mode,
  onLanguageChange,
}) => {
  const isTranslationMode = mode === 'text_to_text' || mode === 'voice_to_voice';

  const handleSwap = () => {
    if (sourceLang === 'auto') return;
    onLanguageChange(targetLang, sourceLang);
  };

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm">
      {/* Source Language */}
      <div className="flex items-center gap-1.5 px-2">
        <span className="text-xs text-slate-400 font-medium">From:</span>
        <select
          value={sourceLang}
          onChange={(e) => onLanguageChange(e.target.value, targetLang)}
          className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option
              key={lang.code}
              value={lang.code}
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              {lang.flag} {lang.name} {lang.code !== 'auto' ? `(${lang.nativeName})` : ''}
            </option>
          ))}
        </select>
      </div>

      {isTranslationMode && (
        <>
          {/* Swap button */}
          <button
            onClick={handleSwap}
            disabled={sourceLang === 'auto'}
            title={sourceLang === 'auto' ? 'Cannot swap auto-detect' : 'Swap languages'}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          {/* Target Language */}
          <div className="flex items-center gap-1.5 px-2 border-l border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">To:</span>
            <select
              value={targetLang}
              onChange={(e) => onLanguageChange(sourceLang, e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
};
