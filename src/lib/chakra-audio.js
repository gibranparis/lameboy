// Lightweight Web Audio bell chimes for the 7 chakras.
// No external audio files needed.

let _ctx = null;

export function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

// Pleasant, simple mapping (musical, not “official” frequencies).
// Root→C3 up to Crown→C4.
const CHAKRA_FREQS = [
  130.81, // Root  (C3)
  146.83, // Sacral(D3)
  164.81, // Solar (E3)
  174.61, // Heart (F3 slightly higher ~F3)
  196.00, // Throat(G3)
  220.00, // Third Eye (A3)
  261.63, // Crown (C4)
];

// Create a soft bell tone with a quick bright onset and smooth decay.
function playBell(ctx, freq = 220, when = 0, duration = 1.2) {
  const attack = 0.02;
  const decay = Math.max(0.6, duration * 0.8); // ring out a bit
  const end = when + attack + decay;

  // Master gain (envelope)
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.6, when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  // Fundamental
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, when);

  // A quiet upper partial for belliness
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.71, when); // inharmonic-ish

  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0.9, when);

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.25, when);

  osc1.connect(g1).connect(gain);
  osc2.connect(g2).connect(gain);

  // Very light high-cut so it’s not harsh
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(8000, when);
  filter.Q.setValueAtTime(0.7, when);

  gain.connect(filter).connect(ctx.destination);

  osc1.start(when);
  osc2.start(when);
  osc1.stop(end);
  osc2.stop(end);
}

// Public API: schedule all seven chimes with provided delays
export function scheduleChakraChimes(delaysSec = [], baseDuration = 1.2) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Ensure the context is running (Submit click counts as user gesture)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime + 0.02; // tiny offset for safety

  delaysSec.slice(0, 7).forEach((delay, i) => {
    const when = now + (delay || 0);
    const freq = CHAKRA_FREQS[i] || CHAKRA_FREQS[CHAKRA_FREQS.length - 1];
    playBell(ctx, freq, when, baseDuration);
  });
}
