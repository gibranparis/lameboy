// src/components/Maintenance.jsx
'use client';

import React from 'react';

export default function Maintenance() {
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [allowEmail, setAllowEmail] = React.useState(true);
  const [allowSMS, setAllowSMS] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  const [err, setErr] = React.useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, phone, allowEmail, allowSMS }),
      });
      if (!r.ok) throw new Error('Failed to save');
      setOk(true);
      setEmail('');
      setPhone('');
      setAllowSMS(false);
    } catch (e) {
      setErr('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="vscode-screen">
      <div className="wrap">
        {/* code panel */}
        <div className="panel code">
          <div className="accent" />
          <pre className="codeText">
            <span className="cmt">// LAMEBOY.COM</span>{'\n'}
            <span className="cmt">// is banned for now</span>{'\n\n'}
            <span className="purple">console</span>
            <span className="text">.</span>
            <span className="blue">log</span>
            <span className="text">(</span>
            <span className="string">"🚧..."</span>
            <span className="text">)</span>
            <span className="text">;</span>
            <span className="cursor" />
          </pre>
        </div>

        {/* form panel */}
        <form className="panel form" onSubmit={onSubmit}>
          <div className="grid">
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Phone</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+1 555 555 5555"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={allowEmail}
              onChange={(e) => setAllowEmail(e.target.checked)}
            />
            <span>I agree to receive email updates.</span>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={allowSMS}
              onChange={(e) => setAllowSMS(e.target.checked)}
            />
            <span>I agree to receive SMS (US only, msg &amp; data rates may apply).</span>
          </label>

          <div className="actions">
            <button className="enter" disabled={busy || !email || !allowEmail}>
              {busy ? '…' : 'Enter'}
            </button>
            {ok && <span className="ok">Saved.</span>}
            {err && <span className="err">{err}</span>}
          </div>
        </form>

        <p className="foot">Florida, USA</p>
      </div>

      <style jsx>{`
        /* uses variables from globals.css (we set these earlier) */
        .vscode-screen {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: var(--bg, #0b1117);
          color: var(--fg, #e5e7eb);
          font-family: var(--mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);
        }
        .wrap { width: min(720px, 92vw); display: grid; gap: 16px; }
        .panel {
          position: relative;
          background: var(--panel, #0f141a);
          border: 1px solid var(--panel-border, #1f2937);
          border-radius: 12px;
          box-shadow: 0 6px 22px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.02);
        }
        .panel:focus-within,
        .panel:hover { box-shadow:
            0 6px 22px rgba(0,0,0,.45),
            inset 0 0 0 1px rgba(255,255,255,.02),
            0 0 0 2px var(--ring, #2b85f0); }

        /* blue trim (exact) */
        .accent {
          position:absolute; inset:-1px;
          border-radius:12px;
          pointer-events:none;
          box-shadow: 0 0 0 2px var(--ring, #2b85f0);
          opacity:.9;
        }

        .code { padding: 18px 20px; }
        .codeText {
          margin:0;
          line-height: 1.7;
          letter-spacing: .2px;
          font-size: 14px;
          color: var(--code-text, #cdd6f4);
          white-space: pre;
        }
        .cmt { color: var(--code-comment, #6a9955); }
        .text { color: var(--code-text, #cdd6f4); }
        .blue { color: var(--code-blue, #569cd6); }
        .purple { color: var(--code-purple, #c586c0); }
        .string { color: var(--code-string, #ce9178); }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor {
          display:inline-block; width:10px; height:1.1em; margin-left:3px;
          background: var(--fg, #e5e7eb);
          vertical-align:-2px; animation: blink 1s step-end infinite;
          border-radius:1px;
        }

        .form { padding: 16px; }
        .grid { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
        @media (max-width: 640px){ .grid { grid-template-columns: 1fr; } }

        .field label {
          display:block; font-size:12px; color: var(--muted, #9aa4b2);
          margin: 4px 0 6px;
        }
        .field input {
          width:100%;
          background: var(--input-bg, #0b1117);
          color: var(--fg, #e5e7eb);
          border: 1px solid var(--input-border, #253041);
          border-radius: 8px;
          padding: 10px 12px;
          outline: none;
          font-size: 14px;
        }
        .field input::placeholder { color: var(--placeholder, #7b8794); }
        .field input:focus {
          border-color: var(--ring, #2b85f0);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring, #2b85f0) 35%, transparent);
        }

        .check {
          user-select:none;
          display:flex; gap:10px; align-items:center;
          font-size: 12px; color: var(--muted, #9aa4b2);
          margin-top: 6px;
        }
        .check input {
          width:16px; height:16px; border-radius:4px;
          accent-color: var(--ring, #2b85f0);
        }

        .actions { display:flex; align-items:center; gap:10px; margin-top: 12px; }
        .enter {
          appearance:none; border:1px solid var(--panel-border, #1f2937);
          background: linear-gradient(180deg, #101820 0%, #0c141a 100%);
          color:#e5e7eb; padding:10px 14px; font-weight:600; font-size:14px;
          border-radius:10px; cursor:pointer;
          box-shadow: 0 0 0 2px var(--ring, #2b85f0);
          transition: transform .04s ease, filter .12s ease;
        }
        .enter:hover { filter: brightness(1.06); }
        .enter:active { transform: translateY(1px); }
        .enter[disabled] { opacity:.55; cursor: not-allowed; }

        .ok { color:#22c55e; font-size:12px; }
        .err { color:#f87171; font-size:12px; }

        .foot { text-align:center; opacity:.7; font-size:12px; margin-top: 8px; }
      `}</style>
    </main>
  );
}
