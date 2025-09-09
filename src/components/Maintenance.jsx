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
    <div className="page-center">
      <Card className="w-full max-w-2xl">
        <h1 className="text-[28px] md:text-[32px] font-bold vscode-accent mb-2">
          LAMEBOY — Maintenance Mode
        </h1>
        <p className="vscode-muted mb-6 leading-7">
          We’re working on something amazing. Enter your info to get updates when we restock or reopen.
        </p>

        {/* Desktop: fused input group ; Mobile: stacks gracefully */}
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="hidden md:block">
            <div className="ig">
              <input
                className="ig-field"
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
              <input
                className="ig-field"
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e)=>setPhone(e.target.value)}
              />
              <button className="ig-button" type="submit">Enter</button>
            </div>
          </div>

          {/* Mobile stacked fields */}
          <div className="md:hidden space-y-3">
            <input
              className="vscode-input w-full"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
            <input
              className="vscode-input w-full"
              type="tel"
              placeholder="Phone"
              value={phone}
              onChange={(e)=>setPhone(e.target.value)}
            />
            <button className="ig-button w-full rounded-[10px]" type="submit">Enter</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
