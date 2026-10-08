import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { TransitionLink } from './RouteCurtain';
import { gsap, ScrollTrigger, EASE, heading, reduced, cleanup, fx, fx0 } from '../lib/motion';
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

   Nothing here re-renders on scroll. The node centres are measured
   once (and again on resize or refresh), and the scene's driver calls
   `api.set(pos)` every frame with a float along the stages: the charge
   is placed by interpolating between the two real node centres it sits
   between, and the rail's fill ends exactly under it, so dot, fill and
   nodes can never disagree — scrolling down or back up. Only the head
   index, which changes a handful of times, goes through React.
   ------------------------------------------------------------------ */
const Graph = ({ sys, head, apiRef }) => {
  const rowRef = useRef(null);
  const railRef = useRef(null);
  const fillRef = useRef(null);
  const dotRef = useRef(null);
  const [arc, setArc] = useState(null);
  const centres = useRef([]);
  const last = useRef(0);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = () => {
      const nodes = Array.from(row.querySelectorAll('.gx-node'));
      centres.current = nodes.map((nd) => nd.offsetLeft + nd.offsetWidth / 2);
      const c = centres.current;
      const rail = railRef.current;
      rail.style.left = `${c[0]}px`;
      rail.style.width = `${c[c.length - 1] - c[0]}px`;
      if (sys.loop) {
        const x1 = c[sys.loop[0]] - c[0];
        const x2 = c[sys.loop[1]] - c[0];
        const y = nodes[0].offsetTop - rail.offsetTop;
        setArc({ d: `M${x1} ${y - 4} C ${x1} ${y - 70}, ${x2} ${y - 70}, ${x2} ${y - 4}`, w: c[c.length - 1] - c[0] });
      } else setArc(null);
      set(last.current);
    };
    const set = (pos) => {
      last.current = pos;
      const c = centres.current;
      if (!c.length) return;
      const n = c.length;
      const p = gsap.utils.clamp(0, n - 1, pos);
      const i = Math.min(n - 2, Math.floor(p));
      const x = c[i] + (c[i + 1] - c[i]) * (p - i) - c[0];
      const span = c[n - 1] - c[0] || 1;
      fillRef.current.style.transform = `scaleX(${x / span})`;
      dotRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
    };
    apiRef.current = { set, measure };
    measure();
    window.addEventListener('resize', measure);
    ScrollTrigger.addEventListener('refresh', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ScrollTrigger.removeEventListener('refresh', measure);
    };
  }, [sys, apiRef]);

  const loopLit = sys.loop && head >= sys.loop[0];

  return (
    <div className="gx" ref={rowRef}>
      <span className="gx-rail" ref={railRef} aria-hidden="true">
        {arc && (
          <svg className={`gx-arc${loopLit ? ' is-on' : ''}`} width={arc.w} height="1" aria-hidden="true">
            <path d={arc.d} pathLength="1" />
            <path d={arc.d} pathLength="1" className="gx-arc-run" />
          </svg>
        )}
        <i ref={fillRef} />
        <b ref={dotRef} />
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

/* The narration: one line, the current stage's. The old line blurs
   off upwards and the new one resolves out of a blur from below. */
const Caption = ({ text, id }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (reduced() || !ref.current) return;
    gsap.fromTo(ref.current,
      { yPercent: 40, opacity: 0, ...fx(10) },
      { yPercent: 0, opacity: 1, ...fx0(), duration: 0.6, ease: EASE.swift, overwrite: true });
  }, [id]);
  return <p className="ex-cap display" ref={ref} aria-live="polite">{text}</p>;
};

const Scene = ({ sys, head, apiRef }) => {
  const n = sys.stages.length;
  return (
    <div className="ex-sys" key={sys.id}>
      <div className="ex-sys-top">
        <div>
          <span className="mono ex-sys-sub">{sys.sub}</span>
          <h3 className="display ex-sys-name">{sys.name}</h3>
        </div>
        <p className="ex-sys-lead">{sys.lead}</p>
      </div>

      <Graph sys={sys} head={head} apiRef={apiRef} />

      <div className="ex-narr">
        <span className="num ex-narr-n">
          {String(head + 1).padStart(2, '0')}<em>/{String(n).padStart(2, '0')}</em>
        </span>
        <Caption text={sys.stages[head].c} id={`${sys.id}-${head}`} />
      </div>
    </div>
  );
};

const Experience = () => {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const sceneRef = useRef(null);
  const apiRef = useRef(null);
  const barRef = useRef(null);
  const [wide, setWide] = useState(() => typeof window !== 'undefined'
    && window.matchMedia('(min-width: 961px)').matches && !reduced());
  const [head, setHead] = useState(0);
  const [done, setDone] = useState(false);
  const [sel, setSel] = useState(0);
  const stRef = useRef(null);
  const selRef = useRef(0);
  selRef.current = sel;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 961px)');
    const on = () => setWide(mq.matches && !reduced());
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => cleanup([heading(headRef.current)]), []);

  /* The scene pins while one graph runs, with a short dwell at its end
     so the last stage is read. The scrub's own smoothing carries the
     charge, so it glides the same way in both directions; the second
     system is offered at the end, never forced. */
  useEffect(() => {
    if (!wide) return undefined;
    const drive = { p: 0 };
    const apply = () => {
      const sys = SYSTEMS[selRef.current];
      const n = sys.stages.length;
      const local = Math.min(1, drive.p / 0.85);
      const pos = local * (n - 1);
      apiRef.current?.set(pos);
      if (barRef.current) barRef.current.style.transform = `scaleX(${local})`;
      const h = Math.min(n - 1, Math.floor(pos + 0.05));
      setHead((o) => (o === h ? o : h));
      const d = local > 0.8;
      setDone((o) => (o === d ? o : d));
    };
    const tween = gsap.to(drive, {
      p: 1,
      ease: 'none',
      onUpdate: apply,
      scrollTrigger: {
        trigger: sceneRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * 1.9}`,
        pin: true,
        scrub: 0.5,
      },
    });
    stRef.current = tween.scrollTrigger;
    apply();
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, [wide]);

  const sys = SYSTEMS[sel];

  const choose = (k) => {
    if (k === sel) return;
    const st = stRef.current;
    const inner = sceneRef.current?.querySelector('.ex-sys');
    const swap = () => {
      setSel(k);
      setHead(0);
      setDone(false);
      const y = st ? st.start + 2 : 0;
      if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
      ScrollTrigger.update();
      const next = sceneRef.current?.querySelector('.ex-sys');
      if (next && !reduced()) gsap.fromTo(next, { opacity: 0, y: 30, ...fx(12) }, { opacity: 1, y: 0, ...fx0(), duration: 0.7, ease: EASE.swift });
    };
    if (!inner || reduced()) { swap(); return; }
    gsap.to(inner, { opacity: 0, y: -30, ...fx(12), duration: 0.35, ease: 'power2.in', onComplete: swap });
  };

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
          <TransitionLink to="/experience/pmo" title="Two graphs" kicker="Emerson · PMO AI/ML" className="ex-more" data-cursor-label="Architecture">
            Full architecture <ArrowUpRight size={16} strokeWidth={2.4} />
          </TransitionLink>
        </div>
      </div>

      {wide ? (
        <div className="ex-pin" ref={sceneRef}>
          <div className="shell ex-pin-in">
            <Scene sys={sys} head={head} apiRef={apiRef} />

            {/* One control, on the same grid as the narration above it:
                both systems as segments of a single switch. The one
                being run fills as you scroll it; once it has been read
                the other segment lights up as the way on. */}
            <div className={`ex-offer${done ? ' is-ready' : ''}`}>
              <span className="num ex-offer-k">{sel + 1}<em>/{SYSTEMS.length}</em></span>
              <div className="ex-switch" role="tablist" aria-label="Systems">
                {SYSTEMS.map((x, i) => (
                  <button
                    key={x.id}
                    type="button"
                    role="tab"
                    aria-selected={i === sel}
                    className={`ex-seg${i === sel ? ' is-on' : ' is-other'}`}
                    onClick={() => choose(i)}
                    data-cursor-label={i === sel ? 'Running' : 'Run it'}
                  >
                    <span className="num ex-seg-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="ex-seg-t">{x.name}</span>
                    {i === sel
                      ? <span className="ex-seg-bar" aria-hidden="true"><i ref={barRef} /></span>
                      : <ArrowRight className="ex-seg-go" size={17} strokeWidth={2.6} />}
                  </button>
                ))}
              </div>
              <span className="ex-offer-hint">
                {sel === 0 ? 'The second system is optional — keep scrolling to skip it.' : 'Back to the first any time.'}
              </span>
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
        .gx-rail {
          position: absolute;
          top: 50%;
          height: 3px;
          margin-top: -1.5px;
          border-radius: 3px;
          background: var(--paper-3);
        }
        .gx-arc { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
        .gx-arc path { fill: none; stroke: var(--line); stroke-width: 2; stroke-dasharray: 0.012 0.012; transition: stroke 0.4s; }
        .gx-arc .gx-arc-run { stroke: var(--acc); stroke-dasharray: 0.1 0.9; stroke-dashoffset: 1; opacity: 0; }
        .gx-arc.is-on path:first-child { stroke: var(--acc); }
        .gx-arc.is-on .gx-arc-run { opacity: 1; stroke-width: 4; stroke-linecap: round; animation: gx-run 1.2s linear infinite; }
        @keyframes gx-run { to { stroke-dashoffset: 0; } }
        .gx-rail i {
          position: absolute; inset: 0;
          background: var(--acc);
          border-radius: inherit;
          transform-origin: left;
          transform: scaleX(0);
        }
        /* The charge sits under the nodes, so it slides behind each one
           it reaches instead of over its label. */
        .gx-rail b {
          position: absolute;
          left: -8px; top: 50%;
          width: 16px; height: 16px;
          margin-top: -8px;
          border-radius: 99px;
          background: var(--acc);
          box-shadow: 0 0 0 6px color-mix(in srgb, var(--acc) 25%, transparent);
          will-change: transform;
        }

        .gx-row {
          position: relative;
          z-index: 1;
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
          grid-template-columns: 6rem minmax(0, 1fr);
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

        /* The switch shares the narration's columns: number, body, aside. */
        .ex-offer {
          display: grid;
          grid-template-columns: 6rem minmax(0, 1fr) auto;
          gap: 1.5rem;
          align-items: center;
          margin-top: 1.25rem;
        }
        .ex-offer-k { font-size: var(--step-0); font-weight: 600; color: var(--ink-3); }
        .ex-offer-k em { font-style: normal; opacity: 0.6; }
        .ex-switch {
          justify-self: start;
          display: inline-flex;
          gap: 4px;
          padding: 4px;
          border-radius: var(--r-pill);
          background: var(--paper-2);
          box-shadow: inset 0 1px 2px var(--shadow);
        }
        .ex-seg {
          position: relative;
          display: inline-flex; align-items: center; gap: 0.6rem;
          height: 3rem;
          padding: 0 1.2rem 0 0.4rem;
          border-radius: var(--r-pill);
          color: var(--ink-3);
          font-family: var(--font-display); font-weight: 650; font-size: var(--step-0); letter-spacing: -0.02em;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.45s var(--ease-out), color 0.45s var(--ease-out), box-shadow 0.45s var(--ease-out);
        }
        .ex-seg-n {
          display: grid; place-items: center;
          width: 2.2rem; height: 2.2rem; border-radius: 99px;
          background: var(--paper-3); color: var(--ink-3);
          font-family: var(--font-body); font-size: 0.72rem;
          transition: background 0.45s, color 0.45s;
        }
        .ex-seg.is-on { background: var(--paper); color: var(--ink); box-shadow: 0 1px 2px var(--shadow), 0 6px 16px -8px var(--shadow); }
        .ex-seg.is-on .ex-seg-n { background: var(--acc); color: var(--acc-ink); }
        .ex-seg-bar { position: absolute; left: 3.2rem; right: 1.2rem; bottom: 6px; height: 3px; border-radius: 3px; background: var(--paper-3); overflow: hidden; }
        .ex-seg-bar i { display: block; height: 100%; background: var(--acc); transform-origin: left; transform: scaleX(0); }
        .ex-seg-go { transition: transform 0.4s var(--ease-out); }
        .ex-seg.is-other:hover { color: var(--ink); }
        .ex-seg.is-other:hover .ex-seg-go { transform: translateX(4px); }
        .ex-offer.is-ready .ex-seg.is-other { background: var(--acc); color: var(--acc-ink); }
        .ex-offer.is-ready .ex-seg.is-other .ex-seg-n { background: var(--acc-ink); color: var(--acc); }
        .ex-offer.is-ready .ex-seg.is-other .ex-seg-go { animation: ex-nudge 2.4s var(--ease-in-out) 0.4s infinite; }
        @keyframes ex-nudge { 0%, 70%, 100% { transform: translateX(0); } 80% { transform: translateX(5px); } 90% { transform: translateX(-2px); } }
        .ex-offer-hint { color: var(--ink-3); font-size: var(--step--1); text-align: right; max-width: 22ch; line-height: 1.35; }

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
