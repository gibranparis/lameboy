// Web Audio bell chimes for 7 chakras with tunable params

let _ctx = null;

export function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

// Pleasant base mapping Root→C3 up to Crown→C4
const BASE_FREQS = [130.81,146.83,164.81,174.61,196.00,220.00,261.63];

export const DEFAULTS = {
  attack: 0.02,
  decay: 1.2,
  filterHz: 8000,
  filterQ: 0.7,
  partialRatio: 2.71,
  partialLevel: 0.25,
  octave: 0,
  freqs: BASE_FREQS,
  noteGain: 0.6,
  masterGain: 0.8,
};

function shiftOctave(freq, oct = 0) { return freq * Math.pow(2, oct); }

function makeMaster(ctx, gainValue) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainValue, ctx.currentTime);
  g.connect(ctx.destination);
  return g;
}

function playBell(ctx, {
  freq = 220, when = 0,
  attack = DEFAULTS.attack, decay = DEFAULTS.decay,
  filterHz = DEFAULTS.filterHz, filterQ = DEFAULTS.filterQ,
  partialRatio = DEFAULTS.partialRatio, partialLevel = DEFAULTS.partialLevel,
  noteGain = DEFAULTS.noteGain, masterNode,
}) {
  const end = when + attack + decay;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(Math.max(0.001, noteGain), when + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, end);

  const oscFund = ctx.createOscillator();
  oscFund.type = 'sine';
  oscFund.frequency.setValueAtTime(freq, when);

  const oscPart = ctx.createOscillator();
  oscPart.type = 'sine';
  oscPart.frequency.setValueAtTime(freq * partialRatio, when);

  const gFund = ctx.createGain(); gFund.gain.setValueAtTime(1.0, when);
  const gPart = ctx.createGain(); gPart.gain.setValueAtTime(Math.max(0, Math.min(1, partialLevel)), when);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterHz, when);
  filter.Q.setValueAtTime(filterQ, when);

  oscFund.connect(gFund).connect(env);
  oscPart.connect(gPart).connect(env);
  env.connect(filter).connect(masterNode || ctx.destination);

  oscFund.start(when); oscPart.start(when);
  oscFund.stop(end);   oscPart.stop(end);
}

export function scheduleChakraChimes(delaysSec = [], opts = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); }

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
    duration,
  } = opts;

  const finalDecay = typeof duration === 'number' ? Math.max(0.2, duration - attack) : decay;
  const master = makeMaster(ctx, Math.max(0, Math.min(1, masterGain)));
  const now = ctx.currentTime + 0.02;

  delaysSec.slice(0,7).forEach((delay, i) => {
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
