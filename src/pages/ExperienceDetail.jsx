import React, { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { TransitionLink } from '../components/RouteCurtain';
import { gsap, maskLines, riseIn, drawRule, reduced, cleanup } from '../lib/motion';

/* This page is deliberately shallow on content and deep on structure.
   The work is Emerson's; the architecture is the part that is mine to
   show, so the page shows the graphs and nothing that sits inside them —
   no queries, no columns, no business questions, no numbers. */

const FOOTPRINT = [
  'LangGraph', 'LangChain', 'Azure OpenAI', 'FastAPI', 'Server-sent events',
  'Azure SQL', 'Azure PostgreSQL', 'sqlglot', 'TimeGPT', 'React', 'TypeScript',
  'Azure App Service',
];

const POR_NOTES = [
  {
    k: 'One graph, two products',
    v: 'Each reporting module declares what it needs in configuration and the loader assembles the graph at runtime. The shared agent code has no branch for either product, which is what stopped the two from drifting apart.',
  },
  {
    k: 'Agents with one job each',
    v: 'Extraction turns documents into structure. The SQL agent answers against the warehouse. Neither carries the other’s failure modes, so either can be replaced without touching the rest of the graph.',
  },
  {
    k: 'Failure is a state, not an exception',
    v: 'The validator is allowed to send work back. Because the retry loop is a node rather than a try/except, a bad generation is corrected inside the run instead of surfacing as an error.',
  },
];

const SNOP_NOTES = [
  {
    k: 'Intent before SQL',
    v: 'The question is reduced to a typed intent before any query exists. Everything downstream operates on that structure, which is what makes the rest of the graph deterministic enough to test.',
  },
  {
    k: 'Checked before it runs',
    v: 'Generation and execution are separate stages with a parser between them. The query is validated at the level of its syntax tree, so structural faults are caught before the database is ever touched.',
  },
  {
    k: 'Streamed, not awaited',
    v: 'Answers arrive over server-sent events as they are produced, so a long-running stage reads as progress in the interface rather than as a spinner.',
  },
  {
    k: 'Forecasting beside retrieval',
    v: 'Demand and resource forecasting run on TimeGPT, benchmarked against classical SARIMA and SARIMAX baselines rather than adopted on faith.',
  },
];

/* ------------------------------------------------------------------
   Diagram plumbing.

   Paths carry pathLength="1" so a single dashoffset tween draws any of
   them regardless of real length. A second copy of each path, dashed
   short, carries a charge along the same route once drawn — which is
   how the picture says "pipeline" without a legend.
   ------------------------------------------------------------------ */
const useDiagram = (rootRef) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const boxes = Array.from(root.querySelectorAll('.dg-box'));
    const lines = Array.from(root.querySelectorAll('.dg-line'));
    const pulses = Array.from(root.querySelectorAll('.dg-pulse'));

    if (reduced()) {
      gsap.set([...boxes, ...lines], { opacity: 1, strokeDashoffset: 0 });
      gsap.set(pulses, { opacity: 0 });
      return undefined;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top 78%', once: true },
    });

    tl.fromTo(boxes, { opacity: 0, scale: 0.94 }, {
      opacity: 1, scale: 1, duration: 0.65, stagger: 0.06,
      ease: 'swift', transformOrigin: 'center',
    })
      .fromTo(lines, { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, duration: 0.7, stagger: 0.05, ease: 'glide',
      }, 0.25);

    // The charge keeps running after the draw, on its own clock.
    const charge = gsap.fromTo(
      pulses,
      { strokeDashoffset: 1 },
      {
        strokeDashoffset: -1,
        duration: 2.6,
        ease: 'none',
        repeat: -1,
        stagger: { each: 0.12, repeat: -1 },
        scrollTrigger: { trigger: root, start: 'top 95%', end: 'bottom 5%', toggleActions: 'play pause resume pause' },
      }
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      charge.scrollTrigger?.kill();
      charge.kill();
    };
  }, [rootRef]);
};

const Node = ({ x, y, w, label, strong }) => (
  <g className="dg-box">
    <rect x={x} y={y} width={w} height={strong ? 56 : 46} rx={12} className={strong ? 'dg-rect dg-rect--strong' : 'dg-rect'} />
    <text x={x + w / 2} y={y + (strong ? 34 : 29)} className="dg-label" textAnchor="middle">{label}</text>
  </g>
);

const Edge = ({ d }) => (
  <>
    <path d={d} className="dg-line" pathLength="1" />
    <path d={d} className="dg-pulse" pathLength="1" />
  </>
);

const CommandCentreDiagram = () => {
  const ref = useRef(null);
  useDiagram(ref);

  return (
    <div className="dg" ref={ref}>
      <svg viewBox="0 0 920 626" role="img" aria-label="Architecture of the PMO Command Centre: two configuration modules feed a config-driven loader, which assembles one shared agent graph; the graph fans out to an extraction agent and a SQL agent, both of which report to a validator that can send work back to the SQL agent before a report is produced.">
        <Edge d="M260 74 V101 H460 V128" />
        <Edge d="M660 74 V101 H460 V128" />
        <Edge d="M460 174 V228" />
        <Edge d="M460 284 V321 H230 V358" />
        <Edge d="M460 284 V321 H690 V358" />
        <Edge d="M230 404 V440 H460 V468" />
        <Edge d="M690 404 V440 H460 V468" />
        <Edge d="M460 514 V558" />
        <Edge d="M580 491 H862 V381 H810" />

        <Node x={150} y={28} w={220} label="POR module" />
        <Node x={550} y={28} w={220} label="PPR module" />
        <Node x={310} y={128} w={300} label="Config-driven loader" />
        <Node x={260} y={228} w={400} label="Shared agent graph" strong />
        <Node x={110} y={358} w={240} label="Extraction agent" />
        <Node x={570} y={358} w={240} label="SQL agent" />
        <Node x={340} y={468} w={240} label="Validator" />
        <Node x={370} y={558} w={180} label="Report" />

        <text x={872} y={430} className="dg-note" textAnchor="middle" transform="rotate(90 872 430)">
          self-correcting retry
        </text>
      </svg>
    </div>
  );
};

const SnopDiagram = () => {
  const ref = useRef(null);
  useDiagram(ref);

  return (
    <div className="dg" ref={ref}>
      <svg viewBox="0 0 920 410" role="img" aria-label="Architecture of the S&OP agent: a question passes through a guardrail, a conversation router and intent extraction, then an orchestrator, planner, SQL generator and an abstract-syntax-tree validator, before an executor, an output agent and a streamed response.">
        <Edge d="M170 63 H230" />
        <Edge d="M380 63 H440" />
        <Edge d="M590 63 H650" />
        <Edge d="M800 63 H862 V213 H800" />
        <Edge d="M650 213 H590" />
        <Edge d="M440 213 H380" />
        <Edge d="M230 213 H170" />
        <Edge d="M95 236 V340" />
        <Edge d="M170 363 H230" />
        <Edge d="M380 363 H440" />

        <Node x={20} y={40} w={150} label="Question" />
        <Node x={230} y={40} w={150} label="Guardrail" />
        <Node x={440} y={40} w={150} label="Router" />
        <Node x={650} y={40} w={150} label="Intent" />

        <Node x={650} y={190} w={150} label="Orchestrator" />
        <Node x={440} y={190} w={150} label="Planner" />
        <Node x={230} y={190} w={150} label="SQL gen" />
        <Node x={20} y={190} w={150} label="AST check" />

        <Node x={20} y={340} w={150} label="Executor" />
        <Node x={230} y={340} w={150} label="Output agent" />
        <Node x={440} y={340} w={150} label="Stream" strong />
      </svg>
    </div>
  );
};

const Chapter = ({ n, name, sub, lead, notes, diagram, tone }) => {
  const rootRef = useRef(null);
  const nameRef = useRef(null);
  const notesRef = useRef(null);

  useEffect(() => {
    const fns = [
      maskLines(nameRef.current, { trigger: rootRef.current, start: 'top 80%', stagger: 0.08 }),
      riseIn(notesRef.current?.children, { trigger: notesRef.current, start: 'top 88%', stagger: 0.09, y: 24 }),
    ];
    return cleanup(fns);
  }, []);

  return (
    <section ref={rootRef} className={`block cs-chapter cs-chapter--${n}`} data-tone={tone}>
      <div className="shell">
        <div className="cs-chapter-head">
          <span className="num cs-chapter-n">{n}</span>
          <div>
            <h2 ref={nameRef} className="display cs-chapter-name">{name}</h2>
            <span className="mono cs-chapter-sub">{sub}</span>
          </div>
        </div>

        <p className="lead cs-chapter-lead">{lead}</p>

        {diagram}

        <ul className="cs-notes" ref={notesRef}>
          {notes.map((x) => (
            <li key={x.k} className="cs-note">
              <h3 className="cs-note-k">{x.k}</h3>
              <p className="body cs-note-v">{x.v}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

const ExperienceDetail = () => {
  const headRef = useRef(null);
  const ruleRef = useRef(null);
  const footRef = useRef(null);

  useEffect(() => {
    const fns = [
      maskLines(headRef.current, { trigger: headRef.current, start: 'top 92%', stagger: 0.09 }),
      drawRule(ruleRef.current, { start: 'top 95%' }),
      riseIn(footRef.current?.children, { trigger: footRef.current, start: 'top 88%', stagger: 0.07, y: 20 }),
    ];
    return cleanup(fns);
  }, []);

  return (
    <article className="cs">
      <header className="block cs-hero" data-tone="paper">
        <div className="shell">
          <TransitionLink to="/#experience" className="cs-back">
            <ArrowLeft size={15} strokeWidth={2.4} />
            <span>Back to portfolio</span>
          </TransitionLink>

          <div className="cs-hero-meta">
            <span className="eyebrow">Emerson · PMO AI/ML</span>
            <span className="rule" ref={ruleRef} />
            <span className="mono">Dec 2025 — Present</span>
          </div>

          <h1 ref={headRef} className="display display--hero cs-title">
            Two graphs,<br />one footprint.
          </h1>

          <p className="lead cs-standfirst">
            Two multi-agent systems built inside the same internship, on the same
            Azure stack and the same agent conventions. What follows is the shape
            of each one — the nodes, the edges and the decisions behind them.
            The data they run on stays where it belongs.
          </p>

          <ul className="cs-footprint" ref={footRef}>
            {FOOTPRINT.map((t) => <li key={t} className="tag">{t}</li>)}
          </ul>
        </div>
      </header>

      <Chapter
        n="01"
        tone="paper"
        name="PMO Command Centre"
        sub="POR / PPR · one agent graph serving two reporting products"
        lead="Two reporting products had grown two codebases that did nearly the same thing. Rebuilding them as one configurable graph removed the duplication without flattening the differences between them."
        notes={POR_NOTES}
        diagram={<CommandCentreDiagram />}
      />

      <Chapter
        n="02"
        tone="paper"
        name="S&OP Agent"
        sub="Sales & Operations Planning · natural language to validated SQL"
        lead="A planning question in plain English, turned into a query that has been checked before it runs, and answered with the reasoning attached rather than a bare number."
        notes={SNOP_NOTES}
        diagram={<SnopDiagram />}
      />

      <footer className="block cs-foot" data-tone="ink">
        <div className="shell cs-foot-in">
          <h2 className="display display--m cs-foot-head">
            The architecture travels;<br />the data does not.
          </h2>
          <p className="body cs-foot-note">
            Everything above is structure: how the graphs are composed, where
            validation sits, and what happens when a generation is wrong. The
            queries, the schema and the business content stay inside Emerson.
          </p>
          <TransitionLink to="/#experience" className="btn btn--mark cs-foot-cta">
            Back to portfolio
            <span className="arrow" aria-hidden="true">→</span>
          </TransitionLink>
        </div>
      </footer>

      <style>{`
        .cs { display: block; }

        /* ---- hero ---- */
        .cs-hero { padding-block: clamp(5.5rem, 14vh, 9rem) var(--bay); }
        .cs-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--ink-2);
          font-family: var(--font-mono);
          font-size: var(--step--1);
          transition: color 0.35s var(--ease-out), gap 0.35s var(--ease-out);
        }
        .cs-back:hover { color: var(--ink); gap: 0.75rem; }

        .cs-hero-meta {
          display: flex;
          align-items: center;
          gap: clamp(0.75rem, 2vw, 1.5rem);
          margin-top: clamp(2rem, 6vh, 3.5rem);
          color: var(--ink-3);
        }
        .cs-title {
          margin: clamp(1.5rem, 4vh, 2.5rem) 0 0;
          font-size: clamp(2.6rem, 9vw, 7.5rem);
        }
        .cs-standfirst { max-width: 56ch; margin-top: clamp(1.5rem, 4vh, 2.25rem); }
        .cs-footprint {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: clamp(2rem, 5vh, 3rem);
        }

        /* ---- chapters ----
           Every chapter is on the same neutral tone now, so the block
           stacking no longer separates them. A hairline does it instead. */
        .cs-chapter { border-top: 1px solid var(--line); }
        .cs-chapter-head {
          display: flex;
          align-items: flex-start;
          gap: clamp(0.9rem, 2.5vw, 1.75rem);
        }
        .cs-chapter-n {
          color: var(--mark);
          font-size: clamp(1rem, 1.8vw, 1.25rem);
          font-weight: 600;
          padding-top: 0.45em;
        }
        .cs-chapter-name {
          margin: 0;
          font-size: clamp(2rem, 5.5vw, 4rem);
          letter-spacing: -0.045em;
        }
        .cs-chapter-sub {
          display: block;
          margin-top: 0.7rem;
          color: var(--ink-3);
          font-size: var(--step--1);
        }
        .cs-chapter-lead {
          max-width: 58ch;
          margin-top: clamp(1.25rem, 3.5vh, 2rem);
        }

        /* ---- diagram ---- */
        .dg {
          margin-top: clamp(2rem, 6vh, 3.5rem);
          padding: clamp(1rem, 3vw, 2.25rem);
          border-radius: clamp(18px, 2.2vw, 28px);
          border: 1px solid var(--line);
          background: var(--paper-2);
          overflow-x: auto;
        }
        .dg svg { width: 100%; min-width: 580px; height: auto; overflow: visible; }

        .dg-rect {
          fill: var(--paper);
          stroke: var(--line);
          stroke-width: 1.25;
        }
        .dg-rect--strong {
          fill: color-mix(in srgb, var(--mark) 12%, var(--paper));
          stroke: var(--mark);
          stroke-width: 1.75;
        }
        .dg-label {
          fill: var(--ink);
          font-family: var(--font-mono);
          font-size: 15px;
          letter-spacing: 0.01em;
        }
        .dg-note {
          fill: var(--ink-3);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .dg-line {
          fill: none;
          stroke: var(--line);
          stroke-width: 1.5;
          stroke-dasharray: 1;
        }
        /* A short dash chasing the same route — the charge. */
        .dg-pulse {
          fill: none;
          stroke: var(--mark);
          stroke-width: 2.25;
          stroke-linecap: round;
          stroke-dasharray: 0.07 0.93;
          opacity: 0.85;
        }

        /* ---- notes ---- */
        .cs-notes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 1px;
          margin-top: clamp(2rem, 5vh, 3rem);
          background: var(--line);
          border: 1px solid var(--line);
          border-radius: clamp(16px, 2vw, 24px);
          overflow: hidden;
        }
        .cs-note {
          padding: clamp(1.2rem, 2.4vw, 1.9rem);
          background: var(--paper);
          transition: background 0.4s var(--ease-out);
        }
        .cs-note:hover { background: var(--paper-2); }
        .cs-note-k {
          font-family: var(--font-display);
          font-size: var(--step-1);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .cs-note-v { margin-top: 0.7rem; font-size: var(--step--1); }

        /* ---- foot ---- */
        .cs-foot { padding-block: clamp(4rem, 11vh, 7rem); }
        .cs-foot-in { display: flex; flex-direction: column; align-items: flex-start; gap: 1.25rem; }
        .cs-foot-head { margin: 0; letter-spacing: -0.04em; }
        .cs-foot-note { max-width: 54ch; }
        .cs-foot-cta { margin-top: 0.75rem; }

        @media (max-width: 640px) {
          .cs-chapter-n { padding-top: 0.2em; }
        }
      `}</style>
    </article>
  );
};

export default ExperienceDetail;
