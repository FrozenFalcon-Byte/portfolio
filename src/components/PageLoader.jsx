import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, reduced } from '../lib/motion';
import Mark from './Mark';

/* ------------------------------------------------------------------
   Loaders for the pages that are not home. A reload lands you inside
   a page with its own idea, so the wait is told in that idea:

   story   — the camera ride: the years rush at you through the lens
             and the last one carries you into the first chapter.
   lab     — the workshop: a tower goes up floor by floor, one floor
             per build, on the same ink ground as the map.
   graph   — the Emerson case: an agent graph wires itself up, a
             charge runs through it, and it folds into a point.
   mark    — anywhere else: the logo writes itself.
   ------------------------------------------------------------------ */
export const loaderKind = (path) => {
  if (path.startsWith('/story')) return 'story';
  if (path.startsWith('/lab')) return 'lab';
  if (path.startsWith('/experience')) return 'graph';
  return 'mark';
};

const YEARS = ['2023', '2024', '2025', '2026', '2027'];
const FLOORS = ['pink', 'yellow', 'lime', 'blue', 'violet', 'teal', 'pink'];

const A = 104; const B = 60; const T = 22; const STEP = 30;
const slab = (i) => {
  const y = -i * STEP;
  const p = (pts) => pts.map(([x, yy]) => `${x},${yy + y}`).join(' ');
  return {
    top: p([[0, 0], [A, B], [0, 2 * B], [-A, B]]),
    left: p([[-A, B], [0, 2 * B], [0, 2 * B + T], [-A, B + T]]),
    right: p([[0, 2 * B], [A, B], [A, B + T], [0, 2 * B + T]]),
  };
};

const NODES = [[90, 150], [230, 70], [230, 230], [380, 150], [520, 80], [520, 220], [650, 150]];
const EDGES = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]];
const curve = ([x1, y1], [x2, y2]) => {
  const dx = (x2 - x1) / 2;
  return `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
};

const COPY = {
  story: { who: 'The story', what: 'A camera ride through the years' },
  lab: { who: 'The workshop', what: 'Seven builds, one map' },
  graph: { who: 'Emerson · PMO AI/ML', what: 'Two graphs, one footprint' },
  mark: { who: 'Ajinkya Chavan', what: 'AI / ML Engineer · Portfolio ’26' },
};

const PageLoader = ({ kind }) => {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const footRef = useRef(null);
  const fillRef = useRef(null);
  const [count, setCount] = useState(kind === 'lab' ? '0 / 7' : '000%');

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
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
    gsap.set('.nav-logo, .nav-links, .nav-right', { opacity: 0, y: -10 });
    gsap.set(footRef.current, { opacity: 0, y: 16 });

    const page = document.querySelector('main.page');
    // Pins measured while the page is still scaled keep the wrong size.
    const settle = () => ScrollTrigger.refresh();
    const tl = gsap.timeline();
    const meter = { v: 0 };
    const pct = () => setCount(`${String(Math.round(meter.v)).padStart(3, '0')}%`);

    tl.to(footRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE.swift }, 0.2);

    let END = 2.6;

    if (kind === 'story') {
      const years = stage.querySelectorAll('.pl-year');
      const last = stage.querySelector('.pl-title');
      // Each year comes out of the distance, holds for a beat in focus,
      // then passes the lens — bigger, softer, gone.
      years.forEach((y, i) => {
        const at = 0.3 + i * 0.36;
        tl.fromTo(y, { scale: 0.18, opacity: 0, filter: 'blur(8px)' },
          { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.42, ease: 'power2.out' }, at)
          .to(y, { scale: 4.2, opacity: 0, filter: 'blur(14px)', duration: 0.42, ease: 'power2.in' }, at + 0.42);
      });
      const tAt = 0.3 + YEARS.length * 0.36 + 0.1;
      tl.fromTo(last, { scale: 0.18, opacity: 0, filter: 'blur(8px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: EASE.swift }, tAt)
        .to(meter, { v: 100, duration: tAt + 0.4, ease: 'power1.inOut', onUpdate: pct }, 0.2)
        .to(fillRef.current, { scaleX: 1, duration: tAt + 0.4, ease: 'power1.inOut' }, 0.2);
      END = tAt + 0.9;
      // Through the lens and into the page.
      tl.to(footRef.current, { opacity: 0, y: -12, duration: 0.35 }, END - 0.3)
        .to(stage, { scale: 5, opacity: 0, filter: 'blur(16px)', duration: 0.8, ease: 'power2.in' }, END)
        .to(root, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, END + 0.45);
      if (page) tl.fromTo(page, { scale: 0.86, filter: 'blur(10px)' }, { scale: 1, filter: 'blur(0px)', duration: 1, ease: EASE.glide, clearProps: 'transform,filter', onComplete: settle }, END + 0.3);
      END += 0.95;
    } else if (kind === 'lab') {
      const floors = stage.querySelectorAll('.pl-floor');
      const tower = stage.querySelector('.pl-tower');
      gsap.set(floors, { y: -90, opacity: 0 });
      floors.forEach((f, i) => {
        const at = 0.35 + i * 0.24;
        tl.to(f, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, at)
          .add(() => setCount(`${i + 1} / 7`), at + 0.2);
      });
      tl.to(fillRef.current, { scaleX: 1, duration: 0.35 + FLOORS.length * 0.24, ease: 'power1.inOut' }, 0.2);
      END = 0.35 + FLOORS.length * 0.24 + 0.6;
      // The camera rises off the finished tower and the map is there.
      tl.to(footRef.current, { opacity: 0, y: -12, duration: 0.35 }, END - 0.3)
        .to(tower, { y: 120, scale: 0.55, opacity: 0, duration: 0.8, ease: EASE.swift, transformOrigin: '50% 100%' }, END)
        .to(stage.querySelector('.pl-cap'), { opacity: 0, y: 20, duration: 0.4 }, END)
        .to(root, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }, END + 0.4);
      if (page) tl.fromTo(page, { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: EASE.glide, clearProps: 'transform,opacity', onComplete: settle }, END + 0.3);
      END += 1;
    } else if (kind === 'graph') {
      const nodes = stage.querySelectorAll('.pl-node');
      const edges = stage.querySelectorAll('.pl-edge');
      const charge = stage.querySelectorAll('.pl-charge');
      gsap.set(nodes, { scale: 0, transformOrigin: '50% 50%', transformBox: 'fill-box' });
      gsap.set([...edges, ...charge], { strokeDasharray: '1 1', strokeDashoffset: 1 });
      gsap.set(charge, { strokeDasharray: '0.06 1' });
      tl.to(nodes, { scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(2.4)' }, 0.3)
        .to(edges, { strokeDashoffset: 0, duration: 0.6, stagger: 0.09, ease: EASE.glide }, 0.5)
        .to(charge, { strokeDashoffset: -0.06, duration: 0.9, stagger: 0.06, ease: 'power1.inOut' }, 1.3)
        .fromTo(stage.querySelector('.pl-title'), { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: EASE.swift }, 0.9)
        .to(meter, { v: 100, duration: 2.1, ease: 'power1.inOut', onUpdate: pct }, 0.2)
        .to(fillRef.current, { scaleX: 1, duration: 2.1, ease: 'power1.inOut' }, 0.2);
      END = 2.5;
      // The graph folds into a single point and the page opens from it.
      tl.to(footRef.current, { opacity: 0, y: -12, duration: 0.35 }, END - 0.3)
        .to(stage.querySelector('.pl-title'), { yPercent: -110, duration: 0.4, ease: 'power2.in' }, END - 0.2)
        .to(edges, { opacity: 0, duration: 0.3 }, END)
        .to(nodes, { attr: { cx: 370, cy: 150 }, duration: 0.55, ease: 'power3.in', stagger: 0.02 }, END)
        .fromTo(root, { clipPath: 'circle(150% at 50% 50%)' }, { clipPath: 'circle(0% at 50% 50%)', duration: 0.8, ease: EASE.glide }, END + 0.5);
      if (page) tl.fromTo(page, { scale: 0.94 }, { scale: 1, duration: 1, ease: EASE.glide, clearProps: 'transform', onComplete: settle }, END + 0.5);
      END += 1.1;
    } else {
      const mark = stage.querySelector('.mark');
      const bowl = mark?.querySelector('.mark-bowl');
      const stem = mark?.querySelector('.mark-stem');
      if (bowl && stem) {
        gsap.set([bowl, stem], { strokeDasharray: 1, strokeDashoffset: 1 });
        tl.to(bowl, { strokeDashoffset: 0, duration: 0.8, ease: EASE.glide }, 0.2)
          .to(stem, { strokeDashoffset: 0, duration: 0.4, ease: EASE.swift }, 0.75);
      }
      tl.to(meter, { v: 100, duration: 1.5, ease: 'power1.inOut', onUpdate: pct }, 0.2)
        .to(fillRef.current, { scaleX: 1, duration: 1.5, ease: 'power1.inOut' }, 0.2);
      END = 1.8;
      tl.to(footRef.current, { opacity: 0, duration: 0.3 }, END - 0.2)
        .to(root, { autoAlpha: 0, duration: 0.6 }, END);
      END += 0.6;
    }

    tl.to('.nav-logo, .nav-links, .nav-right', { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: EASE.swift }, END - 0.5)
      .add(done, END);

    return () => tl.kill();
  }, [kind]);

  const c = COPY[kind];

  return (
    <div
      ref={rootRef}
      className={`loader pl pl--${kind}`}
      aria-hidden="true"
      data-surface={kind === 'lab' ? 'ink' : undefined}
      data-acc={{ story: 'yellow', lab: 'lime', graph: 'blue', mark: 'pink' }[kind]}
    >
      <div className="pl-stage" ref={stageRef}>
        {kind === 'story' && (
          <>
            {YEARS.map((y) => <span key={y} className="pl-year display">{y}</span>)}
            <span className="pl-title display">Story<i className="pl-dot" /></span>
          </>
        )}

        {kind === 'lab' && (
          <>
            <svg className="pl-tower" viewBox="-130 -200 260 360">
              {FLOORS.map((acc, i) => {
                const s = slab(i);
                return (
                  <g key={i} className="pl-floor" data-acc={acc}>
                    <polygon points={s.left} className="pl-l" />
                    <polygon points={s.right} className="pl-r" />
                    <polygon points={s.top} className="pl-t" />
                  </g>
                );
              })}
            </svg>
            <span className="pl-cap">Laying floors</span>
          </>
        )}

        {kind === 'graph' && (
          <>
            <svg className="pl-graph" viewBox="40 20 660 260">
              {EDGES.map(([a, b]) => <path key={`e${a}${b}`} d={curve(NODES[a], NODES[b])} className="pl-edge" pathLength="1" />)}
              {EDGES.map(([a, b]) => <path key={`c${a}${b}`} d={curve(NODES[a], NODES[b])} className="pl-charge" pathLength="1" />)}
              {NODES.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 3 ? 22 : 15} className={`pl-node${i === 3 ? ' is-core' : ''}`} />)}
            </svg>
            <span className="pl-title-box"><span className="pl-title display">Two graphs<i className="pl-dot" /></span></span>
          </>
        )}

        {kind === 'mark' && <Mark className="pl-mark" />}
      </div>

      <div className="loader-foot shell" ref={footRef}>
        <span className="loader-who">{c.who}</span>
        <span className="loader-pill">
          <span className="loader-fill" ref={fillRef} />
          <span className="num loader-count">{count}</span>
        </span>
        <span className="mono loader-role">{c.what}</span>
      </div>

      <style>{`
        .pl {
          position: fixed; inset: 0; z-index: 9999;
          background: var(--paper);
          color: var(--ink);
        }
        .pl-stage { position: absolute; inset: 0; display: grid; place-items: center; }
        .pl-stage > * { grid-area: 1 / 1; }

        .pl-year, .pl-title {
          font-size: clamp(4.5rem, 16vw, 14rem);
          font-weight: 800; letter-spacing: -0.06em; line-height: 1;
          opacity: 0;
          will-change: transform, filter;
        }
        .pl-dot {
          display: inline-block;
          width: 0.17em; height: 0.17em; margin-left: 0.04em;
          border-radius: 99px; background: var(--acc);
        }
        .pl-year:nth-child(odd) { color: var(--acc); }

        .pl-tower { width: min(46vw, 300px); height: auto; overflow: visible; }
        .pl-t { fill: var(--acc); }
        .pl-l { fill: color-mix(in srgb, var(--acc) 72%, #000); }
        .pl-r { fill: color-mix(in srgb, var(--acc) 52%, #000); }
        .pl-cap {
          align-self: end;
          margin-bottom: 22vh;
          color: var(--ink-2);
          font-weight: 600;
        }

        .pl-graph { width: min(84vw, 760px); height: auto; overflow: visible; margin-bottom: 8vh; }
        .pl-edge { fill: none; stroke: var(--ink-3); stroke-width: 2.4; stroke-linecap: round; }
        .pl-charge { fill: none; stroke: var(--acc); stroke-width: 9; stroke-linecap: round; }
        .pl-node { fill: var(--paper); stroke: var(--ink); stroke-width: 3; }
        .pl-node.is-core { fill: var(--acc); stroke: var(--acc); }
        .pl-title-box { align-self: end; margin-bottom: 20vh; overflow: hidden; padding-bottom: 0.08em; }
        .pl--graph .pl-title { display: block; opacity: 1; font-size: clamp(2.6rem, 7vw, 5.5rem); }

        .pl-mark { width: clamp(6rem, 18vw, 11rem); height: auto; color: var(--ink); }

        .pl .loader-foot {
          position: absolute; left: 0; right: 0;
          bottom: clamp(1.5rem, 5vh, 3rem);
          display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem;
        }
        .pl .loader-who { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em; }
        .pl .loader-role { justify-self: end; color: var(--ink-3); font-size: var(--step--2); }
        .pl .loader-pill {
          position: relative; display: grid; place-items: center;
          width: clamp(9rem, 22vw, 15rem); height: 2.6rem;
          border-radius: var(--r-pill); border: 1px solid var(--line); overflow: hidden;
        }
        .pl .loader-fill { position: absolute; inset: 0; background: var(--acc); transform: scaleX(0); transform-origin: left; border-radius: inherit; }
        .pl .loader-count { position: relative; font-weight: 600; font-size: 0.95rem; color: var(--ink); }

        html.is-loading { overflow: hidden; }
        @media (max-width: 640px) {
          .pl .loader-foot { grid-template-columns: 1fr auto; }
          .pl .loader-role { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .pl { display: none; } }
      `}</style>
    </div>
  );
};

export default PageLoader;
