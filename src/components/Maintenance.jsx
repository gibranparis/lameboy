'use client';

import { useState } from 'react';

export default function Maintenance() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', { email, phone });
    setEmail('');
    setPhone('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-md w-full p-6 vscode-border rounded-lg shadow-lg bg-[#1e1e1e]">
        <h1 className="text-2xl font-bold vscode-accent mb-4">
          LAMEBOY Maintenance Mode
        </h1>
        <p className="mb-6 text-gray-300">
          We’re working on something amazing. Enter your info to get updates
          when we restock or reopen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded bg-black text-white vscode-border focus:outline-none focus:ring-2 focus:ring-[#007acc]"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 rounded bg-black text-white vscode-border focus:outline-none focus:ring-2 focus:ring-[#007acc]"
          />
          <button
            type="submit"
            className="w-full p-3 rounded bg-[#007acc] text-white font-bold hover:bg-[#005a9e] transition"
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
