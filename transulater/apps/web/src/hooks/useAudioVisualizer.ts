import { useEffect, useRef } from 'react';
import { AssistantState } from '@voice-assistant/core';

export function useAudioVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioLevel: number,
  state: AssistantState
) {
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      phaseRef.current += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Determine visual style according to state
      let baseAmplitude = 5;
      let strokeColor = 'rgba(99, 102, 241, 0.4)'; // Primary indigo

      if (state === 'listening') {
        baseAmplitude = 12 + audioLevel * 45;
        strokeColor = 'rgba(239, 68, 68, 0.85)'; // Red / recording
      } else if (state === 'speaking') {
        baseAmplitude = 16 + Math.sin(phaseRef.current * 2) * 10;
        strokeColor = 'rgba(16, 185, 129, 0.85)'; // Emerald / speaking
      } else if (state === 'thinking' || state === 'transcribing' || state === 'translating') {
        baseAmplitude = 8 + Math.sin(phaseRef.current * 3) * 6;
        strokeColor = 'rgba(245, 158, 11, 0.85)'; // Amber / processing
      } else if (state === 'wake_word_listening') {
        baseAmplitude = 6 + Math.sin(phaseRef.current) * 3;
        strokeColor = 'rgba(99, 102, 241, 0.6)';
      }

      // Draw multi-layered sine waves
      const waves = [
        { amplitude: baseAmplitude, frequency: 0.02, speed: 1, alpha: 0.8, lineWidth: 3 },
        { amplitude: baseAmplitude * 0.65, frequency: 0.035, speed: 1.5, alpha: 0.45, lineWidth: 2 },
        { amplitude: baseAmplitude * 0.35, frequency: 0.015, speed: 0.7, alpha: 0.25, lineWidth: 1.5 },
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = wave.lineWidth;
        ctx.lineCap = 'round';

        for (let x = 0; x < width; x++) {
          // Windowing function (fade edges to 0)
          const windowRatio = Math.sin((x / width) * Math.PI);
          const y =
            centerY +
            Math.sin(x * wave.frequency + phaseRef.current * wave.speed) *
              wave.amplitude *
              windowRatio;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasRef, audioLevel, state]);
}
