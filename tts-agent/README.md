# AuraVoice Studio — Deep & Clear Text-to-Speech

A high-performance Text-to-Speech application built with **FastAPI**, **Edge-TTS**, and a modern glassmorphic web interface.

---

## Key Features

1. **Voice Quality & Deep Vocal Tuning**
   - Default Voice: **`en-US-GuyNeural`** (Warm, clear, and resonant baritone).
   - Tuned SSML prosody: `rate="-5%"` and `pitch="-5Hz"` for unhurried, natural human cadence.
   - Curated shortlist of premium deep/warm male voices and clear female voices (`en-US-GuyNeural`, `en-GB-RyanNeural`, `en-US-ChristopherNeural`, `en-GB-ThomasNeural`, `en-US-JennyNeural`, `en-US-AriaNeural`, `en-GB-SoniaNeural`).
   - Sliders to fine-tune speaking rate and pitch in real time with 1-click reset to defaults.

2. **Intelligent Text Normalization & Clarity**
   - Automatically expands common abbreviations (`e.g.`, `i.e.`, `approx.`, `w/`, `w/o`, `etc.`, `Dr.`, `Mr.`, `Mrs.`, `Prof.`, etc.).
   - Collapses excessive whitespace and blank lines.
   - Automatically ensures proper sentence punctuation (`.` appended if missing) to prompt natural engine pauses.
   - Live character counter with gentle warning badge if input exceeds 1,000 characters for optimal single-take synthesis.

3. **Modern Glassmorphic UI**
   - Sleek dark aesthetic with warm golden accents and animated ambient lighting.
   - Interactive HTML5 Audio waveform visualizer animated via Canvas.
   - Scrubber, custom play/pause, playback speed selector (0.75x–1.5x), and volume/mute controls.
   - 1-click **Download MP3** button.
   - Session take history with script reuse and metadata.
   - Fully responsive for mobile and accessible (WCAG AA contrast, keyboard navigation, aria labels).

4. **Pluggable Architecture**
   - Clean `TTSProvider` abstract base class in `backend/providers.py`.
   - Pluggable support for switching between `EdgeTTSProvider`, `OpenAITTSProvider`, and `ElevenLabsTTSProvider`.
   - Preserves standard `POST /api/tts` contract returning `audio/mpeg`.

---

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python run.py
```
Or with uvicorn directly:
```bash
uvicorn backend.main:app --reload --port 8000
```

### 3. Open in Browser
Visit **[http://localhost:8000](http://localhost:8000)**

---

## API Endpoints

- `GET /api/health` — Provider health and default settings.
- `GET /api/voices` — Curated voice shortlist with descriptors.
- `POST /api/normalize` — Utility endpoint to preview text normalization.
- `POST /api/tts` — Synthesizes speech to `audio/mpeg`.
  - Body:
    ```json
    {
      "text": "Welcome to AuraVoice studio.",
      "voice": "en-US-GuyNeural",
      "rate": "-5%",
      "pitch": "-5Hz"
    }
    ```

---

## Running Tests

```bash
pytest tests/
```
