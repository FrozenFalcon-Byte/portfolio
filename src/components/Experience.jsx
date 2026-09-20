import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { maskLines, riseIn, drawRule, magnetic, cleanup } from '../lib/motion';

const LOG = [
  'Built a nine-node LangGraph pipeline that turns a plain-English business question into validated SQL.',
  'Encoded the fiscal calendar and business glossary into the planner, so generated SQL is correct rather than merely plausible.',
  'Added AST-level validation with sqlglot — join fan-out and malformed filters are caught before anything touches the database.',
  'Shipped to Azure behind FastAPI with SSE streaming, generated charts, and a persisted reasoning trace per session.',
];

const STACK = [
  'LangGraph', 'LangChain', 'Azure OpenAI', 'FastAPI', 'Azure PostgreSQL',
  'sqlglot', 'React', 'TypeScript',
];

const Experience = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const titleRef = useRef(null);
  const listRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const fns = [
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' }),
      maskLines(titleRef.current, { trigger: rootRef.current, start: 'top 74%', stagger: 0.08 }),
      riseIn(listRef.current?.children, { trigger: listRef.current, start: 'top 88%', stagger: 0.08, y: 22 }),
      magnetic(ctaRef.current, 0.22),
    ];
    return cleanup(fns);
  }, []);

  return (
    <section ref={rootRef} id="experience" className="block experience" data-tone="cyan">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">02 — Experience</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono exp-count">1 role · in production</span>
        </div>

        <article className="exp-card">
          <header className="exp-head">
            <div className="exp-org">
              <span className="exp-live" aria-hidden="true" />
              <span className="display exp-org-name">Emerson</span>
            </div>
            <dl className="exp-meta">
              <div><dt className="mono">Role</dt><dd>PMO AI/ML Intern</dd></div>
              <div><dt className="mono">Timeframe</dt><dd>Dec 2025 — Present</dd></div>
              <div><dt className="mono">Status</dt><dd className="exp-status">Currently interning here</dd></div>
            </dl>
          </header>

          <h3 ref={titleRef} className="exp-title display display--m">
            SNOP GenAI Pipeline —<br />business questions into SQL
          </h3>

          <p className="body exp-lead">
            Sales &amp; Operations Planning teams were hand-writing SQL for the same
            recurring questions. This answers them conversationally instead —
            across workforce utilisation, demand and supply forecasting, financial
            recovery and operational effectiveness — with the query, the numbers and
            the reasoning behind them.
          </p>

          <ul className="exp-log" ref={listRef}>
            {LOG.map((l) => (
              <li key={l}><span className="exp-bar" aria-hidden="true" />{l}</li>
            ))}
          </ul>

          <ul className="exp-stack">
            {STACK.map((s) => <li key={s} className="tag">{s}</li>)}
          </ul>

          <Link ref={ctaRef} to="/experience/pmo" className="btn exp-cta">
            Read the case study
            <ArrowUpRight size={17} strokeWidth={2.4} />
          </Link>
        </article>
      </div>

      <style>{`
        .exp-count { color: var(--ink-3); white-space: nowrap; }

        .exp-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: clamp(1.5rem, 4vh, 2.25rem);
          padding: clamp(1.5rem, 4vw, 3rem);
          border-radius: clamp(20px, 2.6vw, 32px);
          border: 1px solid var(--line);
          background: var(--paper-2);
        }

        .exp-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: clamp(1rem, 3vw, 2.5rem);
          width: 100%;
        }
        .exp-org { display: inline-flex; align-items: center; gap: 0.7rem; }
        .exp-org-name { font-size: clamp(1.6rem, 3.4vw, 2.6rem); letter-spacing: -0.04em; }
        .exp-live {
          width: 9px; height: 9px;
          flex: none;
          border-radius: 999px;
          background: var(--mark);
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--mark) 55%, transparent);
          animation: pulse 2.4s var(--ease-out) infinite;
        }

        .exp-meta { display: flex; flex-wrap: wrap; gap: 1.2rem 2.2rem; }
        .exp-meta dt {
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: var(--step--2);
          margin-bottom: 0.3rem;
        }
        .exp-meta dd { font-size: var(--step--1); font-weight: 500; }
        .exp-status { color: var(--mark); }

        .exp-title { margin: 0; letter-spacing: -0.035em; }
        .exp-lead { max-width: 64ch; margin-top: -0.5rem; }

        .exp-log { display: flex; flex-direction: column; gap: 0.75rem; }
        .exp-log li {
          display: flex;
          gap: 0.85rem;
          align-items: baseline;
          color: var(--ink-2);
          font-size: var(--step--1);
          line-height: 1.6;
          max-width: 62ch;
        }
        .exp-bar { flex: none; width: 14px; height: 2px; border-radius: 2px; background: var(--mark); }

        .exp-stack { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .exp-cta { margin-top: 0.4rem; }

        @media (max-width: 720px) {
          .exp-meta { gap: 1rem 1.6rem; }
        }
      `}</style>
    </section>
  );
};

export default Experience;
