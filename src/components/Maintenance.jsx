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
            <span className="comment">// is banned for now</span>{'\n'}
            {'\n'}
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

        <p className="foot">Florida, USA</p>
      </div>

      <style jsx>{`
        /* VS Code Dark+ palette */
        :root {
          --bg: #0b0b0b;               /* editor background (pitch black feel) */
          --panel: #111214;            /* dark panel block */
          --fg: #d4d4d4;               /* default text */
          --muted: #9da3ad;

          --border: #2c2c2c;           /* subtle border */
          --accent: #007acc;           /* VS Code focus blue */
          --accent-shadow: rgba(0, 122, 204, 0.3);

          /* token colors (Dark+) */
          --tok-comment: #6a9955;
          --tok-blue: #569cd6;         /* function/identifier */
          --tok-purple: #c586c0;       /* namespace/keyword-ish */
          --tok-string: #ce9178;
        }

        .screen {
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          color: var(--fg);
          font: 16px/1.6 Menlo, Monaco, 'SFMono-Regular', 'Courier New', monospace;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .wrap {
          text-align: center;
          padding: 2rem;
        }

        .panel {
          position: relative;
          display: inline-block;
          text-align: left;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px 22px;
          box-shadow:
            0 8px 24px rgba(0,0,0,0.35),
            0 0 0 2px var(--accent); /* the bright VS Code blue outline */
        }

        /* faint blue “glow” just outside the border for that VS Code focus look */
        .panel::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 12px;
          box-shadow: 0 0 0 1px var(--accent), 0 0 18px var(--accent-shadow);
          pointer-events: none;
        }

        .accent { display: none; } /* hook kept if you ever want a tab notch */

        .code {
          margin: 0;
          white-space: pre;
        }

        .comment { color: var(--tok-comment); }
        .blue    { color: var(--tok-blue); }
        .purple  { color: var(--tok-purple); }
        .string  { color: var(--tok-string); }
        .text    { color: var(--fg); }

        .cursor {
          display: inline-block;
          width: 10px;
          height: 1.1em;
          margin-left: 2px;
          background: var(--fg);
          vertical-align: -2px;
          animation: blink 1s step-end infinite;
        }

        .foot {
          margin-top: 16px;
          color: var(--muted);
          letter-spacing: 0.4px;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
      `}</style>
    </main>
  );
}
