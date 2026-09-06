import React from 'react';
import { AssistantState } from '@voice-assistant/core';
import { Mic, MicOff, Square, VolumeX } from 'lucide-react';

interface MicControlProps {
  state: AssistantState;
  onStartListening: () => void;
  onStopListening: () => void;
  onCancel: () => void;
}

export const MicControl: React.FC<MicControlProps> = ({
  state,
  onStartListening,
  onStopListening,
  onCancel,
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isBusy =
    state === 'transcribing' ||
    state === 'thinking' ||
    state === 'translating';

  const handleClick = () => {
    if (isListening) {
      onStopListening();
    } else if (isSpeaking || isBusy) {
      onCancel();
    } else {
      onStartListening();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Ripple Effect while Listening */}
      {isListening && (
        <>
          <div className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-ping"></div>
          <div className="absolute w-32 h-32 rounded-full bg-red-500/10 animate-pulse"></div>
        </>
      )}

      {/* Ripple Effect while Speaking */}
      {isSpeaking && (
        <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-pulse"></div>
      )}

      {/* Main Mic Button */}
      <button
        onClick={handleClick}
        disabled={isBusy}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl focus:outline-none focus:ring-4 ${
          isListening
            ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 glow-recording scale-110'
            : isSpeaking
            ? 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-300 glow-speaking'
            : isBusy
            ? 'bg-amber-500 text-white cursor-wait glow-thinking'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-300 glow-primary hover:scale-105 active:scale-95'
        }`}
        title={
          isListening
            ? 'Click to finish speaking'
            : isSpeaking
            ? 'Click to stop audio'
            : isBusy
            ? 'Processing...'
            : 'Click to start speaking'
        }
      >
        {isListening ? (
          <Square className="w-7 h-7 fill-white animate-pulse" />
        ) : isSpeaking ? (
          <VolumeX className="w-7 h-7" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>
    </div>
  );
};
