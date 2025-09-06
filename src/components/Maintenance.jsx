'use client';

export default function Maintenance() {
  return (
    <main
      style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        fontSize: 16,
      }}
    >
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div
          style={{
            border: '1px solid #3c3c3c',
            borderRadius: 6,
            padding: '1.25rem 1.5rem',
            background: '#1e1e1e',
            textAlign: 'left',
            display: 'inline-block',
            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
            lineHeight: 1.6,
            whiteSpace: 'pre',
          }}
        >
          <span style={{ color: '#6A9955' }}>{"// LAMEBOY.COM\n"}</span>
          <span style={{ color: '#6A9955' }}>{"// is banned for now\n\n"}</span>

          <span style={{ color: '#C586C0' }}>console</span>
          <span style={{ color: '#d4d4d4' }}>.</span>
          <span style={{ color: '#569CD6' }}>log</span>
          <span style={{ color: '#d4d4d4' }}>(</span>
          <span style={{ color: '#CE9178' }}>"🚧..."</span>
          <span style={{ color: '#d4d4d4' }}>)</span>
          <span style={{ color: '#d4d4d4' }}>;</span>
          <span className="cursor"> </span>
        </div>

        <p style={{ marginTop: '1.25rem', opacity: 0.75 }}>
          Florida, USA
        </p>
      </div>

      <style jsx>{`
        @keyframes blink { 0%{opacity:1} 50%{opacity:0} 100%{opacity:1} }
        .cursor {
          display:inline-block; width:10px; height:1.1em; margin-left:2px;
          background:#d4d4d4; vertical-align:-2px; animation:blink 1s step-end infinite;
        }
      `}</style>
    </main>
  );
}
