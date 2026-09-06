import React, { useRef } from 'react';
import { AssistantState } from '@voice-assistant/core';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';

interface WaveformVisualizerProps {
  state: AssistantState;
  audioLevel: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ state, audioLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useAudioVisualizer(canvasRef, audioLevel, state);

  return (
    <div className="w-full flex items-center justify-center py-2">
      <div className="relative w-full max-w-lg h-20 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-inner overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={480}
          height={80}
          className="w-full h-full"
        />
        {state === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase">
              Microphone Standby
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
