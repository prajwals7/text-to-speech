# Aura Voice AI - React Native Mobile Companion

Companion mobile application for Aura Voice AI wired to `@voice-assistant/core`.

---

## Key Mobile Capabilities & Architecture

### 1. Android: Background Wake Word via Foreground Service
- **Challenge**: Android restricts background processing to preserve battery.
- **Solution**: Implemented using an Android **Foreground Service** with `FOREGROUND_SERVICE_TYPE_MICROPHONE`.
- **Requirements**:
  - `RECORD_AUDIO` permission
  - `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MICROPHONE` in `AndroidManifest.xml`
  - A persistent low-priority status bar notification letting the user know the assistant is actively listening for the wake word
  - Partial `WAKE_LOCK` to keep audio processing alive when the screen is off

### 2. iOS: Siri Shortcuts & App Intents (Apple Background Sandbox)
- **The iOS Limitation**: 
  Apple strictly prohibits third-party apps from maintaining continuous silent microphone streams while backgrounded. Any background mic recording without an active CallKit session (VoIP) or user-initiated foreground audio will be terminated by iOS (`runningboardd`) within 30 seconds.
- **The Practical Solution**:
  We implement **Apple App Intents** (`AppIntent` / `AppShortcutsProvider`). This gives users the exact hands-free, always-on voice experience natively:
  - Users can say: *"Hey Siri, Ask Aura <question>"* or *"Hey Siri, Translate with Aura"*
  - Users can bind Aura to the **iPhone 15/16 Pro Action Button** or Back Tap for 1-click instantaneous voice capture.
  - See `src/native/IOSAppIntentBridge.ts` for Swift bridge code.

---

## Getting Started

```bash
cd apps/mobile
npm install
npm run android   # Run on Android emulator / device
npm run ios       # Run on iOS simulator / device
```
