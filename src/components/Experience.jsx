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
    n: '01',
    name: 'PMO Command Centre',
    sub: 'POR / PPR',
    lead:
      'Project and performance reporting ran as two codebases doing nearly the same thing, drifting apart with every change. This is one agent graph that serves both.',
    log: [
      'Architected a multi-agent system on LangGraph and Azure OpenAI over Azure SQL, with dedicated SQL and Extraction agents and a self-correcting retry loop wrapped around them.',
      'Unified the separate POR and PPR codebases into a single shared agent graph with config-driven, dynamically loaded modules.',
      'New reporting modules plug in without any change to shared agent code.',
    ],
    flow: ['Intake', 'Extract', 'SQL', 'Validate', 'Retry', 'Report'],
    stack: ['LangGraph', 'Azure OpenAI', 'Azure SQL', 'Python', 'FastAPI'],
  },
  {
    id: 'snop',
    n: '02',
    name: 'S&OP Agent',
    sub: 'Sales & Operations Planning',
    lead:
      'Planning teams were hand-writing SQL for the same recurring questions. This answers them in plain language instead — and ships the working alongside the number.',
    log: [
      'Built a production LangGraph pipeline that turns a natural-language S&OP question into validated SQL over Azure PostgreSQL.',
      'Layered guardrails, intent extraction and AST-level SQL validation, so a query is checked structurally before it is ever allowed to execute.',
      'Streamed answers to a React and TypeScript front end over server-sent events, deployed on Azure App Service.',
      'Used TimeGPT for demand and resource forecasting, benchmarked against classical SARIMA and SARIMAX baselines.',
    ],
    flow: ['Guardrail', 'Intent', 'Plan', 'Generate', 'Validate', 'Execute', 'Stream'],
    stack: ['LangGraph', 'LangChain', 'Azure OpenAI', 'TimeGPT', 'Azure PostgreSQL', 'sqlglot', 'React'],
  },
];

/* ------------------------------------------------------------------
   Flow — a chain of stages with a charge running along it.

   The track draws itself as the record arrives, then a charge walks the
   stages on a loop. It is the cheapest honest picture of a graph: the
   order is the information, and the travelling dot says the thing is a
   pipeline rather than a list of words.
   ------------------------------------------------------------------ */
const Flow = ({ steps }) => {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const track = trackRef.current;
    if (!root || !dot || !track || reduced()) return undefined;

    const nodes = Array.from(root.querySelectorAll('.flow-node'));
    if (!nodes.length) return undefined;

    const draw = gsap.fromTo(
      track,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.1,
        ease: 'glide',
        scrollTrigger: { trigger: root, start: 'top 90%', once: true },
      }
    );

    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 1.1,
      delay: 0.6,
      scrollTrigger: {
        trigger: root,
        start: 'top 92%',
        end: 'bottom 8%',
        toggleActions: 'play pause resume pause',
      },
    });

    // Measured per hop rather than tweened across the whole row, so the
    // charge lands on each stage instead of sliding past them.
    nodes.forEach((node, i) => {
      const x = node.offsetLeft + node.offsetWidth / 2;
      const y = node.offsetTop + node.offsetHeight / 2;
      // Scale, not colour: a colour tween resolves to hex when it is
      // built, so it would be holding the old theme's value after a switch.
      tl.to(dot, { x, y, duration: i === 0 ? 0 : 0.28, ease: 'glide' })
        .to(node, { scale: 1.14, opacity: 1, duration: 0.18 }, '<')
        .to(node, { scale: 1, opacity: 0.6, duration: 0.4 }, '>+0.1');
    });

    return () => {
      draw.scrollTrigger?.kill(); draw.kill();
      tl.scrollTrigger?.kill(); tl.kill();
    };
  }, [steps]);

  return (
    <div className="flow" ref={rootRef} aria-hidden="true">
      <span className="flow-track" ref={trackRef} />
      <span className="flow-dot" ref={dotRef} />
      {steps.map((s) => <span key={s} className="mono flow-node">{s}</span>)}
    </div>
  );
};

/* ------------------------------------------------------------------
   Record — one system, as a full-width entry in a ledger.
   ------------------------------------------------------------------ */
const Record = ({ p }) => {
  const rootRef = useRef(null);
  const nameRef = useRef(null);
  const numRef = useRef(null);
  const logRef = useRef(null);
  const stackRef = useRef(null);

  useEffect(() => {
    const fns = [
      maskLines(nameRef.current, { trigger: rootRef.current, start: 'top 82%', stagger: 0.07 }),
      riseIn(logRef.current?.children, { trigger: logRef.current, start: 'top 90%', stagger: 0.08, y: 20 }),
      riseIn(stackRef.current?.children, { trigger: stackRef.current, start: 'top 95%', stagger: 0.04, y: 14 }),
    ];
    return cleanup(fns);
  }, []);

  /* The index drifts up a little slower than the text beside it. At this
     distance it is not read as parallax, only as depth. */
  useEffect(() => {
    if (reduced()) return undefined;
    const tween = gsap.fromTo(
      numRef.current,
      { y: 26, opacity: 0 },
      {
        y: -26,
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top 95%', end: 'bottom 40%', scrub: 0.8 },
      }
    );
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  return (
    <article ref={rootRef} className="xp-record">
      <div className="xp-record-rail">
        <span className="num xp-record-n" ref={numRef}>{p.n}</span>
      </div>

      <div className="xp-record-main">
        <span className="tag xp-record-sub">{p.sub}</span>
        <h3 ref={nameRef} className="display xp-record-name">{p.name}</h3>
        <p className="body xp-record-lead">{p.lead}</p>

        <Flow steps={p.flow} />

        <ul className="xp-log" ref={logRef}>
          {p.log.map((l) => (
            <li key={l}><span className="xp-bar" aria-hidden="true" />{l}</li>
          ))}
        </ul>

        <ul className="xp-stack" ref={stackRef}>
          {p.stack.map((s) => <li key={s} className="tag">{s}</li>)}
        </ul>
      </div>
    </article>
  );
};

const Experience = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const orgRef = useRef(null);
  const ctaRef = useRef(null);
  const metaRef = useRef(null);
  const threadRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const fns = [
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' }),
      maskLines(orgRef.current, { trigger: rootRef.current, start: 'top 76%', stagger: 0.08 }),
      riseIn(metaRef.current?.children, { trigger: metaRef.current, start: 'top 92%', stagger: 0.08, y: 18 }),
      magnetic(ctaRef.current, 0.22),
    ];
    return cleanup(fns);
  }, []);

  /* One hairline runs the length of the ledger and fills as it is read,
     so the two systems hang off a single thread. */
  useEffect(() => {
    const thread = threadRef.current;
    if (!thread || reduced()) return undefined;

    const tween = gsap.fromTo(
      thread,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: listRef.current, start: 'top 70%', end: 'bottom 80%', scrub: 0.5 },
      }
    );
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  return (
    <section ref={rootRef} id="experience" className="block experience" data-tone="paper">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">02 — Experience</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono xp-count">2 systems · in production</span>
        </div>

        <div className="xp-stage">
          {/* The identity holds still while the work scrolls past it. */}
          <aside className="xp-rail">
            <div className="xp-rail-in">
              <div className="xp-org">
                <span className="xp-live" aria-hidden="true" />
                <h2 ref={orgRef} className="display xp-org-name">Emerson</h2>
              </div>

              <dl className="xp-meta" ref={metaRef}>
                <div><dt className="mono">Role</dt><dd>PMO AI/ML Intern</dd></div>
                <div><dt className="mono">Timeframe</dt><dd>Dec 2025 — Present</dd></div>
                <div><dt className="mono">Stack</dt><dd>LangGraph · Azure OpenAI · Azure SQL</dd></div>
                <div><dt className="mono">Status</dt><dd className="xp-status">Currently interning here</dd></div>
              </dl>

              <p className="body xp-rail-note">
                Both systems run on the same Azure footprint and share the agent
                conventions — the architecture is the interesting part.
              </p>

              <TransitionLink ref={ctaRef} to="/experience/pmo" className="btn xp-cta">
                Open the architecture
                <ArrowUpRight size={17} strokeWidth={2.4} />
              </TransitionLink>
            </div>
          </aside>

          <div className="xp-ledger" ref={listRef}>
            <span className="xp-thread" ref={threadRef} aria-hidden="true" />
            {PROJECTS.map((p) => <Record key={p.id} p={p} />)}
          </div>
        </div>
      </div>

      <style>{`
        .xp-count { color: var(--ink-3); white-space: nowrap; }

        /* ---- stage: a held identity beside a scrolling ledger ---- */
        .xp-stage {
          display: grid;
          grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.6fr);
          gap: clamp(2rem, 6vw, 5.5rem);
          align-items: start;
        }

        .xp-rail-in {
          position: sticky;
          top: clamp(5.5rem, 14vh, 8rem);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: clamp(1.25rem, 3vh, 2rem);
        }

        .xp-org { display: inline-flex; align-items: center; gap: 0.8rem; }
        .xp-org-name {
          margin: 0;
          font-size: clamp(2.4rem, 5.5vw, 4.4rem);
          letter-spacing: -0.05em;
        }
        .xp-live {
          width: 10px; height: 10px;
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

        .xp-meta {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          width: 100%;
          padding-block: clamp(1rem, 2.5vh, 1.5rem);
          border-block: 1px solid var(--line);
        }
        .xp-meta > div {
          display: grid;
          grid-template-columns: 6.5rem minmax(0, 1fr);
          gap: 1rem;
          align-items: baseline;
        }
        .xp-meta dt {
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: var(--step--2);
        }
        .xp-meta dd { font-size: var(--step--1); font-weight: 500; }
        .xp-status { color: var(--mark); }
        .xp-rail-note { max-width: 36ch; font-size: var(--step--1); }

        /* ---- the ledger ---- */
        .xp-ledger { position: relative; padding-left: clamp(0px, 2vw, 1.5rem); }
        .xp-thread {
          position: absolute;
          left: 0;
          top: 0.75rem;
          bottom: 0.75rem;
          width: 1px;
          background: var(--mark);
          transform: scaleY(0);
          transform-origin: top;
        }

        .xp-record {
          display: grid;
          grid-template-columns: clamp(2.5rem, 5vw, 4.5rem) minmax(0, 1fr);
          gap: clamp(0.75rem, 2vw, 1.5rem);
          padding-block: clamp(2rem, 5vh, 3.25rem);
        }
        .xp-record + .xp-record { border-top: 1px solid var(--line); }
        .xp-record:first-child { padding-top: 0; }

        .xp-record-rail { position: relative; }
        .xp-record-n {
          display: block;
          font-size: clamp(1.4rem, 3vw, 2.2rem);
          font-weight: 500;
          color: var(--mark);
          letter-spacing: -0.02em;
        }

        .xp-record-main { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; }
        .xp-record-sub {
          background: color-mix(in srgb, var(--ink) 7%, transparent);
          border-color: transparent;
        }
        .xp-record-name {
          margin: 0;
          font-size: clamp(1.75rem, 4vw, 3rem);
          letter-spacing: -0.04em;
          line-height: 1.04;
        }
        .xp-record-lead { max-width: 54ch; font-size: var(--step--1); }

        /* ---- flow strip ---- */
        .flow {
          position: relative;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.35rem 1.1rem;
          width: 100%;
          padding: 0.95rem 1rem;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: var(--paper-2);
          overflow: hidden;
        }
        /* The track draws under the stages as the record arrives. */
        .flow-track {
          position: absolute;
          left: 1rem; right: 1rem;
          top: 50%;
          height: 1px;
          background: var(--line);
          transform: scaleX(0);
          transform-origin: left;
        }
        .flow-node {
          position: relative;
          z-index: 1;
          display: inline-block;
          padding-inline: 0.3rem;
          background: var(--paper-2);
          color: var(--ink-2);
          font-size: var(--step--2);
          white-space: nowrap;
          opacity: 0.6;
        }
        .flow-dot {
          position: absolute;
          top: 0; left: 0;
          width: 24px; height: 24px;
          margin: -12px 0 0 -12px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--mark) 20%, transparent);
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
          max-width: 62ch;
        }
        .xp-bar { flex: none; width: 13px; height: 2px; border-radius: 2px; background: var(--mark); }

        .xp-stack { display: flex; flex-wrap: wrap; gap: 0.35rem; padding-top: 0.3rem; }

        @media (max-width: 980px) {
          .xp-stage { grid-template-columns: minmax(0, 1fr); gap: clamp(2rem, 6vh, 3rem); }
          .xp-rail-in { position: static; }
          .xp-meta { max-width: 36rem; }
          .xp-ledger { padding-left: 0; }
          .xp-thread { display: none; }
        }
        @media (max-width: 560px) {
          .xp-record { grid-template-columns: minmax(0, 1fr); gap: 0.25rem; }
          /* Stacked, the index needs its own line — the drift would
             otherwise carry it into the tag underneath. */
          .xp-record-rail { height: 2.4rem; }
          .xp-meta > div { grid-template-columns: minmax(0, 1fr); gap: 0.2rem; }
        }
      `}</style>
    </section>
  );
};

export default Experience;
