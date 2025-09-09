'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function BannedCard() {
  const [mode, setMode]   = useState("banned"); // "banned" | "login"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState(null);     // {type:'ok'|'err', text:string}

  const emailRef = useRef(null);
  const emailMeasureRef = useRef(null);
  const phoneMeasureRef = useRef(null);

  const [emailPx, setEmailPx] = useState(8);
  const [phonePx, setPhonePx] = useState(8);

  const toggle = () => { setMsg(null); setMode(m => m === "banned" ? "login" : "banned"); };

  // Pixel-accurate autosize (no trailing gap)
  useLayoutEffect(() => {
    if (emailMeasureRef.current) {
      emailMeasureRef.current.textContent = email.length ? email : "\u200B";
      const w = Math.ceil(emailMeasureRef.current.getBoundingClientRect().width);
      setEmailPx(Math.max(8, w));
    }
  }, [email]);

  useLayoutEffect(() => {
    if (phoneMeasureRef.current) {
      phoneMeasureRef.current.textContent = phone.length ? phone : "\u200B";
      const w = Math.ceil(phoneMeasureRef.current.getBoundingClientRect().width);
      setPhonePx(Math.max(8, w));
    }
  }, [phone]);

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

        {/* const email = "<typed>";  (real purple caret; fake purple caret only before first char) */}
        <div className="code-line" onClick={() => emailRef.current?.focus()}>
          <span className="code-keyword">const</span>
          <span className="code-var">email</span>
          <span className="code-op">=</span>
          <span className="code-punc">"</span>

          <span className="relative inline-flex items-baseline" style={{ gap: 0 }}>
            {/* Fake caret visible only when empty */}
            {email.length === 0 && <span className="purple-caret" aria-hidden="true"></span>}

            {/* One input (keeps iOS keyboard open) — autosized to exact text width */}
            <input
              ref={emailRef}
              className="code-input"
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: `${emailPx}px` }}
              required
            />
            <span ref={emailMeasureRef} className="measurer"></span>
          </span>

          <span className="code-punc">"</span>
          <span className="code-punc">;</span>
        </div>

        {/* always-visible example preview (full view) */}
        <div className="code-line">
          <span className="code-comment">// you@example.com</span>
        </div>

        {/* const phone = "<typed>";  (autosized too) */}
        <div className="code-line">
          <span className="code-keyword">const</span>
          <span className="code-var">phone</span>
          <span className="code-op">=</span>
          <span className="code-punc">"</span>

          <span className="relative inline-flex items-baseline" style={{ gap: 0 }}>
            <input
              className="code-input"
              type="tel"
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              placeholder="+1 305 555 0123"
              style={{ width: `${phonePx}px` }}
            />
            <span ref={phoneMeasureRef} className="measurer"></span>
          </span>

          <span className="code-punc">"</span>
          <span className="code-punc">;</span>
        </div>

        {/* phone example preview (full view) */}
        <div className="code-line">
          <span className="code-comment">// +1 305 555 0123</span>
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
