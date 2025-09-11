'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

/** Right-side hover activates Florida; clicking goes back to Banned (/) */

export default function LoginCard() {
  const router = useRouter();
  const [hot, setHot] = useState(false); // hover highlight for Florida
  const emailRef = useRef(null);
  const phoneRef = useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();
    // keep simple; you can wire your real submit later
    // just pretend and stay here; cascade is handled elsewhere
    // (this file only restores visuals & nav)
  };

  return (
    <>
      {/* RIGHT half hover/click area to go back to banned */}
      <div
        className="hover-zone right"
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        onClick={() => router.push('/')}
        aria-hidden="true"
      />

      <div className="page-center">
        {/* Florida back button */}
        <button
          type="button"
          className={`ghost-btn florida-link ${hot ? 'is-hot' : ''}`}
          onClick={() => router.push('/')}
          style={{ marginRight: 14 }}
        >
          Florida, USA
        </button>

        {/* login bubble */}
        <form className="vscode-card login-card slide-in-left" onSubmit={onSubmit}>
          <div className="code-line">
            <span className="code-comment">// </span>
            <span className="code-comment lameboy-glow">login</span>
          </div>

          <div className="code-line">
            <span className="code-keyword">const</span>
            <span className="code-op">&nbsp;</span>
            <span className="code-var">email</span>
            <span className="code-op">=</span>
            <span className="code-string">"</span>
            <span className="caretwrap">
              <input
                ref={emailRef}
                className="code-input"
                type="email"
                placeholder="you@example.com"
                aria-label="email"
              />
              <span className="purple-caret" />
            </span>
            <span className="code-string">"</span>
            <span className="code-punc">;</span>
          </div>

          <div className="code-line">
            <span className="code-keyword">const</span>
            <span className="code-op">&nbsp;</span>
            <span className="code-var">phone</span>
            <span className="code-op">=</span>
            <span className="code-string">"</span>
            <input
              ref={phoneRef}
              className="code-input"
              type="tel"
              placeholder="+1 305 555 0123"
              aria-label="phone"
            />
            <span className="code-string">"</span>
            <span className="code-punc">;</span>
          </div>

          <div className="row-nowrap" style={{ marginTop: 6 }}>
            <button type="submit" className="commit-btn">Submit</button>
          </div>
        </form>
      </div>
    </>
  );
}
