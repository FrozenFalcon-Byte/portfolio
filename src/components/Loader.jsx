import React, { useEffect, useRef, useState } from 'react';
import { gsap, EASE, reduced } from '../lib/motion';
import Mark from './Mark';

/* ------------------------------------------------------------------
   The loader — "a." stands for "ajinkya."

   One continuous story told with the logo itself:

   1. The mark writes itself, large, on a white page: the bowl draws
      round, the stem drops, the full stop bounces in.
   2. The full stop is shoved to the right as the rest of the name types
      in behind the a. Each letter lands in the visit's accent and then
      settles to ink.
   3. Nothing lifts or wipes. The letters "jinkya" each fly to the very
      letter of the hero's name they become, the "a." flies to the nav
      as the logo, and the loader's ground — the same paper as the page
      — is simply gone. The hero's capital A rises where the mark left,
      and the rest of the page builds around the name.
   ------------------------------------------------------------------ */
const TAIL = 'jinkya'.split('');
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

const Loader = () => {
  const rootRef = useRef(null);
  const veilRef = useRef(null);
  const wordRef = useRef(null);
  const markRef = useRef(null);
  const dotRef = useRef(null);
  const tailRef = useRef(null);
  const footRef = useRef(null);
  const fillRef = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const done = () => {
      window.loaderIsDone = true;
      window.dispatchEvent(new Event('loader-complete'));
      window.lenis?.start();
      document.documentElement.classList.remove('is-loading');
      gsap.set(rootRef.current, { autoAlpha: 0, pointerEvents: 'none' });
    };

    if (reduced()) { setCount(100); done(); return undefined; }

    window.lenis?.stop();
    document.documentElement.classList.add('is-loading');

    const mark = markRef.current;
    const bowl = mark.querySelector('.mark-bowl');
    const stem = mark.querySelector('.mark-stem');
    const dot = dotRef.current;
    const boxes = Array.from(tailRef.current.children);
    const letters = boxes.map((b) => b.firstElementChild);
    const widths = boxes.map((b) => b.firstElementChild.getBoundingClientRect().width);
    const meter = { v: 0 };
    // Colour tweens need a real value, not a var() — read it once here.
    const pop = pickPop();
    rootRef.current.style.setProperty('--acc', pop);
    const ink = getComputedStyle(rootRef.current).getPropertyValue('--lw-ink').trim() || '#0E0E0D';
    const row = document.querySelector('.hero-row--a');
    // Letters are drawn in the hero name's own weight, so the shapes
    // that fly are the shapes that land.
    if (row) tailRef.current.style.fontWeight = getComputedStyle(row).fontWeight;

    gsap.set([bowl, stem], { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(dot, { y: '-3em', scale: 0 });
    gsap.set(boxes, { width: 0 });
    gsap.set(letters, { yPercent: 110 });
    gsap.set(footRef.current, { opacity: 0, y: 16 });
    gsap.set('.nav-logo', { opacity: 0 });
    gsap.set('.nav-links, .nav-right', { opacity: 0, y: -10 });

    const tl = gsap.timeline();

    tl
      // 1 — the mark writes itself.
      .to(bowl, { strokeDashoffset: 0, duration: 0.8, ease: EASE.glide }, 0.1)
      .to(stem, { strokeDashoffset: 0, duration: 0.4, ease: EASE.swift }, 0.65)
      .to(dot, { scale: 1, duration: 0.15, ease: 'power2.out' }, 0.85)
      .to(dot, { y: 0, duration: 0.7, ease: 'bounce.out' }, 0.85)
      .to(footRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE.swift }, 0.5)
      .to(meter, {
        v: 100,
        duration: 2.4,
        ease: 'power1.inOut',
        onUpdate: () => setCount(Math.round(meter.v)),
      }, 0.5)
      .to(fillRef.current, { scaleX: 1, duration: 2.4, ease: 'power1.inOut' }, 0.5);

    // 2 — the name types in, shoving the dot along.
    boxes.forEach((b, i) => {
      const at = 1.5 + i * 0.11;
      tl.to(b, { width: widths[i], duration: 0.38, ease: EASE.swift }, at)
        .fromTo(letters[i],
          { yPercent: 110, color: pop },
          { yPercent: 0, duration: 0.42, ease: 'back.out(2)' }, at)
        .to(letters[i], { color: ink, duration: 0.5, ease: 'power1.out' }, at + 0.35);
    });

    /* Character boxes from text ranges: the content area of a glyph
       scales exactly with font size, whatever line-height its element
       has, so two of them can be lined up centre to centre. */
    const charRects = (el) => {
      const out = [];
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement.closest('.glyph') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      const r = document.createRange();
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        for (let k = 0; k < n.length; k += 1) {
          if (/\s/.test(n.data[k])) continue;
          r.setStart(n, k); r.setEnd(n, k + 1);
          out.push({ ch: n.data[k], box: r.getBoundingClientRect(), node: n.parentElement });
        }
      }
      return out;
    };

    const FLY = 2.85;
    const LAND = FLY + 1.15;

    tl
      .to(footRef.current, { opacity: 0, y: -12, duration: 0.4, ease: EASE.swift }, 2.6)

      // 3 — the letters become the hero's letters; the mark becomes the logo.
      .add(() => {
        const fly = (el, to, origin) => {
          const from = el.getBoundingClientRect();
          return { x: (to.left + to.width / 2) - (from.left + from.width / 2), y: (to.top + to.height / 2) - (from.top + from.height / 2), s: to.width / from.width, origin };
        };

        const navSvg = document.querySelector('.nav-logo .mark');
        const navDot = document.querySelector('.nav-logo .mark-dot');
        if (navSvg && navDot) {
          const m = fly(mark, navSvg.getBoundingClientRect());
          gsap.to(mark, { x: m.x, y: m.y, scale: m.s, transformOrigin: '50% 50%', duration: 1.1, ease: EASE.swift });
          const d = fly(dot, navDot.getBoundingClientRect());
          gsap.to(dot, {
            x: d.x, y: d.y, scale: d.s, transformOrigin: '50% 50%',
            backgroundColor: getComputedStyle(navDot).fill,
            duration: 1.1, ease: EASE.swift, delay: 0.06,
          });
        }

        if (!row) { gsap.to(boxes, { opacity: 0, duration: 0.5 }); return; }
        // The hero's line is put in its resting place under the veil so
        // its letters can be measured where they will finally sit.
        gsap.set(row, { yPercent: 0, rotate: 0, x: 0, xPercent: 0 });
        const targets = charRects(row);
        const sources = charRects(tailRef.current);
        const scale = parseFloat(getComputedStyle(row).fontSize) / parseFloat(getComputedStyle(boxes[0]).fontSize);
        gsap.set(boxes, { overflow: 'visible' });
        sources.forEach((src, k) => {
          const to = targets[k + 1]; // targets[0] is the capital A
          if (!to) return;
          const el = letters[k];
          const own = el.getBoundingClientRect();
          gsap.to(el, {
            x: (to.box.left + to.box.width / 2) - (src.box.left + src.box.width / 2),
            y: (to.box.top + to.box.height / 2) - (src.box.top + src.box.height / 2),
            scale,
            transformOrigin: `${src.box.left + src.box.width / 2 - own.left}px ${src.box.top + src.box.height / 2 - own.top}px`,
            duration: 1.1,
            delay: k * 0.025,
            ease: EASE.glide,
          });
        });
      }, FLY)

      // Hand over in a single frame: the veil and the hero share a
      // ground, so removing it shows nothing new except what landed.
      .set('.nav-logo', { opacity: 1 }, LAND)
      .set([veilRef.current, wordRef.current], { autoAlpha: 0 }, LAND)
      .add(() => {
        const a = row?.querySelector('.sc-ch');
        if (a) gsap.fromTo(a, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: EASE.swift });
        gsap.to('.nav-links, .nav-right', { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: EASE.swift });
      }, LAND)
      .add(done, LAND);

    if (import.meta.env.DEV) window.__loader = tl;

    return () => tl.kill();
  }, []);

  return (
    <div ref={rootRef} className="loader" aria-hidden="true">
      <div className="loader-veil" ref={veilRef} />

      <div className="loader-center">
        <div className="loader-word" ref={wordRef}>
          <Mark className="loader-mark" dot={false} ref={markRef} />
          <span className="loader-tail" ref={tailRef}>
            {TAIL.map((c, i) => (
              <span className="lw-box" key={i}><span className="lw-ch">{c}</span></span>
            ))}
          </span>
          <span className="loader-dot" ref={dotRef} />
        </div>
      </div>

      <div className="loader-foot shell" ref={footRef}>
        <span className="loader-who">Ajinkya Chavan</span>
        <span className="loader-pill">
          <span className="loader-fill" ref={fillRef} />
          <span className="num loader-count">{String(count).padStart(3, '0')}%</span>
        </span>
        <span className="mono loader-role">AI / ML Engineer · Portfolio ’26</span>
      </div>

      <style>{`
        .loader {
          --lw-ink: #0E0E0D;
          --lw-size: clamp(4.2rem, 15vw, 13rem);
          position: fixed; inset: 0; z-index: 9999;
          color: var(--lw-ink);
        }
        [data-theme="dark"] .loader { --lw-ink: #FAFAF7; }

        .loader-veil {
          position: absolute;
          inset: 0;
          background: var(--paper);
        }

        .loader-center {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
        }
        .loader-word {
          display: flex;
          align-items: flex-end;
          height: var(--lw-size);
          will-change: transform;
        }
        /* The svg box is a square of --lw-size; its a sits in the
           middle band of that square, so the letters are sized and
           lifted to share its x-height and baseline. */
        .loader-mark {
          width: var(--lw-size);
          height: var(--lw-size);
          max-width: none;
          flex: none;
          color: var(--lw-ink);
          overflow: visible;
          margin-right: calc(var(--lw-size) * -0.36);
        }
        .loader-tail {
          display: flex;
          align-items: flex-end;
          height: 100%;
          padding-bottom: calc(var(--lw-size) * 0.215);
        }
        .lw-box {
          display: inline-block;
          overflow: hidden;
          padding-bottom: 0.18em;
          margin-bottom: -0.18em;
          font-family: var(--font-display);
          font-size: calc(var(--lw-size) * 1.02);
          font-weight: 800;
          line-height: 0.74;
          letter-spacing: -0.05em;
        }
        .lw-ch { display: inline-block; padding-right: 0.02em; white-space: pre; will-change: transform; }

        .loader-dot {
          flex: none;
          width: calc(var(--lw-size) * 0.17);
          height: calc(var(--lw-size) * 0.17);
          margin: 0 0 calc(var(--lw-size) * 0.195) calc(var(--lw-size) * 0.105);
          border-radius: 999px;
          background: var(--acc);
        }

        .loader-foot {
          position: absolute;
          left: 0; right: 0;
          bottom: clamp(1.5rem, 5vh, 3rem);
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1rem;
        }
        .loader-who { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em; }
        .loader-role { justify-self: end; color: var(--ink-3); letter-spacing: -0.01em; font-size: var(--step--2); }
        .loader-pill {
          position: relative;
          display: grid;
          place-items: center;
          width: clamp(9rem, 22vw, 15rem);
          height: 2.6rem;
          border-radius: var(--r-pill);
          border: 1px solid var(--line);
          overflow: hidden;
        }
        .loader-fill {
          position: absolute;
          inset: 0;
          background: var(--acc);
          transform: scaleX(0);
          transform-origin: left;
          border-radius: inherit;
        }
        .loader-count {
          position: relative;
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--lw-ink);
          mix-blend-mode: normal;
        }

        html.is-loading { overflow: hidden; }

        @media (max-width: 640px) {
          .loader-foot { grid-template-columns: 1fr auto; }
          .loader-role { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .loader { display: none; } }
      `}</style>
    </div>
  );
};

export default Loader;
