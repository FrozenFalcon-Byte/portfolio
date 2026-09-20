import React, { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, EASE, reduced, token, magnetic, cleanup } from '../lib/motion';

/* ------------------------------------------------------------------
   SignalHero

   A field of rounded gradient pills — a signal read out live. It is
   canvas 2D on purpose: the old keyboard was a downloaded 3D model
   that never rendered on a phone, and this draws identically on every
   device with nothing to fetch.

   Four things drive the bar heights, summed:
     1. an ambient two-wave oscillation, so it is never still
     2. a fixed per-bar character, so the shape is recognisable
     3. pointer proximity — bars swell toward the cursor or finger
     4. scroll, which stretches the field into columns as you leave

   The entrance runs the field up from a flat line, which is also the
   resting state a reader with reduced motion sees.
   ------------------------------------------------------------------ */

const BAR_CHARACTER = [0.42, 0.78, 1.0, 0.86, 0.55, 0.95, 0.68, 0.38, 0.72, 0.9, 0.5, 0.82, 0.6, 0.34, 0.66];

const SignalHero = () => {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  const tagRef = useRef(null);
  const metaRef = useRef(null);
  const cueRef = useRef(null);
  const scrollRef = useRef({ p: 0 });

  /* ---------- canvas field ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const isReduced = reduced();

    const amber = token('--amber') || '#FFB800';
    const ember = token('--ember') || '#FF5C00';
    const bone = '#F2E4CB';

    let w = 0;
    let h = 0;
    let dpr = 1;
    let bars = [];
    let raf = 0;
    let t = 0;

    const pointer = { x: -9999, y: -9999, active: false };

    function layout() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = w < 560 ? 7 : w < 900 ? 11 : 15;
      const fieldW = Math.min(w * 0.82, 1080);
      const gap = fieldW * (w < 560 ? 0.028 : 0.022);
      const barW = (fieldW - gap * (count - 1)) / count;
      const startX = (w - fieldW) / 2;

      bars = Array.from({ length: count }, (_, i) => {
        const c = BAR_CHARACTER[i % BAR_CHARACTER.length];
        // Two bars run cream — the field needs a break in the heat or
        // it reads as one solid block.
        const isBone = i === Math.floor(count / 2) - 1 || i === count - 3;
        return {
          x: startX + i * (barW + gap),
          w: barW,
          character: c,
          phase: i * 0.62,
          isBone,
          cur: 0,
          target: 0,
        };
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      const midY = h / 2;
      const narrow = w < 560;
      const maxH = narrow ? Math.min(h * 0.30, 210) : Math.min(h * 0.54, 400);
      const sp = scrollRef.current.p;

      for (let i = 0; i < bars.length; i += 1) {
        const b = bars[i];

        const wave = 0.5 + 0.5 * Math.sin(t * 0.7 + b.phase);
        const wobble = 0.5 + 0.5 * Math.sin(t * 1.63 + b.phase * 1.9);
        const ambient = b.character * (0.62 + wave * 0.26 + wobble * 0.12);

        let pull = 0;
        if (pointer.active) {
          const d = Math.abs(pointer.x - (b.x + b.w / 2));
          pull = Math.max(0, 1 - d / (b.w * 3.4)) ** 2 * 0.42;
        }

        // Leaving the hero stretches the field into tall columns.
        const stretch = 1 + sp * 1.5;
        b.target = Math.min(1.25, (ambient + pull) * stretch);
        b.cur += (b.target - b.cur) * (isReduced ? 1 : 0.11);

        const barH = Math.max(b.w, b.cur * maxH * intro.v);
        const y = midY - barH / 2;
        const r = b.w / 2;

        const g = ctx.createLinearGradient(b.x, y, b.x + b.w, y + barH);
        if (b.isBone) {
          g.addColorStop(0, '#FFFFFF');
          g.addColorStop(1, bone);
        } else {
          g.addColorStop(0, amber);
          g.addColorStop(1, ember);
        }

        ctx.globalAlpha = Math.max(0, 1 - sp * 1.15);
        ctx.fillStyle = g;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(b.x, y, b.w, barH, r);
        } else {
          // Safari < 16 has no roundRect; a stadium is two arcs and a box.
          ctx.moveTo(b.x, y + r);
          ctx.arc(b.x + r, y + r, r, Math.PI, 0);
          ctx.lineTo(b.x + b.w, y + barH - r);
          ctx.arc(b.x + r, y + barH - r, r, 0, Math.PI);
          ctx.closePath();
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Entrance: the field runs up out of a flat line.
    const intro = { v: isReduced ? 1 : 0 };

    function frame() {
      t += 0.016;
      draw();
      raf = requestAnimationFrame(frame);
    }

    const onPointer = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };

    layout();
    draw();

    if (isReduced) {
      // One static frame, no loop.
      intro.v = 1;
      bars.forEach((b) => { b.cur = b.character * 0.8; });
      draw();
    } else {
      gsap.to(intro, { v: 1, duration: 1.6, ease: EASE.swift, delay: 0.15 });
      raf = requestAnimationFrame(frame);
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('pointerleave', onLeave);
    }

    const ro = new ResizeObserver(() => { layout(); draw(); });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  /* ---------- type entrance + scroll handoff ---------- */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const isReduced = reduced();

      if (!isReduced) {
        const lines = titleRef.current?.querySelectorAll('.hero-line-inner');
        const tl = gsap.timeline({ delay: 0.35 });

        tl.fromTo(
          lines,
          { yPercent: 112 },
          { yPercent: 0, duration: 1.25, stagger: 0.11, ease: EASE.swift }
        )
          .fromTo(tagRef.current, { opacity: 0, scaleX: 0.7 }, { opacity: 1, scaleX: 1, duration: 0.9, ease: EASE.swift }, '-=0.75')
          .fromTo(
            metaRef.current?.children || [],
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: EASE.swift },
            '-=0.6'
          )
          .fromTo(cueRef.current, { opacity: 0 }, { opacity: 1, duration: 0.7 }, '-=0.4');
      }

      // Scroll handoff: the hero doesn't cut away, it recedes.
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: (self) => { scrollRef.current.p = self.progress; },
      });

      if (!isReduced) {
        gsap.to(titleRef.current, {
          yPercent: -18,
          opacity: 0.12,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
        });
        gsap.to('.hero-bloom', {
          opacity: 0,
          scale: 1.4,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => cleanup([magnetic(cueRef.current, 0.25)]), []);

  return (
    <section ref={rootRef} id="intro" className="hero">
      <div className="hero-stage">
        <div className="hero-bloom bloom" aria-hidden="true" />
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />

        <div className="hero-inner shell">
          <h1 ref={titleRef} className="hero-title display display--xl">
            <span className="split-line"><span className="hero-line-inner">Ajinkya</span></span>
            <span className="split-line"><span className="hero-line-inner">Chavan</span></span>
          </h1>

          <span ref={tagRef} className="hero-tag mono">AI / ML ENGINEER — GENERATIVE SYSTEMS</span>
        </div>
      </div>

      <div ref={metaRef} className="hero-meta shell">
        <div className="hero-meta-col">
          <span className="eyebrow eyebrow--plain">Currently</span>
          <p>PMO AI/ML Intern at Emerson, building multi-agent frameworks on LangGraph.</p>
        </div>
        <div className="hero-meta-col">
          <span className="eyebrow eyebrow--plain">Focus</span>
          <p>Generative AI, autonomous agents, and the full-stack systems that carry them.</p>
        </div>
      </div>

      <a ref={cueRef} href="#about" className="hero-cue mono" aria-label="Scroll to about">
        <span>Scroll</span>
        <span className="hero-cue-line" aria-hidden="true" />
      </a>

      <style>{`
        .hero {
          position: relative;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          isolation: isolate;
          padding-block: clamp(6rem, 14vh, 9rem) clamp(4rem, 10vh, 7rem);
        }
        /* Field and lockup share one centred stage — they are one object,
           and on a tall phone they must not drift apart. */
        .hero-stage {
          position: relative;
          flex: 1;
          display: grid;
          place-items: center;
          min-height: 0;
        }
        .hero-bloom {
          top: 50%; left: 50%;
          width: min(120vw, 1300px);
          height: min(70vh, 620px);
          transform: translate(-50%, -50%);
          background: radial-gradient(
            ellipse at center,
            rgba(255, 150, 0, 0.42) 0%,
            rgba(255, 92, 0, 0.20) 36%,
            rgba(10, 9, 8, 0) 70%
          );
          z-index: 0;
        }
        .hero-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        .hero-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          pointer-events: none;
        }
        .hero-title {
          margin: 0;
          font-size: clamp(3.4rem, 18vw, 15rem);
          font-stretch: 64%;
          line-height: 0.83;
          color: var(--fg);
          text-shadow: 0 0 22px rgba(10, 9, 8, 0.85), 0 0 70px rgba(10, 9, 8, 0.6);
        }
        .hero-title .split-line { display: block; }
        .hero-line-inner { display: block; will-change: transform; }

        /* The label rides across the name, the way dkton crosses its
           title — the two layers read as one lockup. */
        .hero-tag {
          position: absolute;
          top: 50%;
          left: 50%;
          translate: -50% -50%;
          z-index: 3;
          padding: 0.45em 0.9em;
          background: var(--ink);
          border: 1px solid var(--line);
          border-radius: 999px;
          color: var(--amber);
          font-weight: 500;
          letter-spacing: 0.16em;
          font-size: clamp(0.56rem, 1.6vw, 0.8rem);
          white-space: nowrap;
          max-width: calc(100% - 2 * var(--gutter));
        }

        .hero-meta {
          position: relative;
          z-index: 2;
          flex: none;
          padding-top: clamp(2rem, 6vh, 4rem);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: clamp(1.5rem, 4vw, 4rem);
          max-width: var(--shell);
        }
        .hero-meta-col { display: flex; flex-direction: column; gap: 0.6rem; max-width: 34ch; }
        .hero-meta-col p { color: var(--fg-dim); font-size: var(--step--1); line-height: 1.6; }

        .hero-cue {
          position: absolute;
          right: var(--gutter);
          bottom: clamp(1.5rem, 5vh, 3rem);
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          color: var(--fg-faint);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.68rem;
        }
        .hero-cue-line {
          display: block;
          width: 46px;
          height: 1px;
          background: linear-gradient(90deg, var(--fg-faint), var(--amber));
          transform-origin: left;
          animation: cueSlide 2.6s var(--ease-in-out) infinite;
        }
        @keyframes cueSlide {
          0%, 100% { transform: scaleX(0.35); opacity: 0.5; }
          50% { transform: scaleX(1); opacity: 1; }
        }

        @media (max-width: 720px) {
          .hero-meta { grid-template-columns: 1fr; gap: 1.25rem; }
          .hero-meta-col:last-child { display: none; }
          .hero-cue { right: auto; left: var(--gutter); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-cue-line { animation: none; transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
};

export default SignalHero;
