import React, { useEffect, useRef } from 'react';
import { splitChars, drawRule, riseIn, cleanup } from '../lib/motion';

/* The statement lights up character by character under the scroll line —
   the reader sets the pace of their own introduction. */
const STATEMENT =
  'I build generative AI systems — multi-agent frameworks, retrieval pipelines, and the full-stack architecture that carries them into production.';

const MARKERS = [
  { k: 'Discipline', v: 'AI & Machine Learning' },
  { k: 'Based in', v: 'Pune, India' },
  { k: 'Currently', v: 'AI/ML Intern at Emerson' },
  { k: 'Open to', v: 'Internships & collaboration' },
];

const About = () => {
  const rootRef = useRef(null);
  const textRef = useRef(null);
  const ruleRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const fns = [
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 80%' }),
      riseIn(gridRef.current?.children, { trigger: gridRef.current, stagger: 0.09, y: 26 }),
    ];
    return cleanup(fns);
  }, []);

  /* The scrub reveal tweens between three token colours, which GSAP
     resolves to hex when the tween is built. After a theme switch those
     are the old theme's colours, so the statement has to be rebuilt
     rather than left holding them. */
  useEffect(() => {
    const opts = { start: 'top 76%', end: 'bottom 60%', each: 0.5 };
    let kill = splitChars(textRef.current, opts);

    const rebuild = () => {
      kill?.();
      kill = splitChars(textRef.current, opts);
    };

    window.addEventListener('themechange', rebuild);
    return () => {
      window.removeEventListener('themechange', rebuild);
      kill?.();
    };
  }, []);

  return (
    <section ref={rootRef} id="about" className="block about" data-tone="lilac">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">01 — About</span>
          <span className="rule" ref={ruleRef} />
        </div>

        <p ref={textRef} className="about-statement display">
          {STATEMENT}
        </p>

        <div className="about-grid" ref={gridRef}>
          {MARKERS.map((m) => (
            <div key={m.k} className="about-marker">
              <span className="mono about-marker-k">{m.k}</span>
              <span className="about-marker-v">{m.v}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .about-statement {
          font-size: clamp(1.7rem, 4.8vw, 4rem);
          line-height: 1.05;
          letter-spacing: -0.03em;
          max-width: 22ch;
        }

        .about-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1px;
          margin-top: clamp(3rem, 9vh, 5.5rem);
          background: var(--line);
          border: 1px solid var(--line);
          border-radius: 18px;
          overflow: hidden;
        }
        .about-marker {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          padding: 1.4rem 1.5rem 1.6rem;
          background: var(--paper);
          transition: background 0.4s var(--ease-out);
        }
        .about-marker:hover { background: var(--paper-2); }
        .about-marker-k { color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.12em; font-size: var(--step--2); }
        .about-marker-v { font-size: var(--step-0); font-weight: 500; }
      `}</style>
    </section>
  );
};

export default About;
