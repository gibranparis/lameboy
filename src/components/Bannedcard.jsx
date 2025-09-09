'use client';

export default function BannedCard() {
  return (
    <div className="page-center relative">
      <div
        className="vscode-card p-4 rounded-xl"
        style={{ maxWidth: 360 }}
      >
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

      <div className="absolute bottom-10 w-full text-center text-xs" style={{ color: "#b3b3b3" }}>
        Florida, USA
      </div>
    </div>
  );
}
