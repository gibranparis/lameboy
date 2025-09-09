'use client';

import { useState } from 'react';
import Card from "./ui/Card";

export default function Maintenance() {
  const [email,setEmail] = useState("");
  const [phone,setPhone] = useState("");

  const onSubmit = (e)=>{
    e.preventDefault();
    // TODO: POST to /api/subscribe
    console.log({email,phone});
    setEmail(""); setPhone("");
  };

  return (
    <div className="page-center px-4">
      <Card className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold vscode-accent mb-2">
          LAMEBOY — Maintenance Mode
        </h1>
        <p className="vscode-muted mb-6">
          We’re working on something amazing. Enter your info to get updates when we restock or reopen.
        </p>

        <form onSubmit={onSubmit}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            className="vscode-input"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
          <input
            className="vscode-input"
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
          />
          <button className="vscode-button" type="submit">Enter</button>
        </form>
      </Card>
    </div>
  );
}
