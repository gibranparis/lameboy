'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Right-side hover should activate Florida and clicking goes to /login */

export default function BannedCard() {
  const router = useRouter();
  const [hot, setHot] = useState(false); // hover highlight for Florida

  return (
    <>
      {/* RIGHT half hover/click area */}
      <div
        className="hover-zone right"
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        onClick={() => router.push('/login')}
        aria-hidden="true"
      />

      <div className="page-center">
        {/* blue code bubble */}
        <div className="vscode-card card-ultra-tight slide-in-right">
          <div className="code-line">
            <span className="code-comment">// </span>
            <span className="code-comment lameboy-glow">LAMEBOY.COM</span>
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
        </div>

        {/* Florida label */}
        <button
          type="button"
          className={`ghost-btn florida-link ${hot ? 'is-hot' : ''}`}
          onClick={() => router.push('/login')}
          style={{ marginLeft: 14 }}
        >
          Florida, USA
        </button>
      </div>
    </>
  );
}
