import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { maskLines, riseIn, drawRule, countTo, cleanup } from '../lib/motion';

const STACK = [
  'LangGraph', 'LangChain', 'Azure OpenAI', 'FastAPI', 'Azure PostgreSQL',
  'sqlglot', 'psycopg2', 'React', 'TypeScript', 'Chart.js',
];

/* The pipeline is the project. Everything else on this page is context
   for why each of these nodes has to exist. */
const NODES = [
  { n: '01', k: 'Guardrail',          v: 'Blocks unsafe or out-of-scope questions before anything else runs.' },
  { n: '02', k: 'Conversation router', v: 'Decides whether this is a follow-up, a fresh query, or just chat.' },
  { n: '03', k: 'Query intent',       v: 'Pulls the metrics, filters and grouping out of the sentence into a typed result.' },
  { n: '04', k: 'Orchestrator',       v: 'Routes to the metric tools the intent actually needs, and deduplicates overlapping ones.' },
  { n: '05', k: 'Planner',            v: 'Composes the SQL template, applies the business glossary, enforces row limits.' },
  { n: '06', k: 'SQL generator',      v: 'Writes the query — and writes the explanation that ships with the answer.' },
  { n: '07', k: 'SQL validator',      v: 'Parses the AST with sqlglot. Join fan-out and malformed filters die here.' },
  { n: '08', k: 'Data executor',      v: 'Runs it against Azure PostgreSQL, partitioned quarterly on fiscal period.' },
  { n: '09', k: 'Output agent',       v: 'Formats the Markdown table and picks a chart the answer deserves.' },
];

/* Schema navigation was the hard part, not the prompting. */
const DOMAIN = [
  {
    k: 'The fiscal calendar is not the calendar',
    v: 'Emerson’s year starts in October, and fp_posted stores a fiscal literal — 2026-01 means fiscal October 2026, not January. Every date filter the model writes has to be translated through that.',
  },
  {
    k: 'Hierarchies the schema does not name',
    v: 'World Area to CoE to project class. A business glossary maps what a person says ("PSS Pune") to the column value the database holds, so the planner never invents a filter combination the schema rejects.',
  },
  {
    k: 'Correctness over plausibility',
    v: 'An LLM will happily produce SQL that parses and returns the wrong number. Validation runs at the AST level, and the answer carries its own methodology so a planner can check the working.',
  },
  {
    k: 'State that does not bleed',
    v: 'Checkpointing keeps a session’s context across turns without letting a previous turn’s filters — a stray LIMIT 2 — leak into the next question.',
  },
];

const METRICS = [
  { v: 9, k: 'Pipeline nodes' },
  { v: 12, suffix: 'K', k: 'Lines in the core modules' },
  { v: 2, k: 'Engineers on it' },
];

const Metric = ({ m }) => {
  const ref = useRef(null);
  useEffect(() => cleanup([
    countTo(ref.current, m.v, { suffix: m.suffix, prefix: m.prefix, decimals: m.decimals || 0 }),
  ]), [m]);

  return (
    <div className="metric">
      <span className="display metric-v" ref={ref} />
      <span className="mono metric-k">{m.k}</span>
    </div>
  );
};

const ExperienceDetail = () => {
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  const ruleRef = useRef(null);
  const nodesRef = useRef(null);
  const domainRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    window.lenis?.scrollTo(0, { immediate: true });

    const fns = [
      maskLines(titleRef.current, { trigger: false, stagger: 0.09 }),
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 95%' }),
      riseIn(nodesRef.current?.children, { trigger: nodesRef.current, start: 'top 85%', stagger: 0.06, y: 22 }),
      riseIn(domainRef.current?.children, { trigger: domainRef.current, start: 'top 86%', stagger: 0.09, y: 26 }),
    ];
    return cleanup(fns);
  }, []);

  return (
    <article ref={rootRef} className="case block block--flat" data-tone="paper">
      <div className="shell case-shell">
        <Link to="/#experience" className="case-back">
          <ArrowLeft size={16} strokeWidth={2.4} /> Back to portfolio
        </Link>

        <header className="case-head">
          <span className="eyebrow">Case study — Emerson</span>

          <h1 ref={titleRef} className="display display--l case-title">
            SNOP GenAI<br />Pipeline
          </h1>

          <p className="lead case-standfirst">
            A multi-agent system that turns a natural-language business question into
            a correct SQL query over Emerson&rsquo;s Sales &amp; Operations Planning
            database — and returns the numbers, a chart, and its own reasoning.
          </p>

          <dl className="case-meta">
            <div><dt className="mono">Organisation</dt><dd>Emerson</dd></div>
            <div><dt className="mono">Role</dt><dd>PMO AI/ML Intern</dd></div>
            <div><dt className="mono">Timeframe</dt><dd>Dec 2025 — Present</dd></div>
            <div><dt className="mono">Status</dt><dd className="case-live">In production, actively maintained</dd></div>
          </dl>

          <span className="rule" ref={ruleRef} />

          <ul className="case-stack">
            {STACK.map((s) => <li key={s} className="tag">{s}</li>)}
          </ul>
        </header>

        <section className="case-overview" data-tone="lilac">
          <h2 className="mono case-kicker">The problem</h2>
          <p className="lead">
            S&amp;OP teams were hand-writing ad-hoc SQL to answer the same recurring
            questions about workforce utilisation, demand and supply forecasting,
            financial recovery and operational effectiveness. The schema is not
            friendly: nuanced fiscal calendars, multi-dimensional hierarchies, and
            business rules that live in people&rsquo;s heads rather than in columns.
            Getting an LLM to write SQL is easy. Getting it to write SQL that is
            <em> right</em> is the work.
          </p>
        </section>

        <div className="case-grid">
          <section className="case-col">
            <h2 className="mono case-kicker">How a question becomes an answer</h2>
            <ol className="case-nodes" ref={nodesRef}>
              {NODES.map((n) => (
                <li key={n.n} className="node">
                  <span className="num node-n">{n.n}</span>
                  <span className="node-k">{n.k}</span>
                  <span className="node-v">{n.v}</span>
                </li>
              ))}
            </ol>

            <h2 className="mono case-kicker case-kicker--spaced">What made it hard</h2>
            <div className="case-domain" ref={domainRef}>
              {DOMAIN.map((d) => (
                <div key={d.k} className="domain-card">
                  <h3 className="domain-k">{d.k}</h3>
                  <p className="body domain-v">{d.v}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="case-aside">
            <div className="case-panel">
              <span className="mono panel-label">at a glance</span>
              <div className="case-metrics">
                {METRICS.map((m) => <Metric key={m.k} m={m} />)}
              </div>
            </div>

            <div className="case-panel case-code" data-tone="ink">
              <span className="mono panel-label">pipeline_state.py</span>
              <pre className="mono"><code>{`class PipelineState(TypedDict):
    session_id: str
    user_message: str
    is_safe: bool
    conversation_history: list[dict]
    intents: list[IntentResult]
    planned_tools: list[str]
    sql_queries: dict[str, str]
    query_results: dict[str, Any]
    reasoning_trace: list[ReasoningEntry]
    final_response: str
    chart_config: ChartConfig | None`}</code></pre>
              <p className="mono panel-note">
                Checkpointed per session, so a follow-up keeps its context
                without inheriting the last turn&rsquo;s filters.
              </p>
            </div>

            <div className="case-panel case-next" data-tone="cyan">
              <span className="mono panel-label">shipping next</span>
              <p className="body">
                A geopolitical-impact tool — web search wired into the same graph,
                so the system can answer how current events move an industry and
                Emerson&rsquo;s supply chain, not just what the database already knows.
              </p>
            </div>
          </aside>
        </div>

        <Link to="/#experience" className="btn case-foot-cta">
          Back to portfolio <span className="arrow" aria-hidden="true">→</span>
        </Link>
      </div>

      <style>{`
        .case { min-height: 100svh; }
        .case-shell {
          display: flex;
          flex-direction: column;
          gap: clamp(2.5rem, 7vh, 4.5rem);
          padding-top: clamp(6rem, 14vh, 9rem);
        }

        .case-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
          align-self: flex-start;
          padding: 0.6em 1.1em 0.65em 0.9em;
          border-radius: 999px;
          border: 1px solid var(--line);
          font-size: var(--step--1);
          font-weight: 500;
          transition: border-color 0.3s var(--ease-out), color 0.3s var(--ease-out);
        }
        .case-back:hover { border-color: var(--mark); color: var(--mark); }

        .case-head { display: flex; flex-direction: column; gap: clamp(1.2rem, 3.5vh, 2rem); align-items: flex-start; }
        .case-title { margin: 0; letter-spacing: -0.045em; }
        .case-standfirst { max-width: 58ch; }
        .case-meta { display: flex; flex-wrap: wrap; gap: 1.2rem 2.5rem; }
        .case-meta dt {
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: var(--step--2);
          margin-bottom: 0.3rem;
        }
        .case-meta dd { font-size: var(--step--1); font-weight: 500; }
        .case-live { color: var(--mark); }
        .case-head .rule { width: 100%; flex: none; }
        .case-stack { display: flex; flex-wrap: wrap; gap: 0.4rem; }

        .case-kicker {
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: var(--step--2);
          margin-bottom: 1.2rem;
        }
        .case-kicker--spaced { margin-top: clamp(2.5rem, 7vh, 4rem); }

        .case-overview {
          padding: clamp(1.5rem, 4vw, 2.75rem);
          border-radius: clamp(18px, 2.4vw, 28px);
        }
        .case-overview .lead { color: var(--ink); max-width: 64ch; }
        .case-overview em { font-style: italic; color: var(--mark); }

        .case-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: start;
        }

        /* ---- the pipeline ---- */
        .case-nodes { border-top: 1px solid var(--line); }
        .node {
          display: grid;
          grid-template-columns: 2.4rem 11rem minmax(0, 1fr);
          gap: 0.9rem;
          align-items: baseline;
          padding-block: 0.85rem;
          border-bottom: 1px solid var(--line-2);
          position: relative;
        }
        .node::before {
          content: "";
          position: absolute;
          left: 0.55rem;
          top: 2.1rem;
          bottom: -0.3rem;
          width: 1px;
          background: var(--line);
        }
        .node:last-child::before { display: none; }
        .node-n { color: var(--mark); font-size: var(--step--2); font-weight: 500; }
        .node-k { font-weight: 600; font-size: var(--step--1); }
        .node-v { color: var(--ink-2); font-size: var(--step--1); line-height: 1.6; }

        /* ---- what made it hard ---- */
        .case-domain { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; }
        .domain-card {
          padding: 1.3rem 1.4rem;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: var(--paper-2);
          transition: border-color 0.35s var(--ease-out);
        }
        .domain-card:hover { border-color: var(--mark); }
        .domain-k { font-size: var(--step-0); font-weight: 600; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
        .domain-v { font-size: var(--step--1); }

        /* ---- aside ---- */
        .case-aside { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 5.5rem; }
        .case-panel {
          padding: 1.2rem 1.3rem 1.4rem;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: var(--paper-2);
        }
        .panel-label {
          display: block;
          color: var(--ink-3);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: var(--step--2);
          margin-bottom: 1.1rem;
        }
        .panel-note {
          margin-top: 0.9rem;
          padding-top: 0.9rem;
          border-top: 1px solid var(--line);
          color: var(--ink-3);
          font-size: 0.68rem;
          line-height: 1.6;
        }
        .case-metrics { display: flex; flex-direction: column; gap: 1.1rem; }
        .metric { display: flex; flex-direction: column; gap: 0.2rem; }
        .metric + .metric { padding-top: 1.1rem; border-top: 1px solid var(--line); }
        .metric-v { font-size: clamp(1.7rem, 3.2vw, 2.4rem); letter-spacing: -0.04em; }
        .metric-k { color: var(--mark); font-size: var(--step--2); text-transform: uppercase; letter-spacing: 0.08em; }

        .case-code { overflow-x: auto; }
        .case-code pre { font-size: 0.72rem; line-height: 1.75; color: var(--ink-2); }
        .case-code code { white-space: pre; }

        .case-next .body { color: var(--ink); font-size: var(--step--1); }

        .case-foot-cta { align-self: flex-start; margin-bottom: clamp(3rem, 10vh, 6rem); }

        @media (max-width: 900px) {
          .case-grid { grid-template-columns: 1fr; }
          .case-aside { position: static; }
        }
        @media (max-width: 560px) {
          .node { grid-template-columns: 2rem minmax(0, 1fr); }
          .node-v { grid-column: 2; }
          .node::before { display: none; }
        }
      `}</style>
    </article>
  );
};

export default ExperienceDetail;
