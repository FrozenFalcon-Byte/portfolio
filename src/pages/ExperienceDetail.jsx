import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu, Network, RefreshCw } from 'lucide-react';
import { maskLines, riseIn, drawRule, countTo, cleanup } from '../lib/motion';

const STACK = ['LangGraph', 'Python', 'LLMs', 'SQL', 'Prompt Engineering', 'Agentic AI', 'Data Analytics'];

const ARCHITECTURE = [
  {
    icon: Network,
    title: 'Dynamic Query Orchestrator',
    desc: 'Intelligent multi-agent routing built on Azure OpenAI. It evaluates complex incoming enterprise PMO requests and autonomously routes each one to the specialised sub-agent that can answer it.',
  },
  {
    icon: Cpu,
    title: 'Specialised Execution Agents',
    desc: 'A dual-agent structure: an Azure SQL Database agent for secure schema querying, and a document processing agent for unstructured data parsing and text summarisation.',
  },
  {
    icon: RefreshCw,
    title: 'Self-Healing Interactions',
    desc: 'Autonomous exception handling. The system captures execution failures, analyses the traceback through an LLM, and corrects the query logic before re-running it.',
  },
];

const RESULTS = [
  'Automated manual PMO tracking processes, replacing static dashboards with an adaptive, conversational analytics assistant.',
  'Optimised query accuracy and semantic search across massive, unstructured project databases.',
  'Delivered a secure, high-availability architecture giving project leadership real-time, data-driven forecasting.',
];

const METRICS = [
  { v: 99.99, decimals: 2, suffix: '%', k: 'Azure service availability' },
  { v: 200, prefix: '<', suffix: 'ms', k: 'Azure OpenAI inference latency' },
  { v: 1.2, decimals: 1, suffix: 'M+', k: 'Monthly pipeline executions' },
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
  const archRef = useRef(null);
  const resRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    window.lenis?.scrollTo(0, { immediate: true });

    const fns = [
      maskLines(titleRef.current, { trigger: false, stagger: 0.09 }),
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 95%' }),
      riseIn(archRef.current?.children, { trigger: archRef.current, start: 'top 85%', stagger: 0.1, y: 28 }),
      riseIn(resRef.current?.children, { trigger: resRef.current, start: 'top 88%', stagger: 0.08, y: 22 }),
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
            Intelligent<br />PMO Analytics
          </h1>

          <dl className="case-meta">
            <div><dt className="mono">Organisation</dt><dd>Emerson</dd></div>
            <div><dt className="mono">Role</dt><dd>PMO AI/ML Intern</dd></div>
            <div><dt className="mono">Timeframe</dt><dd>Dec 2025 — Present</dd></div>
            <div><dt className="mono">Status</dt><dd className="case-live">Ongoing</dd></div>
          </dl>

          <span className="rule" ref={ruleRef} />

          <ul className="case-stack">
            {STACK.map((s) => <li key={s} className="tag">{s}</li>)}
          </ul>
        </header>

        <section className="case-overview" data-tone="lilac">
          <h2 className="mono case-kicker">Project overview</h2>
          <p className="lead">
            A dynamic, multi-agent AI system that automates and scales complex analytics for the
            Project Management Office. Rather than a rigid prompt chain, the framework uses
            autonomous agents that reason, route and self-correct to produce high-level project
            insights, resource forecasts and financial S-curve analyses in real time.
          </p>
        </section>

        <div className="case-grid">
          <section className="case-col">
            <h2 className="mono case-kicker">System architecture</h2>
            <div className="case-arch" ref={archRef}>
              {ARCHITECTURE.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="arch-card">
                  <span className="arch-icon" aria-hidden="true"><Icon size={18} strokeWidth={2.2} /></span>
                  <div>
                    <h3 className="arch-title">{title}</h3>
                    <p className="body arch-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="mono case-kicker case-kicker--spaced">Execution results</h2>
            <ol className="case-results" ref={resRef}>
              {RESULTS.map((r, i) => (
                <li key={r}>
                  <span className="num result-n">{String(i + 1).padStart(2, '0')}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
          </section>

          <aside className="case-aside">
            <div className="case-panel">
              <span className="mono panel-label">metrics.dat</span>
              <div className="case-metrics">
                {METRICS.map((m) => <Metric key={m.k} m={m} />)}
              </div>
            </div>

            <div className="case-panel case-code" data-tone="ink">
              <span className="mono panel-label">agent_loop.py</span>
              <pre className="mono"><code>{`def execute_agent_task(prompt, context):
    try:
        response = azure_openai.Completion.create(
            engine="gpt-4-turbo",
            prompt=build_query(prompt, context)
        )
        return response.choices[0].text
    except APIError as e:
        corrected = self_correct_logic(e, prompt)
        return execute_agent_task(corrected, context)`}</code></pre>
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
        .case-overview .lead { color: var(--ink); max-width: 62ch; }

        .case-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: start;
        }

        .case-arch { display: flex; flex-direction: column; gap: 0.75rem; }
        .arch-card {
          display: flex;
          gap: 1.1rem;
          padding: 1.3rem 1.4rem;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: var(--paper-2);
          transition: border-color 0.35s var(--ease-out);
        }
        .arch-card:hover { border-color: var(--mark); }
        .arch-icon {
          display: grid; place-items: center;
          width: 34px; height: 34px;
          flex: none;
          border-radius: 11px;
          background: var(--mark);
          color: var(--paper);
        }
        [data-theme="dark"] .arch-icon { color: #101403; }
        .arch-title { font-size: var(--step-0); font-weight: 600; margin-bottom: 0.4rem; }
        .arch-desc { font-size: var(--step--1); }

        .case-results { display: flex; flex-direction: column; gap: 0.9rem; }
        .case-results li {
          display: flex;
          gap: 1rem;
          color: var(--ink-2);
          font-size: var(--step--1);
          line-height: 1.7;
          max-width: 62ch;
        }
        .result-n { color: var(--mark); flex: none; font-size: var(--step--2); padding-top: 0.25em; }

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
        .case-metrics { display: flex; flex-direction: column; gap: 1.1rem; }
        .metric { display: flex; flex-direction: column; gap: 0.2rem; }
        .metric + .metric { padding-top: 1.1rem; border-top: 1px solid var(--line); }
        .metric-v { font-size: clamp(1.7rem, 3.2vw, 2.4rem); letter-spacing: -0.04em; }
        .metric-k { color: var(--mark); font-size: var(--step--2); text-transform: uppercase; letter-spacing: 0.08em; }

        .case-code { overflow-x: auto; }
        .case-code pre { font-size: 0.72rem; line-height: 1.75; color: var(--ink-2); }
        .case-code code { white-space: pre; }

        .case-foot-cta { align-self: flex-start; margin-bottom: clamp(3rem, 10vh, 6rem); }

        @media (max-width: 900px) {
          .case-grid { grid-template-columns: 1fr; }
          .case-aside { position: static; }
        }
      `}</style>
    </article>
  );
};

export default ExperienceDetail;
