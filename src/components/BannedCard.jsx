'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function BannedCard() {
  const [mode, setMode]   = useState("banned"); // "banned" | "login"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState(null);     // {type:'ok'|'err', text:string}

  const emailRef = useRef(null);
  const measureRef = useRef(null);
  const [emailPx, setEmailPx] = useState(8); // tiny default so bubble still huggable

  const toggle = () => { setMsg(null); setMode(m => m === "banned" ? "login" : "banned"); };

  // Autosize email input exactly to its content (pixel-perfect, no trailing gap)
  useLayoutEffect(() => {
    if (!measureRef.current) return;
    // Use a zero-width placeholder char to ensure at least a caret width when empty
    const text = email.length ? email : "\u200B";
    measureRef.current.textContent = text;
    const w = Math.ceil(measureRef.current.getBoundingClientRect().width);
    setEmailPx(Math.max(8, w)); // at least a few px so it's clickable
  }, [email]);

  // Focus email and put insertion point at index 0
  useEffect(() => {
    if (mode === 'login' && emailRef.current) {
      emailRef.current.focus({ preventScroll: true });
      try { emailRef.current.setSelectionRange(0, 0); } catch {}
    }
  }, [mode]);

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
        method:"POST",
        headers:{ "Content-Type":"application/json" },
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
    <button type="button" className="ghost-btn text-xs" onClick={toggle} aria-label="Florida, USA">
      Florida, USA
    </button>
  );

  const CodeCard = (
    <div className="vscode-card card-ultra-tight rounded-xl" style={{ maxWidth: 360 }}>
      <div className="text-sm leading-6">
        <div className="code-comment">// LAMEBOY.COM</div>
        <div className="code-comment">// is banned</div>
        <div className="mt-1 caret">
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
    <div className="vscode-card card-ultra-tight login-card rounded-xl">
      <form className="text-sm" onSubmit={onSubmit}>
        <div className="code-comment">// login</div>

        {/* const email = "<typed>";  (real purple caret, tight bubble) */}
        <div className="code-line" onClick={() => emailRef.current?.focus()}>
          <span className="code-keyword">const</span>
          <span className="code-var">email</span>
          <span className="code-op">=</span>
          <span className="code-punc">"</span>

          <span className="relative inline-flex items-baseline" style={{ gap: 0 }}>
            <input
              ref={emailRef}
              className="code-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              style={{ width: `${emailPx}px` }}
              required
            />
            {/* hidden live measurer uses identical font to compute exact width */}
            <span ref={measureRef} className="measurer"></span>
          </span>

          <span className="code-punc">"</span>
          <span className="code-punc">;</span>
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
            /* let phone be a little elastic but still compact */
            style={{ width: `${Math.max(8, Math.ceil((phone || "").length * 8))}px` }}
          />
          <span className="code-punc">"</span>
          <span className="code-punc">;</span>
        </div>

        {/* bottom-left tiny button */}
        <div className="code-line">
          <button type="submit" className="commit-btn" disabled={busy}>Submit</button>
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
            {FloridaButton}
          </>
        ) : (
          <>
            {FloridaButton}
            {LoginCard}
          </>
        )}
      </div>
    </div>
  );
}
