import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { TransitionLink } from './RouteCurtain';
import { gsap, ScrollTrigger, EASE, heading, reduced, cleanup } from '../lib/motion';
import Glyph from './Glyph';

/* Two systems, one internship. Each is told as its own graph: the
   stages in order, and one line for what happens at each — the reader
   runs the pipeline by scrolling through it. `loop` draws a return
   edge, which is how the self-correcting retry is shown rather than
   described. */
const SYSTEMS = [
  {
    id: 'por',
    name: 'PMO Command Centre',
    sub: 'POR / PPR reporting',
    lead: 'Two reporting codebases, drifting apart with every change — replaced by one agent graph that serves both.',
    loop: [4, 2],
    stages: [
      { t: 'Intake', c: 'A reporting request comes in. POR or PPR, it is the same door now.' },
      { t: 'Extract', c: 'A dedicated Extraction agent turns the source documents into structure.' },
      { t: 'SQL', c: 'A dedicated SQL agent answers against Azure SQL, on Azure OpenAI.' },
      { t: 'Validate', c: 'Every result is checked before it is allowed any further.' },
      { t: 'Retry', c: 'A bad result loops back and is corrected inside the run — never thrown.' },
      { t: 'Report', c: 'Modules load from config, so a new report plugs in without touching shared agent code.' },
    ],
  },
  {
    id: 'snop',
    name: 'S&OP Agent',
    sub: 'Sales & Operations Planning',
    lead: 'Planners were hand-writing SQL for the same questions. Now they ask in plain language and get the working with the number.',
    loop: null,
    stages: [
      { t: 'Guardrail', c: 'Off-topic and unsafe questions stop at the door.' },
      { t: 'Intent', c: 'The question is reduced to a typed intent before any SQL exists.' },
      { t: 'Plan', c: 'The intent becomes a plan over the planning data.' },
      { t: 'Generate', c: 'The LangGraph pipeline writes SQL for Azure PostgreSQL.' },
      { t: 'Validate', c: 'The query is checked at the level of its syntax tree before it can run.' },
      { t: 'Execute', c: 'Only validated SQL ever touches the database.' },
      { t: 'Stream', c: 'Answers stream to React over server-sent events, with TimeGPT forecasts benchmarked against SARIMA.' },
    ],
  },
];

/* ------------------------------------------------------------------
   Graph — the stages as a row of nodes joined by a rail.

   `pos` is a float along the stages (2.4 = just past the third). The
   rail fills to it, every node at or behind it is lit, and the charge
   rides the rail at exactly that point. The return edge, if there is
   one, is measured off the real node boxes and drawn as an arc above.
   ------------------------------------------------------------------ */
const Graph = ({ sys, pos }) => {
  const rowRef = useRef(null);
  const [arc, setArc] = useState(null);
  const n = sys.stages.length;
  const head = Math.min(n - 1, Math.floor(pos + 0.001));

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || !sys.loop) { setArc(null); return undefined; }
    const measure = () => {
      const nodes = row.querySelectorAll('.gx-node');
      const box = row.getBoundingClientRect();
      const a = nodes[sys.loop[0]].getBoundingClientRect();
      const b = nodes[sys.loop[1]].getBoundingClientRect();
      const x1 = a.left + a.width / 2 - box.left;
      const x2 = b.left + b.width / 2 - box.left;
      const y = a.top - box.top;
      setArc({ d: `M${x1} ${y - 4} C ${x1} ${y - 70}, ${x2} ${y - 70}, ${x2} ${y - 4}`, w: box.width });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [sys]);

  const loopLit = sys.loop && pos >= sys.loop[0];

  return (
    <div className="gx" ref={rowRef}>
      {arc && (
        <svg className={`gx-arc${loopLit ? ' is-on' : ''}`} width={arc.w} height="100%" aria-hidden="true">
          <path d={arc.d} pathLength="1" />
          <path d={arc.d} pathLength="1" className="gx-arc-run" />
        </svg>
      )}
      <span className="gx-rail" aria-hidden="true">
        <i style={{ transform: `scaleX(${Math.min(1, pos / (n - 1))})` }} />
        <b style={{ left: `${Math.min(100, (pos / (n - 1)) * 100)}%` }} />
      </span>
      <ol className="gx-row">
        {sys.stages.map((s, i) => (
          <li key={s.t} className={`gx-node${i <= head ? ' is-on' : ''}${i === head ? ' is-head' : ''}`}>
            <span className="num gx-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="gx-t">{s.t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

/* The narration: one line, the current stage's, rolled in when it
   changes. */
const Caption = ({ text, id }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (reduced() || !ref.current) return;
    gsap.fromTo(ref.current, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: EASE.swift });
  }, [id]);
  return <p className="ex-cap display" ref={ref} aria-live="polite">{text}</p>;
};

const Scene = ({ sys, pos, idx, total }) => {
  const n = sys.stages.length;
  const head = Math.min(n - 1, Math.floor(pos + 0.001));
  return (
    <div className="ex-sys" key={sys.id}>
      <div className="ex-sys-top">
        <div>
          <span className="mono ex-sys-sub">{sys.sub}</span>
          <h3 className="display ex-sys-name">{sys.name}</h3>
        </div>
        <p className="ex-sys-lead">{sys.lead}</p>
      </div>

      <Graph sys={sys} pos={pos} />

      <div className="ex-narr">
        <span className="num ex-narr-n">
          {String(head + 1).padStart(2, '0')}<em>/{String(n).padStart(2, '0')}</em>
        </span>
        <Caption text={sys.stages[head].c} id={`${sys.id}-${head}`} />
        <span className="num ex-narr-sys">System {idx + 1} of {total}</span>
      </div>
    </div>
  );
};

const Experience = () => {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const sceneRef = useRef(null);
  const [wide, setWide] = useState(() => typeof window !== 'undefined'
    && window.matchMedia('(min-width: 961px)').matches && !reduced());
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 961px)');
    const on = () => setWide(mq.matches && !reduced());
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => cleanup([heading(headRef.current)]), []);

  /* The scene pins while both graphs run, one after the other. Each
     system gets half the distance, with a short dwell at its end so the
     last stage is read before the next system replaces it. */
  useEffect(() => {
    if (!wide) return undefined;
    const st = ScrollTrigger.create({
      trigger: sceneRef.current,
      start: 'top top',
      end: () => `+=${window.innerHeight * 3.4}`,
      pin: true,
      onUpdate: (self) => setProg(Math.round(self.progress * 400) / 400),
    });
    return () => st.kill();
  }, [wide]);

  const idx = prog < 0.5 ? 0 : 1;
  const sys = SYSTEMS[idx];
  const local = Math.min(1, ((prog - idx * 0.5) / 0.5) / 0.85);
  const pos = local * (sys.stages.length - 1);

  return (
    <section ref={rootRef} id="experience" className="experience" data-acc="blue">
      <div className="shell ex-intro">
        <span className="eyebrow"><b>02</b>Experience</span>
        <h2 ref={headRef} className="display display--l ex-head">
          <span className="ln"><span className="ln-in">Shipping agents</span></span>
          <span className="ln"><span className="ln-in">at Emerson<Glyph kind="loop" acc="blue" /></span></span>
        </h2>
        <div className="ex-role">
          <span className="ex-role-t">PMO AI/ML Intern</span>
          <span className="ex-role-d">Dec 2025 — Present</span>
          <TransitionLink to="/experience/pmo" className="ex-more" data-cursor-label="Architecture">
            Full architecture <ArrowUpRight size={16} strokeWidth={2.4} />
          </TransitionLink>
        </div>
      </div>

      {wide ? (
        <div className="ex-pin" ref={sceneRef}>
          <div className="shell ex-pin-in">
            <Scene sys={sys} pos={pos} idx={idx} total={SYSTEMS.length} />
            <div className="ex-dots" aria-hidden="true">
              {SYSTEMS.map((s, i) => (
                <span key={s.id} className={i === idx ? 'is-on' : ''}>
                  <i style={{ transform: `scaleX(${i < idx ? 1 : i === idx ? local : 0})` }} />
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="shell ex-list">
          {SYSTEMS.map((s) => (
            <div className="ex-sys" key={s.id}>
              <span className="mono ex-sys-sub">{s.sub}</span>
              <h3 className="display ex-sys-name">{s.name}</h3>
              <p className="ex-sys-lead">{s.lead}</p>
              <ol className="ex-steps">
                {s.stages.map((st, i) => (
                  <li key={st.t}>
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <strong>{st.t}</strong>
                    <p>{st.c}</p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .experience { position: relative; padding-top: var(--bay); }
        .ex-intro { display: grid; gap: 1.5rem; justify-items: start; }
        .ex-head { margin: 0; }
        .ex-role { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.4rem 1.2rem; }
        .ex-role-t { font-family: var(--font-display); font-weight: 700; font-size: var(--step-1); letter-spacing: -0.03em; }
        .ex-role-d { color: var(--ink-3); }
        .ex-more {
          display: inline-flex; align-items: center; gap: 0.3em;
          color: var(--acc); font-weight: 600;
          border-bottom: 1.5px solid currentColor;
        }

        /* ---- the pinned scene ---- */
        .ex-pin { height: 100svh; display: flex; align-items: center; }
        .ex-pin-in { width: 100%; }

        .ex-sys { animation: ex-in 0.8s var(--ease-out); }
        @keyframes ex-in { from { opacity: 0; transform: translateY(30px); } }
        .ex-sys-top {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
          gap: 2rem;
          align-items: end;
        }
        .ex-sys-sub { color: var(--acc); font-weight: 600; letter-spacing: -0.01em; font-size: var(--step--2); }
        .ex-sys-name { margin-top: 0.5rem; font-size: clamp(2.4rem, 5.6vw, 5.4rem); letter-spacing: -0.055em; }
        .ex-sys-lead { color: var(--ink-2); font-size: var(--step-1); line-height: 1.4; letter-spacing: -0.01em; }

        /* ---- graph ---- */
        .gx { position: relative; margin-top: clamp(5rem, 14vh, 8rem); }
        .gx-arc { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
        .gx-arc path { fill: none; stroke: var(--line); stroke-width: 2; stroke-dasharray: 0.012 0.012; }
        .gx-arc .gx-arc-run { stroke: var(--acc); stroke-dasharray: 0.1 0.9; stroke-dashoffset: 1; opacity: 0; }
        .gx-arc.is-on path:first-child { stroke: var(--acc); }
        .gx-arc.is-on .gx-arc-run { opacity: 1; stroke-width: 4; stroke-linecap: round; animation: gx-run 1.2s linear infinite; }
        @keyframes gx-run { to { stroke-dashoffset: 0; } }

        .gx-rail {
          position: absolute;
          left: 4%; right: 4%;
          top: 50%;
          height: 3px;
          border-radius: 3px;
          background: var(--paper-3);
        }
        .gx-rail i {
          position: absolute; inset: 0;
          background: var(--acc);
          border-radius: inherit;
          transform-origin: left;
          transition: transform 0.35s var(--ease-out);
        }
        .gx-rail b {
          position: absolute;
          top: 50%;
          width: 16px; height: 16px;
          margin: -8px 0 0 -8px;
          border-radius: 99px;
          background: var(--acc);
          box-shadow: 0 0 0 6px color-mix(in srgb, var(--acc) 25%, transparent);
          transition: left 0.35s var(--ease-out);
        }

        .gx-row {
          position: relative;
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .gx-node {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.45rem 1.1rem 0.45rem 0.45rem;
          border-radius: var(--r-pill);
          background: var(--paper);
          border: 1.5px solid var(--line);
          transition: background 0.45s var(--ease-out), border-color 0.45s, transform 0.6s var(--ease-out);
        }
        .gx-n {
          display: grid; place-items: center;
          width: 2.2rem; height: 2.2rem;
          border-radius: 99px;
          background: var(--paper-3);
          color: var(--ink-3);
          font-size: 0.75rem; font-weight: 600;
          transition: background 0.45s, color 0.45s;
        }
        .gx-t {
          font-family: var(--font-display);
          font-weight: 650;
          font-size: clamp(0.95rem, 1.35vw, 1.25rem);
          letter-spacing: -0.02em;
          color: var(--ink-3);
          transition: color 0.45s;
        }
        .gx-node.is-on { border-color: var(--acc); }
        .gx-node.is-on .gx-n { background: var(--acc); color: var(--acc-ink); }
        .gx-node.is-on .gx-t { color: var(--ink); }
        .gx-node.is-head { background: var(--acc); transform: translateY(-6px) scale(1.08); }
        .gx-node.is-head .gx-t { color: var(--acc-ink); }
        .gx-node.is-head .gx-n { background: var(--acc-ink); color: var(--acc); }

        /* ---- narration ---- */
        .ex-narr {
          display: grid;
          grid-template-columns: 6rem minmax(0, 1fr) auto;
          gap: 1.5rem;
          align-items: start;
          margin-top: clamp(3rem, 9vh, 5rem);
          padding-top: 1.5rem;
          border-top: 1px solid var(--line);
          min-height: 9rem;
        }
        .ex-narr-n { font-size: var(--step-2); font-weight: 600; color: var(--acc); line-height: 1; }
        .ex-narr-n em { font-style: normal; font-size: 0.5em; color: var(--ink-3); }
        .ex-cap { font-size: clamp(1.5rem, 2.8vw, 2.6rem); font-weight: 650; line-height: 1.1; letter-spacing: -0.04em; max-width: 30ch; }
        .ex-narr-sys { color: var(--ink-3); font-size: var(--step--2); white-space: nowrap; padding-top: 0.5rem; }

        .ex-dots { display: flex; gap: 6px; margin-top: 1.5rem; width: 12rem; }
        .ex-dots span { flex: 1; height: 4px; border-radius: 4px; background: var(--paper-3); overflow: hidden; }
        .ex-dots i { display: block; height: 100%; background: var(--acc); transform-origin: left; }

        /* ---- narrow ---- */
        .ex-list { display: grid; gap: 3.5rem; padding-block: 3rem var(--bay); }
        .ex-steps { display: grid; gap: 0.5rem; margin-top: 1.5rem; }
        .ex-steps li {
          display: grid;
          grid-template-columns: 2.4rem minmax(0, 1fr);
          column-gap: 0.75rem;
          padding: 1rem 1.1rem;
          border-radius: var(--r-m);
          background: var(--paper-2);
        }
        .ex-steps .num {
          grid-row: span 2;
          display: grid; place-items: center;
          width: 2.4rem; height: 2.4rem;
          border-radius: 99px;
          background: var(--acc); color: var(--acc-ink);
          font-size: 0.75rem; font-weight: 600;
        }
        .ex-steps strong { font-family: var(--font-display); font-size: var(--step-1); letter-spacing: -0.03em; }
        .ex-steps p { color: var(--ink-2); font-size: var(--step--1); }
      `}</style>
    </section>
  );
};

export default Experience;
