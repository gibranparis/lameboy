'use client';

import { useState } from 'react';

export default function BannedCard() {
  const [mode, setMode] = useState("banned"); // "banned" | "login"

  const FloridaButton = (
    <button
      type="button"
      className="ghost-btn text-xs"
      onClick={() => setMode(mode === "banned" ? "login" : "banned")}
      aria-label="Florida, USA"
    >
      Florida, USA
    </button>
  );

  const CodeCard = (
    <div className="vscode-card p-4 rounded-xl" style={{ maxWidth: 360 }}>
      <div className="text-sm leading-7">
        <div className="code-comment">// LAMEBOY.COM</div>
        <div className="code-comment">// is banned</div>
        <div className="mt-2 caret">
          <span className="code-keyword">console</span>
          <span>.</span>
          <span className="code-keyword">log</span>
          <span>(</span>
          <span className="code-string">"hi..."</span>
          <span>);</span>
        </div>
      </div>
    </div>
  );

  const LoginCard = (
    <div className="vscode-card p-4 rounded-xl" style={{ maxWidth: 360, minWidth: 300 }}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs" style={{ color: 'var(--muted)' }}>Email</label>
          <input className="login-input" type="email" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-xs" style={{ color: 'var(--muted)' }}>Phone number</label>
          <input className="login-input" type="tel" placeholder="+1 305 555 0123" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-center">
      {/* Always a single horizontal row (no wrapping) */}
      <div className="row-nowrap">
        {mode === "banned" ? (
          <>
            {CodeCard}
            {FloridaButton}  {/* on the RIGHT of the code card */}
          </>
        ) : (
          <>
            {FloridaButton}  {/* shift to LEFT */}
            {LoginCard}      {/* new bubble on the RIGHT */}
          </>
        )}
      </div>
    </div>
  );
}
