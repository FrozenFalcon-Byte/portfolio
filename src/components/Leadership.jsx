import React, { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, maskLines, riseIn, drawRule, reduced, cleanup } from '../lib/motion';

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
    stat: { k: 'CGPA', v: '9.55' },
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
    kind: 'Leadership',
    date: '2024 — 2026',
    title: 'Technical Lead, AIMSS Club',
    org: 'Vishwakarma Institute of Information Technology',
    desc: 'Leading the club’s technical track: running AI/ML workshops, mentoring juniors, and shipping the club’s own machine-learning projects.',
    stat: { k: 'Scope', v: 'Club-wide' },
  },
];

const COURSES = [
  'CISCO CCNAv7 — Introduction to Networks',
  'Machine Learning & Deep Learning in Python and R',
];

const Record = ({ r, i }) => {
  const rootRef = useRef(null);
  const markRef = useRef(null);

  useEffect(() => {
    if (reduced()) return undefined;

    /* The marker fills as its row crosses the reading line, so the
       column reads as a timeline being walked rather than a list. */
    const tween = gsap.fromTo(
      markRef.current,
      { scale: 0.3, opacity: 0.25 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: 'swift',
        scrollTrigger: { trigger: rootRef.current, start: 'top 78%', once: true },
      }
    );
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  return (
    <li ref={rootRef} className="rec-row">
      <div className="rec-spine" aria-hidden="true">
        <span className="rec-mark" ref={markRef} />
      </div>

      <div className="rec-head">
        <span className="tag rec-kind">{r.kind}</span>
        <span className="mono rec-date">{r.date}</span>
      </div>

      <div className="rec-main">
        <h3 className="display rec-title">{r.title}</h3>
        <span className="rec-org">{r.org}</span>
        <p className="body rec-desc">{r.desc}</p>
      </div>

      <div className="rec-stat">
        <span className="mono rec-stat-k">{r.stat.k}</span>
        <span className="display rec-stat-v">{r.stat.v}</span>
      </div>
    </li>
  );
};

const Leadership = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const headRef = useRef(null);
  const listRef = useRef(null);
  const lineRef = useRef(null);
  const courseRef = useRef(null);

  useEffect(() => {
    const fns = [
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' }),
      maskLines(headRef.current, { trigger: rootRef.current, start: 'top 76%', stagger: 0.08 }),
      riseIn(courseRef.current?.children, { trigger: courseRef.current, start: 'top 92%', stagger: 0.07, y: 18 }),
    ];
    return cleanup(fns);
  }, []);

  /* One hairline runs the length of the column and draws as you read
     down it — the rows hang off a single thread rather than floating. */
  useEffect(() => {
    const line = lineRef.current;
    if (!line || reduced()) return undefined;

    const tween = gsap.fromTo(
      line,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: listRef.current,
          start: 'top 72%',
          end: 'bottom 72%',
          scrub: 0.5,
        },
      }
    );
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
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

        <div className="rec-wrap">
          <span className="rec-thread" ref={lineRef} aria-hidden="true" />
          <ul className="rec-list" ref={listRef}>
            {RECORDS.map((r, i) => <Record key={r.id} r={r} i={i} />)}
          </ul>
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

        .rec-wrap { position: relative; }
        /* The thread sits under the markers, at their centre. */
        .rec-thread {
          position: absolute;
          left: 5px;
          top: 0.6rem;
          bottom: 0.6rem;
          width: 1px;
          background: var(--line);
          transform: scaleY(0);
          transform-origin: top;
        }

        .rec-list { position: relative; }
        .rec-row {
          display: grid;
          grid-template-columns: 2.4rem minmax(0, 10rem) minmax(0, 1fr) auto;
          gap: clamp(1rem, 3vw, 2.5rem);
          align-items: start;
          padding-block: clamp(1.75rem, 4.5vh, 2.75rem);
          border-bottom: 1px solid var(--line);
        }
        .rec-row:first-child { border-top: 1px solid var(--line); }

        .rec-spine { position: relative; height: 1.4rem; }
        .rec-mark {
          position: absolute;
          left: 0; top: 0.35rem;
          width: 11px; height: 11px;
          border-radius: 999px;
          background: var(--mark);
          box-shadow: 0 0 0 4px var(--paper);
        }

        .rec-head { display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        .rec-kind {
          background: color-mix(in srgb, var(--mark) 14%, transparent);
          border-color: transparent;
          color: var(--mark);
          font-weight: 500;
        }
        .rec-date { color: var(--ink-3); white-space: nowrap; }

        .rec-main { min-width: 0; }
        .rec-title {
          margin: 0;
          font-size: clamp(1.15rem, 2.1vw, 1.65rem);
          letter-spacing: -0.03em;
          line-height: 1.12;
          text-wrap: balance;
        }
        .rec-org { display: block; margin-top: 0.5rem; color: var(--ink-2); font-size: var(--step--1); font-weight: 500; }
        .rec-desc { margin-top: 0.85rem; max-width: 56ch; font-size: var(--step--1); }

        .rec-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.3rem;
          text-align: right;
        }
        .rec-stat-k { color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.12em; font-size: var(--step--2); }
        .rec-stat-v { font-size: clamp(1.4rem, 2.6vw, 2.1rem); letter-spacing: -0.03em; }

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
          .rec-row { grid-template-columns: 2rem minmax(0, 1fr) auto; row-gap: 0.9rem; }
          .rec-head { grid-column: 2; flex-direction: row; align-items: center; gap: 0.7rem; }
          .rec-main { grid-column: 2; }
          .rec-stat { grid-column: 3; grid-row: 1; }
        }
        @media (max-width: 560px) {
          .rec-row { grid-template-columns: 1.6rem minmax(0, 1fr); }
          .rec-stat { grid-column: 2; grid-row: auto; align-items: flex-start; text-align: left; }
          .rec-stat-v { font-size: 1.3rem; }
        }
      `}</style>
    </section>
  );
};

export default Leadership;
