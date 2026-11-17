// WebAudio synthesizer for Bloomkeeper sound effects.
// Lazily initialized on first user gesture, fully guarded in try/catch.

let audioCtx = null;
let muted = false;

function getContext() {
  if (audioCtx) return audioCtx;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function playTone(freqStart, freqEnd, duration, type = 'sine', gainVal = 0.1) {
  if (muted) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors
  }
}

export const audio = {
  fire() {
    playTone(600, 200, 0.08, 'triangle', 0.08);
  },
  pop() {
    playTone(300, 800, 0.12, 'sine', 0.12);
  },
  pickup() {
    playTone(440, 880, 0.1, 'sine', 0.1);
  },
  burst() {
    playTone(150, 50, 0.5, 'sawtooth', 0.2);
  },
  hit() {
    playTone(120, 40, 0.25, 'sawtooth', 0.18);
  }
};
