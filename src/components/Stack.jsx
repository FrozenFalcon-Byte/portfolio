import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, reduced, riseIn, cleanup } from '../lib/motion';

const LAYERS = [
  {
    n: '01',
    title: 'Languages',
    blurb: 'The base layer. Typed, compiled or scripted — whatever the problem is actually shaped like.',
    items: ['Python', 'Java', 'C++', 'JavaScript', 'SQL'],
  },
  {
    n: '02',
    title: 'GenAI & ML',
    blurb: 'Where most of the work happens now: agent graphs, retrieval, and the evaluation loops around them.',
    items: ['LangGraph', 'LangChain', 'NumPy', 'Pandas', 'TensorFlow', 'Keras'],
  },
  {
    n: '03',
    title: 'Web',
    blurb: 'Models are useless behind a bad interface. Front to back, so the system ships whole.',
    items: ['React', 'FastAPI', 'Supabase', 'PostgreSQL', 'Streamlit'],
  },
  {
    n: '04',
    title: 'Cloud',
    blurb: 'Where it runs when it stops running on a laptop.',
    items: ['AWS S3', 'AWS EC2', 'Azure', 'Azure AI'],
  },
  {
    n: '05',
    title: 'Tooling',
    blurb: 'Reproducible environments and version control, because "works on my machine" is not a deployment.',
    items: ['Git', 'GitHub', 'Docker', 'Hugging Face'],
  },
];

const Stack = () => {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const progressRef = useRef(null);
  const listRef = useRef(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const canPin = window.matchMedia('(min-width: 861px)').matches && !reduced();
    setPinned(canPin);

    if (!canPin) {
      return cleanup([
        riseIn(listRef.current?.querySelectorAll('.layer'), {
          trigger: listRef.current,
          start: 'top 85%',
          stagger: 0.1,
          y: 32,
        }),
      ]);
    }

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: () => `+=${LAYERS.length * 62}%`,
        pin: stageRef.current,
        scrub: 0.4,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const i = Math.min(LAYERS.length - 1, Math.floor(self.progress * LAYERS.length));
          setActive(i);
          gsap.set(progressRef.current, { scaleY: self.progress });
        },
      });
      return () => st.kill();
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="stack" className={`block stack ${pinned ? 'is-pinned' : ''}`} data-tone="lilac">
      <div ref={stageRef} className="stack-stage">
        <div className="shell stack-inner">
          <div className="sec-head">
            <span className="eyebrow">05 — The stack</span>
            <span className="rule stack-rule" />
          </div>

          <div className="stack-body">
            <div className="stack-rail" aria-hidden="true">
              <span className="stack-rail-track">
                <span className="stack-rail-fill" ref={progressRef} />
              </span>
            </div>

            <ol className="stack-list" ref={listRef}>
              {LAYERS.map((l, i) => (
                <li
                  key={l.n}
                  className={`layer ${pinned ? 'is-stacked' : ''} ${i === active ? 'is-active' : ''}`}
                >
                  <h3 className="layer-title display">
                    <span className="num layer-num">{l.n}</span>
                    {l.title}
                  </h3>
                  <div className="layer-detail">
                    <div className="layer-detail-in">
                      <p className="body layer-blurb">{l.blurb}</p>
                      <ul className="layer-items">
                        {l.items.map((it) => <li key={it} className="tag">{it}</li>)}
                      </ul>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <style>{`
        .stack.is-pinned { padding-block: 0; }
        .stack-stage { display: flex; align-items: center; min-height: 100svh; }
        .stack:not(.is-pinned) .stack-stage { min-height: 0; display: block; }
        .stack-inner { width: 100%; }
        .stack.is-pinned .stack-rule { transform: scaleX(1); }

        .stack-body {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: clamp(1.5rem, 4vw, 3.5rem);
        }

        .stack-rail { display: grid; }
        .stack-rail-track { position: relative; width: 2px; border-radius: 2px; background: var(--line); }
        .stack-rail-fill {
          position: absolute;
          inset: 0;
          border-radius: 2px;
          background: var(--mark);
          transform: scaleY(0);
          transform-origin: top;
        }

        .stack-list { display: flex; flex-direction: column; gap: 0.1rem; }

        .layer-title {
          margin: 0;
          font-size: clamp(2rem, 6vw, 4.4rem);
          letter-spacing: -0.04em;
          color: var(--ink-3);
          transition: color 0.5s var(--ease-out);
        }
        .layer.is-active .layer-title { color: var(--ink); }
        .layer-num {
          font-size: clamp(0.66rem, 1.2vw, 0.8rem);
          color: var(--ink-3);
          margin-right: 0.9em;
          vertical-align: 0.95em;
          font-weight: 500;
          transition: color 0.45s var(--ease-out);
        }
        .layer.is-active .layer-num,
        .layer:not(.is-stacked) .layer-num { color: var(--mark); }

        /* One child, one explicit row. With two children the second landed
           in an implicit auto row, so every collapsed layer still reserved
           the full height of its tag list — five of those overflowed the
           pinned viewport and the last layers were unreachable. */
        .layer-detail {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.6s var(--ease-out), opacity 0.45s var(--ease-out);
        }
        .layer-detail-in { overflow: hidden; min-height: 0; }
        .layer.is-active .layer-detail { grid-template-rows: 1fr; opacity: 1; }

        .layer-blurb { padding-block: 0.9rem 0.1rem; max-width: 50ch; }
        .layer-items { display: flex; flex-wrap: wrap; gap: 0.4rem; padding-block: 0.9rem 1.4rem; }

        /* Un-pinned (phone / reduced motion): every layer reads open. */
        .layer:not(.is-stacked) .layer-title { color: var(--ink); }
        .layer:not(.is-stacked) .layer-detail { grid-template-rows: 1fr; opacity: 1; }
        .layer:not(.is-stacked) { padding-block: 1.1rem; border-bottom: 1px solid var(--line-2); }
        .layer:not(.is-stacked):last-child { border-bottom: 0; }

        @media (max-width: 860px) {
          .stack-body { grid-template-columns: 1fr; }
          .stack-rail { display: none; }
          .layer-title { font-size: clamp(1.7rem, 8vw, 2.6rem); }
        }
      `}</style>
    </section>
  );
};

export default Stack;
