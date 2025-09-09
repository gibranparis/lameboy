'use client';

import { useMemo, useState } from 'react';

export default function BannedCard() {
  const [mode, setMode]   = useState("banned"); // "banned" | "login"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState(null);     // {type:'ok'|'err', text:string}

  const toggle = () => { setMsg(null); setMode(m => m === "banned" ? "login" : "banned"); };

  // Make the “string” input width feel like code literals
  const emailWidthCh = useMemo(() => Math.max((email || 'you@example.com').length, 6) + 1, [email]);
  const phoneWidthCh = useMemo(() => Math.max((phone || '+1 305 555 0123').length, 6) + 1, [phone]);

  async function onSubmit(e){
    e.preventDefault();
    setMsg(null);

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneOk = !phone || /^\+?[0-9\-().\s]{7,}$/.test(phone);
    if (!emailOk) return setMsg({type:'err', text:'Please enter a valid email.'});
    if (!phoneOk) return setMsg({type:'err', text:'Phone looks invalid.'});

    try{
      setBusy(true);
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email, phone }),
      });
      if (!res.ok) {
        const t = await res.json().catch(()=>({error:"Submit failed"}));
        throw new Error(t.error || "Submit failed");
      }
      setMsg({type:'ok', text:'Thanks — we got it.'});
      setEmail(""); setPhone("");
    }catch(err){
      setMsg({type:'err', text: err.message || 'Something went wrong.'});
    }finally{
      setBusy(false);
    }
  }

  const FloridaButton = (
    <button
      type="button"
      className="ghost-btn text-xs"
      onClick={toggle}
      aria-label="Florida, USA"
    >
      Florida, USA
    </button>
  );

  const CodeCard = (
    <div className="vscode-card p-4 rounded-xl" style={{ maxWidth: 360 }}>
      <div className="text-sm leading-7">
        <div className="code-comment">// LAMEBOY.COM</div>
        <div className="code-comment">// is banned</div>
        <div className="mt-2 caret">
          <span className="code-keyword">console</span>
          <span className="code-punc">.</span>
          <span className="code-keyword">log</span>
          <span className="code-punc">(</span>
          <span className="code-string">"hi..."</span>
          <span className="code-punc">);</span>
        </div>
      </div>
    </div>
  );

  const LoginCard = (
    <div className="vscode-card p-4 rounded-xl" style={{ maxWidth: 360 }}>
      <form className="text-sm" onSubmit={onSubmit}>
        <div className="code-comment">// login</div>

        {/* const email = "<typed>"; */}
        <div className="code-line">
          <span className="code-keyword">const</span>
          <span className="code-var">email</span>
          <span className="code-op">=</span>
          <span className="code-punc">"</span>
          <input
            className="code-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            style={{ width: `${emailWidthCh}ch` }}
            required
          />
          <span className="code-punc">"</span><span className="code-punc">;</span>
        </div>

        {/* const phone = "<typed>"; */}
        <div className="code-line">
          <span className="code-keyword">const</span>
          <span className="code-var">phone</span>
          <span className="code-op">=</span>
          <span className="code-punc">"</span>
          <input
            className="code-input"
            type="tel"
            placeholder="+1 305 555 0123"
            value={phone}
            onChange={e=>setPhone(e.target.value)}
            style={{ width: `${phoneWidthCh}ch` }}
          />
          <span className="code-punc">"</span><span className="code-punc">;</span>
        </div>

        {/* await submit({ email, phone }); */}
        <div className="code-line mt-2">
          <span className="code-keyword">await</span>
          <button type="submit" className="code-fn-btn" disabled={busy}>
            submit
          </button>
          <span className="code-punc">(</span>
          <span className="code-punc">{'{'}</span>
          <span className="code-var">email</span>
          <span className="code-punc">,</span>
          <span className="code-var">phone</span>
          <span className="code-punc">{'}'}</span>
          <span className="code-punc">)</span><span className="code-punc">;</span>

          {msg && (
            <span style={{ marginLeft: 10 }} className={msg.type === 'ok' ? "code-comment" : "code-string"}>
              {msg.type === 'ok' ? `// ${msg.text}` : `"${msg.text}"`}
            </span>
          )}
        </div>
      </form>
    </div>
  );

  return (
    <div className="page-center">
      <div className="row-nowrap">
        {mode === "banned" ? (
          <>
            {CodeCard}
            {FloridaButton}  {/* to the RIGHT initially */}
          </>
        ) : (
          <>
            {FloridaButton}  {/* shifts to LEFT */}
            {LoginCard}      {/* compact code-style login bubble on RIGHT */}
          </>
        )}
      </div>
    </div>
  );
}
