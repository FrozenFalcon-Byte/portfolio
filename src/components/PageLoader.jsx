import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, reduced } from '../lib/motion';
import Glyph from './Glyph';

/* ------------------------------------------------------------------
   The loader for every page that is not home.

   A reload lands you inside a page, so the wait is told with the one
   thing every page already has: its tab in the nav. The tab is shown
   blown up in the middle of the screen, with the page's glyph and
   name, and it fills with the page's accent from left to right as the
   page actually loads (fonts and assets, never less than a beat). The
   filled part reads in the accent's own ink, so the name is legible
   all the way across.

   When it is full, the pill flies up into its slot in the nav and
   turns from accent to ink as it lands, which is exactly how the nav
   marks the page you are on. The ground thins away and the page rises
   in under it. Pages without a tab land on the index button instead.
   ------------------------------------------------------------------ */
export const loaderKind = (path) => {
  if (path.startsWith('/story')) return 'story';
  if (path.startsWith('/lab')) return 'lab';
  if (path.startsWith('/experience')) return 'graph';
  if (path.startsWith('/settings')) return 'settings';
  return 'mark';
};

const META = {
  story: { word: 'Story', glyph: 'ship', acc: 'yellow', note: 'A camera ride through the years', tab: '/story' },
  lab: { word: 'Workshop', glyph: 'stack', acc: 'lime', note: 'Seven builds, one map', tab: '/lab', ink: true },
  graph: { word: 'Emerson', glyph: 'graph', acc: 'blue', note: 'Two agent systems, drawn out', tab: null },
  settings: { word: 'Settings', glyph: 'dial', acc: 'violet', note: 'Make the site yours', tab: null },
  mark: { word: 'Portfolio', glyph: 'mark', acc: 'pink', note: 'Ajinkya Chavan · AI / ML', tab: null },
};

// Resolves once fonts and the window's own assets are in, or after a
// ceiling so a slow image never holds the page hostage.
const ready = () => Promise.race([
  Promise.all([
    document.fonts?.ready ?? Promise.resolve(),
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((r) => window.addEventListener('load', r, { once: true })),
  ]),
  new Promise((r) => setTimeout(r, 4000)),
]);

const PageLoader = ({ kind }) => {
  const rootRef = useRef(null);
  const groundRef = useRef(null);
  const pillRef = useRef(null);
  const topRef = useRef(null);
  const sideRef = useRef(null);
  const [count, setCount] = useState(0);
  const m = META[kind];

  useEffect(() => {
    const root = rootRef.current;
    const pill = pillRef.current;
    const top = topRef.current;
    const nav = '.nav-logo, .nav-links, .nav-right';
    const done = () => {
      window.loaderIsDone = true;
      window.dispatchEvent(new Event('loader-complete'));
      window.lenis?.start();
      document.documentElement.classList.remove('is-loading');
      gsap.set(root, { autoAlpha: 0, pointerEvents: 'none' });
    };
    if (reduced()) { done(); return undefined; }

    window.lenis?.stop();
    document.documentElement.classList.add('is-loading');
    // Opacity only: the nav must stay where it lands so the pill can be
    // measured against it.
    gsap.set(nav, { opacity: 0 });

    const meter = { v: 0 };
    const paint = () => {
      top.style.clipPath = `inset(0 ${(100 - meter.v).toFixed(2)}% 0 0 round 999px)`;
      setCount(Math.round(meter.v));
    };
    paint();

    let alive = true;
    const intro = gsap.timeline()
      .fromTo(pill, { scale: 0.6, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.9, ease: EASE.swift }, 0.1)
      .fromTo(sideRef.current.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: EASE.swift }, 0.35)
      .to(meter, { v: 82, duration: 1.3, ease: 'power2.out', onUpdate: paint }, 0.3);

    let out;
    Promise.all([ready(), new Promise((r) => intro.eventCallback('onComplete', r))]).then(() => {
      if (!alive) return;
      const page = document.querySelector('main.page');
      const target = (m.tab && document.querySelector(`.nav-tab[data-to="${m.tab}"]`))
        || document.querySelector('.nav-index');
      const from = pill.getBoundingClientRect();
      const to = target?.getBoundingClientRect();
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#0E0E0D';

      out = gsap.timeline({ onComplete: done })
        .to(meter, { v: 100, duration: 0.45, ease: 'power2.inOut', onUpdate: paint })
        .to(sideRef.current.children, { opacity: 0, y: -10, duration: 0.3, stagger: 0.04 }, 0.35)
        .to(pill.querySelectorAll('.pl-pill-in'), { opacity: 0, duration: 0.25 }, 0.5)
        .to(nav, { opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power1.out' }, 0.5);

      if (to && to.width) {
        // Once its contents are gone the pill is lifted out of the layout
        // and flown by its real box, so it stays a true pill all the way
        // into the tab, turning from accent to ink as it lands.
        out.add(() => {
          pill.querySelectorAll('.pl-pill-in').forEach((n) => { n.style.display = 'none'; });
          pill.querySelectorAll('.pl-pill-l').forEach((n) => { n.style.position = 'absolute'; n.style.inset = '0'; n.style.padding = '0'; });
          gsap.set(pill, { position: 'fixed', left: from.left, top: from.top, width: from.width, height: from.height, margin: 0 });
        }, 0.8)
          .to(pill, {
            left: to.left, top: to.top, width: to.width, height: to.height,
            duration: 0.85, ease: EASE.glide,
          }, 0.8)
          .to(top, { backgroundColor: ink, duration: 0.6, ease: 'power1.inOut' }, 1)
          .to(pill, { opacity: 0, duration: 0.3 }, 1.6);
      } else {
        out.to(pill, { scale: 0.4, opacity: 0, duration: 0.6, ease: EASE.glide }, 0.55);
      }
      out.to(groundRef.current, { opacity: 0, duration: 0.8, ease: 'power1.inOut' }, 0.9);
      if (page) {
        out.fromTo(page, { y: 60, opacity: 0 }, {
          y: 0, opacity: 1, duration: 1, ease: EASE.swift, clearProps: 'transform,opacity',
          onComplete: () => ScrollTrigger.refresh(),
        }, 0.95);
      }
    });

    return () => { alive = false; intro.kill(); out?.kill(); };
  }, [kind]);

  return (
    <div
      ref={rootRef}
      className={`loader pl pl--${kind}`}
      aria-hidden="true"
      data-surface={m.ink ? 'ink' : undefined}
      data-acc={m.acc}
    >
      <div className="pl-ground" ref={groundRef} />
      <div className="pl-center">
        <div className="pl-pill" ref={pillRef}>
          <div className="pl-pill-l pl-pill-base">
            <span className="pl-pill-in pl-g"><Glyph kind={m.glyph} acc={m.acc} /></span>
            <span className="pl-pill-in pl-w display">{m.word}</span>
            <span className="pl-pill-in pl-n num">{String(count).padStart(2, '0')}</span>
          </div>
          <div className="pl-pill-l pl-pill-top" ref={topRef}>
            <span className="pl-pill-in pl-g"><Glyph kind={m.glyph} acc={m.acc} /></span>
            <span className="pl-pill-in pl-w display">{m.word}</span>
            <span className="pl-pill-in pl-n num">{String(count).padStart(2, '0')}</span>
          </div>
        </div>
        <div className="pl-side" ref={sideRef}>
          <span className="pl-who">Ajinkya Chavan</span>
          <span className="pl-note">{m.note}</span>
        </div>
      </div>

      <style>{`
        .pl { position: fixed; inset: 0; z-index: 9999; color: var(--ink); background: transparent; }
        .pl-ground { position: absolute; inset: 0; background: var(--paper); }
        .pl-center {
          position: absolute; inset: 0;
          display: grid; place-content: center; justify-items: center;
          gap: clamp(1.2rem, 3vh, 2rem);
          padding: 0 var(--gutter);
        }
        .pl-pill { position: relative; transform-origin: 50% 50%; will-change: transform; }
        .pl-pill-l {
          display: flex; align-items: center;
          gap: clamp(0.8rem, 2vw, 1.6rem);
          padding: clamp(0.6rem, 1.4vw, 1rem) clamp(1rem, 2.6vw, 2rem) clamp(0.6rem, 1.4vw, 1rem) clamp(0.7rem, 1.6vw, 1.1rem);
          border-radius: 999px;
          white-space: nowrap;
        }
        .pl-pill-base { background: var(--paper-2); box-shadow: inset 0 0 0 1px var(--line); color: var(--ink); }
        .pl-pill-top {
          position: absolute; inset: 0;
          background: var(--acc); color: var(--acc-ink);
          clip-path: inset(0 100% 0 0 round 999px);
          --pa: var(--acc);
        }
        /* On the filled side the glyph flips: ink-coloured pill, accent marks. */
        .pl-pill-top .glyph { --acc: currentColor; --acc-ink: var(--pa); }
        .pl-g { font-size: clamp(2.2rem, 6vw, 4.6rem); line-height: 0; }
        .pl-w {
          font-size: clamp(2.6rem, 8vw, 6.6rem);
          font-weight: 800; letter-spacing: -0.055em; line-height: 1;
          padding-bottom: 0.06em;
        }
        .pl-n {
          align-self: flex-start;
          margin-top: 0.5em;
          min-width: 2ch;
          font-size: clamp(0.9rem, 1.6vw, 1.2rem); font-weight: 650;
        }
        .pl-pill-base .pl-n { color: var(--ink-3); }
        .pl-side { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem 1.2rem; font-size: var(--step--1); font-weight: 600; }
        .pl-who { color: var(--ink); }
        .pl-note { color: var(--ink-3); }
        html.is-loading { overflow: hidden; }
        @media (prefers-reduced-motion: reduce) { .pl { display: none; } }
      `}</style>
    </div>
  );
};

export default PageLoader;
