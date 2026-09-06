import React, { useState } from 'react';
import { VoiceAssistantConfig, DEFAULT_PRESET_VOICES } from '@voice-assistant/core';
import { X, Key, Mic, Radio, Cpu, Volume2, ShieldCheck, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VoiceAssistantConfig;
  onSaveConfig: (newConfig: Partial<VoiceAssistantConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<VoiceAssistantConfig>(config);
  const [activeTab, setActiveTab] = useState<'wakeword' | 'stt' | 'tts' | 'llm' | 'server'>('wakeword');
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Assistant Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure wake words, speech models, neural voices, and API keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 pt-2 bg-slate-50/50 dark:bg-slate-900/50">
          {[
            { id: 'wakeword', label: 'Wake Word', icon: <Radio className="w-4 h-4" /> },
            { id: 'stt', label: 'STT (Whisper)', icon: <Mic className="w-4 h-4" /> },
            { id: 'tts', label: 'TTS (Voices)', icon: <Volume2 className="w-4 h-4" /> },
            { id: 'llm', label: 'Claude AI', icon: <Cpu className="w-4 h-4" /> },
            { id: 'server', label: 'Connection', icon: <ShieldCheck className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 pb-2.5 px-2 text-xs font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* 1. Wake Word Tab */}
          {activeTab === 'wakeword' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Always-On Wake Word
                  </div>
                  <div className="text-xs text-slate-500">
                    Runs locally on-device. Activates listening automatically when heard.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localConfig.wakeWord.enabled}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      wakeWord: { ...localConfig.wakeWord, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Wake Phrase
                </label>
                <input
                  type="text"
                  value={localConfig.wakeWord.keyword}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      wakeWord: { ...localConfig.wakeWord, keyword: e.target.value },
                    })
                  }
                  placeholder="e.g. Hey Assistant, Jarvis, Computer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported triggers: "Hey Assistant", "Jarvis", "Computer", "Assistant"
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Wake Word Engine
                </label>
                <select
                  value={localConfig.wakeWord.engine}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      wakeWord: { ...localConfig.wakeWord, engine: e.target.value as any },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="web_keyword">Browser Native Acoustic Spotter (Offline & Zero Cost)</option>
                  <option value="porcupine">Picovoice Porcupine (Requires AccessKey)</option>
                </select>
              </div>

              {localConfig.wakeWord.engine === 'porcupine' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Picovoice Access Key
                  </label>
                  <input
                    type="password"
                    value={localConfig.wakeWord.accessKey || ''}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        wakeWord: { ...localConfig.wakeWord, accessKey: e.target.value },
                      })
                    }
                    placeholder="Enter your Picovoice AccessKey"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* 2. STT Tab */}
          {activeTab === 'stt' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Speech-to-Text Provider
                </label>
                <select
                  value={localConfig.stt.provider}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      stt: { ...localConfig.stt, provider: e.target.value as any },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="whisper">OpenAI Whisper (Multilingual 90+ Languages)</option>
                  <option value="deepgram">Deepgram Streaming API (Low Latency)</option>
                  <option value="browser">Browser Web Speech API (Zero-Cost Local)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Whisper Endpoint URL
                </label>
                <input
                  type="text"
                  value={localConfig.stt.endpointUrl || ''}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      stt: { ...localConfig.stt, endpointUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* 3. TTS Tab */}
          {activeTab === 'tts' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Text-to-Speech Engine
                </label>
                <select
                  value={localConfig.tts.provider}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      tts: { ...localConfig.tts, provider: e.target.value as any },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="elevenlabs">ElevenLabs Neural Voice (Hyper-realistic)</option>
                  <option value="browser">System Web Speech Synthesis (Zero-Cost Local)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Voice Selection
                </label>
                <select
                  value={localConfig.tts.voiceId}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      tts: { ...localConfig.tts, voiceId: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {DEFAULT_PRESET_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Speech Rate</span>
                  <span>{localConfig.tts.speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.5"
                  step="0.1"
                  value={localConfig.tts.speed ?? 1.0}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      tts: { ...localConfig.tts, speed: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 4. Claude LLM Tab */}
          {activeTab === 'llm' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Claude Model
                </label>
                <select
                  value={localConfig.llm.model}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      llm: { ...localConfig.llm, model: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                >
                  <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022 (Recommended)</option>
                  <option value="claude-3-opus-20240229">claude-3-opus-20240229 (Deep Reasoning)</option>
                  <option value="claude-3-haiku-20240307">claude-3-haiku-20240307 (Ultra-Fast)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Creativity (Temperature)</span>
                  <span>{localConfig.llm.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={localConfig.llm.temperature ?? 0.7}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      llm: { ...localConfig.llm, temperature: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Auto-Speak Assistant Replies
                  </div>
                  <div className="text-xs text-slate-500">
                    Read Claude's response aloud automatically after streaming
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localConfig.autoSpeakResponse}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      autoSpeakResponse: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 5. Server Connection Tab */}
          {activeTab === 'server' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Backend API Base URL
                </label>
                <input
                  type="text"
                  value={localConfig.backendBaseUrl}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      backendBaseUrl: e.target.value,
                    })
                  }
                  placeholder="http://localhost:8000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-800 dark:text-indigo-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  API Keys Security Note
                </div>
                <p>
                  For production and security, your <code>ANTHROPIC_API_KEY</code>, <code>OPENAI_API_KEY</code>, and <code>ELEVENLABS_API_KEY</code> are loaded by the FastAPI backend from your root <code>.env</code> file. No secrets are exposed directly in client JavaScript bundles.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transition"
          >
            {savedMessage ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
