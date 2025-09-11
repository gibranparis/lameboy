'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function LoginCard() {
  const router = useRouter();

  // Yellow glow on Florida when the left zone is hot
  const [hot, setHot] = useState(false);

  // Left hover-zone width stops at bubble's left edge (so inputs remain clickable)
  const formRef = useRef(null);
  const [zoneWidth, setZoneWidth] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      const rect = formRef.current?.getBoundingClientRect();
      const left = rect ? Math.max(0, Math.floor(rect.left)) : Math.floor(window.innerWidth * 0.4);
      setZoneWidth(left);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Focus email on mount
  useEffect(() => {
    formRef.current?.querySelector('input[type="email"]')?.focus();
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    // keep your real submit/cascade logic; visuals restored only
  };

  return (
    <>
      {/* LEFT dynamic hover/click area → back to banned */}
      <div
        className="hover-zone left"
        style={{ width: `${zoneWidth}px` }}
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        onClick={() => router.push('/')}
        aria-hidden="true"
      />

      <div className="page-center" style={{ position: 'relative', gap: 14 }}>
        {/* Back to banned label */}
        <button
          type="button"
          className={`ghost-btn florida-link ${hot ? 'is-hot' : ''}`}
          onClick={() => router.push('/')}
        >
          Florida, USA
        </button>

        {/* Login bubble */}
        <form
          ref={formRef}
          className="vscode-card login-card slide-in-left"
          onSubmit={onSubmit}
          style={{ position: 'relative', zIndex: 50 }}
        >
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

          {/* BYPASS STAR (tight to bubble, bottom-right) */}
          <button
            type="button"
            className="bypass-star"
            title="Skip sign-in"
            onClick={() => router.push('/shop')}
            aria-label="Skip sign-in"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M12 2l2.9 6.6 7.1.6-5.3 4.6 1.7 6.8L12 17.6 5.6 20.6l1.7-6.8L2 9.2l7.1-.6L12 2z"
                fill="currentColor"
              />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}
