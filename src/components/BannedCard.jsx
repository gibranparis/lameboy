'use client';

import { useState } from 'react';

export default function BannedCard() {
  const [mode, setMode] = useState("banned"); // "banned" | "login"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text:string}

  const toggle = () => {
    setMsg(null);
    setMode(m => (m === "banned" ? "login" : "banned"));
  };

  async function onSubmit(e){
    e.preventDefault();
    setMsg(null);

    // minimal validation
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
          <span>.</span>
          <span className="code-keyword">log</span>
          <span>(</span>
          <span className="code-string">"hi..."</span>
          <span>);</span>
        </div>
      </div>
    </div>
  );

  const LoginCard = (
    <div className="vscode-card p-4 rounded-xl" style={{ maxWidth: 360, minWidth: 300 }}>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="block text-xs" style={{ color: 'var(--muted)' }}>Email</label>
          <input
            className="login-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs" style={{ color: 'var(--muted)' }}>Phone number</label>
          <input
            className="login-input"
            type="tel"
            placeholder="+1 305 555 0123"
            value={phone}
            onChange={e=>setPhone(e.target.value)}
          />
        </div>

        <button className="primary-btn" type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit"}
        </button>

        {msg && (
          <p className={msg.type === 'ok' ? "msg-ok" : "msg-err"}>
            {msg.text}
          </p>
        )}
      </form>
    </div>
  );

  return (
    <div className="page-center">
      <div className="row-nowrap">
        {mode === "banned" ? (
          <>
            {CodeCard}
            {FloridaButton}   {/* RIGHT of code card */}
          </>
        ) : (
          <>
            {FloridaButton}   {/* shift to LEFT */}
            {LoginCard}       {/* login bubble on RIGHT */}
          </>
        )}
      </div>
    </div>
  );
}
