'use client';
import Card from "./ui/Card";

export default function BannedCard() {
  return (
    <div className="page-center relative">
      <Card className="max-w-sm">
        <div className="text-sm leading-7">
          <div className="code-comment">// LAMEBOY.COM</div>
          <div className="code-comment">// is banned</div>
          <div className="mt-2 caret">
            <span className="code-keyword">console</span>
            <span>.</span>
            <span className="code-keyword">log</span>
            <span>(</span>
            <span className="code-string">"hi…"</span>
            <span>);</span>
          </div>
        </div>
      </Card>

      <div className="absolute bottom-10 w-full text-center text-xs vscode-muted">
        Florida, USA
      </div>
    </div>
  );
}
