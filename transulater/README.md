# Aura Voice AI - Multilingual AI Voice Assistant

A full-featured, multilingual conversational AI assistant with on-device wake-word activation, real-time speech understanding in 90+ languages, live translation (text-to-text & voice-to-voice), conversational intelligence powered by Anthropic Claude (Sonnet), and a modular architecture.

---

## Architecture Overview

```
transulater/
├── packages/
│   └── core/                    # Modular @voice-assistant/core package (exportable / publishable)
│       ├── src/
│       │   ├── wakeword/        # On-device wake-word engine (Porcupine & Web Keyword Spotter)
│       │   ├── stt/             # Multilingual STT (Whisper, Deepgram, Web Speech)
│       │   ├── tts/             # Speech synthesis (ElevenLabs & Web Speech Synthesis)
│       │   ├── translation/     # Live translation engine (Text-to-text & Voice-to-voice)
│       │   ├── llm/             # Anthropic Claude streaming client with session memory
│       │   ├── client.ts        # Unified VoiceAssistantClient pipeline coordinator
│       │   └── config.ts        # Typed settings and sane defaults
│       └── README.md            # API docs and embedding guide
├── apps/
│   ├── web/                     # React + TypeScript + Tailwind CSS Web Application
│   │   ├── src/
│   │   │   ├── hooks/           # Custom hooks (useVoiceAssistant, useAudioVisualizer, useTheme)
│   │   │   ├── components/      # UI components (Mic, Waveform, Chat, Settings, Languages)
│   │   │   └── App.tsx          # Main interactive interface
│   ├── backend/                 # Python FastAPI Backend (audio processing, Claude, Whisper, ElevenLabs)
│   │   ├── app/
│   │   │   ├── api/             # REST & SSE routes (/stt, /llm, /tts, /translate)
│   │   │   └── services/        # Whisper, Claude, ElevenLabs & Translation services
│   │   ├── run.py               # Backend launcher
│   │   └── requirements.txt
│   └── mobile/                  # React Native Companion Shell
│       ├── src/native/
│       │   ├── AndroidForegroundService.ts  # Android background wake-word service
│       │   └── IOSAppIntentBridge.ts        # iOS Siri Shortcuts & App Intents architecture
│       └── App.tsx
├── package.json                 # Monorepo root scripts
└── .env.example                 # Root environment variables template
```

---

## Core Features

1. **Local On-Device Wake-Word Detection**:
   - Runs locally in the browser/client without sending continuous audio to cloud servers.
   - Configurable wake phrase (default: *"Hey Assistant"*, with support for *"Jarvis"*, *"Computer"*, etc.).
   - Visual pulsing indicators and audio alerts upon detection.
   - Dual-engine: Browser-native acoustic keyword spotter + Picovoice Porcupine.

2. **Multilingual Speech Understanding**:
   - Auto-detects spoken language across 90+ languages.
   - Transcribes via OpenAI Whisper or Deepgram streaming API.
   - Graceful fallback to browser Web Speech Recognition for instant zero-cost local usage.

3. **Live Multilingual Translation**:
   - **Text-to-Text Mode**: Auto-detects source language and translates to target language in real-time.
   - **Voice-to-Voice Mode**: Listens to speech in any language, translates it, and speaks the translated output aloud in the target language.

4. **Conversational AI Intelligence**:
   - Anthropic Claude 3.5 Sonnet / 4.6 via the official SDK.
   - Real-time token streaming over Server-Sent Events (SSE).
   - Preserves multi-turn session conversational history.

5. **Modern Reactive UI**:
   - Live canvas waveform visualizer (`AnalyserNode`) reflecting speech input and voice playback.
   - Interactive microphone trigger with pulsing animations.
   - Dark/Light mode toggle with persistence.
   - Comprehensive settings modal for voices, models, wake phrase, and thresholds.
   - Fallback text input box for silent environments.

6. **Modular `/core` Package**:
   - No UI dependencies; clean TypeScript interfaces.
   - Can be imported into any React, Vue, Svelte, Electron, Node, or React Native application.

---

## Quickstart & Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+

### 2. Environment Configuration
Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and provide your API keys:
```env
# Anthropic Claude (for Conversational AI)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI (for Whisper Multilingual STT)
OPENAI_API_KEY=sk-...

# ElevenLabs (for Neural Voice Synthesis)
ELEVENLABS_API_KEY=...

# Optional: Picovoice Porcupine Key
PICOVOICE_ACCESS_KEY=...
```

> **Note**: Even without API keys, the system operates in **Zero-Cost Offline Fallback Mode** using browser-native Speech Recognition, Speech Synthesis, and local keyword detection!

---

### 3. Install Dependencies

```bash
# Install frontend & root dependencies
npm install

# Install backend dependencies
cd apps/backend
pip install -r requirements.txt
cd ../..
```

---

### 4. Running the Application

In one terminal, start the FastAPI backend:
```bash
npm run dev:backend
# Or: python apps/backend/run.py
```
*Backend runs on `http://localhost:8000` (API docs at `http://localhost:8000/docs`).*

In a second terminal, start the React Web App:
```bash
npm run dev:web
# Or: cd apps/web && npm run dev
```
*Web App opens at `http://localhost:5173`.*

---

## Embedding `@voice-assistant/core` in Other Projects

You can import `@voice-assistant/core` as an independent library:

```typescript
import { VoiceAssistantClient } from '@voice-assistant/core';

const assistant = new VoiceAssistantClient({
  backendBaseUrl: 'http://localhost:8000',
  wakeWord: {
    enabled: true,
    keyword: 'Hey Assistant',
  },
  stt: { provider: 'whisper' },
  tts: { provider: 'elevenlabs' },
  llm: { model: 'claude-3-5-sonnet-20241022' },
});

// React to state changes
assistant.on('stateChange', (state) => {
  console.log('State:', state);
});

// Start wake word listener
await assistant.init();
```

---

## Mobile Architecture & Background Audio Constraints

- **Android**:
  - Uses an Android **Foreground Service** (`FOREGROUND_SERVICE_TYPE_MICROPHONE`) with a persistent notification.
  - Keeps the wake-word engine alive continuously even when the screen is off or the app is minimized.
- **iOS**:
  - Apple blocks silent continuous background microphone access for third-party apps (the watchdog daemon `runningboardd` halts background mic streams after ~30s).
  - Practical solution: **Apple App Intents & Siri Shortcuts** (`AskAuraIntent`). Users say *"Hey Siri, Ask Aura..."* or trigger Aura via the Action Button, providing hands-free activation compliant with iOS security rules.
  - Detailed Swift bridge specs located in `apps/mobile/src/native/IOSAppIntentBridge.ts`.

---

## License
MIT
