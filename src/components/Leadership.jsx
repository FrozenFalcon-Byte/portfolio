import React, { useEffect, useRef } from 'react';
import {
  gsap, maskLines, riseIn, drawRule, countTo, reduced, cleanup,
} from '../lib/motion';

/* Separate from Experience on purpose: a degree, a paper and a club role
   are not jobs, and collapsing them into the internship would misread the
   résumé. They share this section because they share a register — the
   things that are on the record rather than in production. */
const RECORDS = [
  {
    id: 'education',
    kind: 'Education',
    date: '2023 — 2027',
    title: 'B.Tech, Computer Science & Engineering (AI/ML)',
    org: 'Vishwakarma Institute of Information Technology, Pune',
    desc: 'Four-year engineering degree specialising in artificial intelligence and machine learning.',
    stat: { k: 'CGPA', v: '9.55', count: 9.55, decimals: 2 },
  },
  {
    id: 'publication',
    kind: 'Publication',
    date: 'ICICIS 2026',
    title: 'Intrinsic Uncertainty Modeling for Pre-Output Truthfulness Control in Large Language Models',
    org: 'Co-author · IEEE',
    desc: 'On reading a model’s own uncertainty before it commits to an answer, and using that signal to govern truthfulness at generation time rather than auditing it afterwards.',
    stat: { k: 'Venue', v: 'IEEE' },
  },
  {
    id: 'aimss',
    kind: 'Extra-curricular',
    date: '2024 — 2026',
    title: 'Tech Lead, AIMSS Club',
    org: 'Vishwakarma Institute of Information Technology',
    desc: 'Leading the club’s technical initiatives: running AI/ML workshops, mentoring juniors, and shipping the club’s own machine-learning projects.',
    stat: { k: 'Scope', v: 'Club-wide' },
  },
];

const COURSES = [
  'CISCO CCNAv7 — Introduction to Networks',
  'Machine Learning & Deep Learning in Python and R',
];

/* ------------------------------------------------------------------
   Plate — one record, stacked.

   Each plate sticks just below the one before it and is pushed back as
   the next slides over it, so the three arrive as a deck being dealt
   rather than a list scrolling by. The offsets are driven off the index
   so the stacked edges stay visible underneath the top card.
   ------------------------------------------------------------------ */
const Plate = ({ r, i, last }) => {
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const ghostRef = useRef(null);
  const statRef = useRef(null);

  useEffect(() => {
    const fns = [
      riseIn(cardRef.current, { trigger: rootRef.current, start: 'top 92%', y: 40 }),
    ];
    if (r.stat.count !== undefined) {
      fns.push(countTo(statRef.current, r.stat.count, {
        trigger: rootRef.current,
        start: 'top 82%',
        decimals: r.stat.decimals ?? 0,
      }));
    }
    return cleanup(fns);
  }, [r]);

  /* The plate recedes as the next one covers it. The last has nothing
     coming over it, so it is left alone. */
  useEffect(() => {
    if (last || reduced()) return undefined;
    const tween = gsap.fromTo(
      cardRef.current,
      { scale: 1, filter: 'brightness(1)' },
      {
        scale: 0.93,
        filter: 'brightness(0.94)',
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 18%',
          end: 'bottom 32%',
          scrub: 0.6,
        },
      }
    );
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, [last]);

  /* The numeral behind the text drifts against the scroll — depth, not
     decoration, and far enough back that it never competes to be read. */
  useEffect(() => {
    if (reduced()) return undefined;
    // Opacity is tweened to the same faint value the stylesheet holds —
    // animating it to 1 would turn the backdrop into a foreground.
    const tween = gsap.fromTo(
      ghostRef.current,
      { yPercent: 14, opacity: 0 },
      {
        yPercent: -14,
        opacity: 0.05,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top 95%', end: 'bottom 45%', scrub: 0.9 },
      }
    );
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  return (
    <div ref={rootRef} className="rec-slot" style={{ '--i': i }}>
      <article ref={cardRef} className="rec-plate">
        <span className="num rec-ghost" ref={ghostRef} aria-hidden="true">
          {String(i + 1).padStart(2, '0')}
        </span>

        <div className="rec-plate-top">
          <span className="tag rec-kind">{r.kind}</span>
          <span className="mono rec-date">{r.date}</span>
        </div>

        <div className="rec-plate-main">
          <h3 className="display rec-title">{r.title}</h3>
          <span className="rec-org">{r.org}</span>
          <p className="body rec-desc">{r.desc}</p>
        </div>

        <div className="rec-stat">
          <span className="mono rec-stat-k">{r.stat.k}</span>
          <span className="display rec-stat-v" ref={statRef}>{r.stat.v}</span>
        </div>
      </article>
    </div>
  );
};

const Leadership = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const headRef = useRef(null);
  const courseRef = useRef(null);

  useEffect(() => {
    const fns = [
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' }),
      maskLines(headRef.current, { trigger: rootRef.current, start: 'top 76%', stagger: 0.08 }),
      riseIn(courseRef.current?.children, { trigger: courseRef.current, start: 'top 94%', stagger: 0.07, y: 18 }),
    ];
    return cleanup(fns);
  }, []);

  return (
    <section ref={rootRef} id="leadership" className="block record" data-tone="paper">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">06 — On the record</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono rec-count">Degree · Paper · Club</span>
        </div>

        <h2 ref={headRef} className="display display--l rec-lede">
          The paperwork<br />behind the practice.
        </h2>

        <div className="rec-deck">
          {RECORDS.map((r, i) => (
            <Plate key={r.id} r={r} i={i} last={i === RECORDS.length - 1} />
          ))}
        </div>

        <div className="rec-courses">
          <span className="mono rec-courses-k">Certifications</span>
          <ul ref={courseRef}>
            {COURSES.map((c) => <li key={c} className="tag">{c}</li>)}
          </ul>
        </div>
      </div>

      <style>{`
        .rec-count { color: var(--ink-3); white-space: nowrap; }
        .rec-lede {
          margin: 0 0 clamp(2.5rem, 7vh, 4rem);
          max-width: 14ch;
          letter-spacing: -0.04em;
        }

        /* ---- the deck ---- */
        .rec-deck { display: flex; flex-direction: column; }
        .rec-slot {
          position: sticky;
          /* Each plate parks a little lower than the last, so the stack
             underneath stays visible as an edge. */
          top: calc(clamp(5rem, 13vh, 7.5rem) + var(--i) * 16px);
          padding-bottom: clamp(1.25rem, 3vh, 2rem);
        }

        .rec-plate {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 11rem) minmax(0, 1fr) auto;
          gap: clamp(1rem, 3vw, 2.5rem);
          align-items: start;
          padding: clamp(1.5rem, 3.5vw, 2.75rem);
          overflow: hidden;
          border-radius: clamp(18px, 2.2vw, 28px);
          border: 1px solid var(--line);
          background: var(--paper-2);
          transform-origin: center top;
        }

        /* Bottom-left, where the kind/date column runs out of content —
           the stat on the right stays legible. */
        .rec-ghost {
          position: absolute;
          left: clamp(0.75rem, 2vw, 1.75rem);
          bottom: -1.75rem;
          z-index: 0;
          font-size: clamp(5rem, 10vw, 8.5rem);
          font-weight: 500;
          line-height: 0.8;
          letter-spacing: -0.06em;
          color: var(--ink);
          opacity: 0.05;
          pointer-events: none;
        }

        .rec-plate-top,
        .rec-plate-main,
        .rec-stat { position: relative; z-index: 1; }

        .rec-plate-top { display: flex; flex-direction: column; align-items: flex-start; gap: 0.55rem; }
        .rec-kind {
          background: color-mix(in srgb, var(--mark) 14%, transparent);
          border-color: transparent;
          color: var(--mark);
          font-weight: 500;
        }
        .rec-date { color: var(--ink-3); white-space: nowrap; }

        .rec-plate-main { min-width: 0; }
        .rec-title {
          margin: 0;
          font-size: clamp(1.25rem, 2.4vw, 1.85rem);
          letter-spacing: -0.03em;
          line-height: 1.12;
          text-wrap: balance;
        }
        .rec-org { display: block; margin-top: 0.55rem; color: var(--ink-2); font-size: var(--step--1); font-weight: 500; }
        .rec-desc { margin-top: 0.9rem; max-width: 56ch; font-size: var(--step--1); }

        .rec-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.3rem;
          text-align: right;
        }
        .rec-stat-k { color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.12em; font-size: var(--step--2); }
        .rec-stat-v { font-size: clamp(1.5rem, 3vw, 2.4rem); letter-spacing: -0.03em; }

        .rec-courses {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem 1.25rem;
          margin-top: clamp(2rem, 5vh, 3rem);
        }
        .rec-courses-k { color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.12em; font-size: var(--step--2); }
        .rec-courses ul { display: flex; flex-wrap: wrap; gap: 0.4rem; }

        @media (max-width: 900px) {
          .rec-plate { grid-template-columns: minmax(0, 1fr) auto; row-gap: 1rem; }
          .rec-plate-top { grid-column: 1; flex-direction: row; align-items: center; gap: 0.7rem; }
          .rec-plate-main { grid-column: 1 / -1; }
          .rec-stat { grid-column: 2; grid-row: 1; }
        }
        @media (max-width: 560px) {
          /* Stacking needs headroom the viewport does not have; below
             this the deck reads better as plain stacked cards. */
          .rec-slot { position: static; }
          .rec-plate { grid-template-columns: minmax(0, 1fr); }
          .rec-stat { grid-column: 1; grid-row: auto; align-items: flex-start; text-align: left; }
          .rec-ghost { font-size: 4.5rem; bottom: -1.25rem; }
        }
      `}</style>
    </section>
  );
};

export default Leadership;
