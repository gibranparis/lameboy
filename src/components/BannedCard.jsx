'use client';

import { useState } from 'react';

/**
 * Keep this component focused on markup so it can prerender.
 * Any effects/audio run only on the client (not needed for the build crash).
 */

// Right-to-left (crown → root). We avoid iterating numbers entirely.
const CHAKRA_BANDS = [
  'chakra-crown',
  'chakra-thirdeye',
  'chakra-throat',
  'chakra-heart',
  'chakra-plexus',
  'chakra-sacral',
  'chakra-root',
];

export default function BannedCard() {
  // minimal state to keep SSR safe
  const [showCascade, setShowCascade] = useState(false);

  return (
    <div className="page-center">
      {/* blue bubble */}
      <div className="vscode-card card-ultra-tight slide-in-right">
        <div className="code-line">
          <span className="code-comment">// </span>
          <span className="code-comment">LAMEBOY.COM</span>
        </div>
        <div className="code-line">
          <span className="code-comment">// </span>
          <span className="code-banned">is banned</span>
        </div>
        <div className="code-line">
          <span className="code-keyword">console</span>
          <span className="code-punc">.</span>
          <span className="code-var">log</span>
          <span className="code-punc">(</span>
          <span className="code-string">"hi..."</span>
          <span className="code-punc">);</span>
        </div>

        {/* just a demo toggle so you can still flip cascade on SSR preview */}
        <button className="commit-btn" onClick={() => setShowCascade(s => !s)} style={{ marginTop: 8 }}>
          {showCascade ? 'Hide cascade' : 'Show cascade'}
        </button>
      </div>

      {/* location */}
      <button className="ghost-btn florida-link" style={{ marginLeft: 14 }}>
        Florida, USA
      </button>

      {/* Chakra overlay (server-safe mapping) */}
      {showCascade && (
        <div className="chakra-overlay">
          {CHAKRA_BANDS.map((cls, i) => (
            <div key={cls} className={`chakra-band band-${i + 1} ${cls}`} />
          ))}
        </div>
      )}
    </div>
  );
}
