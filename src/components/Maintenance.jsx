// src/components/Maintenance.jsx
'use client';

import React from 'react';

const TOKENS = {
  bg: '#0e1116',          // near-pitch black
  panel: '#111318',
  border: '#2563eb',      // VSCode-ish blue
  shadow: '0 8px 24px rgba(0,0,0,0.35)',
  text: '#e5e7eb',        // bright gray/white
  comment: '#7fdb8a',     // green comment
  purple: '#c084fc',
  blue: '#60a5fa',
  string: '#fbbf24',      // warm yellow for strings
  dim: 'rgba(229,231,235,0.7)',
  inputBg: '#0b0e13',
  inputBorder: '#1f2937',
  inputFocus: '#2563eb',
};

export default function Maintenance() {
  const [status, setStatus] = React.useState('idle'); // idle | loading | ok | err
  const [message, setMessage] = React.useState('');

  // capture UTM + context once
  const contextRef = React.useRef(null);
  if (!contextRef.current) {
    const url = new URL(typeof window !== 'undefined' ? window.location.href : 'https://lameboy.com/');
    const utm = {
      source: url.searchParams.get('utm_source') || '',
      medium: url.searchParams.get('utm_medium') || '',
      campaign: url.searchParams.get('utm_campaign') || '',
      content: url.searchParams.get('utm_content') || '',
      term: url.searchParams.get('utm_term') || '',
    };
    contextRef.current = {
      utm,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      path: url.pathname + url.search,
      tzOffset: new Date().getTimezoneOffset(), // minutes
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email')?.toString().trim();
    const phone = formData.get('phone')?.toString().trim();
    const consentEmail = formData.get('consent_email') === 'on';
    const consentSMS = formData.get('consent_sms') === 'on';
    const honey = formData.get('website'); // honeypot

    if (honey) {
      setStatus('ok'); // silently accept bots
      return;
    }
    if (!email && !phone) {
      setStatus('err');
      setMessage('Enter an email or a phone.');
      return;
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          consentEmail,
          consentSMS,
          ...contextRef.current,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed');
      }
      setStatus('ok');
      setMessage('Thanks — check your inbox for confirmation.');
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus('err');
      setMessage('Something went wrong. Try again.');
    }
  }

  return (
    <main style={styles.screen}>
      <div style={styles.wrap}>
        <div style={styles.panel}>
          <div style={styles.accent} />
          <pre style={styles.code}>
            <span style={styles.comment}>// LAMEBOY.COM</span>{'\n'}
            <span style={styles.comment}>// is banned for now</span>{'\n'}
            <span style={styles.purple}>console</span>
            <span style={styles.text}>.</span>
            <span style={styles.blue}>log</span>
            <span style={styles.text}>(</span>
            <span style={styles.string}>"🚧..."</span>
            <span style={styles.text}>)</span>
            <span style={styles.text}>;</span>
          </pre>
        </div>

        {/* Waitlist form */}
        <form onSubmit={onSubmit} style={styles.form} autoComplete="on" aria-label="Join waitlist">
          <div style={styles.inputsRow}>
            <label style={styles.label}>
              <span style={styles.labelText}>Email</span>
              <input name="email" type="email" placeholder="you@domain.com" style={styles.input} />
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Phone (optional)</span>
              <input name="phone" type="tel" placeholder="+1 555 555 5555" style={styles.input} />
            </label>

            {/* honeypot (hidden) */}
            <input name="website" type="text" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
          </div>

          <div style={styles.consents}>
            <label style={styles.check}>
              <input name="consent_email" type="checkbox" defaultChecked />
              <span style={styles.checkText}>I agree to receive email updates.</span>
            </label>
            <label style={styles.check}>
              <input name="consent_sms" type="checkbox" />
              <span style={styles.checkText}>I agree to receive SMS (US only, msg & data rates may apply).</span>
            </label>
          </div>

          <div style={styles.actions}>
            <button type="submit" disabled={status === 'loading'} style={styles.button}>
              {status === 'loading' ? 'Saving…' : 'Notify me'}
            </button>
            {!!message && (
              <span
                style={{
                  marginLeft: 12,
                  color: status === 'ok' ? '#86efac' : '#fca5a5',
                  fontSize: 14,
                }}
              >
                {message}
              </span>
            )}
          </div>
        </form>

        <p style={{ marginTop: 24, color: TOKENS.dim }}>Florida, USA</p>
      </div>
    </main>
  );
}

/* inline styles to stay self-contained */
const styles = {
  screen: {
    minHeight: '100svh',
    display: 'grid',
    placeItems: 'center',
    background: 'radial-gradient(60% 60% at 50% 20%, #0f1420 0%, #0e1116 45%, #0b0e13 100%)',
    color: TOKENS.text,
    fontFamily: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
    padding: '6vh 16px',
  },
  wrap: { maxWidth: 760, width: '100%', display: 'grid', gap: 20, justifyItems: 'center' },
  panel: {
    position: 'relative',
    width: 'min(680px, 90vw)',
    background: TOKENS.panel,
    borderRadius: 10,
    boxShadow: TOKENS.shadow,
    border: `1px solid rgba(37, 99, 235, 0.4)`,
    padding: '18px 22px',
  },
  accent: {
    position: 'absolute',
    inset: -1,
    borderRadius: 10,
    pointerEvents: 'none',
    boxShadow: `0 0 0 1px ${TOKENS.border}, 0 0 0 3px rgba(37, 99, 235, 0.15) inset`,
    mixBlendMode: 'normal',
  },
  code: { margin: 0, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre' },
  comment: { color: TOKENS.comment },
  purple: { color: TOKENS.purple },
  blue: { color: TOKENS.blue },
  string: { color: TOKENS.string },
  text: { color: TOKENS.text },

  form: {
    width: 'min(680px, 90vw)',
    background: TOKENS.panel,
    border: '1px solid #1f2937',
    borderRadius: 10,
    padding: 14,
    display: 'grid',
    gap: 12,
    boxShadow: TOKENS.shadow,
  },
  inputsRow: { display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' },
  label: { display: 'grid', gap: 6 },
  labelText: { fontSize: 12, color: TOKENS.dim },
  input: {
    height: 42,
    borderRadius: 8,
    border: `1px solid ${TOKENS.inputBorder}`,
    background: TOKENS.inputBg,
    color: TOKENS.text,
    padding: '0 12px',
    outline: 'none',
  },
  consents: { display: 'grid', gap: 6 },
  check: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: TOKENS.dim },
  checkText: { opacity: 0.9 },
  actions: { display: 'flex', alignItems: 'center' },
  button: {
    height: 40,
    padding: '0 16px',
    borderRadius: 8,
    border: '1px solid rgba(37,99,235,0.6)',
    background: 'linear-gradient(180deg, rgba(37,99,235,0.25), rgba(37,99,235,0.05))',
    color: TOKENS.text,
    cursor: 'pointer',
  },
};
