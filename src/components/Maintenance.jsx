// src/components/Maintenance.jsx
'use client';

export default function Maintenance() {
  return (
    <main className="screen">
      <div className="wrap">
        <div className="panel">
          <div className="accent" />
          <pre className="code">
            <span className="comment">// LAMEBOY.COM</span>{'\n'}
            <span className="comment">// is under maintenance</span>{'\n'}
            {'\n'}
            <span className="purple">console</span>
            <span className="text">.</span>
            <span className="blue">log</span>
            <span className="text">(</span>
            <span className="string">"⚙️ Updating site…"</span>
            <span className="text">)</span>
            <span className="text">;</span>
            <span className="cursor" />
          </pre>
        </div>

        <p className="note">We’ll be back online soon.</p>
      </div>

      <style jsx>{`
        :root {
          --bg: #0d0f12;           /* page bg (near black) */
          --panel: #0f1115;        /* card bg */
          --border: #2563eb;       /* blue trim */
          --text: #e5e7eb;         /* default text */
          --muted: #9aa4b2;        /* secondary text */
          --cmt: #6a9955;          /* VSCode comment green */
          --blue: #569cd6;         /* VSCode blue */
          --purple: #c586c0;       /* VSCode purple */
          --string: #ce9178;       /* VSCode string */
        }

        .screen {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          display: grid;
          place-items: center;
          padding: 48px 16px;
          font-family: Menlo, Monaco, 'Courier New', ui-monospace, SFMono-Regular, monospace;
        }

        .wrap {
          text-align: center;
        }

        .panel {
          position: relative;
          width: min(760px, 92vw);
          margin: 0 auto;
          background: var(--panel);
          border-radius: 14px;
          box-shadow:
            inset 0 0 0 1px rgba(37, 99, 235, 0.35),
            0 10px 30px rgba(0, 0, 0, 0.6);
        }

        /* thin blue bar at the top (accent trim) */
        .accent {
          height: 4px;
          width: 100%;
          border-radius: 14px 14px 0 0;
          background: linear-gradient(90deg, var(--border), #60a5fa);
        }

        .code {
          margin: 0;
          padding: 20px 24px 22px;
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
          text-align: left;
        }

        .note {
          margin-top: 18px;
          color: var(--muted);
          font-size: 14px;
        }

        .comment { color: var(--cmt); }
        .blue    { color: var(--blue); }
        .purple  { color: var(--purple); }
        .string  { color: var(--string); }
        .text    { color: var(--text); }

        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        .cursor {
          display: inline-block;
          width: 8px;
          height: 1.1em;
          margin-left: 4px;
          background: var(--text);
          vertical-align: -2px;
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </main>
  );
}
