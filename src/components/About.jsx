import React, { useEffect, useRef } from 'react';
import { splitChars, drawRule, riseIn, cleanup } from '../lib/motion';

/* The statement lights up character by character under the scrollbar —
   the reader sets the pace of their own introduction. */
const STATEMENT =
  'I build generative AI systems — multi-agent frameworks, retrieval pipelines, and the full-stack architecture that carries them into production.';

const MARKERS = [
  { k: 'Discipline', v: 'AI & Machine Learning' },
  { k: 'Based in', v: 'Pune, India' },
  { k: 'Working on', v: 'Autonomous agent systems' },
  { k: 'Open to', v: 'Internships & collaboration' },
];

const About = () => {
  const rootRef = useRef(null);
  const textRef = useRef(null);
  const ruleRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const fns = [
      splitChars(textRef.current, { start: 'top 78%', end: 'bottom 58%', each: 0.5 }),
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 80%' }),
      riseIn(gridRef.current?.children, { trigger: gridRef.current, stagger: 0.09, y: 26 }),
    ];
    return cleanup(fns);
  }, []);

  return (
    <section ref={rootRef} id="about" className="section about">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">About</span>
          <span className="rule" ref={ruleRef} />
        </div>

        <p ref={textRef} className="about-statement display display--wide">
          {STATEMENT}
        </p>

        <div className="about-grid" ref={gridRef}>
          {MARKERS.map((m) => (
            <div key={m.k} className="about-marker">
              <span className="eyebrow eyebrow--plain">{m.k}</span>
              <span className="about-marker-v">{m.v}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .about-statement {
          font-size: clamp(1.6rem, 4.6vw, 3.9rem);
          line-height: 1.08;
          font-stretch: 84%;
          font-weight: 800;
          letter-spacing: -0.015em;
          max-width: 21ch;
          margin: 0;
          /* Resting colour: readable on its own, before any scrub runs. */
          color: var(--fg);
        }
        .about-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: clamp(1.5rem, 3vw, 2.5rem);
          margin-top: clamp(3.5rem, 9vh, 6.5rem);
          padding-top: clamp(1.75rem, 4vh, 2.5rem);
          border-top: 1px solid var(--line);
        }
        .about-marker { display: flex; flex-direction: column; gap: 0.55rem; }
        .about-marker-v {
          font-size: var(--step-0);
          color: var(--fg);
          font-weight: 500;
          text-wrap: balance;
        }
        @media (max-width: 720px) {
          .about-statement { max-width: none; font-stretch: 78%; }
        }
      `}</style>
    </section>
  );
};

export default About;
