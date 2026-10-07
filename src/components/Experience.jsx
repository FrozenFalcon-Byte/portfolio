import React, { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { TransitionLink } from './RouteCurtain';
import {
  gsap, maskLines, riseIn, drawRule, magnetic, reduced, cleanup,
} from '../lib/motion';

/* Two systems, one internship. They are kept apart because they are
   genuinely separate products with separate graphs — folding them into a
   single "AI work" bullet would hide the harder half. */
const PROJECTS = [
  {
    id: 'por',
    n: 'P01',
    name: 'PMO Command Centre',
    sub: 'POR / PPR',
    lead:
      'Project and performance reporting ran as two codebases doing nearly the same thing, drifting apart with every change. This is one agent graph that serves both.',
    log: [
      'Architected a multi-agent system on LangGraph and Azure OpenAI over Azure SQL, with dedicated SQL and Extraction agents and a self-correcting retry loop wrapped around them.',
      'Unified the separate POR and PPR codebases into a single shared agent graph, so the two reporting lines stopped diverging.',
      'Made the modules config-driven and dynamically loaded — a new reporting module plugs in without anyone touching shared agent code.',
    ],
    flow: ['Intake', 'Extract', 'SQL', 'Validate', 'Retry', 'Report'],
    stack: ['LangGraph', 'Azure OpenAI', 'Azure SQL', 'Python', 'FastAPI'],
  },
  {
    id: 'snop',
    n: 'P02',
    name: 'S&OP Agent',
    sub: 'Sales & Operations Planning',
    lead:
      'Planning teams were hand-writing SQL for the same recurring questions. This answers them in plain language instead — and ships the working alongside the number.',
    log: [
      'Built a production LangGraph pipeline that turns a natural-language planning question into validated SQL over Azure PostgreSQL.',
      'Layered guardrails, intent extraction and AST-level SQL validation, so a query is checked structurally before it is ever allowed to execute.',
      'Streamed answers to a React and TypeScript front end over server-sent events, deployed on Azure App Service.',
      'Used TimeGPT for demand and resource forecasting, benchmarked against classical SARIMA and SARIMAX baselines.',
    ],
    flow: ['Guardrail', 'Intent', 'Plan', 'Generate', 'Validate', 'Execute', 'Stream'],
    stack: ['LangGraph', 'LangChain', 'Azure OpenAI', 'TimeGPT', 'Azure PostgreSQL', 'sqlglot', 'React'],
  },
];

/* A chain of stages with a charge running along it. It is the cheapest
   honest picture of a graph: the order is the information, and the
   travelling dot says the thing is a pipeline, not a list. */
const Flow = ({ steps }) => {
  const rootRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    if (!root || !dot || reduced()) return undefined;

    const nodes = Array.from(root.querySelectorAll('.flow-node'));
    if (!nodes.length) return undefined;

    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 1.1,
      scrollTrigger: { trigger: root, start: 'top 92%', end: 'bottom 8%', toggleActions: 'play pause resume pause' },
    });

    // Measured per hop rather than tweened across the whole row, so the
    // charge lands on each node instead of sliding past them.
    nodes.forEach((node, i) => {
      const x = node.offsetLeft + node.offsetWidth / 2;
      const y = node.offsetTop + node.offsetHeight / 2;
      // Scale, not colour: a colour tween resolves to hex when it is
      // built, so it would be holding the old theme's value after a switch.
      tl.to(dot, { x, y, duration: i === 0 ? 0 : 0.28, ease: 'glide' })
        .to(node, { scale: 1.12, opacity: 1, duration: 0.18 }, '<')
        .to(node, { scale: 1, opacity: 0.72, duration: 0.4 }, '>+0.1');
    });

    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, [steps]);

  return (
    <div className="flow" ref={rootRef} aria-hidden="true">
      <span className="flow-dot" ref={dotRef} />
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <span className="flow-link" />}
          <span className="mono flow-node">{s}</span>
        </React.Fragment>
      ))}
    </div>
  );
};

const Panel = ({ p }) => {
  const rootRef = useRef(null);
  const nameRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    const fns = [
      maskLines(nameRef.current, { trigger: rootRef.current, start: 'top 84%', stagger: 0.07 }),
      riseIn(logRef.current?.children, { trigger: logRef.current, start: 'top 90%', stagger: 0.08, y: 20 }),
    ];
    return cleanup(fns);
  }, []);

  return (
    <article ref={rootRef} className="xp-panel">
      <div className="xp-panel-top">
        <span className="num xp-n">{p.n}</span>
        <span className="tag xp-sub">{p.sub}</span>
      </div>

      <h3 ref={nameRef} className="display xp-name">{p.name}</h3>
      <p className="body xp-lead">{p.lead}</p>

      <Flow steps={p.flow} />

      <ul className="xp-log" ref={logRef}>
        {p.log.map((l) => (
          <li key={l}><span className="xp-bar" aria-hidden="true" />{l}</li>
        ))}
      </ul>

      <ul className="xp-stack">
        {p.stack.map((s) => <li key={s} className="tag">{s}</li>)}
      </ul>
    </article>
  );
};

const Experience = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const orgRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const fns = [
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' }),
      maskLines(orgRef.current, { trigger: rootRef.current, start: 'top 76%', stagger: 0.08 }),
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
          <span className="mono xp-count">2 systems · in production</span>
        </div>

        <header className="xp-masthead">
          <div className="xp-org">
            <span className="xp-live" aria-hidden="true" />
            <h2 ref={orgRef} className="display xp-org-name">Emerson</h2>
          </div>

          <dl className="xp-meta">
            <div><dt className="mono">Role</dt><dd>PMO AI/ML Intern</dd></div>
            <div><dt className="mono">Timeframe</dt><dd>Dec 2025 — Present</dd></div>
            <div><dt className="mono">Status</dt><dd className="xp-status">Currently interning here</dd></div>
          </dl>
        </header>

        <div className="xp-grid">
          {PROJECTS.map((p) => <Panel key={p.id} p={p} />)}
        </div>

        <div className="xp-foot">
          <p className="body xp-foot-note">
            Both run on the same Azure footprint and share the agent
            conventions — the architecture is the interesting part.
          </p>
          <TransitionLink ref={ctaRef} to="/experience/pmo" className="btn xp-cta">
            Open the architecture
            <ArrowUpRight size={17} strokeWidth={2.4} />
          </TransitionLink>
        </div>
      </div>

      <style>{`
        .xp-count { color: var(--ink-3); white-space: nowrap; }

        /* ---- masthead ---- */
        .xp-masthead {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: clamp(1.25rem, 4vw, 3rem);
          padding-bottom: clamp(1.5rem, 4vh, 2.25rem);
          border-bottom: 1px solid var(--line);
        }
        .xp-org { display: inline-flex; align-items: center; gap: 0.85rem; }
        .xp-org-name {
          margin: 0;
          font-size: clamp(2.6rem, 8vw, 6rem);
          letter-spacing: -0.05em;
        }
        .xp-live {
          width: 11px; height: 11px;
          flex: none;
          border-radius: 999px;
          background: var(--mark);
          animation: xp-pulse 2.4s var(--ease-out) infinite;
        }
        @keyframes xp-pulse {
          0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--mark) 55%, transparent); }
          70%  { box-shadow: 0 0 0 11px color-mix(in srgb, var(--mark) 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--mark) 0%, transparent); }
        }

        .xp-meta { display: flex; flex-wrap: wrap; gap: 1.1rem 2.2rem; }
        .xp-meta dt {
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: var(--step--2);
          margin-bottom: 0.3rem;
        }
        .xp-meta dd { font-size: var(--step--1); font-weight: 500; }
        .xp-status { color: var(--mark); }

        /* ---- the two systems ---- */
        .xp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 1px;
          margin-top: clamp(2rem, 5vh, 3rem);
          background: var(--line);
          border: 1px solid var(--line);
          border-radius: clamp(18px, 2.2vw, 28px);
          overflow: hidden;
        }
        .xp-panel {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
          padding: clamp(1.4rem, 3vw, 2.4rem);
          background: var(--paper);
          transition: background 0.45s var(--ease-out);
        }
        .xp-panel:hover { background: var(--paper-2); }

        .xp-panel-top { display: flex; align-items: center; gap: 0.75rem; }
        .xp-n { color: var(--mark); font-size: var(--step--1); font-weight: 600; letter-spacing: 0.06em; }
        .xp-sub { background: color-mix(in srgb, var(--ink) 7%, transparent); border-color: transparent; }

        .xp-name { margin: 0; font-size: clamp(1.5rem, 3vw, 2.3rem); letter-spacing: -0.04em; }
        .xp-lead { max-width: 50ch; font-size: var(--step--1); }

        /* ---- flow strip ---- */
        .flow {
          position: relative;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          width: 100%;
          padding: 0.85rem 0.9rem;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: var(--paper-2);
        }
        .flow-node {
          position: relative;
          z-index: 1;
          display: inline-block;
          color: var(--ink-2);
          font-size: var(--step--2);
          white-space: nowrap;
          opacity: 0.72;
        }
        .flow-link { width: 14px; height: 1px; background: var(--line); flex: none; }
        .flow-dot {
          position: absolute;
          top: 0; left: 0;
          width: 22px; height: 22px;
          margin: -11px 0 0 -11px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--mark) 22%, transparent);
          pointer-events: none;
        }

        .xp-log { display: flex; flex-direction: column; gap: 0.7rem; }
        .xp-log li {
          display: flex;
          gap: 0.8rem;
          align-items: baseline;
          color: var(--ink-2);
          font-size: var(--step--1);
          line-height: 1.6;
          max-width: 56ch;
        }
        .xp-bar { flex: none; width: 13px; height: 2px; border-radius: 2px; background: var(--mark); }

        .xp-stack { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: auto; padding-top: 0.4rem; }

        /* ---- foot ---- */
        .xp-foot {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem 2rem;
          margin-top: clamp(1.75rem, 4.5vh, 2.5rem);
        }
        .xp-foot-note { max-width: 44ch; font-size: var(--step--1); }

        @media (max-width: 720px) {
          .xp-meta { gap: 0.9rem 1.5rem; }
          .xp-masthead { align-items: flex-start; }
        }
      `}</style>
    </section>
  );
};

export default Experience;
