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

/* ------------------------------------------------------------------
   Band — one layer of the stack, as a strip of type running the full
   width of the page.

   The tool names are set huge and roll sideways forever, odd layers one
   way and even layers the other, with the logo's full stop between
   them. Scrolling the page winds them faster in the direction you are
   scrolling, then they ease back to a drift. Pointing at a band stops
   it so a name can be read; pointing at a name inks it in the layer's
   accent. The layer's own name sits pinned at the left edge over the
   moving type, on a paper tab, so you always know which shelf you are
   looking at.
   ------------------------------------------------------------------ */
const Band = ({ l, i }) => {
  const bandRef = useRef(null);
  const runRef = useRef(null);

  useEffect(() => {
    const band = bandRef.current;
    const run = runRef.current;
    const dir = i % 2 ? 1 : -1;
    let x = 0;
    let boost = 0;
    let held = false;
    let lastY = window.scrollY;
    let visible = false;

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' });
    io.observe(band);

    const tick = (_t, delta) => {
      if (!visible || reduced()) return;
      const dt = Math.min(delta / 16.667, 3);
      const y = window.scrollY;
      const v = y - lastY;
      lastY = y;
      boost += (gsap.utils.clamp(-40, 40, v * 0.6) - boost) * 0.12 * dt;
      const speed = held ? 0 : (0.6 + Math.abs(boost)) * (boost < 0 ? -1 : 1);
      const half = run.scrollWidth / 2;
      x += dir * speed * dt;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      run.style.transform = `translate3d(${x}px, 0, 0)`;
    };
    const on = () => { held = true; };
    const off = () => { held = false; };
    band.addEventListener('pointerenter', on);
    band.addEventListener('pointerleave', off);
    gsap.ticker.add(tick);

    // Arrival: the band unrolls from a thin line to its full height.
    let st;
    if (!reduced()) {
      st = gsap.fromTo(band, { clipPath: 'inset(48% 0% 48% 0% round 999px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.1, ease: 'power3.inOut',
        scrollTrigger: { trigger: band, start: 'top 88%', toggleActions: 'play none none reverse' },
      });
    }
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      band.removeEventListener('pointerenter', on);
      band.removeEventListener('pointerleave', off);
      st?.scrollTrigger?.kill(); st?.kill();
    };
  }, [i]);

  // Two copies so the strip can wrap without a seam.
  const words = [...l.items, ...l.items, ...l.items];
  return (
    <li className="st-band" ref={bandRef} data-acc={l.acc}>
      <div className="st-tab">
        <span className="num st-n">{l.n}</span>
        <span className="display st-name">{l.title}</span>
        <Glyph kind={l.glyph} acc={l.acc} />
      </div>
      <div className="st-run" ref={runRef} aria-label={`${l.title}: ${l.items.join(', ')}`}>
        {[0, 1].map((copy) => (
          <span className="st-set" key={copy} aria-hidden={copy === 1}>
            {words.map((w, k) => (
              <span className="st-item" key={k}>
                <span className="display st-word">{w}</span>
                <i className="st-stop" />
              </span>
            ))}
          </span>
        ))}
      </div>
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

      </div>

      <ol className="st-bands">
        {LAYERS.map((l, i) => <Band key={l.n} l={l} i={i} />)}
      </ol>

      <style>{`
        .stack { overflow: hidden; }
        .st-note { color: var(--ink-3); white-space: nowrap; }
        .st-head { margin-bottom: clamp(2rem, 7vh, 4rem); }

        .st-bands { display: grid; border-top: 1px solid var(--line); }
        .st-band {
          position: relative;
          display: flex;
          align-items: center;
          height: clamp(6rem, 15vh, 9.5rem);
          border-bottom: 1px solid var(--line);
          overflow: hidden;
        }
        .st-tab {
          position: absolute; left: 0; top: 50%; z-index: 2;
          translate: 0 -50%;
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.7rem 1.1rem 0.7rem var(--gutter);
          background: var(--paper);
          border-radius: 0 999px 999px 0;
          box-shadow: 1.2rem 0 1.4rem -0.2rem var(--paper);
          font-size: var(--step-1);
        }
        .st-n { color: var(--ink-3); font-size: var(--step--1); }
        .st-name { font-weight: 700; letter-spacing: -0.04em; }
        .st-run { display: flex; width: max-content; will-change: transform; }
        .st-set { display: flex; align-items: center; }
        .st-item { display: inline-flex; align-items: center; }
        .st-word {
          position: relative;
          padding: 0 0.12em;
          font-size: clamp(2.6rem, 7.4vw, 7rem);
          font-weight: 700;
          letter-spacing: -0.055em;
          line-height: 1;
          white-space: nowrap;
          color: var(--ink);
          z-index: 0;
          transition: color 0.3s var(--ease-out);
        }
        .st-word::after {
          content: ""; position: absolute; z-index: -1;
          left: 0; right: 0; top: 12%; bottom: 8%;
          border-radius: 999px;
          background: var(--acc);
          transform: scaleY(0);
          transition: transform 0.45s var(--ease-out);
        }
        .st-word:hover { color: var(--acc-ink); }
        .st-word:hover::after { transform: scaleY(1); }
        .st-stop {
          width: clamp(0.6rem, 1.2vw, 1.05rem); height: clamp(0.6rem, 1.2vw, 1.05rem);
          margin: 0 clamp(0.8rem, 2vw, 1.8rem);
          border-radius: 99px;
          background: var(--acc);
          flex: none;
        }

        @media (max-width: 700px) {
          .st-tab { top: 0.6rem; translate: 0 0; padding-block: 0.4rem; font-size: var(--step-0); }
          .st-tab .glyph { display: none; }
          .st-band { align-items: flex-end; padding-bottom: 0.8rem; height: 8rem; }
        }
      `}</style>
    </section>
  );
};

export default Stack;
