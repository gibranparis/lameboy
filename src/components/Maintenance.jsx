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
        :root {
          --vs-blue: #007acc;       /* VS Code blue (exact) */
          --bg: #000000;            /* pitch black */
          --panel: #0a0a0a;         /* near-black to separate from bg */
          --text: #d4d4d4;          /* default text */
          --muted: #a0a0a0;         /* secondary text */

          /* VS Code syntax colors */
          --cmt: #6a9955;           /* comment green */
          --blue: #569cd6;          /* function blue */
          --purple: #c586c0;        /* object purple */
          --string: #ce9178;        /* string orange */
        }

        .screen {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: var(--bg);
          color: var(--text);
          padding: 48px 16px;
          font-family: Menlo, Monaco, 'Courier New', ui-monospace, SFMono-Regular, monospace;
          font-size: 16px;
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
          /* blue border + subtle glow */
          box-shadow:
            inset 0 0 0 1px rgba(0, 122, 204, 0.7),
            0 0 0 1px rgba(0, 122, 204, 0.3),
            0 10px 30px rgba(0, 0, 0, 0.6);
        }

        /* thin blue bar across the top */
        .accent {
          height: 4px;
          width: 100%;
          border-radius: 14px 14px 0 0;
          background: var(--vs-blue);
        }

        .code {
          margin: 0;
          padding: 20px 24px 22px;
          white-space: pre-wrap;
          line-height: 1.65;
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

        @keyframes blink { 0%,100% {opacity:1} 50% {opacity:0} }
        .cursor {
          display: inline-block;
          width: 10px;
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
