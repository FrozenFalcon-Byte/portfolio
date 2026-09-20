import React, { useEffect, useRef } from 'react';
import { gsap, EASE, maskLines, riseIn, reduced, cleanup } from '../lib/motion';

const ROLES = [
  {
    org: 'Emerson',
    role: 'PMO AI/ML Intern',
    span: 'Dec 2025 — Present',
    current: true,
    headline: 'Architected a multi-agent system framework',
    lines: [
      'Designed a multi-agent AI framework on LangGraph.',
      'Deployed autonomous SQL and extraction agents.',
      'Built a self-correcting retry loop so failed agent steps recover instead of stalling.',
      'Automated complex PMO data workflows end to end.',
    ],
  },
  {
    org: 'AIMSS, VIIT',
    role: 'Technical Lead',
    span: '2024 — 2026',
    headline: 'Leading the technical wing',
    lines: [
      'Run AI/ML workshops for the student body.',
      'Guide teams building their first intelligent systems.',
    ],
  },
  {
    org: 'VIIT',
    role: 'Class Representative',
    span: '2023 — 2026',
    headline: 'Liaison between students and faculty',
    lines: ['Kept academic operations running across three cohorts.'],
  },
];

/* A light panel that rises over the dark page — the surface inversion
   brilean uses to mark a change of register. Only tokens flip; no rule
   in here names a colour. */
const Experience = () => {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const listRef = useRef(null);
  const railRef = useRef(null);

  useEffect(() => {
    const fns = [
      maskLines(headRef.current, { trigger: rootRef.current, start: 'top 80%' }),
      riseIn(listRef.current?.querySelectorAll('.role'), { trigger: listRef.current, start: 'top 85%', stagger: 0.12, y: 40 }),
    ];

    if (!reduced() && railRef.current) {
      const t = gsap.fromTo(
        railRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: listRef.current, start: 'top 72%', end: 'bottom 78%', scrub: 0.5 },
        }
      );
      fns.push(() => { t.scrollTrigger?.kill(); t.kill(); });
    }

    return cleanup(fns);
  }, []);

  return (
    <section ref={rootRef} id="experience" className="section experience" data-surface="bone">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">Track record</span>
          <span className="rule" />
        </div>

        <h2 ref={headRef} className="exp-head display display--l">
          Shipping in production, not in slides.
        </h2>

        <div className="exp-list" ref={listRef}>
          <span className="exp-rail-track" aria-hidden="true">
            <span className="exp-rail" ref={railRef} />
          </span>

          {ROLES.map((r) => (
            <article key={r.org + r.role} className="role">
              <span className="role-node" aria-hidden="true" />

              <div className="role-head">
                <div className="role-id">
                  <h3 className="role-org display display--s">{r.org}</h3>
                  <span className="role-title mono">{r.role}</span>
                </div>
                <span className={`role-span mono ${r.current ? 'is-current' : ''}`}>
                  {r.current && <span className="role-live" aria-hidden="true" />}
                  {r.span}
                </span>
              </div>

              <p className="role-headline">{r.headline}</p>

              <ul className="role-lines">
                {r.lines.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .experience {
          border-radius: clamp(20px, 3vw, 40px) clamp(20px, 3vw, 40px) 0 0;
          margin-top: clamp(2rem, 6vh, 5rem);
        }
        .exp-head {
          font-size: clamp(2rem, 6.4vw, 5.2rem);
          font-stretch: 76%;
          max-width: 15ch;
          margin: 0 0 clamp(3rem, 8vh, 5.5rem);
          color: var(--fg);
        }

        .exp-list { position: relative; display: flex; flex-direction: column; gap: clamp(2.5rem, 7vh, 4.5rem); }

        .exp-rail-track {
          position: absolute;
          left: 5px; top: 8px; bottom: 8px;
          width: 1px;
          background: var(--line);
        }
        .exp-rail {
          display: block;
          width: 100%; height: 100%;
          background: var(--ember);
          transform-origin: top;
        }

        .role { position: relative; padding-left: clamp(1.75rem, 4vw, 2.75rem); }
        .role-node {
          position: absolute;
          left: 0; top: 7px;
          width: 11px; height: 11px;
          border-radius: 999px;
          border: 1px solid var(--fg-faint);
          background: var(--ink);
        }
        .role:first-child .role-node { border-color: var(--ember); background: var(--ember); }

        .role-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding-bottom: 0.9rem;
          border-bottom: 1px solid var(--line);
        }
        .role-id { display: flex; align-items: baseline; gap: 0.9rem; flex-wrap: wrap; }
        .role-org { margin: 0; font-size: clamp(1.3rem, 3vw, 2.1rem); color: var(--fg); }
        .role-title { color: var(--fg-dim); text-transform: uppercase; letter-spacing: 0.1em; }
        .role-span {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
          color: var(--fg-faint);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }
        .role-span.is-current { color: var(--ember); }
        .role-live {
          width: 6px; height: 6px;
          border-radius: 999px;
          background: var(--ember);
          animation: roleBlink 2.2s ease-in-out infinite;
        }
        @keyframes roleBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

        .role-headline {
          margin-top: 1.1rem;
          font-size: var(--step-1);
          font-weight: 600;
          color: var(--fg);
          max-width: 34ch;
          text-wrap: balance;
        }
        .role-lines { display: flex; flex-direction: column; gap: 0.55rem; margin-top: 1rem; }
        .role-lines li {
          position: relative;
          padding-left: 1.2rem;
          color: var(--fg-dim);
          font-size: var(--step--1);
          line-height: 1.7;
          max-width: 60ch;
        }
        .role-lines li::before {
          content: "";
          position: absolute;
          left: 0; top: 0.85em;
          width: 8px; height: 1px;
          background: var(--fg-faint);
        }

        @media (prefers-reduced-motion: reduce) {
          .exp-rail { transform: scaleY(1); }
          .role-live { animation: none; }
        }
      `}</style>
    </section>
  );
};

export default Experience;
