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

        <p className="note">Florida, USA</p>
      </div>

      <style jsx>{`
        /* === VS Code Default Dark+ palette === */
        :root{
          --vsc-bg: #1e1e1e;         /* editor background */
          --vsc-panel: #252526;      /* panel block */
          --vsc-border: #007acc;     /* VS Code focus/selection blue */
          --vsc-text: #d4d4d4;       /* default text */
          --vsc-comment: #6a9955;    /* comments */
          --vsc-blue: #569cd6;       /* keywords / member functions */
          --vsc-purple: #c586c0;     /* identifiers */
          --vsc-string: #ce9178;     /* strings */
          --vsc-shadow: rgba(0,0,0,.55);
        }

        .screen{
          margin:0;
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          background:var(--vsc-bg);
          color:var(--vsc-text);
          font: 14px/1.6 Menlo, Monaco, "Courier New", ui-monospace, SFMono-Regular, Consolas, Liberation Mono, monospace;
        }

        .wrap{ text-align:center; padding: 2rem; }

        .panel{
          position:relative;
          display:inline-block;
          text-align:left;
          background:var(--vsc-panel);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:8px;
          box-shadow:
            0 8px 24px var(--vsc-shadow),
            inset 0 0 0 1px rgba(255,255,255,0.03);
        }

        /* the VS Code blue focus ring */
        .accent{
          position:absolute;
          inset:-1px;
          border-radius:8px;
          pointer-events:none;
          box-shadow: 0 0 0 1px var(--vsc-border), 0 0 18px 0 rgba(0,122,204,.35);
          mix-blend-mode:normal;
        }

        .code{
          margin:0;
          padding: 14px 16px;
          white-space:pre;
        }

        .comment{ color: var(--vsc-comment); }
        .text{ color: var(--vsc-text); }
        .blue{ color: var(--vsc-blue); }
        .purple{ color: var(--vsc-purple); }
        .string{ color: var(--vsc-string); }

        .note{
          margin-top: 14px;
          color: rgba(212,212,212,.75);
          font-size: 12px;
          letter-spacing: .2px;
        }

        /* blinking cursor like editor caret */
        @keyframes blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
        .cursor{
          display:inline-block;
          width:10px;
          height:1.15em;
          margin-left:2px;
          background: var(--vsc-text);
          vertical-align: -2px;
          animation: blink 1s step-end infinite;
          border-radius:1px;
        }

        /* tighten on very small viewports */
        @media (max-width: 480px){
          .code{ padding: 12px 12px; }
        }
      `}</style>
    </main>
  );
}
