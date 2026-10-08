import React, { useEffect, useRef } from 'react';
import { gsap, heading, drawRule, reduced, cleanup } from '../lib/motion';
import Glyph from './Glyph';

const LAYERS = [
  {
    n: '01',
    title: 'Languages',
    acc: 'yellow',
    glyph: 'type',
    blurb: 'The base layer. Typed, compiled or scripted — whatever the problem is actually shaped like.',
    items: ['Python', 'Java', 'C++', 'JavaScript', 'SQL'],
  },
  {
    n: '02',
    title: 'GenAI & ML',
    acc: 'pink',
    glyph: 'graph',
    blurb: 'Where most of the work happens now: agent graphs, retrieval, and the evaluation loops around them.',
    items: ['LangGraph', 'LangChain', 'RAG', 'MCP', 'A2A', 'Azure OpenAI', 'TimeGPT', 'Scikit-Learn', 'TensorFlow', 'Keras'],
  },
  {
    n: '03',
    title: 'Web',
    acc: 'blue',
    glyph: 'click',
    blurb: 'Models are useless behind a bad interface. Front to back, so the system ships whole.',
    items: ['React', 'TypeScript', 'FastAPI', 'Supabase', 'PostgreSQL', 'Streamlit'],
  },
  {
    n: '04',
    title: 'Cloud',
    acc: 'teal',
    glyph: 'cloud',
    blurb: 'Where it runs when it stops running on a laptop.',
    items: ['Azure', 'Azure AI', 'Azure App Service', 'AWS S3', 'AWS EC2', 'Vercel', 'Render', 'Firebase'],
  },
  {
    n: '05',
    title: 'Tooling',
    acc: 'violet',
    glyph: 'git',
    blurb: 'Reproducible environments and version control, because "works on my machine" is not a deployment.',
    items: ['Git', 'GitHub', 'GitHub Actions', 'Docker', 'Hugging Face'],
  },
];

/* Deterministic scatter, so a layout never jumps between renders. */
const rand = (seed) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

/* ------------------------------------------------------------------
   Layer — one row of the stack.

   The tools are keycaps: square-ish keys with a raised edge, the
   first filled with the row's accent. As the row arrives they drop
   onto the board one after another and bounce as they land; hovering
   a key presses it down, so the whole section reads as something you
   build with rather than a list of names.
   ------------------------------------------------------------------ */
const Layer = ({ l, i }) => {
  const rowRef = useRef(null);

  useEffect(() => {
    if (reduced()) return undefined;
    const row = rowRef.current;
    const keys = row.querySelectorAll('.st-key');
    const title = row.querySelector('.st-title');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: row, start: 'top 82%', toggleActions: 'play none none reverse' },
    });
    tl.fromTo(title, { xPercent: -8, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 0)
      .fromTo(keys,
        { y: -140, opacity: 0, rotate: (j) => (rand(i * 31 + j) - 0.5) * 30 },
        { y: 0, opacity: 1, rotate: 0, duration: 0.9, ease: 'bounce.out', stagger: 0.06 }, 0.1);
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, [i]);

  return (
    <li className="st-row" ref={rowRef} data-acc={l.acc}>
      <div className="st-left">
        <span className="num st-n">{l.n}</span>
        <h3 className="display st-title">{l.title}<Glyph kind={l.glyph} acc={l.acc} /></h3>
        <p className="st-blurb">{l.blurb}</p>
      </div>
      <ul className="st-keys">
        {l.items.map((it, j) => (
          <li key={it} className={`st-key${j === 0 ? ' is-lead' : ''}`}>
            <span className="num st-key-n">{String(j + 1).padStart(2, '0')}</span>
            <span className="display st-key-t">{it}</span>
          </li>
        ))}
      </ul>
    </li>
  );
};

const Stack = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const headRef = useRef(null);

  useEffect(() => cleanup([
    drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 84%' }),
    heading(headRef.current),
  ]), []);

  const total = LAYERS.reduce((n, l) => n + l.items.length, 0);

  return (
    <section ref={rootRef} id="stack" className="block stack" data-acc="lime">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow"><b>05</b>Stack</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono st-note">{total} tools · 5 layers</span>
        </div>

        <h2 ref={headRef} className="display display--l st-head">
          <span className="ln"><span className="ln-in">Assembled</span></span>
          <span className="ln"><span className="ln-in">layer by<Glyph kind="stack" acc="lime" />layer.</span></span>
        </h2>

        <ol className="st-rows">
          {LAYERS.map((l, i) => <Layer key={l.n} l={l} i={i} />)}
        </ol>
      </div>

      <style>{`
        .stack { overflow: hidden; }
        .st-note { color: var(--ink-3); white-space: nowrap; }
        .st-head { margin-bottom: clamp(2rem, 7vh, 4rem); }

        .st-rows { display: grid; }
        .st-row {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: clamp(1.25rem, 4vw, 4rem);
          align-items: center;
          padding-block: clamp(1.5rem, 4vh, 2.5rem);
          border-top: 1px solid var(--line);
        }
        .st-row:last-child { border-bottom: 1px solid var(--line); }
        .st-left { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr); column-gap: 0.75rem; align-items: baseline; }
        .st-n { color: var(--ink-3); font-size: var(--step--1); }
        .st-title { font-size: clamp(2rem, 4.6vw, 4rem); letter-spacing: -0.05em; }
        .st-blurb { grid-column: 2; margin-top: 0.6rem; color: var(--ink-2); font-size: var(--step--1); max-width: 40ch; }

        .st-keys { display: flex; flex-wrap: wrap; gap: 0.7rem 0.6rem; padding-bottom: 6px; }
        .st-key {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 6.2rem;
          height: clamp(4.4rem, 6.4vw, 5.4rem);
          padding: 0.6rem 0.85rem 0.65rem;
          border-radius: 18px;
          background: var(--paper);
          border: 1.5px solid var(--ink);
          box-shadow: 0 6px 0 var(--ink);
          cursor: default;
          will-change: transform;
          transition: translate 0.18s var(--ease-out), box-shadow 0.18s var(--ease-out), background 0.3s, color 0.3s;
        }
        .st-key:hover { translate: 0 4px; box-shadow: 0 2px 0 var(--ink); background: var(--acc); color: var(--acc-ink); }
        .st-key:active { translate: 0 6px; box-shadow: 0 0 0 var(--ink); }
        .st-key.is-lead { background: var(--acc); color: var(--acc-ink); }
        .st-key-n { font-size: 0.7rem; opacity: 0.55; }
        .st-key-t { font-size: clamp(1rem, 1.35vw, 1.3rem); font-weight: 650; letter-spacing: -0.03em; line-height: 1; white-space: nowrap; }

        @media (max-width: 860px) {
          .st-row { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </section>
  );
};

export default Stack;
