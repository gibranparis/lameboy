'use client';

import { useState } from 'react';

export default function BannedCard() {
  const [mode, setMode] = useState("banned"); // "banned" | "login"

  const floridaBtn = (
    <button
      type="button"
      onClick={() => setMode(mode === "banned" ? "login" : "banned")}
      className="text-xs vscode-muted hover:text-white transition underline-offset-4 hover:underline"
      aria-label="Florida, USA"
    >
      Florida, USA
    </button>
  );

  const leftCodeCard = (
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

  const rightLoginCard = (
    <div className="vscode-card p-4 rounded-xl" style={{ maxWidth: 360, minWidth: 300 }}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs vscode-muted mb-1">Email</label>
          <input className="login-input" type="email" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-xs vscode-muted mb-1">Phone number</label>
          <input className="login-input" type="tel" placeholder="+1 305 555 0123" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-center">
      <div className="flex items-center gap-8">
        {mode === "banned" ? (
          <>
            {leftCodeCard}
            {floridaBtn}
          </>
        ) : (
          <>
            {floridaBtn}
            {rightLoginCard}
          </>
        )}
      </div>
    </div>
  );
}
