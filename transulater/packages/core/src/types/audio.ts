export interface AudioRecorderOptions {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  mimeType?: string;
}

export interface AudioVisualizerData {
  timeDomainData: Uint8Array;
  frequencyData: Uint8Array;
  volume: number; // 0 to 1 normalized
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}
