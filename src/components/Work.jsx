import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, maskLines, riseIn, drawRule, cleanup } from '../lib/motion';

const TONES = ['lilac', 'cyan', 'acid', 'ink'];

/* Decided before the first paint, not after: a card that mounts thinking
   it is stacked gets riseIn's opacity:0 written onto it, and the rail
   never puts it back. */
const wantsRail = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(min-width: 901px)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PROJECTS = [
  {
    id: '01',
    title: 'FinMCP',
    kind: 'Model Context Protocol platform',
    desc: 'A personal finance platform whose business logic is an MCP server. The web app, Claude Desktop and the in-app agent are all clients of the same ledger.',
    tech: ['MCP', 'React 19', 'FastAPI', 'PostgreSQL', 'Supabase', 'TypeScript', 'Claude API'],
    img: '/finmcp.webp',
    details: [
      'Shipped the entire feature set as 27 MCP tools, 13 resources and 4 prompts, so every client — browser, Claude Desktop, Claude Code — gets identical capability with no duplicated logic.',
      'Used the protocol’s two-way channel properly: sampling hands a weak category guess to the client’s model, elicitation pauses a risky call for a dialog, and subscriptions stream writes from any client into the open web app.',
      'Pushed tenant isolation down into Postgres row-level security — every request runs in a transaction opened as the caller’s account, so a leaked token still reads nothing.',
      'Wrote deterministic fallbacks for categorisation, text-to-SQL and receipt parsing, so the whole app still works with no model key set.',
    ],
  },
  {
    id: '02',
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
    id: '03',
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
    id: '04',
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
    id: '05',
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

const Card = ({ p, tone, index, stacked }) => {
  const rootRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!stacked) return undefined;
    return cleanup([
      riseIn(rootRef.current, { trigger: rootRef.current, start: 'top 88%', y: 34 }),
    ]);
  }, [stacked]);

  useEffect(() => {
    if (stacked) return undefined;
    // Inside a pinned horizontal track the card never crosses a vertical
    // trigger line, so the title reveal runs off the section instead.
    return cleanup([
      maskLines(titleRef.current, {
        trigger: rootRef.current.closest('.work'),
        start: 'top 70%',
        stagger: 0.07,
        delay: index * 0.05,
      }),
    ]);
  }, [stacked, index]);

  return (
    <article ref={rootRef} className="wcard" data-tone={tone}>
      <div className="wcard-media">
        <span className="wcard-frame">
          <img className="wcard-img" src={p.img} alt={`${p.title} interface`} loading="lazy" />
        </span>
      </div>

      <div className="wcard-text">
        <div className="wcard-top">
          <span className="num wcard-n">{p.id}</span>
          <span className="tag wcard-kind">{p.kind}</span>
        </div>

        <h3 ref={titleRef} className="wcard-title display">{p.title}</h3>
        <p className="wcard-desc">{p.desc}</p>

        <ul className="wcard-points">
          {p.details.slice(0, 3).map((d) => (
            <li key={d}><span className="wcard-bar" aria-hidden="true" />{d}</li>
          ))}
        </ul>

        <ul className="wcard-tech">
          {p.tech.map((t) => <li key={t} className="tag">{t}</li>)}
        </ul>
      </div>
    </article>
  );
};

const Work = () => {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const ruleRef = useRef(null);
  const fillRef = useRef(null);
  const [stacked, setStacked] = useState(() => !wantsRail());
  const [active, setActive] = useState(0);

  useEffect(() => cleanup([drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' })]), []);

  /* The gallery runs sideways while the page runs down: the section pins
     and the scroll distance is exactly the track's overflow, so a turn of
     the wheel moves the cards the same distance it would move the page. */
  useEffect(() => {
    const canRun = wantsRail();
    setStacked(!canRun);
    if (!canRun) return undefined;

    const ctx = gsap.context(() => {
      const track = trackRef.current;
      const cards = Array.from(track.querySelectorAll('.wcard'));
      const overflow = () => Math.max(1, track.scrollWidth - track.parentElement.clientWidth);

      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: () => `+=${overflow()}`,
        pin: stageRef.current,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set(track, { x: -overflow() * self.progress });
          gsap.set(fillRef.current, { scaleX: self.progress });
          setActive(Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1))));

          // Each image drifts against its card as the card crosses the
          // screen, which gives the sideways travel some depth.
          const w = window.innerWidth;
          cards.forEach((card) => {
            const r = card.getBoundingClientRect();
            const off = gsap.utils.clamp(-1, 1, ((r.left + r.width / 2) / w - 0.5) * 2);
            gsap.set(card.querySelector('.wcard-img'), { xPercent: off * -5, scale: 1.1 });
          });
        },
      });
      return () => st.kill();
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="work" className={`block work ${stacked ? 'is-stacked' : 'is-rail'}`} data-tone="paper">
      <div className="work-stage" ref={stageRef}>
        <div className="shell">
          <div className="sec-head">
            <span className="eyebrow">03 — Selected work</span>
            <span className="rule" ref={ruleRef} />
            {/* Nothing advances when the cards are stacked, so a live
                position counter would be a number that never moves. */}
            <span className="mono work-count">
              {stacked ? (
                `${PROJECTS.length} projects`
              ) : (
                <>
                  <span className="work-count-n">{String(active + 1).padStart(2, '0')}</span>
                  {` / ${String(PROJECTS.length).padStart(2, '0')}`}
                </>
              )}
            </span>
          </div>
        </div>

        <div className="work-viewport">
          <div className="work-track" ref={trackRef}>
            {PROJECTS.map((p, i) => (
              <Card key={p.id} p={p} index={i} tone={TONES[i % TONES.length]} stacked={stacked} />
            ))}
          </div>
        </div>

        <div className="shell work-rail" aria-hidden="true">
          <span className="work-rail-track"><span className="work-rail-fill" ref={fillRef} /></span>
          <span className="mono work-hint">Scroll →</span>
        </div>
      </div>

      <style>{`
        .work { padding-block: var(--bay); }
        /* The pinned stage is already a full viewport tall; the block's own
           bay would just add dead cream above the first card. */
        .work.is-rail { padding-block: 0; }
        .work-stage { display: flex; flex-direction: column; justify-content: center; gap: clamp(1.25rem, 3vh, 2rem); }
        .work.is-rail .work-stage { min-height: 100svh; }

        .work-count { color: var(--ink-3); white-space: nowrap; }
        .work-count-n { color: var(--ink); font-weight: 500; }

        .work-viewport { overflow: hidden; }
        .work-track {
          display: flex;
          gap: clamp(1rem, 2.5vw, 2rem);
          padding-inline: var(--gutter);
          width: max-content;
          will-change: transform;
        }

        .wcard {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(1.25rem, 3vw, 2.5rem);
          align-items: center;
          width: min(1080px, 84vw);
          padding: clamp(1.25rem, 2.6vw, 2.25rem);
          border-radius: clamp(20px, 2.6vw, 34px);
          border: 1px solid var(--line);
        }

        .wcard-media { min-width: 0; }
        .wcard-frame {
          display: block;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          border-radius: clamp(14px, 1.6vw, 22px);
          background: var(--paper-3);
        }
        .wcard-img { width: 100%; height: 100%; object-fit: cover; will-change: transform; }

        .wcard-text { display: flex; flex-direction: column; gap: 0.85rem; min-width: 0; }
        .wcard-top { display: flex; align-items: center; gap: 0.8rem; }
        .wcard-n { font-size: clamp(1.1rem, 2vw, 1.5rem); font-weight: 600; }
        .wcard-kind { background: color-mix(in srgb, var(--ink) 7%, transparent); border-color: transparent; }

        .wcard-title {
          margin: 0;
          font-size: clamp(1.6rem, 3.2vw, 2.7rem);
          letter-spacing: -0.04em;
        }
        .wcard-desc { color: var(--ink-2); font-size: var(--step--1); line-height: 1.6; max-width: 46ch; }

        .wcard-points { display: flex; flex-direction: column; gap: 0.6rem; }
        .wcard-points li {
          display: flex;
          gap: 0.75rem;
          color: var(--ink-2);
          font-size: var(--step--2);
          line-height: 1.6;
        }
        .wcard-bar { flex: none; width: 12px; height: 2px; margin-top: 0.75em; border-radius: 2px; background: var(--mark); }

        .wcard-tech { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.2rem; }
        .wcard-tech .tag { border-color: color-mix(in srgb, var(--ink) 22%, transparent); }

        /* ---- progress rail ---- */
        .work-rail { display: flex; align-items: center; gap: 1rem; }
        .work-rail-track { flex: 1; height: 2px; border-radius: 2px; background: var(--line); overflow: hidden; }
        .work-rail-fill {
          display: block;
          height: 100%;
          background: var(--mark);
          transform: scaleX(0);
          transform-origin: left;
        }
        .work-hint { color: var(--ink-3); white-space: nowrap; }

        /* ---- stacked: phones and reduced motion ---- */
        .work.is-stacked .work-viewport { overflow: visible; }
        .work.is-stacked .work-track {
          flex-direction: column;
          width: auto;
          max-width: var(--shell);
          margin-inline: auto;
          gap: clamp(1.25rem, 4vh, 2rem);
        }
        .work.is-stacked .wcard { width: auto; grid-template-columns: 1fr; }
        .work.is-stacked .wcard-frame { aspect-ratio: 16 / 10; }
        .work.is-stacked .work-rail { display: none; }
      `}</style>
    </section>
  );
};

export default Work;
