import React, { useEffect, useRef } from 'react';
import { gsap, drawRule, countTo, reduced, cleanup } from '../lib/motion';
import ScrubText from './ScrubText';

const STATEMENT = [
  'I build',
  '*production-grade',
  'generative AI',
  { kind: 'spark', acc: 'yellow' },
  '— multi-agent',
  { kind: 'graph', acc: 'blue' },
  'LangGraph pipelines, retrieval',
  { kind: 'search', acc: 'pink' },
  'and MCP and A2A agent services — delivered as full-stack apps on FastAPI and React,',
  'and',
  '*deployed',
  { kind: 'ship', acc: 'lime' },
  'on Azure.',
];

const STATS = [
  { v: 9.55, d: 2, k: 'CGPA, B.Tech CSE (AI/ML)', acc: 'yellow' },
  { v: 7, d: 0, k: 'Projects shipped end to end', acc: 'pink' },
  { v: 2, d: 0, k: 'Agent systems in production at Emerson', acc: 'blue' },
  { v: 1, d: 0, k: 'IEEE paper, ICICIS 2026', acc: 'violet' },
];

/* ------------------------------------------------------------------
   Deal — the stats arrive as a hand of cards. They start piled in the
   middle, turned every which way, and the scrollbar deals them out to
   their places. It runs backwards too, so scrolling up gathers them.
   ------------------------------------------------------------------ */
const Deal = () => {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const cards = Array.from(root.querySelectorAll('.ab-card'));
    const nums = root.querySelectorAll('.ab-card-v');
    const fns = Array.from(nums).map((n, i) => countTo(n, STATS[i].v, {
      trigger: root, start: 'top 70%', decimals: STATS[i].d,
    }));

    const wide = window.matchMedia('(min-width: 861px)').matches;
    if (reduced() || !wide) {
      fns.push(() => {});
      if (!reduced()) {
        const t = gsap.from(cards, {
          y: 60, rotate: (i) => (i % 2 ? 6 : -6), opacity: 0, duration: 1, stagger: 0.08, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: root, start: 'top 85%', once: true },
        });
        fns.push(() => { t.scrollTrigger?.kill(); t.kill(); });
      }
      return cleanup(fns);
    }

    /* Each card is pulled back to the centre of the row and twisted, so
       the pile is measured off the real layout, not guessed. */
    const box = root.getBoundingClientRect();
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top 92%', end: 'top 30%', scrub: 0.8 },
    });
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const dx = box.left + box.width / 2 - (r.left + r.width / 2);
      tl.fromTo(c,
        { x: dx, y: 70 + i * 8, rotate: [-14, 8, -4, 12][i], scale: 0.86 },
        { x: 0, y: 0, rotate: [-3, 2, -2, 3][i], scale: 1, ease: 'power2.out', duration: 1 },
        i * 0.12);
    });
    fns.push(() => { tl.scrollTrigger?.kill(); tl.kill(); });
    return cleanup(fns);
  }, []);

  return (
    <ul className="ab-deal" ref={rootRef}>
      {STATS.map((s, i) => (
        <li key={s.k} className={`ab-card${i === 1 ? ' ab-card--ink' : ''}`} data-acc={s.acc}>
          <span className="display ab-card-v num">{s.d ? s.v.toFixed(s.d) : s.v}</span>
          <span className="ab-card-k">{s.k}</span>
          <span className="ab-card-dot" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
};

const About = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);

  useEffect(() => cleanup([
    drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 84%' }),
  ]), []);

  return (
    <section ref={rootRef} id="about" className="block about" data-acc="yellow">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow"><b>01</b>About</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono ab-note">Pune, India · GMT+5:30</span>
        </div>

        <ScrubText tokens={STATEMENT} className="ab-statement display" />

        <Deal />
      </div>

      <style>{`
        .about { overflow: hidden; }
        .ab-note { color: var(--ink-3); white-space: nowrap; }

        .ab-statement {
          font-size: clamp(1.9rem, 5.2vw, 5rem);
          font-weight: 650;
          line-height: 1.04;
          letter-spacing: -0.045em;
          max-width: 18ch;
          text-wrap: initial;
        }
        .ab-statement .sw { display: inline-block; will-change: opacity, transform; }
        .ab-statement .hl::after { background: var(--yellow); }

        .ab-deal {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: clamp(0.75rem, 1.6vw, 1.25rem);
          margin-top: clamp(4rem, 12vh, 8rem);
        }
        .ab-card {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 2.5rem;
          min-height: clamp(13rem, 26vw, 19rem);
          padding: clamp(1.25rem, 2vw, 1.75rem);
          border-radius: var(--r-l);
          background: var(--acc);
          color: var(--acc-ink);
          will-change: transform;
        }
        .ab-card--ink { background: var(--ink); color: var(--paper); }
        .ab-card-v {
          font-family: var(--font-display);
          font-size: clamp(3.2rem, 7vw, 6.5rem);
          font-weight: 750;
          line-height: 0.85;
          letter-spacing: -0.06em;
        }
        .ab-card-k { font-weight: 550; font-size: var(--step-0); line-height: 1.3; max-width: 16ch; }
        .ab-card-dot {
          position: absolute;
          top: clamp(1.25rem, 2vw, 1.75rem); right: clamp(1.25rem, 2vw, 1.75rem);
          width: 14px; height: 14px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0.85;
        }
        .ab-card--ink .ab-card-dot { background: var(--acc); opacity: 1; }

        @media (max-width: 860px) {
          .ab-deal { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ab-statement { max-width: none; }
        }
      `}</style>
    </section>
  );
};

export default About;
