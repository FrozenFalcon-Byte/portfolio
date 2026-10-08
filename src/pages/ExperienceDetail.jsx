import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowDown } from 'lucide-react';
import { TransitionLink } from '../components/RouteCurtain';
import { gsap, ScrollTrigger, heading, marquee, reduced, cleanup } from '../lib/motion';
import Glyph from '../components/Glyph';

/* This page is deliberately shallow on content and deep on structure.
   The work is Emerson's; the architecture is the part that is mine to
   show, so the page shows the graphs and nothing that sits inside them —
   no queries, no columns, no business questions, no numbers.

   Layout: each system is a chapter whose diagram stays pinned on the
   left while its notes scroll past on the right. The note being read
   lights up the nodes it is talking about, so the text and the picture
   are always pointing at the same thing. */

const FOOTPRINT = [
  'LangGraph', 'LangChain', 'Azure OpenAI', 'FastAPI', 'Server-sent events',
  'Azure SQL', 'Azure PostgreSQL', 'sqlglot', 'TimeGPT', 'React', 'TypeScript',
  'Azure App Service',
];

const POR_NOTES = [
  {
    k: 'One graph, two products',
    hl: ['POR module', 'PPR module', 'Config-driven loader'],
    v: 'Each reporting module declares what it needs in configuration and the loader assembles the graph at runtime. The shared agent code has no branch for either product, which is what stopped the two from drifting apart.',
  },
  {
    k: 'Agents with one job each',
    hl: ['Extraction agent', 'SQL agent'],
    v: 'Extraction turns documents into structure. The SQL agent answers against the warehouse. Neither carries the other’s failure modes, so either can be replaced without touching the rest of the graph.',
  },
  {
    k: 'Failure is a state, not an exception',
    hl: ['Validator', 'SQL agent'],
    v: 'The validator is allowed to send work back. Because the retry loop is a node rather than a try/except, a bad generation is corrected inside the run instead of surfacing as an error.',
  },
];

const SNOP_NOTES = [
  {
    k: 'Intent before SQL',
    hl: ['Intent', 'Router'],
    v: 'The question is reduced to a typed intent before any query exists. Everything downstream operates on that structure, which is what makes the rest of the graph deterministic enough to test.',
  },
  {
    k: 'Checked before it runs',
    hl: ['SQL gen', 'AST check'],
    v: 'Generation and execution are separate stages with a parser between them. The query is validated at the level of its syntax tree, so structural faults are caught before the database is ever touched.',
  },
  {
    k: 'Streamed, not awaited',
    hl: ['Output agent', 'Stream'],
    v: 'Answers arrive over server-sent events as they are produced, so a long-running stage reads as progress in the interface rather than as a spinner.',
  },
  {
    k: 'Forecasting beside retrieval',
    hl: ['Orchestrator', 'Planner'],
    v: 'Demand and resource forecasting run on TimeGPT, benchmarked against classical SARIMA and SARIMAX baselines rather than adopted on faith.',
  },
];

/* ------------------------------------------------------------------
   Diagram plumbing.

   Paths carry pathLength="1" so a single dashoffset tween draws any of
   them regardless of real length. A second copy of each path, dashed
   short, carries a charge along the same route once drawn — which is
   how the picture says "pipeline" without a legend.

   Nodes sit on a soft contact shadow (an SVG drop shadow with a wide,
   faint spread) so the board reads as objects resting on a surface;
   a lit node lifts and its shadow opens up with it.
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
      gsap.set(root.querySelectorAll('.dg-socket'), { opacity: 1 });
      return undefined;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top 80%', once: true },
    });

    tl.fromTo(boxes, { opacity: 0, y: 18 }, {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'swift',
    })
      .fromTo(lines, { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, duration: 0.7, stagger: 0.05, ease: 'glide',
      }, 0.25)
      .fromTo(root.querySelectorAll('.dg-socket'), { opacity: 0 }, {
        opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out',
      }, 0.6);

    // The charge keeps running after the draw, on its own clock.
    const charge = gsap.fromTo(
      pulses,
      { strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        duration: 1.8,
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

const Shadows = ({ id }) => (
  <defs>
    <filter id={`${id}-ao`} x="-30%" y="-40%" width="160%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.10" />
      <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#000" floodOpacity="0.10" />
    </filter>
    <filter id={`${id}-lift`} x="-40%" y="-60%" width="180%" height="240%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.14" />
      <feDropShadow dx="0" dy="22" stdDeviation="16" floodColor="#000" floodOpacity="0.22" />
    </filter>
  </defs>
);

const Node = ({ x, y, w, label, strong, hl, id }) => {
  const on = hl?.includes(label);
  const h = strong ? 56 : 46;
  return (
    <g className={`dg-box${on ? ' is-hl' : ''}`}>
      <g className="dg-lift" style={{ transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}>
        <rect
          x={x} y={y} width={w} height={h} rx={h / 2}
          className={strong ? 'dg-rect dg-rect--strong' : 'dg-rect'}
          filter={`url(#${id}-${on ? 'lift' : 'ao'})`}
        />
        <text x={x + w / 2} y={y + (strong ? 34 : 29)} className="dg-label" textAnchor="middle">{label}</text>
      </g>
    </g>
  );
};

/* Edges are written as orthogonal routes ("M x y V y H x ...") and
   drawn with every elbow rounded, so the wiring reads as one cable
   bending rather than lines meeting at corners. The end gets a small
   socket where it plugs into the next node. */
const R = 14;
const route = (d) => {
  const pts = [];
  let x = 0; let y = 0;
  d.trim().split(/\s+(?=[MVH])/).forEach((tok) => {
    const c = tok[0];
    const v = tok.slice(1).trim().split(/\s+/).map(Number);
    if (c === 'M') { [x, y] = v; } else if (c === 'V') { [y] = v; } else { [x] = v; }
    pts.push([x, y]);
  });
  let out = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const [ax, ay] = pts[i - 1]; const [bx, by] = pts[i]; const [cx, cy] = pts[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay); const l2 = Math.hypot(cx - bx, cy - by);
    const r = Math.min(R, l1 / 2, l2 / 2);
    const p1 = [bx - ((bx - ax) / l1) * r, by - ((by - ay) / l1) * r];
    const p2 = [bx + ((cx - bx) / l2) * r, by + ((cy - by) / l2) * r];
    out += ` L${p1[0]} ${p1[1]} Q${bx} ${by} ${p2[0]} ${p2[1]}`;
  }
  const end = pts[pts.length - 1];
  return { d: `${out} L${end[0]} ${end[1]}`, end };
};

const Edge = ({ d }) => {
  const { d: path, end } = route(d);
  return (
    <>
      <path d={path} className="dg-line" pathLength="1" />
      <path d={path} className="dg-pulse" pathLength="1" />
      <circle cx={end[0]} cy={end[1]} r="4" className="dg-socket" />
    </>
  );
};

const CommandCentreDiagram = ({ hl }) => {
  const ref = useRef(null);
  useDiagram(ref);
  const n = { hl, id: 'por' };

  return (
    <div className="dg" ref={ref}>
      <svg viewBox="90 10 820 600" role="img" aria-label="Architecture of the PMO Command Centre: two configuration modules feed a config-driven loader, which assembles one shared agent graph; the graph fans out to an extraction agent and a SQL agent, both of which report to a validator that can send work back to the SQL agent before a report is produced.">
        <Shadows id="por" />
        <Edge d="M260 74 V101 H460 V128" />
        <Edge d="M660 74 V101 H460 V128" />
        <Edge d="M460 174 V228" />
        <Edge d="M460 284 V321 H230 V358" />
        <Edge d="M460 284 V321 H690 V358" />
        <Edge d="M230 404 V440 H460 V468" />
        <Edge d="M690 404 V440 H460 V468" />
        <Edge d="M460 514 V558" />
        <Edge d="M580 491 H870 V381 H810" />

        <Node {...n} x={150} y={28} w={220} label="POR module" />
        <Node {...n} x={550} y={28} w={220} label="PPR module" />
        <Node {...n} x={310} y={128} w={300} label="Config-driven loader" />
        <Node {...n} x={260} y={228} w={400} label="Shared agent graph" strong />
        <Node {...n} x={110} y={358} w={240} label="Extraction agent" />
        <Node {...n} x={570} y={358} w={240} label="SQL agent" />
        <Node {...n} x={340} y={468} w={240} label="Validator" />
        <Node {...n} x={370} y={558} w={180} label="Report" />

        <text x={886} y={436} className="dg-note" textAnchor="middle" transform="rotate(90 886 436)">
          self-correcting retry
        </text>
      </svg>
    </div>
  );
};

const SnopDiagram = ({ hl }) => {
  const ref = useRef(null);
  useDiagram(ref);
  const n = { hl, id: 'snop' };

  return (
    <div className="dg" ref={ref}>
      <svg viewBox="0 0 920 410" role="img" aria-label="Architecture of the S&OP agent: a question passes through a guardrail, a conversation router and intent extraction, then an orchestrator, planner, SQL generator and an abstract-syntax-tree validator, before an executor, an output agent and a streamed response.">
        <Shadows id="snop" />
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

        <Node {...n} x={20} y={40} w={150} label="Question" />
        <Node {...n} x={230} y={40} w={150} label="Guardrail" />
        <Node {...n} x={440} y={40} w={150} label="Router" />
        <Node {...n} x={650} y={40} w={150} label="Intent" />

        <Node {...n} x={650} y={190} w={150} label="Orchestrator" />
        <Node {...n} x={440} y={190} w={150} label="Planner" />
        <Node {...n} x={230} y={190} w={150} label="SQL gen" />
        <Node {...n} x={20} y={190} w={150} label="AST check" />

        <Node {...n} x={20} y={340} w={150} label="Executor" />
        <Node {...n} x={230} y={340} w={150} label="Output agent" />
        <Node {...n} x={440} y={340} w={150} label="Stream" strong />
      </svg>
    </div>
  );
};

/* Arrivals come in out of focus and sharpen as they settle — a motion
   blur along the direction of travel, faked with a filter tween. */
const blurIn = (targets, trigger, opts = {}) => {
  if (!targets || reduced()) return null;
  const t = gsap.fromTo(targets,
    { opacity: 0, y: opts.y ?? 50, filter: 'blur(12px)' },
    {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 1, ease: 'swift', stagger: opts.stagger ?? 0.08,
      clearProps: 'filter',
      scrollTrigger: { trigger, start: opts.start ?? 'top 85%', once: true },
    });
  return () => { t.scrollTrigger?.kill(); t.kill(); };
};

const Chapter = ({ id, n, name, sub, lead, notes, Diagram, acc }) => {
  const nameRef = useRef(null);
  const headRef = useRef(null);
  const notesRef = useRef(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const items = Array.from(notesRef.current.children);
    const triggers = items.map((el, i) => ScrollTrigger.create({
      trigger: el,
      start: 'top 62%',
      end: 'bottom 62%',
      onToggle: (self) => {
        if (self.isActive) setActive(i);
        else if (i === 0 && self.direction < 0) setActive(-1);
      },
    }));
    const fns = [
      heading(nameRef.current),
      blurIn(headRef.current?.querySelectorAll('.cs-ch-sub, .cs-ch-lead'), headRef.current, { stagger: 0.1, y: 30 }),
      ...items.map((el) => blurIn(el, el, { start: 'top 88%' })),
      () => triggers.forEach((t) => t.kill()),
    ];
    return cleanup(fns);
  }, []);

  const hl = active >= 0 ? notes[active].hl : null;

  return (
    <section id={id} className="block cs-ch" data-acc={acc}>
      <div className="shell">
        <header className="cs-ch-head" ref={headRef}>
          <span className="cs-ch-n display">{n}</span>
          <h2 ref={nameRef} className="display cs-ch-name"><span className="ln"><span className="ln-in">{name}</span></span></h2>
          <span className="cs-ch-sub">{sub}</span>
          <p className="lead cs-ch-lead">{lead}</p>
        </header>

        <div className="cs-ch-body">
          <div className="cs-ch-stage">
            <div className="cs-ch-pin">
              <Diagram hl={hl} />
              <div className="cs-ch-read" aria-hidden="true">
                <span className="cs-ch-dots">
                  {notes.map((x, i) => <i key={x.k} className={i === active ? 'is-on' : i < active ? 'is-past' : ''} />)}
                </span>
                <span className="cs-ch-now">{active >= 0 ? notes[active].k : 'Scroll the notes'}</span>
              </div>
            </div>
          </div>

          <ol className="cs-notes" ref={notesRef}>
            {notes.map((x, i) => (
              <li key={x.k} className={`cs-note${i === active ? ' is-on' : ''}`}>
                <div className="cs-note-in">
                  <span className="cs-note-n display">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="cs-note-k">{x.k}</h3>
                  <p className="body cs-note-v">{x.v}</p>
                  <span className="cs-note-hl">
                    {x.hl.map((h) => <span key={h}>{h}</span>)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

const CHAPTERS = [
  {
    id: 'por',
    n: '01',
    acc: 'blue',
    name: 'PMO Command Centre',
    sub: 'POR / PPR · one agent graph serving two reporting products',
    lead: 'Two reporting products had grown two codebases that did nearly the same thing. Rebuilding them as one configurable graph removed the duplication without flattening the differences between them.',
    notes: POR_NOTES,
    Diagram: CommandCentreDiagram,
  },
  {
    id: 'snop',
    n: '02',
    acc: 'pink',
    name: 'S&OP Agent',
    sub: 'Sales & Operations Planning · natural language to validated SQL',
    lead: 'A planning question in plain English, turned into a query that has been checked before it runs, and answered with the reasoning attached rather than a bare number.',
    notes: SNOP_NOTES,
    Diagram: SnopDiagram,
  },
];

const ExperienceDetail = () => {
  const headRef = useRef(null);
  const heroRef = useRef(null);
  const runRef = useRef(null);
  const footRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const fns = [
      heading(headRef.current, { start: 'top 98%' }),
      marquee(runRef.current, { speed: 46 }),
      blurIn(footRef.current?.children, footRef.current, { stagger: 0.08, y: 30 }),
    ];
    if (!reduced()) {
      // The hero panel arrives as the curtain lifts: it rises out of a
      // blur and settles onto its shadow.
      const t = gsap.fromTo(hero.querySelectorAll('.cs-hero-rise'),
        { opacity: 0, y: 40, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.08, ease: 'swift', delay: 0.35, clearProps: 'filter' });
      fns.push(() => t.kill());
    }
    return cleanup(fns);
  }, []);

  return (
    <article className="cs">
      <header className="cs-hero" ref={heroRef}>
        <div className="cs-hero-panel" data-surface="ink" data-acc="blue">
          <div className="cs-hero-top cs-hero-rise">
            <TransitionLink to="/#experience" title="Back to the work" kicker="Ajinkya Chavan · Portfolio" className="cs-back">
              <ArrowLeft size={15} strokeWidth={2.4} />
              <span>Back to portfolio</span>
            </TransitionLink>
            <span className="cs-dates">Emerson · PMO AI/ML · Dec 2025 — Present</span>
          </div>

          <h1 ref={headRef} className="display display--hero cs-title">
            <span className="ln"><span className="ln-in">Two graphs<Glyph kind="graph" acc="blue" /></span></span>
            <span className="ln"><span className="ln-in">one footprint.</span></span>
          </h1>

          <div className="cs-hero-foot">
            <p className="lead cs-standfirst cs-hero-rise">
              Two multi-agent systems built inside the same internship, on the same
              Azure stack and the same agent conventions. What follows is the shape
              of each one — the nodes, the edges and the decisions behind them.
              The data they run on stays where it belongs.
            </p>

            <nav className="cs-index" aria-label="Systems on this page">
              {CHAPTERS.map((c) => (
                <a key={c.id} href={`#${c.id}`} className="cs-index-row cs-hero-rise" data-acc={c.acc}
                  onClick={(e) => { e.preventDefault(); const el = document.getElementById(c.id); if (window.lenis) window.lenis.scrollTo(el, { offset: -40 }); else el.scrollIntoView(); }}>
                  <span className="cs-index-n">{c.n}</span>
                  <span className="cs-index-name">{c.name}</span>
                  <span className="cs-index-go"><ArrowDown size={16} strokeWidth={2.4} /></span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="cs-run-wrap" aria-label="Stack across both systems">
          <div className="cs-run" ref={runRef}>
            {[0, 1].map((k) => (
              <span className="cs-run-set" key={k} aria-hidden={k === 1}>
                {FOOTPRINT.map((t) => <span key={t} className="cs-run-w">{t}<i /></span>)}
              </span>
            ))}
          </div>
        </div>
      </header>

      {CHAPTERS.map((c) => <Chapter key={c.id} {...c} />)}

      <footer className="block cs-foot" data-surface="ink" data-acc="yellow">
        <div className="shell cs-foot-in" ref={footRef}>
          <h2 className="display display--m cs-foot-head">
            The architecture travels;<br />the data does not.
          </h2>
          <p className="body cs-foot-note">
            Everything above is structure: how the graphs are composed, where
            validation sits, and what happens when a generation is wrong. The
            queries, the schema and the business content stay inside Emerson.
          </p>
          <TransitionLink to="/#experience" title="Back to the work" kicker="Ajinkya Chavan · Portfolio" className="btn btn--acc cs-foot-cta">
            Back to portfolio
            <ArrowLeft size={17} strokeWidth={2.4} className="arrow" />
          </TransitionLink>
        </div>
      </footer>

      <style>{`
        .cs { display: block; }

        /* ---- hero: an ink panel resting on the page ---- */
        .cs-hero { padding: clamp(5.5rem, 13vh, 7.5rem) clamp(0.6rem, 1.4vw, 1.25rem) 0; }
        .cs-hero-panel {
          position: relative;
          display: grid;
          gap: clamp(2rem, 6vh, 4rem);
          padding: clamp(1.4rem, 3.4vw, 3.5rem);
          border-radius: var(--r-xl);
          background: var(--paper);
          color: var(--ink);
          /* contact shadow: tight and dark at the base, wide and faint
             around it — the panel sits on the page rather than in it */
          box-shadow: 0 1px 2px rgba(0,0,0,0.18), 0 12px 24px -6px rgba(0,0,0,0.22), 0 40px 90px -20px rgba(0,0,0,0.35);
        }
        .cs-hero-top { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .cs-back {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 1rem 0.6rem 0.8rem;
          border-radius: 99px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: var(--step--1); font-weight: 500;
          transition: gap 0.35s var(--ease-out), background 0.35s;
        }
        .cs-back:hover { gap: 0.8rem; background: var(--acc); color: var(--acc-ink); }
        .cs-dates { color: var(--ink-3); font-size: var(--step--1); }
        .cs-title { margin: 0; font-size: clamp(2.3rem, 10.5vw, 9.5rem); line-height: 0.92; overflow-wrap: normal; word-break: keep-all; hyphens: none; }
        .cs-hero-foot {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(1.5rem, 5vw, 5rem);
          align-items: end;
        }
        .cs-standfirst { max-width: 46ch; color: var(--ink-2); }
        .cs-index { display: grid; gap: 0.5rem; }
        .cs-index-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 0.9rem 0.9rem 1.2rem;
          border-radius: var(--r-l);
          background: var(--paper-2);
          color: var(--ink);
          transition: background 0.4s var(--ease-out), transform 0.5s var(--ease-out), box-shadow 0.5s var(--ease-out);
        }
        .cs-index-n { color: var(--ink-3); font-size: var(--step--1); font-weight: 600; }
        .cs-index-name { font-family: var(--font-display); font-weight: 700; font-size: var(--step-1); letter-spacing: -0.03em; }
        .cs-index-go {
          display: grid; place-items: center;
          width: 2.4rem; height: 2.4rem; border-radius: 99px;
          background: var(--acc); color: var(--acc-ink);
          transition: transform 0.5s var(--ease-out);
        }
        .cs-index-row:hover { background: var(--paper-3); transform: translateY(-3px); box-shadow: 0 14px 30px -12px rgba(0,0,0,0.45); }
        .cs-index-row:hover .cs-index-go { transform: translateY(3px) scale(1.08); }

        /* ---- footprint run ---- */
        .cs-run-wrap { overflow: hidden; margin-top: clamp(1.5rem, 4vh, 2.5rem); }
        .cs-run { display: flex; width: max-content; will-change: transform; }
        .cs-run-set { display: flex; flex: none; }
        .cs-run-w {
          display: inline-flex; align-items: center; gap: clamp(1rem, 2.5vw, 2rem);
          padding-right: clamp(1rem, 2.5vw, 2rem);
          font-family: var(--font-display); font-weight: 700;
          font-size: clamp(1.6rem, 3.6vw, 3rem); letter-spacing: -0.04em;
          color: var(--ink); white-space: nowrap;
        }
        .cs-run-w i { width: 0.32em; height: 0.32em; border-radius: 99px; background: var(--blue); }
        .cs-run-w:nth-child(3n+2) i { background: var(--pink); }
        .cs-run-w:nth-child(3n) i { background: var(--yellow); }

        /* ---- chapters ---- */
        .cs-ch-head {
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: clamp(1rem, 3vw, 2.5rem);
          row-gap: 0.4rem;
          align-items: end;
        }
        .cs-ch-n {
          grid-row: 1 / span 2;
          align-self: start;
          font-size: clamp(4rem, 13vw, 12rem);
          line-height: 0.8;
          letter-spacing: -0.07em;
          color: var(--acc);
        }
        .cs-ch-name { margin: 0; font-size: clamp(2.2rem, 6.4vw, 5.8rem); letter-spacing: -0.055em; line-height: 0.95; }
        .cs-ch-sub { color: var(--ink-2); font-size: var(--step-0); }
        .cs-ch-lead { grid-column: 2; max-width: 52ch; margin-top: clamp(1rem, 3vh, 1.75rem); font-size: var(--step-1); line-height: 1.4; letter-spacing: -0.015em; }

        .cs-ch-body {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
          gap: clamp(1.5rem, 4vw, 4.5rem);
          margin-top: clamp(2.5rem, 7vh, 4.5rem);
        }
        .cs-ch-pin { position: sticky; top: clamp(5.5rem, 12vh, 7rem); }

        /* ---- diagram ---- */
        .dg {
          padding: clamp(1rem, 2.6vw, 2.25rem);
          border-radius: var(--r-xl);
          background: var(--paper-2);
          /* the board is a recessed tray, occluded at its top edge */
          box-shadow: inset 0 0 0 1px var(--line-2), inset 0 10px 22px -12px rgba(0,0,0,0.22);
        }
        .dg svg { display: block; width: 100%; height: auto; max-height: 70vh; overflow: visible; }
        .dg-box { cursor: default; }
        .dg-lift { transition: transform 0.6s var(--ease-out); }
        .dg-rect { fill: var(--paper); stroke: var(--line); stroke-width: 1.5; transition: fill 0.45s var(--ease-out), stroke 0.45s; }
        .dg-rect--strong { fill: var(--ink); stroke: var(--ink); }
        .dg-rect--strong + .dg-label { fill: var(--paper); font-weight: 700; }
        .dg-label { fill: var(--ink); font-family: var(--font-display); font-weight: 600; font-size: 16px; letter-spacing: -0.02em; transition: fill 0.45s; }
        .dg-box.is-hl .dg-lift { transform: translateY(-4px) scale(1.03); }
        .dg-box.is-hl .dg-rect { fill: var(--acc); stroke: var(--acc); }
        .dg-box.is-hl .dg-label { fill: var(--acc-ink); font-weight: 700; }
        .dg-note { fill: var(--ink-3); font-family: var(--font-body); font-weight: 600; font-size: 12px; letter-spacing: 0.02em; }
        .dg-line { fill: none; stroke: var(--ink-3); stroke-width: 1.75; stroke-dasharray: 1; opacity: 0.55; stroke-linecap: round; }
        .dg-socket { fill: var(--paper-2); stroke: var(--ink-3); stroke-width: 1.75; }
        /* A bead riding the same cable — the charge. */
        .dg-pulse { fill: none; stroke: var(--acc); stroke-width: 7; stroke-linecap: round; stroke-dasharray: 0 1; }

        .cs-ch-read { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; padding-inline: 0.5rem; }
        .cs-ch-dots { display: flex; gap: 0.35rem; }
        .cs-ch-dots i { width: 8px; height: 8px; border-radius: 99px; background: var(--paper-3); transition: width 0.5s var(--ease-out), background 0.4s; }
        .cs-ch-dots i.is-past { background: var(--ink-3); }
        .cs-ch-dots i.is-on { width: 28px; background: var(--acc); }
        .cs-ch-now { color: var(--ink-2); font-size: var(--step--1); font-weight: 500; }

        /* ---- notes ---- */
        .cs-notes { display: grid; padding-bottom: 18vh; }
        .cs-note { min-height: 62vh; display: flex; align-items: center; }
        .cs-note:first-child { min-height: 48vh; align-items: flex-start; }
        .cs-note-in {
          display: grid; gap: 0.9rem;
          opacity: 0.32;
          transition: opacity 0.6s var(--ease-out);
        }
        .cs-note.is-on .cs-note-in { opacity: 1; }
        .cs-note-n { font-size: clamp(3rem, 6vw, 5.5rem); line-height: 0.85; letter-spacing: -0.06em; color: var(--ink-3); transition: color 0.5s; }
        .cs-note.is-on .cs-note-n { color: var(--acc); }
        .cs-note-k { font-family: var(--font-display); font-size: var(--step-2); font-weight: 700; letter-spacing: -0.04em; line-height: 1.05; }
        .cs-note-v { color: var(--ink-2); line-height: 1.65; max-width: 44ch; }
        .cs-note-hl { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .cs-note-hl span {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.4rem 0.8rem 0.4rem 0.6rem;
          border-radius: 99px;
          background: var(--paper-2);
          font-size: var(--step--1); font-weight: 500;
        }
        .cs-note-hl span::before { content: ''; width: 7px; height: 7px; border-radius: 99px; background: var(--acc); }

        /* ---- foot ---- */
        .cs-foot { margin-top: var(--bay); padding-block: clamp(4rem, 11vh, 7rem); border-radius: var(--r-xl) var(--r-xl) 0 0; background: var(--paper); color: var(--ink); }
        .cs-foot-in { display: flex; flex-direction: column; align-items: flex-start; gap: 1.25rem; }
        .cs-foot-head { margin: 0; letter-spacing: -0.045em; }
        .cs-foot-note { max-width: 54ch; color: var(--ink-2); }
        .cs-foot-cta { margin-top: 0.75rem; }

        @media (max-width: 900px) {
          .cs-hero-foot { grid-template-columns: 1fr; }
          .cs-ch-head { grid-template-columns: 1fr; }
          .cs-ch-n { grid-row: auto; font-size: clamp(3.5rem, 18vw, 6rem); }
          .cs-ch-lead { grid-column: 1; }
          .cs-ch-body { grid-template-columns: 1fr; }
          /* the stage dissolves so the pin sticks against the whole
             chapter body, not just its own box */
          .cs-ch-stage { display: contents; }
          .cs-ch-pin { position: sticky; top: 4.75rem; z-index: 2; padding-bottom: 0.75rem; background: var(--paper); box-shadow: 0 18px 24px -18px rgba(0,0,0,0.25); border-radius: 0 0 var(--r-l) var(--r-l); }
          .dg { overflow-x: auto; overscroll-behavior-x: contain; }
          .dg svg { min-width: 600px; max-height: none; }
          .cs-note, .cs-note:first-child { min-height: 46vh; align-items: flex-start; }
          .cs-notes { padding-bottom: 0; }
        }
      `}</style>
    </article>
  );
};

export default ExperienceDetail;
