import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, EASE, reduced } from './lib/motion';
import Home from './pages/Home';
import Nav from './components/Nav';
import Cursor from './components/Cursor';
import Grain from './components/Grain';
import Loader from './components/Loader';
import MutatorTerminal from './components/MutatorTerminal';

const App = () => {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const triggerRef = useRef(null);

  /* Lenis drives scroll and ScrollTrigger reads from it — one clock,
     so pinned sections and scrubbed timelines never drift apart. */
  useEffect(() => {
    if (reduced()) {
      ScrollTrigger.refresh();
      return undefined;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      syncTouch: false,     // native momentum on touch stays native
      touchMultiplier: 1.6,
    });

    window.lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop: (value) =>
        value !== undefined ? lenis.scrollTo(value, { immediate: true }) : lenis.scroll,
    });

    // Anything that lands after first paint changes measured heights, and
    // a scrubbed trigger measured against the old layout stays stuck
    // part-way through its tween. Re-measure on each of them.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    const images = Array.from(document.images);
    const pending = images.filter((img) => !img.complete);
    let settled = pending.length;
    const onImage = () => {
      settled -= 1;
      if (settled <= 0) ScrollTrigger.refresh();
    };
    pending.forEach((img) => {
      img.addEventListener('load', onImage, { once: true });
      img.addEventListener('error', onImage, { once: true });
    });

    return () => {
      window.removeEventListener('load', onLoad);
      pending.forEach((img) => {
        img.removeEventListener('load', onImage);
        img.removeEventListener('error', onImage);
      });
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.lenis;
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  /* The terminal trigger stays out of the way until the hero is behind
     you, then fades in — it is a side dish, not the entrance. */
  useEffect(() => {
    const el = triggerRef.current;
    if (!el || reduced()) return undefined;

    const st = ScrollTrigger.create({
      trigger: '#about',
      start: 'top 70%',
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: EASE.swift, pointerEvents: 'auto' }),
      onLeaveBack: () => gsap.to(el, { opacity: 0, y: 20, duration: 0.4, pointerEvents: 'none' }),
    });

    return () => st.kill();
  }, []);

  return (
    <>
      <Grain />
      <Cursor />
      <Loader />
      <Nav />

      <main>
        <Home />
      </main>

      <button
        ref={triggerRef}
        className="mutator-trigger mono"
        onClick={() => setTerminalOpen(true)}
      >
        <span className="mutator-dot" aria-hidden="true" />
        Restyle this site
      </button>

      <MutatorTerminal isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />

      <style>{`
        .mutator-trigger {
          position: fixed;
          right: clamp(1rem, 3vw, 2rem);
          bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(1rem, 3vh, 2rem));
          z-index: 8000;
          display: inline-flex;
          align-items: center;
          gap: 0.6em;
          padding: 0.75em 1.15em;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(18, 16, 16, 0.86);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: var(--fg-dim);
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none;
          transition: color 0.3s var(--ease-out), border-color 0.3s var(--ease-out);
        }
        .mutator-trigger:hover { color: var(--fg); border-color: var(--amber); }
        .mutator-dot {
          width: 6px; height: 6px;
          border-radius: 999px;
          background: var(--amber);
          box-shadow: 0 0 10px var(--amber);
        }
        @media (prefers-reduced-motion: reduce) {
          .mutator-trigger { opacity: 1; transform: none; pointer-events: auto; }
        }
        @media (max-width: 560px) {
          .mutator-trigger { font-size: 0.62rem; padding: 0.7em 0.95em; }
        }
      `}</style>
    </>
  );
};

export default App;
