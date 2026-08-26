/**
 * AuraVoice Studio — Client Application Logic (Interactive Edition)
 * Integrates with FastAPI TTS backend, voice preview auditioning,
 * live text normalizer diff, mood presets, multi-mode waveform visualizer,
 * interactive canvas scrubber, and studio export options.
 */

// Application State
const state = {
  voices: [],
  filteredVoices: [],
  selectedVoiceId: "en-US-GuyNeural",
  activeFilter: "all",
  searchQuery: "",
  rate: "-5%",
  pitch: "-5Hz",
  currentAudioUrl: null,
  currentBlob: null,
  currentText: "",
  history: [],
  audioContext: null,
  analyser: null,
  sourceNode: null,
  animationFrameId: null,
  isPlaying: false,
  visualizerMode: "bars", // 'bars' | 'wave' | 'spectrum'
  isLooping: false,
  previewAudio: null,
  currentlyAuditioningId: null,
};

// Preset Scripts for Quick Testing
const PRESETS = {
  narration:
    "The cosmos is within us. We are made of star-stuff, we are a way for the universe to know itself. In the deep quiet of space, time moves at its own deliberate pace.",
  podcast:
    "Welcome back to The Deep Dive. Today we're exploring breakthroughs in artificial intelligence, voice synthesis, and the future of human-computer audio interfaces.",
  tech:
    "We are thrilled to introduce AuraVoice 2.0, featuring ultra-low latency SSML synthesis, deep resonant vocal modeling, and pristine studio-grade clarity.",
  radio:
    "It's midnight on the airwaves. Wherever you are tonight, sit back, relax, and let the gentle frequency guide you through the late hours.",
  calm:
    "Take a deep breath in... hold for a moment... and gently exhale. Allow your shoulders to relax and bring your focus completely into the present moment.",
};

// Audition Phrases for Quick Voice Samples
const AUDITION_PHRASES = {
  "en-US-GuyNeural": "Hello! I am Guy, deep, warm, and clear.",
  "en-GB-RyanNeural": "Good day! I am Ryan, resonant with a British tone.",
  "en-US-ChristopherNeural": "Greetings! I am Christopher, smooth and authoritative.",
  "en-GB-ThomasNeural": "Hello! I am Thomas, distinguished with classic British depth.",
  "en-US-JennyNeural": "Hi there! I am Jenny, natural, bright, and friendly.",
  "en-US-AriaNeural": "Hello! I am Aria, expressive and polished for storytelling.",
  "en-GB-SoniaNeural": "Welcome! I am Sonia, calm, articulate, and poised.",
};

// DOM Cache
const DOM = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheDOMElements();
  bindEvents();
  loadVoices();
  loadHistoryFromStorage();
  initWaveformCanvas();
  updateTextStats();
});

function cacheDOMElements() {
  DOM.textInput = document.getElementById("tts-text");
  DOM.charCount = document.getElementById("char-count");
  DOM.wordCount = document.getElementById("word-count");
  DOM.speechEstimate = document.getElementById("speech-estimate");
  DOM.lengthWarning = document.getElementById("length-warning");
  DOM.btnAutoPunctuate = document.getElementById("btn-auto-punctuate");
  DOM.btnToggleDiff = document.getElementById("btn-toggle-diff");
  DOM.diffDrawer = document.getElementById("diff-drawer");
  DOM.diffContent = document.getElementById("diff-content");
  DOM.btnCloseDiff = document.getElementById("btn-close-diff");
  DOM.voiceGrid = document.getElementById("voice-grid");
  DOM.voiceSearch = document.getElementById("voice-search");
  DOM.filterTabs = document.querySelectorAll(".filter-tab");
  DOM.rateSlider = document.getElementById("rate-slider");
  DOM.rateValue = document.getElementById("rate-value");
  DOM.pitchSlider = document.getElementById("pitch-slider");
  DOM.pitchValue = document.getElementById("pitch-value");
  DOM.btnRateDown = document.getElementById("btn-rate-down");
  DOM.btnRateUp = document.getElementById("btn-rate-up");
  DOM.btnPitchDown = document.getElementById("btn-pitch-down");
  DOM.btnPitchUp = document.getElementById("btn-pitch-up");
  DOM.btnResetProsody = document.getElementById("btn-reset-prosody");
  DOM.moodChips = document.querySelectorAll(".mood-chip");
  DOM.btnGenerate = document.getElementById("btn-generate");
  DOM.btnPaste = document.getElementById("btn-paste");
  DOM.btnClear = document.getElementById("btn-clear");
  DOM.playerContainer = document.getElementById("player-container");
  DOM.emptyPlayerState = document.getElementById("empty-player-state");
  DOM.activePlayer = document.getElementById("active-player");
  DOM.audio = document.getElementById("audio-element");
  DOM.previewAudio = document.getElementById("preview-audio-element");
  DOM.btnPlayPause = document.getElementById("btn-play-pause");
  DOM.playIcon = document.getElementById("play-icon");
  DOM.pauseIcon = document.getElementById("pause-icon");
  DOM.btnReplay = document.getElementById("btn-replay");
  DOM.btnLoop = document.getElementById("btn-loop");
  DOM.seekSlider = document.getElementById("seek-slider");
  DOM.currentTime = document.getElementById("current-time");
  DOM.totalDuration = document.getElementById("total-duration");
  DOM.playbackSpeed = document.getElementById("playback-speed");
  DOM.volumeSlider = document.getElementById("volume-slider");
  DOM.btnMute = document.getElementById("btn-mute");
  DOM.volHighIcon = document.getElementById("vol-high-icon");
  DOM.volMuteIcon = document.getElementById("vol-mute-icon");
  DOM.btnDownload = document.getElementById("btn-download");
  DOM.btnCopyLink = document.getElementById("btn-copy-link");
  DOM.playerVoiceTag = document.getElementById("player-voice-tag");
  DOM.playerProsodyTag = document.getElementById("player-prosody-tag");
  DOM.playerTimeTag = document.getElementById("player-time-tag");
  DOM.waveformCanvas = document.getElementById("waveform-canvas");
  DOM.waveformBox = document.getElementById("waveform-interactive-box");
  DOM.waveformHoverTime = document.getElementById("waveform-hover-time");
  DOM.vizButtons = document.querySelectorAll(".viz-btn");
  DOM.historyList = document.getElementById("history-list");
  DOM.historyCount = document.getElementById("history-count");
  DOM.btnClearHistory = document.getElementById("btn-clear-history");
  DOM.toastContainer = document.getElementById("toast-container");
  DOM.shortcutsDialog = document.getElementById("shortcuts-dialog");
  DOM.btnShortcuts = document.getElementById("btn-shortcuts");
  DOM.btnCloseDialog = document.getElementById("btn-close-dialog");
}

function bindEvents() {
  // Live character & word stats
  DOM.textInput.addEventListener("input", () => {
    updateTextStats();
    if (!DOM.diffDrawer.classList.contains("hidden")) {
      updateLiveDiff();
    }
  });

  // Auto-punctuate tool
  DOM.btnAutoPunctuate.addEventListener("click", () => {
    const original = DOM.textInput.value.trim();
    if (!original) return;
    const validEndings = [".", "!", "?", ":", ";", "…"];
    let lines = original.split("\n").map((line) => {
      const stripped = line.trim();
      if (!stripped) return "";
      if (!validEndings.includes(stripped.slice(-1))) {
        return stripped + ".";
      }
      return stripped;
    });
    DOM.textInput.value = lines.join("\n");
    updateTextStats();
    showToast("Added punctuation for natural engine pauses", "success");
  });

  // Diff drawer toggle
  DOM.btnToggleDiff.addEventListener("click", () => {
    const isHidden = DOM.diffDrawer.classList.contains("hidden");
    if (isHidden) {
      DOM.diffDrawer.classList.remove("hidden");
      updateLiveDiff();
    } else {
      DOM.diffDrawer.classList.add("hidden");
    }
  });

  DOM.btnCloseDiff.addEventListener("click", () => {
    DOM.diffDrawer.classList.add("hidden");
  });

  // Preset chips
  document.querySelectorAll(".preset-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const presetKey = chip.getAttribute("data-preset");
      if (PRESETS[presetKey]) {
        DOM.textInput.value = PRESETS[presetKey];
        updateTextStats();
        if (!DOM.diffDrawer.classList.contains("hidden")) updateLiveDiff();
        DOM.textInput.focus();
        showToast("Preset script loaded", "success");
      }
    });
  });

  // Quick Action buttons (Paste, Clear)
  DOM.btnPaste.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        DOM.textInput.value = text;
        updateTextStats();
        if (!DOM.diffDrawer.classList.contains("hidden")) updateLiveDiff();
        showToast("Text pasted from clipboard", "success");
      }
    } catch (err) {
      showToast("Unable to read clipboard automatically. Please paste manually.", "error");
    }
  });

  DOM.btnClear.addEventListener("click", () => {
    DOM.textInput.value = "";
    updateTextStats();
    if (!DOM.diffDrawer.classList.contains("hidden")) updateLiveDiff();
    DOM.textInput.focus();
  });

  // Voice Filter Tabs
  DOM.filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      DOM.filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      state.activeFilter = tab.dataset.filter;
      applyVoiceFilters();
    });
  });

  // Voice Search Input
  DOM.voiceSearch.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    applyVoiceFilters();
  });

  // Mood Presets
  DOM.moodChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      DOM.moodChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const r = parseInt(chip.dataset.rate, 10);
      const p = parseInt(chip.dataset.pitch, 10);
      setProsody(r, p);
      showToast(`Mood applied: ${chip.textContent}`, "info");
    });
  });

  // Prosody Slider Handlers
  DOM.rateSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    setRateValue(val);
  });

  DOM.pitchSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    setPitchValue(val);
  });

  DOM.btnRateDown.addEventListener("click", () => {
    const current = parseInt(DOM.rateSlider.value, 10);
    const next = Math.max(-25, current - 2);
    DOM.rateSlider.value = next;
    setRateValue(next);
  });

  DOM.btnRateUp.addEventListener("click", () => {
    const current = parseInt(DOM.rateSlider.value, 10);
    const next = Math.min(25, current + 2);
    DOM.rateSlider.value = next;
    setRateValue(next);
  });

  DOM.btnPitchDown.addEventListener("click", () => {
    const current = parseInt(DOM.pitchSlider.value, 10);
    const next = Math.max(-25, current - 2);
    DOM.pitchSlider.value = next;
    setPitchValue(next);
  });

  DOM.btnPitchUp.addEventListener("click", () => {
    const current = parseInt(DOM.pitchSlider.value, 10);
    const next = Math.min(25, current + 2);
    DOM.pitchSlider.value = next;
    setPitchValue(next);
  });

  DOM.btnResetProsody.addEventListener("click", () => {
    setProsody(-5, -5);
    DOM.moodChips.forEach((c) => {
      c.classList.toggle("active", c.dataset.rate === "-5" && c.dataset.pitch === "-5");
    });
    showToast("Reset to recommended deep voice prosody (-5%, -5Hz)", "success");
  });

  // Visualizer Mode Picker
  DOM.vizButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      DOM.vizButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.visualizerMode = btn.dataset.mode;
      if (!state.isPlaying) {
        initWaveformCanvas();
      }
    });
  });

  // Interactive Waveform Scrubbing
  DOM.waveformBox.addEventListener("click", (e) => {
    if (!DOM.audio.duration) return;
    const rect = DOM.waveformBox.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    DOM.audio.currentTime = percentage * DOM.audio.duration;
  });

  DOM.waveformBox.addEventListener("mousemove", (e) => {
    if (!DOM.audio.duration) return;
    const rect = DOM.waveformBox.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const hoverSeconds = percentage * DOM.audio.duration;
    DOM.waveformHoverTime.textContent = formatTime(hoverSeconds);
    DOM.waveformHoverTime.style.left = `${clickX}px`;
    DOM.waveformHoverTime.classList.remove("hidden");
  });

  DOM.waveformBox.addEventListener("mouseleave", () => {
    DOM.waveformHoverTime.classList.add("hidden");
  });

  // Generate Button
  DOM.btnGenerate.addEventListener("click", handleGenerateAudio);

  // Audio Playback Controls
  DOM.btnPlayPause.addEventListener("click", togglePlayPause);
  DOM.btnReplay.addEventListener("click", () => {
    DOM.audio.currentTime = 0;
    DOM.audio.play();
  });

  DOM.btnLoop.addEventListener("click", () => {
    state.isLooping = !state.isLooping;
    DOM.audio.loop = state.isLooping;
    DOM.btnLoop.classList.toggle("active", state.isLooping);
    showToast(state.isLooping ? "Audio looping enabled" : "Audio looping disabled", "info");
  });

  DOM.btnCopyLink.addEventListener("click", () => {
    if (!state.currentText) return;
    navigator.clipboard.writeText(state.currentText);
    showToast("Script copied to clipboard", "success");
  });

  DOM.audio.addEventListener("timeupdate", updatePlaybackProgress);
  DOM.audio.addEventListener("loadedmetadata", () => {
    DOM.totalDuration.textContent = formatTime(DOM.audio.duration);
    DOM.seekSlider.max = DOM.audio.duration || 100;
  });
  DOM.audio.addEventListener("ended", onAudioEnded);
  DOM.audio.addEventListener("play", () => {
    state.isPlaying = true;
    updatePlayPauseIcons(true);
    startWaveformAnimation();
  });
  DOM.audio.addEventListener("pause", () => {
    state.isPlaying = false;
    updatePlayPauseIcons(false);
  });

  // Scrubber seeking
  DOM.seekSlider.addEventListener("input", (e) => {
    DOM.audio.currentTime = parseFloat(e.target.value);
  });

  // Playback speed
  DOM.playbackSpeed.addEventListener("change", (e) => {
    DOM.audio.playbackRate = parseFloat(e.target.value);
  });

  // Volume & Mute
  DOM.volumeSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    DOM.audio.volume = val;
    DOM.audio.muted = val === 0;
    updateVolumeIcon(DOM.audio.muted);
  });

  DOM.btnMute.addEventListener("click", () => {
    DOM.audio.muted = !DOM.audio.muted;
    if (DOM.audio.muted) {
      DOM.volumeSlider.value = 0;
    } else {
      DOM.volumeSlider.value = DOM.audio.volume || 1;
    }
    updateVolumeIcon(DOM.audio.muted);
  });

  // Shortcuts Dialog Modal Handlers
  if (DOM.btnShortcuts && DOM.shortcutsDialog) {
    DOM.btnShortcuts.addEventListener("click", () => {
      DOM.shortcutsDialog.showModal();
    });
  }

  if (DOM.btnCloseDialog && DOM.shortcutsDialog) {
    DOM.btnCloseDialog.addEventListener("click", () => {
      DOM.shortcutsDialog.close();
    });
  }

  const btnDialogOk = document.getElementById("btn-dialog-ok");
  if (btnDialogOk && DOM.shortcutsDialog) {
    btnDialogOk.addEventListener("click", () => {
      DOM.shortcutsDialog.close();
    });
  }

  if (DOM.shortcutsDialog) {
    // Close when clicking on backdrop
    DOM.shortcutsDialog.addEventListener("click", (e) => {
      const rect = DOM.shortcutsDialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        DOM.shortcutsDialog.close();
      }
    });
  }

  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // Escape key closes modal if open
    if (e.key === "Escape" && DOM.shortcutsDialog && DOM.shortcutsDialog.open) {
      e.preventDefault();
      DOM.shortcutsDialog.close();
      return;
    }

    // Ctrl + Enter or Cmd + Enter -> Generate
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerateAudio();
      return;
    }

    // Don't trigger single-key shortcuts when typing in inputs or when modal is open
    const isModalOpen = DOM.shortcutsDialog && DOM.shortcutsDialog.open;
    const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
    if (!isTyping && !isModalOpen) {
      if (e.key === " " && DOM.audio.src) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "r" || e.key === "R") {
        if (DOM.audio.src) {
          DOM.audio.currentTime = 0;
          DOM.audio.play();
        }
      } else if (e.key === "m" || e.key === "M") {
        DOM.btnMute.click();
      } else if (e.key === "?") {
        DOM.shortcutsDialog.showModal();
      }
    }
  });

  // History Clear
  DOM.btnClearHistory.addEventListener("click", () => {
    state.history = [];
    localStorage.removeItem("auravoice_history");
    renderHistory();
    showToast("Generation history cleared", "success");
  });
}

/**
 * Updates text stats: character count, word count, duration estimate
 */
function updateTextStats() {
  const text = DOM.textInput.value;
  const len = text.length;
  DOM.charCount.textContent = len.toLocaleString();

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  DOM.wordCount.textContent = `${words.toLocaleString()} ${words === 1 ? "word" : "words"}`;

  // Estimate speech duration (approx 135-145 wpm adjusted for rate)
  const rateMultiplier = 1 + parseInt(state.rate, 10) / 100;
  const effectiveWpm = Math.max(80, 140 * rateMultiplier);
  const estSeconds = Math.round((words / effectiveWpm) * 60);
  DOM.speechEstimate.textContent = `⏱ ~${estSeconds}s`;

  if (len > 1000) {
    DOM.charCount.classList.add("warning");
    DOM.lengthWarning.classList.remove("hidden");
  } else {
    DOM.charCount.classList.remove("warning");
    DOM.lengthWarning.classList.add("hidden");
  }
}

/**
 * Live Normalization Preview
 */
async function updateLiveDiff() {
  const raw = DOM.textInput.value;
  if (!raw.trim()) {
    DOM.diffContent.textContent = "Type your script to see live normalized pronunciation...";
    return;
  }
  try {
    const res = await fetch("/api/normalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: raw }),
    });
    if (res.ok) {
      const data = await res.json();
      DOM.diffContent.textContent = data.normalized;
    }
  } catch (e) {
    // Client-side quick preview fallback
    DOM.diffContent.textContent = raw.replace(/\be\.g\./gi, "for example").replace(/\bw\//g, "with");
  }
}

function setProsody(r, p) {
  DOM.rateSlider.value = r;
  setRateValue(r);
  DOM.pitchSlider.value = p;
  setPitchValue(p);
}

function setRateValue(val) {
  const sign = val >= 0 ? "+" : "";
  state.rate = `${sign}${val}%`;
  let label = "Default";
  if (val < -15) label = "Very Slow";
  else if (val < 0) label = "Unhurried";
  else if (val === 0) label = "Standard";
  else if (val > 15) label = "Very Fast";
  else label = "Brisk";
  DOM.rateValue.textContent = `${state.rate} (${label})`;
  updateTextStats();
}

function setPitchValue(val) {
  const sign = val >= 0 ? "+" : "";
  state.pitch = `${sign}${val}Hz`;
  let label = "Default";
  if (val < -15) label = "Deepest";
  else if (val < 0) label = "Deep & Warm";
  else if (val === 0) label = "Natural";
  else if (val > 15) label = "Brightest";
  else label = "Higher";
  DOM.pitchValue.textContent = `${state.pitch} (${label})`;
}

/**
 * Loads curated voice shortlist from FastAPI backend
 */
async function loadVoices() {
  try {
    const res = await fetch("/api/voices");
    if (!res.ok) throw new Error("Failed to fetch voices");
    const data = await res.json();
    state.voices = data.voices || [];
    state.selectedVoiceId = data.default_voice || "en-US-GuyNeural";
    applyVoiceFilters();
  } catch (err) {
    console.error("Error loading voices:", err);
    state.voices = [
      { id: "en-US-GuyNeural", name: "Guy (US)", gender: "Male", locale: "en-US", tag: "Deep & Clear", description: "Warm, clear, and resonant baritone.", is_default: true },
      { id: "en-GB-RyanNeural", name: "Ryan (UK)", gender: "Male", locale: "en-GB", tag: "Warm & Resonant", description: "Deep British accent with sophisticated pacing." },
      { id: "en-US-ChristopherNeural", name: "Christopher (US)", gender: "Male", locale: "en-US", tag: "Smooth & Authoritative", description: "Confident, broadcast-quality male voice." },
      { id: "en-GB-ThomasNeural", name: "Thomas (UK)", gender: "Male", locale: "en-GB", tag: "Rich & Distinguished", description: "Classic British tone with rich acoustic depth." },
      { id: "en-US-JennyNeural", name: "Jenny (US)", gender: "Female", locale: "en-US", tag: "Natural & Friendly", description: "Clear, engaging, and articulate female voice." },
      { id: "en-US-AriaNeural", name: "Aria (US)", gender: "Female", locale: "en-US", tag: "Expressive & Polished", description: "Crisp, versatile voice ideal for storytelling." },
      { id: "en-GB-SoniaNeural", name: "Sonia (UK)", gender: "Female", locale: "en-GB", tag: "Calm & Articulate", description: "Poised and melodic British female voice." },
    ];
    applyVoiceFilters();
  }
}

/**
 * Filters and searches voices
 */
function applyVoiceFilters() {
  state.filteredVoices = state.voices.filter((v) => {
    // Filter tag match
    if (state.activeFilter === "male" && v.gender.toLowerCase() !== "male") return false;
    if (state.activeFilter === "female" && v.gender.toLowerCase() !== "female") return false;
    if (state.activeFilter === "us" && !v.locale.toLowerCase().includes("us")) return false;
    if (state.activeFilter === "uk" && !v.locale.toLowerCase().includes("gb")) return false;

    // Search query match
    if (state.searchQuery) {
      const q = state.searchQuery;
      const match =
        v.name.toLowerCase().includes(q) ||
        v.tag.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.locale.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  renderVoiceCards();
}

/**
 * Renders voice selection cards in grid with Audition Button
 */
function renderVoiceCards() {
  DOM.voiceGrid.innerHTML = "";

  if (state.filteredVoices.length === 0) {
    DOM.voiceGrid.innerHTML = `<div class="empty-history-hint" style="grid-column: 1/-1;">No voices matching your filter.</div>`;
    return;
  }

  state.filteredVoices.forEach((v) => {
    const isSelected = v.id === state.selectedVoiceId;
    const isAuditioning = state.currentlyAuditioningId === v.id;
    const card = document.createElement("div");
    card.className = `voice-card ${v.gender.toLowerCase()} ${isSelected ? "selected" : ""}`;
    card.setAttribute("role", "radio");
    card.setAttribute("aria-checked", isSelected ? "true" : "false");
    card.setAttribute("tabindex", "0");
    card.dataset.voiceId = v.id;

    card.innerHTML = `
      <div class="voice-card-top">
        <span class="voice-name">${v.name}</span>
        <span class="voice-badge-tag">${v.tag}</span>
      </div>
      <p class="voice-desc">${v.description}</p>
      <div class="voice-card-bottom">
        <div class="voice-meta">
          <span>${v.locale}</span> &bull; <span>${v.gender}</span>
        </div>
        <button type="button" class="btn-preview-voice ${isAuditioning ? "playing" : ""}" title="Audition 2-second sample">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          <span>${isAuditioning ? "Playing..." : "Audition"}</span>
        </button>
      </div>
    `;

    const selectThisVoice = () => {
      state.selectedVoiceId = v.id;
      document.querySelectorAll(".voice-card").forEach((c) => {
        c.classList.remove("selected");
        c.setAttribute("aria-checked", "false");
      });
      card.classList.add("selected");
      card.setAttribute("aria-checked", "true");
    };

    card.addEventListener("click", (e) => {
      // Don't select if preview button was clicked
      if (e.target.closest(".btn-preview-voice")) return;
      selectThisVoice();
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target.closest(".btn-preview-voice")) return;
        e.preventDefault();
        selectThisVoice();
      }
    });

    // Audition preview handler
    const btnPreview = card.querySelector(".btn-preview-voice");
    btnPreview.addEventListener("click", (e) => {
      e.stopPropagation();
      handleAuditionVoice(v.id, v.name);
    });

    DOM.voiceGrid.appendChild(card);
  });
}

/**
 * Auditions a voice sample
 */
async function handleAuditionVoice(voiceId, voiceName) {
  if (state.currentlyAuditioningId === voiceId) {
    DOM.previewAudio.pause();
    state.currentlyAuditioningId = null;
    renderVoiceCards();
    return;
  }

  state.currentlyAuditioningId = voiceId;
  renderVoiceCards();

  const phrase = AUDITION_PHRASES[voiceId] || `Hello! This is ${voiceName} speaking.`;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: phrase,
        voice: voiceId,
        rate: state.rate,
        pitch: state.pitch,
      }),
    });

    if (!res.ok) throw new Error("Preview generation failed.");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    DOM.previewAudio.src = url;
    DOM.previewAudio.onended = () => {
      state.currentlyAuditioningId = null;
      renderVoiceCards();
    };
    DOM.previewAudio.play();
  } catch (err) {
    state.currentlyAuditioningId = null;
    renderVoiceCards();
    showToast("Could not audition voice sample.", "error");
  }
}

/**
 * Generates audio via POST /api/tts
 */
async function handleGenerateAudio() {
  const text = DOM.textInput.value.trim();
  if (!text) {
    showToast("Please enter some text to synthesize.", "error");
    DOM.textInput.focus();
    return;
  }

  setGeneratingState(true);

  try {
    const payload = {
      text: text,
      voice: state.selectedVoiceId,
      rate: state.rate,
      pitch: state.pitch,
    };

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMsg = "Speech synthesis failed.";
      try {
        const errJson = await response.json();
        if (errJson.detail) errorMsg = errJson.detail;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const voiceUsed = response.headers.get("X-Voice-Used") || state.selectedVoiceId;

    setupAudioPlayback(blob, text, voiceUsed);
    showToast("Voice generated successfully!", "success");
  } catch (err) {
    console.error("Synthesis error:", err);
    showToast(err.message || "Failed to generate audio.", "error");
  } finally {
    setGeneratingState(false);
  }
}

/**
 * Loads audio blob into player and updates history
 */
function setupAudioPlayback(blob, text, voiceId) {
  if (state.currentAudioUrl) {
    URL.revokeObjectURL(state.currentAudioUrl);
  }

  state.currentBlob = blob;
  state.currentText = text;
  state.currentAudioUrl = URL.createObjectURL(blob);

  DOM.audio.src = state.currentAudioUrl;
  DOM.btnDownload.href = state.currentAudioUrl;
  DOM.btnDownload.download = `auravoice_${voiceId}_${Date.now()}.mp3`;

  DOM.emptyPlayerState.classList.add("hidden");
  DOM.activePlayer.classList.remove("hidden");
  DOM.playerContainer.classList.remove("empty-state");

  const voiceObj = state.voices.find((v) => v.id === voiceId);
  DOM.playerVoiceTag.textContent = voiceObj ? `${voiceObj.name} (${voiceObj.tag})` : voiceId;
  DOM.playerProsodyTag.textContent = `${state.rate} rate • ${state.pitch} pitch`;
  DOM.playerTimeTag.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  initAudioNodes();

  // Autoplay generated take
  DOM.audio.play().catch(() => {});

  // Save to history
  addToHistory({
    id: Date.now(),
    text: text,
    voiceId: voiceId,
    voiceName: voiceObj ? voiceObj.name : voiceId,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    blobUrl: state.currentAudioUrl,
  });
}

function setGeneratingState(isGenerating) {
  DOM.btnGenerate.disabled = isGenerating;
  const defaultSpan = DOM.btnGenerate.querySelector(".default-state");
  const loadingSpan = DOM.btnGenerate.querySelector(".loading-state");

  if (isGenerating) {
    defaultSpan.classList.add("hidden");
    loadingSpan.classList.remove("hidden");
  } else {
    defaultSpan.classList.remove("hidden");
    loadingSpan.classList.add("hidden");
  }
}

function togglePlayPause() {
  if (!DOM.audio.src) return;
  if (DOM.audio.paused) {
    DOM.audio.play();
  } else {
    DOM.audio.pause();
  }
}

function updatePlayPauseIcons(isPlaying) {
  if (isPlaying) {
    DOM.playIcon.classList.add("hidden");
    DOM.pauseIcon.classList.remove("hidden");
    DOM.btnPlayPause.setAttribute("aria-label", "Pause audio");
  } else {
    DOM.playIcon.classList.remove("hidden");
    DOM.pauseIcon.classList.add("hidden");
    DOM.btnPlayPause.setAttribute("aria-label", "Play audio");
  }
}

function updatePlaybackProgress() {
  if (!DOM.audio.duration) return;
  DOM.seekSlider.value = DOM.audio.currentTime;
  DOM.currentTime.textContent = formatTime(DOM.audio.currentTime);
}

function onAudioEnded() {
  if (!state.isLooping) {
    state.isPlaying = false;
    updatePlayPauseIcons(false);
    DOM.seekSlider.value = 0;
    DOM.currentTime.textContent = formatTime(0);
  }
}

function updateVolumeIcon(isMuted) {
  if (isMuted) {
    DOM.volHighIcon.classList.add("hidden");
    DOM.volMuteIcon.classList.remove("hidden");
  } else {
    DOM.volHighIcon.classList.remove("hidden");
    DOM.volMuteIcon.classList.add("hidden");
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Web Audio API & Multi-Mode Waveform Visualizer
 */
function initAudioNodes() {
  if (state.audioContext) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    state.audioContext = new AudioCtx();
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 128;

    state.sourceNode = state.audioContext.createMediaElementSource(DOM.audio);
    state.sourceNode.connect(state.analyser);
    state.analyser.connect(state.audioContext.destination);
  } catch (err) {
    console.warn("Web Audio API not supported or already connected:", err);
  }
}

function initWaveformCanvas() {
  const canvas = DOM.waveformCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  drawIdleWaveform(ctx, canvas.width, canvas.height);
}

function drawIdleWaveform(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  const numBars = 52;
  const barWidth = width / numBars - 3;
  const centerY = height / 2;

  for (let i = 0; i < numBars; i++) {
    const x = i * (barWidth + 3);
    const waveFactor = Math.sin((i / numBars) * Math.PI);
    const barHeight = Math.max(4, waveFactor * 26 + Math.sin(i * 0.4) * 6);

    ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
    ctx.beginPath();
    ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 2);
    ctx.fill();
  }
}

function startWaveformAnimation() {
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
  }

  const canvas = DOM.waveformCanvas;
  const ctx = canvas.getContext("2d");
  const bufferLength = state.analyser ? state.analyser.frequencyBinCount : 64;
  const dataArray = new Uint8Array(bufferLength);

  let phase = 0;

  function renderFrame() {
    state.animationFrameId = requestAnimationFrame(renderFrame);

    if (state.audioContext && state.audioContext.state === "suspended") {
      state.audioContext.resume();
    }

    if (state.analyser && state.isPlaying) {
      state.analyser.getByteFrequencyData(dataArray);
    }

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const mode = state.visualizerMode;
    phase += 0.05;

    if (mode === "bars") {
      // 1. EQUALIZER BARS MODE
      const numBars = 52;
      const barWidth = width / numBars - 3;
      const centerY = height / 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 3);
        let intensity = 0.1;

        if (state.isPlaying && state.analyser) {
          const binIndex = Math.floor((i / numBars) * bufferLength);
          intensity = (dataArray[binIndex] || 0) / 255;
        } else if (state.isPlaying) {
          intensity = (Math.sin(phase + i * 0.3) + 1) * 0.4;
        }

        const barHeight = Math.max(6, intensity * (height - 16));

        const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
        gradient.addColorStop(0, "#fbbf24");
        gradient.addColorStop(0.5, "#f59e0b");
        gradient.addColorStop(1, "#d97706");

        ctx.fillStyle = state.isPlaying ? gradient : "rgba(245, 158, 11, 0.25)";
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 3);
        ctx.fill();
      }
    } else if (mode === "wave") {
      // 2. SMOOTH SINE WAVE / OSCILLOSCOPE MODE
      const centerY = height / 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let x = 0; x < width; x += 4) {
        const i = Math.floor((x / width) * bufferLength);
        const amp = state.isPlaying ? (dataArray[i] / 255) * (height / 2.5) : 8;
        const y = centerY + Math.sin(x * 0.04 + phase) * amp;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(245, 158, 11, 0.7)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    } else if (mode === "spectrum") {
      // 3. STEREO SPECTRUM MODE
      const numBars = 40;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        const binIndex = Math.floor((i / numBars) * bufferLength);
        const val = state.isPlaying ? dataArray[binIndex] / 255 : 0.1;
        const barH = Math.max(4, val * (height - 10));

        const grad = ctx.createLinearGradient(0, height, 0, height - barH);
        grad.addColorStop(0, "#d97706");
        grad.addColorStop(0.6, "#f59e0b");
        grad.addColorStop(1, "#fde68a");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, height - barH, barWidth, barH, 2);
        ctx.fill();
      }
    }

    if (!state.isPlaying) {
      cancelAnimationFrame(state.animationFrameId);
      drawIdleWaveform(ctx, width, height);
    }
  }

  renderFrame();
}

/**
 * Generation History Management
 */
function addToHistory(item) {
  state.history.unshift(item);
  if (state.history.length > 10) state.history.pop();
  try {
    const serializable = state.history.map((h) => ({
      id: h.id,
      text: h.text,
      voiceId: h.voiceId,
      voiceName: h.voiceName,
      timestamp: h.timestamp,
    }));
    localStorage.setItem("auravoice_history", JSON.stringify(serializable));
  } catch (e) {}
  renderHistory();
}

function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem("auravoice_history");
    if (raw) {
      state.history = JSON.parse(raw);
      renderHistory();
    }
  } catch (e) {}
}

function renderHistory() {
  DOM.historyCount.textContent = state.history.length;
  if (!state.history || state.history.length === 0) {
    DOM.historyList.innerHTML = '<div class="empty-history-hint">Your generated voice takes will appear here.</div>';
    return;
  }

  DOM.historyList.innerHTML = "";
  state.history.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div class="history-item-left">
        <span class="history-snippet" title="${item.text}">${item.text}</span>
        <div class="history-meta">
          <span>${item.voiceName}</span> &bull;
          <span>${item.timestamp}</span>
        </div>
      </div>
      <div class="history-actions">
        <button type="button" class="btn-history-action btn-reuse-text" title="Reuse text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
        </button>
      </div>
    `;

    div.querySelector(".btn-reuse-text").addEventListener("click", () => {
      DOM.textInput.value = item.text;
      updateTextStats();
      if (item.voiceId) {
        state.selectedVoiceId = item.voiceId;
        renderVoiceCards();
      }
      showToast("Script restored from history", "success");
    });

    DOM.historyList.appendChild(div);
  });
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    toast.style.transition = "all 0.25s ease-out";
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}
