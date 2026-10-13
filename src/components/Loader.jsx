import React, { useEffect, useRef, useState } from 'react';
import { gsap, EASE, reduced } from '../lib/motion';
import PageLoader, { loaderKind } from './PageLoader';
import { getPrefs } from '../lib/prefs';

/* ------------------------------------------------------------------
   The loader: a wall of moving type.

   Six bands fill the screen, each running one line of the story in
   huge type, alternate bands running opposite ways. They slide in one
   after another, in ink, paper and the visit's one colour. In the
   middle sits a black badge: the count, a ring that fills with the
   real loading, and the name turning round its edge.

   When the page is in, the bands pull away like blinds, alternately
   left and right, and the hero is standing underneath; the badge
   flies up and becomes the logo in the nav.
   ------------------------------------------------------------------ */
/* The loader runs in one colour, drawn at random for each visit and
   never the previous visit's — the site itself keeps its own accents. */
const POPS = ['#E61A66', '#FFD400', '#3860BE', '#A68AFF', '#C8F55C', '#0E7C86'];
const pickPop = () => {
  let last = null;
  try { last = localStorage.getItem('ac-loader-pop'); } catch (e) { /* private mode */ }
  const pool = POPS.filter((c) => c !== last);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  try { localStorage.setItem('ac-loader-pop', pick); } catch (e) { /* private mode */ }
  return pick;
};

const BANDS = [
  { t: 'Ajinkya Chavan', k: 'acc' },
  { t: 'Agents in production', k: 'ink' },
  { t: 'Retrieval that cites its sources', k: 'paper' },
  { t: 'LangGraph · FastAPI · React · Azure', k: 'acc' },
  { t: 'Shipping at Emerson', k: 'ink' },
  { t: 'AI / ML engineer · Pune', k: 'paper' },
];
const RING = 'Loading the portfolio of Ajinkya Chavan · AI / ML engineer · ';
const R = 44; const C = 2 * Math.PI * R;

const HomeLoader = () => {
  const rootRef = useRef(null);
  const badgeRef = useRef(null);
  const arcRef = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const done = () => {
      window.loaderIsDone = true;
      window.dispatchEvent(new Event('loader-complete'));
      window.lenis?.start();
      document.documentElement.classList.remove('is-loading');
    };
    if (reduced()) { setCount(100); done(); gsap.set(root, { autoAlpha: 0 }); return undefined; }

    window.lenis?.stop();
    document.documentElement.classList.add('is-loading');
    root.style.setProperty('--acc', pickPop());
    gsap.set('.nav-logo, .nav-links, .nav-right', { opacity: 0, y: -10 });

    const bands = Array.from(root.querySelectorAll('.ld-band'));
    const badge = badgeRef.current;
    const ready = Promise.race([
      Promise.all([
        document.fonts?.ready ?? Promise.resolve(),
        document.readyState === 'complete'
          ? Promise.resolve()
          : new Promise((r) => window.addEventListener('load', r, { once: true })),
      ]),
      new Promise((r) => setTimeout(r, 4000)),
    ]);

    const meter = { v: 0 };
    const paint = () => {
      arcRef.current.style.strokeDashoffset = (C * (1 - meter.v / 100)).toFixed(2);
      setCount(Math.round(meter.v));
    };
    paint();

    gsap.set(bands, { xPercent: (i) => (i % 2 ? 101 : -101) });
    gsap.set(badge, { scale: 0, rotate: -90 });

    let alive = true;
    const intro = gsap.timeline()
      .to(bands, { xPercent: 0, duration: 0.75, stagger: 0.07, ease: 'expo.out' }, 0)
      .to(badge, { scale: 1, rotate: 0, duration: 0.9, ease: 'back.out(1.7)' }, 0.35)
      .to(meter, { v: 88, duration: 1.8, ease: 'power1.inOut', onUpdate: paint }, 0.45);

    let out;
    Promise.all([ready, new Promise((r) => intro.eventCallback('onComplete', r))]).then(() => {
      if (!alive) return;
      const logo = document.querySelector('.nav-logo')?.getBoundingClientRect();
      const b = badge.getBoundingClientRect();
      out = gsap.timeline()
        .to(meter, { v: 100, duration: 0.5, ease: 'power2.out', onUpdate: paint })
        .to(badge, { scale: 1.12, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }, 0.5)
        .add(done, 0.85)
        .to(bands, {
          xPercent: (i) => (i % 2 ? -101 : 101),
          duration: 0.9, stagger: { each: 0.05, from: 'center' }, ease: 'expo.inOut',
        }, 0.75);
      if (logo && logo.width) {
        out.to(badge, {
          x: logo.left + logo.width / 2 - (b.left + b.width / 2),
          y: logo.top + logo.height / 2 - (b.top + b.height / 2),
          scale: logo.width / b.width, rotate: 180,
          duration: 0.95, ease: 'expo.inOut',
        }, 0.8)
          .set('.nav-logo', { opacity: 1, y: 0 }, 1.7)
          .to(badge, { opacity: 0, duration: 0.2 }, 1.7);
      } else {
        out.to(badge, { scale: 0, duration: 0.6, ease: 'expo.in' }, 0.8);
      }
      out.to('.nav-links, .nav-right', { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: EASE.swift }, 1.3)
        .set(root, { autoAlpha: 0, pointerEvents: 'none' }, 1.95);
    });

    if (import.meta.env.DEV) window.__loader = intro;
    return () => { alive = false; intro.kill(); out?.kill(); };
  }, []);

  return (
    <div ref={rootRef} className="loader ld" aria-hidden="true">
      <div className="ld-bands">
        {BANDS.map((b, i) => (
          <div key={b.t} className={`ld-band ld-band--${b.k}`}>
            <div className={`ld-run${i % 2 ? ' is-rev' : ''}`} style={{ animationDuration: `${16 + i * 2.5}s` }}>
              {[0, 1].map((h) => (
                <span key={h} className="ld-half">
                  {[0, 1, 2].map((n) => <span key={n} className="ld-w display">{b.t}<i /></span>)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ld-badge" ref={badgeRef}>
        <svg viewBox="0 0 100 100" className="ld-ring">
          <defs><path id="ld-circ" d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" /></defs>
          <circle cx="50" cy="50" r="49" className="ld-disc" />
          <circle cx="50" cy="50" r={R} className="ld-track" />
          <circle cx="50" cy="50" r={R} className="ld-arc" ref={arcRef} style={{ strokeDasharray: C }} />
          <g className="ld-spin">
            <text><textPath href="#ld-circ" textLength={2 * Math.PI * 36 - 2}>{RING}</textPath></text>
          </g>
        </svg>
        <b className="ld-num display">{count}</b>
      </div>

      <style>{`
        .ld { position: fixed; inset: 0; z-index: 9999; overflow: hidden; --lh: calc(100svh / 6); }
        .ld-bands { position: absolute; inset: 0; display: grid; grid-template-rows: repeat(6, 1fr); }
        .ld-band { position: relative; overflow: hidden; display: flex; align-items: center; will-change: transform; }
        .ld-band--acc { background: var(--acc); color: #0E0E0D; }
        .ld-band--ink { background: #0E0E0D; color: #FFFFFF; }
        .ld-band--paper { background: #FFFFFF; color: #0E0E0D; }
        .ld-run { display: flex; width: max-content; animation: ld-run 18s linear infinite; }
        .ld-run.is-rev { animation-direction: reverse; }
        @keyframes ld-run { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ld-half { display: flex; flex: none; }
        .ld-w {
          display: inline-flex; align-items: center; gap: 0.35em; padding-right: 0.35em;
          font-size: min(calc(var(--lh) * 0.78), 16vw);
          font-weight: 800; letter-spacing: -0.055em; line-height: 1; white-space: nowrap;
        }
        .ld-w i { flex: none; width: 0.2em; height: 0.2em; border-radius: 50%; background: currentColor; }
        .ld-band--paper .ld-w i, .ld-band--ink .ld-w i { background: var(--acc); }

        .ld-badge {
          position: absolute; left: 50%; top: 50%;
          width: clamp(10rem, 30vmin, 17rem); aspect-ratio: 1;
          margin: calc(clamp(10rem, 30vmin, 17rem) / -2) 0 0 calc(clamp(10rem, 30vmin, 17rem) / -2);
          display: grid; place-items: center;
          will-change: transform;
        }
        .ld-ring { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .ld-disc { fill: #0E0E0D; stroke: #FFFFFF; stroke-width: 1.2; }
        .ld-track { fill: none; stroke: rgb(255 255 255 / 0.14); stroke-width: 2.4; }
        .ld-arc { fill: none; stroke: var(--acc); stroke-width: 2.4; stroke-linecap: round; transform: rotate(-90deg); transform-origin: 50px 50px; }
        .ld-spin { transform-origin: 50px 50px; animation: ld-spin 9s linear infinite; }
        @keyframes ld-spin { to { transform: rotate(360deg); } }
        .ld-spin text { fill: #FFFFFF; font-family: var(--font-display); font-weight: 700; font-size: 6.2px; letter-spacing: 0.08em; text-transform: uppercase; }
        .ld-num { position: relative; color: var(--acc); font-size: clamp(2.8rem, 9vmin, 5rem); font-weight: 800; letter-spacing: -0.06em; line-height: 1; }
        .ld-num::after { content: '%'; font-size: 0.36em; margin-left: 0.06em; vertical-align: 1.3em; color: #FFFFFF; letter-spacing: 0; }

        html.is-loading { overflow: hidden; }
        @media (prefers-reduced-motion: reduce) { .ld { display: none; } }
      `}</style>
    </div>
  );
};

/* Home runs the wall of type; every other page gets a loader told in its own
   idea. Decided once, by where the reload landed. */
/* Settings can turn the loader off, or show it once per visit. Either
   way the page is told loading is done exactly as if it had played, so
   everything that waits on it still makes its entrance. */
const SEEN = 'ac-loader-seen';
const skipLoader = () => {
  const { loader } = getPrefs();
  if (loader === 'never') return true;
  if (loader !== 'once') return false;
  try {
    if (sessionStorage.getItem(SEEN)) return true;
    sessionStorage.setItem(SEEN, '1');
  } catch { /* storage blocked: just play it */ }
  return false;
};

const NoLoader = () => {
  useEffect(() => {
    window.loaderIsDone = true;
    document.documentElement.classList.remove('is-loading');
    window.dispatchEvent(new Event('loader-complete'));
  }, []);
  return null;
};

const Loader = () => {
  const [kind] = useState(() => {
    if (skipLoader()) return 'none';
    return window.location.pathname === '/' ? 'home' : loaderKind(window.location.pathname);
  });
  if (kind === 'none') return <NoLoader />;
  return kind === 'home' ? <HomeLoader /> : <PageLoader kind={kind} />;
};

export default Loader;
