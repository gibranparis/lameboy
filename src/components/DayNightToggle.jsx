// @ts-check
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

/** @typedef {'day'|'night'} Theme */
const THEME_KEY = 'lb:theme';

export default function DayNightToggle({
  id,
  className='',
  value,                    /** @type {Theme|undefined} */
  onChange,                 /** @type {(t:Theme)=>void|undefined} */
  circlePx=28,
  trackPad=1,
  moonImages=['/toggle/moon-red.png','/toggle/moon-blue.png'],
}){
  const isControlled = value!==undefined && typeof onChange==='function';
  const [internal,setInternal] = useState/** @type {Theme} */('day');
  const theme   = (isControlled? value : internal) ?? 'day';
  const isNight = theme==='night';

  // uncontrolled boot from storage
  useEffect(()=>{
    if (!isControlled){
      const stored = typeof window!=='undefined' ? localStorage.getItem(THEME_KEY) : null;
      const initial = stored==='night' || stored==='day' ? stored : 'day';
      setInternal(/** @type {Theme} */(initial));
    }
  },[isControlled]);

  // reflect on <html> + persist + broadcast
  useEffect(()=>{
    if (typeof document==='undefined') return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', isNight);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    try {
      const evt = new CustomEvent('theme-change',{ detail:{ theme }});
      window.dispatchEvent(evt); document.dispatchEvent(evt);
    } catch {}
  },[theme,isNight]);

  function setTheme(next /** @type {Theme} */){
    if (isControlled && onChange) onChange(next); else setInternal(next);
  }
  function toggle(){ setTheme(isNight? 'day':'night'); }

  // Sizing
  const dims = useMemo(()=>{
    const knob = Math.max(20, Math.round(circlePx));
    const pad  = Math.max(1, Math.min(6, Math.round(trackPad)));
    const h    = Math.max(knob + pad*2, 28);
    const w    = Math.round(h * (64/36));
    const inset= pad;
    const shift= Math.round(w - knob - inset*2);
    return {h,w,knob,inset,shift};
  },[circlePx,trackPad]);

  const moonSrc = moonImages?.[0] ?? '/toggle/moon-red.png';

  // NIGHT SKY — twinkle + “LAMEBOY” path + meteor
  const skyRef = useRef/** @type {React.RefObject<HTMLCanvasElement>} */(null);
  useEffect(()=>{
    if (!isNight) return;
    const canvas = skyRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d',{ alpha:true }); if (!ctx) return;

    let raf = 0; let W=0,H=0,DPR=1;
    const resize = ()=>{
      DPR = Math.max(1, Math.round(window.devicePixelRatio||1));
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width*DPR));
      H = Math.max(1, Math.floor(r.height*DPR));
      canvas.width=W; canvas.height=H;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const stars = Array.from({length:32},()=>({
      x:Math.random()*W, y:Math.random()*H, a:Math.random()*6.28, as:(0.5+Math.random())*0.006, r:0.8*DPR
    }));

    /** @type {[number,number][]} */
    const C = [
      [0.08,0.35],[0.08,0.70],[0.18,0.70],
      [0.25,0.35],[0.25,0.70],[0.36,0.70],
      [0.43,0.35],[0.43,0.70],[0.52,0.60],[0.43,0.50],
      [0.57,0.35],[0.57,0.70],[0.66,0.35],[0.66,0.70],
      [0.72,0.35],[0.72,0.70],[0.82,0.70],
      [0.86,0.35],[0.86,0.70],[0.94,0.52],
    ];

    let meteor = { t:-1, x0:0,y0:0, x1:0,y1:0, dur:1100, born:0 };
    const spawn = ()=>{
      const now = performance.now();
      meteor.born=now; meteor.dur=900+Math.random()*700;
      meteor.x0 = Math.random()<0.5 ? -0.1*W : 1.1*W;
      meteor.y0 = Math.random()*(0.25*H)+0.15*H;
      meteor.x1 = meteor.x0<0 ? 1.2*W : -0.2*W;
      meteor.y1 = meteor.y0 + (Math.random()*0.2 - 0.1)*H;
      meteor.t=0;
    };
    let lastSpawn = performance.now();

    const LOOP = ()=>{
      ctx.clearRect(0,0,W,H);

      for(const s of stars){
        s.a += s.as;
        const tw = 0.5+0.5*Math.sin(s.a);
        ctx.globalAlpha = 0.7*tw;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.lineWidth = 1*DPR;
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.fillStyle   = 'rgba(255,255,255,.95)';
      ctx.beginPath();
      for (let i=0;i<C.length;i++){
        const [nx,ny]=C[i], x=nx*W, y=ny*H;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
      for(const [nx,ny] of C){
        const x=nx*W,y=ny*H; ctx.beginPath(); ctx.arc(x,y,1.2*DPR,0,Math.PI*2); ctx.fill();
      }

      const now = performance.now();
      if (meteor.t<0 && now - lastSpawn > 2400 + Math.random()*2600){ lastSpawn=now; spawn(); }
      if (meteor.t>=0){
        const p = Math.min(1, (now-meteor.born)/meteor.dur);
        const x = meteor.x0 + (meteor.x1-meteor.x0)*p;
        const y = meteor.y0 + (meteor.y1-meteor.y0)*p;
        const trail = 80*DPR;
        const ang = Math.atan2(meteor.y1-meteor.y0, meteor.x1-meteor.x0);
        const tx=x-Math.cos(ang)*trail, ty=y-Math.sin(ang)*trail;

        const grad = ctx.createLinearGradient(tx,ty,x,y);
        grad.addColorStop(0,'rgba(255,255,255,0)');
        grad.addColorStop(1,'rgba(255,255,255,.9)');
        ctx.strokeStyle = grad; ctx.lineWidth=1.2*DPR;
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(x,y); ctx.stroke();

        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,1.4*DPR,0,Math.PI*2); ctx.fill();
        if (p>=1) meteor.t=-1;
      }

      requestAnimationFrame(LOOP);
    };
    requestAnimationFrame(LOOP);
    return ()=>{ ro.disconnect(); };
  },[isNight]);

  return (
    <button
      id={id}
      onClick={toggle}
      aria-label="Toggle day / night"
      role="switch"
      aria-checked={isNight}
      className={className}
      style={{
        position:'relative', display:'inline-flex', height:dims.h, width:dims.w,
        borderRadius:9999, overflow:'hidden',
        border: isNight ? '1px solid rgba(90,170,255,.45)' : '1px solid rgba(0,0,0,.10)',
        boxShadow: isNight
          ? '0 0 0 2px rgba(90,170,255,.55), 0 0 16px rgba(90,170,255,.45), inset 0 0 0 1px rgba(255,255,255,.5)'
          : '0 6px 18px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.55)',
        background: isNight ? '#0a0a12' : '#ffffff',
        cursor:'pointer', WebkitTapHighlightColor:'transparent', isolation:'isolate', outline:'none'
      }}
    >
      {/* Day backdrop */}
      <span aria-hidden style={{
        position:'absolute', inset:0, borderRadius:9999,
        background:'linear-gradient(180deg,#bfe7ff 0%, #dff4ff 60%, #ffffff 100%)',
        opacity:isNight?0:1, transition:'opacity 400ms ease'
      }} />

      {/* Night sky */}
      {isNight && <canvas ref={skyRef} aria-hidden style={{ position:'absolute', inset:0, borderRadius:9999, pointerEvents:'none' }} />}

      {/* Knob */}
      <span aria-hidden style={{
        position:'absolute', top:dims.inset, left:dims.inset, height:dims.knob, width:dims.knob,
        borderRadius:'50%', background:'transparent', boxShadow:'0 6px 16px rgba(0,0,0,.18)',
        display:'grid', placeItems:'center',
        transform:`translateX(${isNight?dims.shift:0}px)`,
        transition:'transform 320ms cubic-bezier(.22,.61,.21,.99)'
      }}>
        {/* Sun */}
        <span style={{
          position:'absolute', inset:0, display:'grid', placeItems:'center',
          opacity:isNight?0:1, transition:'opacity 180ms ease',
          filter:'drop-shadow(0 0 18px rgba(255,210,80,.65))'
        }}>
          <span style={{
            width:dims.knob, height:dims.knob, borderRadius:'50%',
            background:'radial-gradient(circle at 45% 45%, #fff6c6 0%, #ffd75e 55%, #ffb200 100%)'
          }}/>
        </span>
        {/* Moon */}
        <span style={{
          position:'absolute', inset:0, display:'grid', placeItems:'center',
          opacity:isNight?1:0, transition:'opacity 180ms ease'
        }}>
          <img src={moonSrc} alt="" draggable={false}
               style={{ width:dims.knob, height:dims.knob, borderRadius:'50%', objectFit:'cover', mixBlendMode:'screen', filter:'saturate(1.15) brightness(1.02)' }}/>
        </span>
      </span>
    </button>
  );
}
