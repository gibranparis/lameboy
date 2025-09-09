'use client';

import { useState } from 'react';

export default function Maintenance() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST to /api/subscribe when you’re ready
    console.log('Submitted:', { email, phone });
    setEmail('');
    setPhone('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      {/* Card with strong VS Code blue border */}
      <div
        className="max-w-md w-full p-6 rounded-2xl shadow-lg bg-[#1e1e1e] border"
        style={{
          borderColor: '#007acc',
          borderWidth: '2px', // visually stronger than 1px on hi-DPI screens
        }}
      >
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#007acc' }}>
          LAMEBOY — Maintenance Mode
        </h1>

        <p className="mb-6 text-gray-300">
          We’re working on something amazing. Enter your info to get updates when we restock or reopen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded bg-black text-white focus:outline-none focus:ring-2"
            style={{ borderColor: '#007acc', borderWidth: '1px', borderStyle: 'solid' }}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 rounded bg-black text-white focus:outline-none focus:ring-2"
            style={{ borderColor: '#007acc', borderWidth: '1px', borderStyle: 'solid' }}
          />

          <button
            type="submit"
            className="w-full p-3 rounded font-bold transition"
            style={{ backgroundColor: '#007acc' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#005a9e')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007acc')}
          >
            Enter
          </button>
        </form>

        <style jsx>{`
          h1, p, input, button {
            font-family: var(--mono);
          }
        `}</style>
      </div>
    </div>
  );
}
