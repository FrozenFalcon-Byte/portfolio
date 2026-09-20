import React, { useEffect, useRef } from 'react';
import { drawRule, riseIn, cleanup } from '../lib/motion';

/* Separate from Experience on purpose: these are college positions, not
   jobs, and collapsing the two would misread the résumé. */
const ROLES = [
  {
    title: 'Technical Lead',
    org: 'AIMSS, VIIT',
    date: '2024 — 2026',
    desc: 'Leading technical initiatives, organising AI/ML workshops, and guiding students in building intelligent systems.',
  },
  {
    title: 'Class Representative',
    org: 'VIIT',
    date: '2023 — 2026',
    desc: 'Acting as the primary liaison between students and faculty to keep academic operations running smoothly.',
  },
];

const Leadership = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const fns = [
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' }),
      riseIn(listRef.current?.children, { trigger: listRef.current, start: 'top 86%', stagger: 0.12, y: 30 }),
    ];
    return cleanup(fns);
  }, []);

  return (
    <section ref={rootRef} id="leadership" className="block leadership" data-tone="paper">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow eyebrow--open">Alongside that — Leadership</span>
          <span className="rule" ref={ruleRef} />
        </div>

        <ul className="lead-list" ref={listRef}>
          {ROLES.map((r) => (
            <li key={r.title} className="lead-row">
              <span className="mono lead-date">{r.date}</span>
              <div className="lead-main">
                <h3 className="display lead-title">{r.title}</h3>
                <span className="lead-org">{r.org}</span>
              </div>
              <p className="body lead-desc">{r.desc}</p>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .lead-list { border-top: 1px solid var(--line); }
        .lead-row {
          display: grid;
          grid-template-columns: 9rem minmax(0, 1fr) minmax(0, 1.15fr);
          gap: clamp(1rem, 3vw, 2.5rem);
          align-items: baseline;
          padding-block: clamp(1.5rem, 4vh, 2.4rem);
          border-bottom: 1px solid var(--line);
          transition: padding-left 0.45s var(--ease-out);
        }
        .lead-row:hover { padding-left: 0.75rem; }
        .lead-date { color: var(--ink-3); white-space: nowrap; }
        .lead-title { font-size: clamp(1.4rem, 3vw, 2.2rem); letter-spacing: -0.035em; margin: 0; }
        .lead-org { display: block; margin-top: 0.35rem; color: var(--mark); font-size: var(--step--1); font-weight: 500; }
        .lead-desc { max-width: 46ch; }

        @media (max-width: 860px) {
          .lead-row { grid-template-columns: 1fr; gap: 0.7rem; }
          .lead-row:hover { padding-left: 0; }
        }
      `}</style>
    </section>
  );
};

export default Leadership;
