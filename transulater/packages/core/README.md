# @voice-assistant/core

Framework-agnostic, modular core engine for building conversational AI voice assistants with:
- 🎙️ **On-device wake-word detection** (Porcupine Picovoice Web SDK & Browser-native keyword spotter)
- 🌐 **Multilingual Speech-to-Text** (OpenAI Whisper with 90+ languages auto-detection, Deepgram streaming, Web Speech API fallback)
- 🤖 **Conversational Intelligence** (Anthropic Claude 3.5 Sonnet / 4.6 streaming SSE with conversation session memory)
- 🌍 **Live Multilingual Translation** (Text-to-text & voice-to-voice instantaneous translation)
- 🔊 **Text-to-Speech** (ElevenLabs hyper-realistic neural voice streaming & platform Web Speech synthesis)
- 📊 **Real-time audio analysis** for live waveform visualizers

---

## Installation

```bash
# In your project:
npm install @voice-assistant/core
# or linking locally:
npm link ../packages/core
```

---

## Quickstart

```typescript
import { VoiceAssistantClient, DEFAULT_ASSISTANT_CONFIG } from '@voice-assistant/core';

// 1. Initialize client
const assistant = new VoiceAssistantClient({
  backendBaseUrl: 'http://localhost:8000',
  wakeWord: {
    enabled: true,
    engine: 'web_keyword',
    keyword: 'Hey Assistant',
  },
  stt: {
    provider: 'whisper',
    language: 'auto',
  },
  tts: {
    provider: 'elevenlabs',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
  },
  llm: {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
  },
});

// 2. Subscribe to reactive events
assistant.on('stateChange', (state) => {
  console.log('Current Assistant State:', state);
  // 'idle' | 'wake_word_listening' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'translating'
});

assistant.on('wakeWordDetected', (keyword) => {
  console.log(`Wake word detected: ${keyword}! Assistant is now listening...`);
});

assistant.on('llmChunk', (delta, fullText) => {
  console.log('Streamed token:', delta);
});

assistant.on('audioLevel', (volume) => {
  // Volume level 0.0 to 1.0 for rendering audio waveforms
});

// 3. Start assistant (activates wake-word listener)
await assistant.init();

// Or trigger manual listening:
await assistant.startListening();
// And stop when finished speaking:
await assistant.stopListeningAndProcess();
```

---

## Modes

### 1. Conversational AI (`assistant`)
Natural spoken dialogue with Anthropic Claude Sonnet with full multi-turn conversational history.

```typescript
assistant.setMode('assistant');
```

### 2. Live Voice-to-Voice Translation (`voice_to_voice`)
Speak in any language -> transcribes speech -> translates to target language -> immediately speaks translated audio in the target language.

```typescript
assistant.setMode('voice_to_voice');
assistant.setLanguages('auto', 'fr'); // Translate any spoken language into French speech
```

### 3. Text-to-Text Live Translation (`text_to_text`)
Transcribes spoken speech and renders translated text into the chat transcript without voice response.

```typescript
assistant.setMode('text_to_text');
assistant.setLanguages('en', 'ja');
```

---

## Standalone Submodules

You can also import and use each submodule independently without UI dependencies:

```typescript
import { WhisperSTTClient } from '@voice-assistant/core/stt';
import { ElevenLabsTTSClient } from '@voice-assistant/core/tts';
import { ClaudeLLMClient } from '@voice-assistant/core/llm';
import { LiveTranslator } from '@voice-assistant/core/translation';
import { WakeWordManager } from '@voice-assistant/core/wakeword';
```

---

## License

MIT
