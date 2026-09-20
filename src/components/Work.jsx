import React, { useEffect, useRef, useState } from 'react';
import { gsap, EASE, maskLines, drawRule, pillReveal, riseIn, reduced, cleanup } from '../lib/motion';

const PROJECTS = [
  {
    id: '01',
    title: 'Construction Risk Predictor',
    kind: 'Retrieval-augmented generation',
    desc: 'A dual-database RAG system that predicts construction violations, stop-work orders, and safety risks before they land.',
    tech: ['React', 'FastAPI', 'ChromaDB', 'SQLite', 'LangChain', 'Gemini', 'Docker'],
    img: '/Risk.png',
    details: [
      'Engineered a retrieval confidence filter on normalized vector distance, dropping into LOW_CONFIDENCE_MODE for unseen projects so the model declines rather than hallucinates.',
      'Split the schema in two — the LLM\'s raw generation target and the API\'s output model — so malformed generations never break JSON parsing downstream.',
      'Matched backend query templates to the structural formatting of the vectorized chunks, which moved historical match accuracy sharply upward.',
      'Containerized the Python, SQLite and ChromaDB environment and shipped it to Hugging Face Spaces.',
    ],
  },
  {
    id: '02',
    title: 'Business Billing',
    kind: 'Full-stack platform',
    desc: 'Invoicing, receipts, role-based access and analytics for small businesses, running on a single Postgres tenant model.',
    tech: ['React', 'Supabase', 'PostgreSQL'],
    img: '/image.png',
    details: [
      'Architected role-based access control for secure tenant isolation across every table.',
      'Built real-time dashboard analytics on complex PostgreSQL aggregations.',
      'Automated PDF invoice generation and the email delivery pipeline behind it.',
    ],
  },
  {
    id: '03',
    title: 'Image Processor',
    kind: 'Computer vision + multimodal',
    desc: 'OCR, background removal, and AI summarization of visual data, wrapped in one tool.',
    tech: ['Python', 'Streamlit', 'Tesseract'],
    img: '/img.png',
    details: [
      'Built an automated background removal pipeline using segmentation-based computer vision.',
      'Integrated Tesseract OCR for high-accuracy extraction from dense document images.',
      'Connected multimodal LLM APIs to turn visual data into structured written reports.',
    ],
  },
  {
    id: '04',
    title: 'Nature Scene Classifier',
    kind: 'Deep learning',
    desc: 'A convolutional network trained on augmented landscape data, deployed as a live inference app.',
    tech: ['TensorFlow', 'Keras', 'CNN'],
    img: '/nature.jpeg',
    details: [
      'Designed and trained a deep CNN reaching 94% validation accuracy.',
      'Applied heavy augmentation to stop the model overfitting a narrow landscape set.',
      'Packaged the inference engine behind an interactive Streamlit front end.',
    ],
  },
];

const Plate = ({ p, index }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const maskRef = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const detailRef = useRef(null);

  useEffect(() => {
    const fns = [
      pillReveal(maskRef.current, { trigger: rootRef.current, start: 'top 92%', end: 'top 30%' }),
      maskLines(titleRef.current, { trigger: rootRef.current, start: 'top 82%', stagger: 0.08 }),
      riseIn(bodyRef.current?.children, { trigger: rootRef.current, start: 'top 78%', stagger: 0.07, y: 24 }),
    ];
    return cleanup(fns);
  }, []);

  useEffect(() => {
    const el = detailRef.current;
    if (!el) return;

    if (reduced()) {
      gsap.set(el, { height: open ? 'auto' : 0, opacity: open ? 1 : 0 });
      return;
    }

    if (open) {
      gsap.set(el, { height: 'auto', opacity: 1 });
      gsap.from(el, { height: 0, opacity: 0, duration: 0.7, ease: EASE.glide });
      gsap.from(el.querySelectorAll('li'), { y: 18, opacity: 0, duration: 0.6, stagger: 0.07, delay: 0.12, ease: EASE.swift });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.45, ease: EASE.glide });
    }
  }, [open]);

  return (
    <article ref={rootRef} className={`plate ${index % 2 ? 'plate--flip' : ''}`}>
      <div className="plate-media">
        <div className="pillmask" ref={maskRef}>
          <img src={p.img} alt={`${p.title} interface`} loading="lazy" />
        </div>
      </div>

      <div className="plate-text">
        <div className="plate-meta">
          <span className="num plate-index">{p.id}</span>
          <span className="tag">{p.kind}</span>
        </div>

        <h3 ref={titleRef} className="plate-title display display--m">{p.title}</h3>

        <div ref={bodyRef} className="plate-body">
          <p className="body">{p.desc}</p>

          <ul className="plate-tech">
            {p.tech.map((t) => <li key={t} className="tag">{t}</li>)}
          </ul>

          <button
            className="plate-toggle mono"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={`detail-${p.id}`}
          >
            <span className="plate-toggle-mark" aria-hidden="true">{open ? '–' : '+'}</span>
            {open ? 'Close breakdown' : 'Read the breakdown'}
          </button>
        </div>

        <div className="plate-detail" ref={detailRef} id={`detail-${p.id}`}>
          <ul>
            {p.details.map((d) => (
              <li key={d}><span className="plate-detail-bar" aria-hidden="true" />{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
};

const Work = () => {
  const ruleRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => cleanup([drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' })]), []);

  return (
    <section ref={rootRef} id="work" className="section work">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">Selected work</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono work-count">{PROJECTS.length} projects</span>
        </div>

        <div className="work-list">
          {PROJECTS.map((p, i) => <Plate key={p.id} p={p} index={i} />)}
        </div>
      </div>

      <style>{`
        .work-count { color: var(--fg-faint); white-space: nowrap; }

        .work-list {
          display: flex;
          flex-direction: column;
          gap: clamp(5rem, 14vh, 11rem);
        }

        .plate {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: clamp(1.75rem, 5vw, 5rem);
          align-items: center;
        }
        .plate--flip .plate-media { order: 2; }

        .plate-media { min-width: 0; }
        .plate .pillmask {
          aspect-ratio: 4 / 3;
          border: 1px solid var(--line);
        }
        .plate .pillmask img { height: 100%; }

        .plate-text { display: flex; flex-direction: column; gap: 1.1rem; min-width: 0; }

        .plate-meta { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; }
        .plate-index {
          font-size: clamp(0.78rem, 1.6vw, 0.95rem);
          color: var(--amber);
          font-weight: 600;
        }

        .plate-title {
          margin: 0;
          font-size: clamp(1.75rem, 4.4vw, 3.4rem);
          font-stretch: 72%;
          color: var(--fg);
        }

        .plate-body { display: flex; flex-direction: column; gap: 1.2rem; }

        .plate-tech { display: flex; flex-wrap: wrap; gap: 0.4rem; }

        .plate-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.65em;
          align-self: flex-start;
          padding: 0;
          color: var(--fg);
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.7rem;
          font-weight: 500;
          transition: color 0.3s var(--ease-out);
        }
        .plate-toggle:hover { color: var(--amber); }
        .plate-toggle-mark {
          display: grid;
          place-items: center;
          width: 26px; height: 26px;
          flex: none;
          border: 1px solid var(--line);
          border-radius: 999px;
          font-size: 0.9rem;
          line-height: 1;
          transition: border-color 0.3s var(--ease-out), background 0.3s var(--ease-out), color 0.3s;
        }
        .plate-toggle:hover .plate-toggle-mark {
          border-color: var(--amber);
          background: var(--amber);
          color: var(--on-accent);
        }

        .plate-detail { height: 0; opacity: 0; overflow: hidden; }
        .plate-detail ul { display: flex; flex-direction: column; gap: 0.9rem; padding-top: 1.4rem; }
        .plate-detail li {
          display: flex;
          gap: 0.9rem;
          color: var(--fg-dim);
          font-size: var(--step--1);
          line-height: 1.65;
          max-width: 58ch;
        }
        .plate-detail-bar {
          flex: none;
          width: 14px; height: 1px;
          margin-top: 0.75em;
          background: var(--amber);
        }

        @media (max-width: 860px) {
          .plate { grid-template-columns: 1fr; gap: 1.5rem; }
          .plate--flip .plate-media { order: 0; }
          .plate .pillmask { aspect-ratio: 16 / 11; }
        }
      `}</style>
    </section>
  );
};

export default Work;
