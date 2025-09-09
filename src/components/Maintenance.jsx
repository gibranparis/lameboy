'use client';

// VS Code “Dark+” styled maintenance screen (pixel-matched)
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
        /* ---------- VS Code Dark+ palette (exact hex) ---------- */
        :root {
          --bg: #0b0e14;             /* near-black canvas seen in your screenshot */
          --panel: #111317;          /* editor gutter-ish panel tone */
          --panel-border: #2b2b2b;   /* editor widget border */
          --focus-blue: #3794ff;     /* VS Code focus/selection blue */
          --text: #d4d4d4;           /* default editor text */
          --comment: #6a9955;        /* comment green */
          --purple: #c586c0;         /* e.g., 'console' */
          --blue: #569cd6;           /* function names like 'log' */
          --string: #ce9178;         /* string literal */
        }

        .screen {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: var(--bg);
          color: var(--text);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .wrap {
          text-align: center;
          padding: 2rem 1.25rem;
        }

        .panel {
          position: relative;
          display: inline-block;
          background: var(--panel);
          border: 1px solid var(--panel-border);
          border-radius: 10px;
          padding: 14px 18px;
          /* subtle soft shadow like VS Code quickpick */
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
          /* keep width visually close to the screenshot */
          max-width: 560px;
        }

        /* The bright blue VS Code focus ring around the panel */
        .accent {
          pointer-events: none;
          position: absolute;
          inset: -2px;               /* sits just outside the grey border */
          border-radius: 12px;       /* matches panel radius + inset */
          border: 2px solid var(--focus-blue);
          /* light outer glow, very subtle */
          box-shadow: 0 0 0 1px rgba(55, 148, 255, 0.08);
        }

        .code {
          margin: 0;
          text-align: left;
          line-height: 1.6;
          font-size: 13.5px;         /* VS Code’s default monospace size feel */
          white-space: pre;
        }

        .comment { color: var(--comment); }
        .purple  { color: var(--purple); }
        .blue    { color: var(--blue); }
        .string  { color: var(--string); }
        .text    { color: var(--text); }

        .foot {
          margin: 1.15rem 0 0;
          font-size: 12.5px;
          opacity: 0.75;
        }

        /* Blinking caret */
        @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
        .cursor {
          display: inline-block;
          width: 8px;
          height: 1.2em;
          margin-left: 3px;
          background: var(--text);
          vertical-align: -2px;
          animation: blink 1s step-end infinite;
          border-radius: 1px;
        }

        /* Make sure the code block width hugs content for that “snippet” feel */
        .panel :global(pre.code) { width: max-content; }
      `}</style>
    </main>
  );
}
