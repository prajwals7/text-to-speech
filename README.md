# AuraVoice Studio — Neural Text-to-Speech Web Application

A studio-grade Text-to-Speech application built with **FastAPI**, **Edge-TTS Neural Voice Engine**, and an interactive glassmorphic web interface.

---

## Highlights

- **Deep Voice Tuning**: Pre-selected default **Guy (US)** (`en-US-GuyNeural`) baritone with tuned SSML prosody (`rate="-5%"`, `pitch="-5Hz"`) for warm, unhurried, natural human cadence.
- **Curated Voice Shortlist**: Curated shortlist of 7 premium voices (Guy, Ryan, Christopher, Thomas, Jenny, Aria, Sonia) with instant 2-second **Audition** previews.
- **Intelligent Text Normalizer**: Expands abbreviations (`e.g.`, `i.e.`, `Dr.`, `Mr.`, `approx.`, `50%`, etc.), collapses excessive whitespace, and auto-completes sentence-ending punctuation for natural pauses.
- **Interactive Studio UI**:
  - Live character, word, and speech duration counter (`⏱ ~18s`).
  - Real-time normalization preview diff drawer.
  - Multi-mode waveform audio visualizer (Equalizer Bars, Sine Wave, Stereo Spectrum) with direct canvas scrubbing.
  - Quick mood presets (Warm Storyteller, Deep & Resonant, Late Night Radio, Natural Neutral, Crisp & Brisk).
  - Loop toggle, variable playback speeds (0.5x–2.0x), and volume/mute controls.
  - 1-click **Download MP3** and copy script actions.
  - Generation take history for quick replay and script reuse.
  - Global keyboard shortcuts (<kbd>Ctrl+Enter</kbd> to generate, <kbd>Space</kbd> to play/pause).
- **Pluggable Architecture**: `TTSProvider` abstract interface in `backend/providers.py` for seamless swapping with OpenAI, ElevenLabs, or other speech engines.

---

## Quick Start

### 1. Install Requirements
```bash
pip install -r requirements.txt
```

### 2. Start the Server
```bash
python run.py
```
Or directly using Uvicorn:
```bash
uvicorn backend.main:app --reload --app-dir tts-agent --port 8000
```

### 3. Open in Browser
Visit **[http://localhost:8000](http://localhost:8000)** or **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.

---

## Project Structure

```
text-to-speech/
├── tts-agent/
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application & API endpoints
│   │   ├── normalizer.py    # Text normalization & abbreviation expansion
│   │   └── providers.py     # TTSProvider abstract class & EdgeTTSProvider
│   ├── frontend/
│   │   ├── index.html       # Modern HTML5 studio interface
│   │   ├── style.css        # Glassmorphic warm amber design system
│   │   └── app.js           # Interactive client logic & audio visualizer
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_normalizer.py
│   │   ├── test_api.py
│   │   └── test_e2e.py
│   ├── requirements.txt
│   ├── README.md
│   └── run.py
├── .gitignore
├── requirements.txt
├── README.md
└── run.py                   # Root launcher
```

---

## Running Tests

```bash
cd tts-agent
pytest -v tests/
```

---

## License
MIT
