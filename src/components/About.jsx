import React, { useEffect, useRef } from 'react';
import { gsap, drawRule, countTo, reduced, cleanup, fx, fx0 } from '../lib/motion';
import ScrubText from './ScrubText';
import Glyph from './Glyph';

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
  { v: 9.55, d: 2, k: 'CGPA, B.Tech CSE (AI/ML)', acc: 'yellow', glyph: 'type' },
  { v: 7, d: 0, k: 'Projects shipped end to end', acc: 'pink', glyph: 'ship' },
  { v: 2, d: 0, k: 'Agent systems in production at Emerson', acc: 'blue', glyph: 'graph' },
  { v: 1, d: 0, k: 'IEEE paper, ICICIS 2026', acc: 'violet', glyph: 'doc' },
];

/* ------------------------------------------------------------------
   About — a reading desk.

   The statement takes the wide column and is read by the scrollbar,
   its glyphs scaling up into the room kept for them so the lines never
   re-wrap. Beside it a ledger stays pinned while you read: the four
   numbers behind the sentence, each tile landing — out of a blur, with
   a small turn — as the reading line passes the part of the sentence
   it backs up. Scrolling back up takes them away again in order.
   ------------------------------------------------------------------ */
const About = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const textRef = useRef(null);
  const ledgerRef = useRef(null);

  useEffect(() => {
    const ledger = ledgerRef.current;
    const tiles = Array.from(ledger.querySelectorAll('.ab-tile'));
    const nums = ledger.querySelectorAll('.ab-tile-v');
    const fns = [drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 84%' })];

    if (reduced()) {
      nums.forEach((n, i) => { n.textContent = STATS[i].d ? STATS[i].v.toFixed(STATS[i].d) : STATS[i].v; });
      return cleanup(fns);
    }

    const wide = window.matchMedia('(min-width: 961px)').matches;
    STATS.forEach((s, i) => fns.push(countTo(nums[i], s.v, {
      trigger: wide ? textRef.current : tiles[i],
      start: wide ? `top ${66 - i * 13}%` : 'top 88%',
      decimals: s.d,
    })));

    const tl = gsap.timeline({
      scrollTrigger: wide
        ? { trigger: textRef.current, start: 'top 72%', end: 'bottom 62%', scrub: 0.8 }
        : { trigger: ledger, start: 'top 90%', end: 'center 60%', scrub: 0.8 },
    });
    tiles.forEach((t, i) => {
      tl.fromTo(t,
        { y: 60, rotate: [-6, 5, -4, 6][i], scale: 0.86, opacity: 0, ...fx(12) },
        { y: 0, rotate: [-1.5, 1, -1, 1.5][i], scale: 1, opacity: 1, ...fx0(), clearProps: 'filter', duration: 1, ease: 'power2.out' },
        i * 0.9);
    });
    fns.push(() => { tl.scrollTrigger?.kill(); tl.kill(); });
    return cleanup(fns);
  }, []);

  return (
    <section ref={rootRef} id="about" className="block about" data-acc="yellow">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow"><b>01</b>About</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono ab-note">Pune, India · GMT+5:30</span>
        </div>

        <div className="ab-desk">
          <div className="ab-read" ref={textRef}>
            <ScrubText tokens={STATEMENT} className="ab-statement display" start="top 75%" end="bottom 60%" />
          </div>

          <aside className="ab-side">
            <ul className="ab-ledger" ref={ledgerRef}>
              {STATS.map((s, i) => (
                <li key={s.k} className={`ab-tile${i === 1 ? ' ab-tile--ink' : ''}`} data-acc={s.acc}>
                  <Glyph kind={s.glyph} acc={s.acc} />
                  <span className="display ab-tile-v num">0</span>
                  <span className="ab-tile-k">{s.k}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      <style>{`
        .ab-note { color: var(--ink-3); white-space: nowrap; }

        .ab-desk {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
          gap: clamp(2rem, 5vw, 5.5rem);
          align-items: start;
        }
        .ab-statement {
          font-size: clamp(1.9rem, 4vw, 4.1rem);
          font-weight: 650;
          line-height: 1.06;
          letter-spacing: -0.045em;
          text-wrap: initial;
        }
        .ab-statement .sw { display: inline-block; }
        .ab-statement .hl::after { background: var(--yellow); }
        .ab-statement .glyph { transform-origin: 50% 60%; }

        .ab-side { position: sticky; top: clamp(5.5rem, 14vh, 8rem); }
        .ab-ledger {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(0.6rem, 1.2vw, 0.9rem);
        }
        .ab-tile {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          min-height: clamp(11rem, 15vw, 14.5rem);
          padding: clamp(1rem, 1.5vw, 1.4rem);
          border-radius: var(--r-l);
          background: var(--acc);
          color: var(--acc-ink);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 18px 36px -18px rgba(0, 0, 0, 0.35);
          transition: translate 0.5s var(--ease-out), box-shadow 0.5s var(--ease-out);
          will-change: transform;
        }
        .ab-tile:hover { translate: 0 -6px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 28px 44px -20px rgba(0, 0, 0, 0.42); }
        .ab-tile--ink { background: var(--ink); color: var(--paper); }
        .ab-tile .glyph { font-size: 1.5rem; margin: 0; background: color-mix(in srgb, var(--acc-ink) 16%, var(--acc)); }
        .ab-tile--ink .glyph { background: var(--acc); }
        .ab-tile-v {
          margin-top: auto;
          font-family: var(--font-display);
          font-size: clamp(2.6rem, 4.6vw, 4.6rem);
          font-weight: 750;
          line-height: 0.85;
          letter-spacing: -0.06em;
        }
        .ab-tile-k { font-weight: 550; font-size: var(--step--1); line-height: 1.3; max-width: 18ch; }

        @media (max-width: 960px) {
          .ab-desk { grid-template-columns: minmax(0, 1fr); }
          .ab-side { position: static; }
          .ab-statement { font-size: clamp(1.8rem, 7vw, 3.4rem); }
        }
      `}</style>
    </section>
  );
};

export default About;
