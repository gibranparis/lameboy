// Client-only tiny synth for chakra tones (Web Audio)
export function playChakraSequenceRTL() {
  if (typeof window === 'undefined') return Promise.resolve();

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return Promise.resolve();

  // Re-use a single context
  const ctx = (window.__lbAudioCtx ||= new AudioCtx());

  const done = (async () => {
    try { await ctx.resume(); } catch {}

    // RTL (violet→red): crown, third eye, throat, heart, plexus, sacral, root
    // B4, A4, G4, F4, E4, D4, C4
    const freqs = [493.88, 440.0, 392.0, 349.23, 329.63, 293.66, 261.63];

    const now = ctx.currentTime + 0.03;
    const step = 0.18;  // matches CSS band stagger
    const dur  = 0.48;  // per tone
    const peak = 0.06;  // gain peak

    freqs.forEach((f, i) => {
      const start = now + i * step;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      // Soft A/D envelope
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });

    // resolve when the last tone ends
    const total = (freqs.length - 1) * step + dur + 0.06;
    await new Promise((r) => setTimeout(r, total * 1000));
  })();

  return done;
}
