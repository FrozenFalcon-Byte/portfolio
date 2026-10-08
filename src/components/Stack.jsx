import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, heading, drawRule, reduced, cleanup, fx, fx0 } from '../lib/motion';
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

const GROW = 7.5;

/* ------------------------------------------------------------------
   Shelf — the five layers stand side by side like volumes on a shelf.
   One is pulled out and open: it takes most of the width, filled with
   its accent, and lists its tools in large type. The others stay
   closed as narrow spines with their names set sideways, so the whole
   stack is always visible at once.

   On a wide screen the shelf pins and the scroll opens the layers one
   after another; clicking a spine scrolls to its place. On a narrow
   one the layers stack as rows and a tap opens one.
   ------------------------------------------------------------------ */
const Shelf = () => {
  const shelfRef = useRef(null);
  const stRef = useRef(null);
  const [on, setOn] = useState(0);

  // The open page is laid out at the width it will have once open, so
  // widening the spine only uncovers it and never reflows the words.
  useEffect(() => {
    const shelf = shelfRef.current;
    const size = () => {
      const gap = parseFloat(getComputedStyle(shelf).columnGap) || 10;
      const n = LAYERS.length;
      const w = ((shelf.clientWidth - gap * (n - 1)) * GROW) / (GROW + n - 1);
      shelf.style.setProperty('--open-w', `${Math.floor(w)}px`);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(shelf);
    return () => ro.disconnect();
  }, []);

  // Arrival: the spines rise one after another, blurred while moving.
  useEffect(() => {
    if (reduced()) return undefined;
    const cols = shelfRef.current.children;
    const t = gsap.fromTo(cols,
      { y: 80, opacity: 0, ...fx(10) },
      {
        y: 0, opacity: 1, ...fx0(), duration: 0.9, stagger: 0.07, ease: EASE.swift,
        scrollTrigger: { trigger: shelfRef.current, start: 'top 82%' },
      });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, []);

  // Wide screens: pin the shelf and let the scroll open each layer in turn.
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const n = LAYERS.length;
      const st = ScrollTrigger.create({
        trigger: shelfRef.current,
        start: 'center 56%',
        end: () => `+=${window.innerHeight * 0.55 * (n - 1)}`,
        pin: true,
        snap: { snapTo: 1 / (n - 1), duration: { min: 0.2, max: 0.5 }, delay: 0.1, ease: 'power2.inOut' },
        onUpdate: (self) => {
          const k = Math.round(self.progress * (n - 1));
          setOn((cur) => (cur === k ? cur : k));
        },
      });
      stRef.current = st;
      return () => { stRef.current = null; };
    });
    return () => mm.revert();
  }, []);

  // The open layer's contents settle in after the spine has widened.
  useEffect(() => {
    const open = shelfRef.current.querySelector('.st-col.is-on .st-open');
    if (!open || reduced()) return undefined;
    const parts = open.querySelectorAll('.st-o-head, .st-blurb, .st-tool');
    const t = gsap.fromTo(parts,
      { y: 22, opacity: 0, ...fx(8) },
      { y: 0, opacity: 1, ...fx0(), duration: 0.6, stagger: 0.03, delay: 0.18, ease: EASE.swift, overwrite: true });
    return () => t.kill();
  }, [on]);

  const pick = (k) => {
    const st = stRef.current;
    if (!st) { setOn(k); return; }
    const y = st.start + (st.end - st.start) * (k / (LAYERS.length - 1));
    if (window.lenis) window.lenis.scrollTo(y, { duration: 1 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div className="st-pinwrap">
    <ol className="st-shelf" ref={shelfRef}>
      {LAYERS.map((l, k) => {
        const open = k === on;
        return (
          <li key={l.n} className={`st-col${open ? ' is-on' : ''}`} data-acc={l.acc}>
            <button
              className="st-spine"
              onClick={() => pick(k)}
              aria-expanded={open}
              aria-controls={`st-open-${k}`}
              data-cursor-label={open ? undefined : l.title}
              tabIndex={open ? -1 : 0}
            >
              <span className="num st-n">{l.n}</span>
              <span className="display st-sname">{l.title}</span>
              <span className="st-count num">{l.items.length}</span>
            </button>

            <div className="st-open" id={`st-open-${k}`} aria-hidden={!open}>
              <div className="st-o-head">
                <span className="num st-n">{l.n}</span>
                <span className="display st-oname">{l.title}</span>
                <Glyph kind={l.glyph} acc={l.acc} />
              </div>
              <p className="st-blurb">{l.blurb}</p>
              <ul className="st-tools">
                {l.items.map((w) => (
                  <li key={w} className="st-tool display">{w}</li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
    </div>
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

        <Shelf />
      </div>

      <style>{`
        .st-note { color: var(--ink-3); white-space: nowrap; }
        .st-head { margin-bottom: clamp(2rem, 7vh, 4rem); }

        .st-shelf {
          display: flex;
          gap: 10px;
          height: clamp(28rem, 64vh, 36rem);
        }
        .st-col {
          position: relative;
          flex: 1 1 0;
          min-width: 0;
          border-radius: var(--r-xl);
          background: var(--paper-2);
          box-shadow: inset 0 0 0 1px var(--line-2);
          overflow: hidden;
          transition: flex-grow 0.75s var(--ease-out), background 0.5s var(--ease-out), box-shadow 0.5s;
        }
        .st-col.is-on {
          flex-grow: 7.5; /* GROW */
          background: var(--acc);
          color: var(--acc-ink);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 26px 50px -26px rgba(0, 0, 0, 0.4);
        }

        /* The closed spine: number on top, the name read bottom to top,
           the count of tools at the foot. */
        .st-spine {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: space-between;
          padding: 1.3rem 0;
          color: var(--ink);
          cursor: pointer;
          transition: opacity 0.35s 0.3s var(--ease-out);
        }
        .st-spine:hover { background: var(--paper-3); }
        .st-spine:hover .st-count { background: var(--acc); color: var(--acc-ink); }
        .st-col.is-on .st-spine { opacity: 0; pointer-events: none; transition: opacity 0.1s; }
        .st-n { font-size: var(--step--1); opacity: 0.6; }
        .st-sname {
          writing-mode: vertical-rl;
          rotate: 180deg;
          font-size: clamp(1.4rem, 2.2vw, 2.1rem);
          font-weight: 700;
          letter-spacing: -0.04em;
          white-space: nowrap;
        }
        .st-count {
          display: grid; place-items: center;
          width: 2.2rem; height: 2.2rem;
          border-radius: 99px;
          background: var(--paper);
          font-size: 0.78rem; font-weight: 600;
          transition: background 0.3s, color 0.3s;
        }

        /* The open page is laid out at its full width from the start,
           so widening the spine only uncovers it, never reflows it. */
        .st-open {
          position: absolute; left: 0; top: 0; bottom: 0;
          width: var(--open-w, 60%);
          display: flex; flex-direction: column;
          gap: clamp(1rem, 2.4vh, 1.6rem);
          padding: clamp(1.4rem, 3vw, 2.6rem);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.12s, visibility 0s 0.12s;
        }
        .st-col.is-on .st-open { opacity: 1; visibility: visible; transition: opacity 0.3s 0.12s, visibility 0s; }
        .st-o-head { display: flex; align-items: center; gap: 0.25em; font-size: clamp(2rem, 3.8vw, 3.8rem); }
        /* The glyph is turned inside out on its own colour: a paper pill
           drawn in the layer's accent. */
        .st-col { --col: var(--acc); }
        .st-o-head .glyph[data-acc] { --acc: var(--paper); --acc-ink: var(--col); }
        .st-o-head .st-n { font-size: var(--step--1); align-self: flex-start; margin-right: 0.4rem; }
        .st-oname {
          font-weight: 800;
          letter-spacing: -0.055em;
          line-height: 1;
        }
        .st-blurb { max-width: 40ch; font-size: var(--step-1); line-height: 1.4; opacity: 0.86; }
        .st-tools {
          margin-top: auto;
          display: flex; flex-wrap: wrap; align-items: center;
          gap: 0.4rem 0.2rem;
        }
        .st-tool {
          display: inline-flex; align-items: center;
          font-size: clamp(1.4rem, 2.6vw, 2.6rem);
          font-weight: 700;
          letter-spacing: -0.05em;
          line-height: 1.12;
        }
        .st-tool:not(:last-child)::after {
          content: "";
          width: 0.26em; height: 0.26em;
          margin: 0 0.45em 0 0.3em;
          border-radius: 99px;
          background: currentColor;
          opacity: 0.4;
        }
        @media (max-width: 860px) {
          .st-shelf { flex-direction: column; height: auto; }
          .st-col { flex: none; height: 4.4rem; transition: height 0.6s var(--ease-out), background 0.5s; }
          .st-col.is-on { height: auto; }
          .st-spine { flex-direction: row; padding: 0 1.2rem; gap: 0.8rem; justify-content: flex-start; }
          .st-sname { writing-mode: horizontal-tb; rotate: none; font-size: var(--step-1); }
          .st-count { margin-left: auto; }
          .st-open { position: relative; width: auto; transition: none; }
          .st-col.is-on .st-spine { display: none; }
          .st-col:not(.is-on) .st-open { display: none; }
        }
      `}</style>
    </section>
  );
};

export default Stack;
