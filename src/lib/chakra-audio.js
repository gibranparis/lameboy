// src/lib/chakra-audio.js
// Web Audio bell chimes for 7 chakras with tunable params

let _ctx = null;

export function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

// Musical, pleasant base mapping (Root→C3 up to Crown→C4)
const BASE_FREQS = [
  130.81, // Root  (C3)
  146.83, // Sacral(D3)
  164.81, // Solar (E3)
  174.61, // Heart (F3-ish)
  196.00, // Throat(G3)
  220.00, // Third Eye (A3)
  261.63, // Crown (C4)
];

export const DEFAULTS = {
  // timing
  attack: 0.02,          // seconds to ramp up
  decay: 1.2,            // seconds to ring out
  // tone & brightness
  filterHz: 8000,
  filterQ: 0.7,
  partialRatio: 2.71,    // inharmonic overtone factor
  partialLevel: 0.25,    // overtone loudness 0..1
  // pitch
  octave: 0,             // +1 = one octave up, -1 = one down
  freqs: BASE_FREQS,     // override with custom array if you like
  // loudness
  noteGain: 0.6,         // per-note peak
  masterGain: 0.8,       // overall output
};

function shiftOctave(freq, oct = 0) {
  return freq * Math.pow(2, oct);
}

function makeMaster(ctx, gainValue) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainValue, ctx.currentTime);
  g.connect(ctx.destination);
  return g;
}

/**
 * Create one bell note with a simple envelope and subtle overtone.
 */
function playBell(ctx, {
  freq = 220,
  when = 0,
  attack = DEFAULTS.attack,
  decay  = DEFAULTS.decay,
  filterHz = DEFAULTS.filterHz,
  filterQ  = DEFAULTS.filterQ,
  partialRatio = DEFAULTS.partialRatio,
  partialLevel = DEFAULTS.partialLevel,
  noteGain = DEFAULTS.noteGain,
  masterNode,
}) {
  const end = when + attack + decay;

  // Envelope (per-note)
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(Math.max(0.001, noteGain), when + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, end);

  // Oscillators
  const oscFund = ctx.createOscillator();
  oscFund.type = 'sine';
  oscFund.frequency.setValueAtTime(freq, when);

  const oscPart = ctx.createOscillator();
  oscPart.type = 'sine';
  oscPart.frequency.setValueAtTime(freq * partialRatio, when);

  const gFund = ctx.createGain();
  gFund.gain.setValueAtTime(1.0, when);

  const gPart = ctx.createGain();
  gPart.gain.setValueAtTime(Math.max(0, Math.min(1, partialLevel)), when);

  // Gentle top filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterHz, when);
  filter.Q.setValueAtTime(filterQ, when);

  // Wire up
  oscFund.connect(gFund).connect(env);
  oscPart.connect(gPart).connect(env);
  env.connect(filter).connect(masterNode || ctx.destination);

  // Lifetimes
  oscFund.start(when);
  oscPart.start(when);
  oscFund.stop(end);
  oscPart.stop(end);
}

/**
 * Schedule all seven chimes to align with visual delays.
 * @param {number[]} delaysSec - length 7, seconds, when to start each note
 * @param {object} opts - overrides from DEFAULTS + { duration?: number }
 */
export function scheduleChakraChimes(delaysSec = [], opts = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Ensure the context is running (Submit click counts as user gesture)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const {
    attack = DEFAULTS.attack,
    decay  = DEFAULTS.decay,
    filterHz = DEFAULTS.filterHz,
    filterQ  = DEFAULTS.filterQ,
    partialRatio = DEFAULTS.partialRatio,
    partialLevel = DEFAULTS.partialLevel,
    octave = DEFAULTS.octave,
    freqs = DEFAULTS.freqs,
    noteGain = DEFAULTS.noteGain,
    masterGain = DEFAULTS.masterGain,
    // convenience: if you pass duration, it sets decay (after attack)
    duration,
  } = opts;

  const finalDecay = typeof duration === 'number' ? Math.max(0.2, duration - attack) : decay;

  // Master gain
  const master = makeMaster(ctx, Math.max(0, Math.min(1, masterGain)));

  const now = ctx.currentTime + 0.02; // tiny scheduling offset
  const arr = delaysSec.slice(0, 7);

  arr.forEach((delay, i) => {
    const when = now + (delay || 0);
    const baseFreq = freqs[i] ?? freqs[freqs.length - 1] ?? 220;
    const f = shiftOctave(baseFreq, octave);
    playBell(ctx, {
      freq: f,
      when,
      attack,
      decay: finalDecay,
      filterHz,
      filterQ,
      partialRatio,
      partialLevel,
      noteGain,
      masterNode: master,
    });
  });
}
