'use client';

export default function Maintenance() {
  return (
    <main className="vscode-maint__screen">
      <div className="vscode-maint__wrap">
        <div className="vscode-maint__panel">
          <div className="vscode-maint__accent" />
          <pre className="vscode-maint__code">
            <span className="tk-comment">// LAMEBOY.COM</span>{'\n'}
            <span className="tk-comment">// is banned for now</span>{'\n'}
            {'\n'}
            <span className="tk-purple">console</span>
            <span className="tk-text">.</span>
            <span className="tk-blue">log</span>
            <span className="tk-text">(</span>
            <span className="tk-string">"🚧..."</span>
            <span className="tk-text">)</span>
            <span className="tk-text">;</span>
            <span className="caret" />
          </pre>
        </div>

        <p className="vscode-maint__foot">Florida, USA</p>
      </div>

      {/* Scoped styles, no globals required */}
      <style jsx>{`
        /* VS Code Dark+ token colors */
        :root {
          --vscode-bg: #000000;        /* pitch black canvas */
          --panel-bg: #111317;         /* near-black panel */
          --panel-outline: #0e639c;    /* VS Code focus border */
          --text: #d4d4d4;
          --comment: #6a9955;
          --purple: #c586c0;
          --blue: #569cd6;
          --string: #ce9178;
        }

        .vscode-maint__screen {
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--vscode-bg);
          color: var(--text);
          font-family: Menlo, Monaco, 'Courier New', ui-monospace, SFMono-Regular,
            Consolas, 'Liberation Mono', monospace;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .vscode-maint__wrap {
          text-align: center;
          padding: 2.5rem 1.5rem;
          width: 100%;
        }

        .vscode-maint__panel {
          position: relative;
          display: inline-block;
          text-align: left;
          background: var(--panel-bg);
          border-radius: 10px;
          padding: 16px 18px;
          box-shadow:
            0 10px 26px rgba(0,0,0,0.55),
            0 2px 0 rgba(0,0,0,0.6) inset;
        }

        /* The crisp blue outline you see in VS Code */
        .vscode-maint__accent {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          box-shadow:
            0 0 0 1px rgba(14,99,156,0.8) inset,
            0 0 0 2px rgba(14,99,156,0.2);
          pointer-events: none;
        }

        .vscode-maint__code {
          margin: 0;
          font-size: 13.5px;          /* Monaco-ish size */
          line-height: 1.65;
          color: var(--text);
          white-space: pre;
          tab-size: 2;
        }

        .tk-comment { color: var(--comment); }
        .tk-purple  { color: var(--purple);  }
        .tk-blue    { color: var(--blue);    }
        .tk-string  { color: var(--string);  }
        .tk-text    { color: var(--text);    }

        /* Blinking block caret */
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .caret {
          display: inline-block;
          width: 7px;
          height: 1.15em;
          margin-left: 3px;
          background: var(--text);
          transform: translateY(2px);
          animation: blink 1s step-end infinite;
        }

        .vscode-maint__foot {
          margin-top: 16px;
          font-size: 12px;
          opacity: 0.75;
          letter-spacing: 0.2px;
        }

        /* Make the panel size/spacing feel like a small VS Code editor */
        @media (min-width: 480px) {
          .vscode-maint__panel { padding: 18px 20px; }
          .vscode-maint__code { font-size: 14px; }
        }
      `}</style>
    </main>
  );
}
