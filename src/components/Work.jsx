import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap, maskLines, riseIn, drawRule, reduced, cleanup } from '../lib/motion';

/* Each tile carries its own column span, so the grid is composed rather
   than uniform — the newest systems get the room they need and the older
   ones sit as a row of footnotes underneath. */
const PROJECTS = [
  {
    id: 'finmcp',
    n: '01',
    title: 'FinMCP',
    kind: 'Model Context Protocol platform',
    meta: 'Full-stack · live',
    tone: 'lilac',
    span: 7,
    img: '/finmcp.webp',
    desc: 'A personal finance platform whose business logic is an MCP server. The web app, Claude Desktop and the in-app agent are all clients of the same ledger.',
    lead: 'Most AI features are bolted onto a finished product. FinMCP inverts that: the ledger, the rules and every operation on them live in an MCP server, and the web app is simply the first client to connect. Claude Desktop, Claude Code and Cursor are the others, and none of them gets a weaker version of the app.',
    details: [
      'Shipped the whole feature set as 34 MCP tools, 13 resources and 4 prompts, so every client — browser, in-app assistant, Claude Desktop, Claude Code, Cursor — gets identical capability with no duplicated logic.',
      'Used the protocol properly rather than just its tool calls: elicitation asks the user to confirm low-confidence categories and deletes, sampling categorises unknown merchants without the server ever holding an API key, roots sandboxes file imports, and resource subscriptions refresh every other client the moment one of them writes.',
      'Pushed multi-tenant isolation into Postgres row-level security — every request runs as the caller’s account, so no tool can reach another account’s rows — and stamped each write with the client that made it, which surfaces in the app as an audit trail.',
      'Wrote the finance logic as server services: deduplicated statement, receipt and SMS imports, a categoriser that learns from corrections, budgets projected to month-end, automatic subscription and recurring-bill detection, EMI tracking, savings goals, month-over-month trend reports and guarded read-only SQL.',
      'Built a streaming chat assistant that calls the MCP tools and shows each call as it happens, including logged-out live demos.',
      'Built the front end for touch as well as desktop: a page that visualises the MCP architecture with live message traces, a drag-pinch-rotate photo cropper, animated charts, and layouts that hold from a 320px phone upward.',
      'Added passkey and password sign-in on Supabase Auth, per-client API tokens for external AI clients, response caching and parallel queries against the cross-region database, behind 220+ pytest tests.',
    ],
    tech: ['MCP', 'Python', 'FastAPI', 'PostgreSQL', 'Supabase', 'React 19', 'TypeScript', 'Motion', 'Vercel', 'Render'],
    links: [{ label: 'Live app', href: 'https://fin-mcp-eight.vercel.app/' }],
  },
  {
    id: 'trailhead',
    n: '02',
    title: 'Trailhead',
    kind: 'AI codebase onboarding',
    meta: 'Full-stack · live',
    tone: 'cyan',
    span: 5,
    img: '/trailhead.jpg',
    desc: 'Point it at any public GitHub repository and it finds you a way in — cited answers, reading tours, and the issues worth a first contribution.',
    lead: 'Joining a codebase is mostly navigation, not programming. Trailhead reads a repository the way a patient colleague would: it answers questions with the commit, pull request or discussion behind each claim, plans a step-by-step reading order for whatever you are trying to do, and ranks the open issues that suit a newcomer.',
    details: [
      'Built an ingestion pipeline that parses code into files, symbols and import graphs, then links commits, pull requests and issues to the files they touch.',
      'Kept the security posture explicit: repository code is only ever read, never executed, and secrets are redacted before any text reaches a model.',
      'Designed a hybrid AI setup — a structured decision engine makes the routing, navigation and ranking calls and the LLM only writes the prose, so every answer traces back to the step that produced it.',
      'Wrote 130+ tests plus an evaluation harness covering prompt injection and “why was this built this way” questions.',
      'Built the app in React 19 and Vite with Supabase auth (GitHub, Google, email, passkeys): an interactive repository map, a code viewer, a symbol outline and line-range links back to GitHub.',
      'Added real-time phone pairing over Supabase Realtime, turning a phone into a remote for the dashboard — trackpad, scrolling, text selection, right-click and link hand-off between devices.',
      'Deployed the API on Render and the web app on Vercel with continuous deployment; onboarded repositories are snapshotted to Supabase Storage so they survive redeploys, and open tabs are offered an in-app update when a new build ships.',
    ],
    tech: ['React', 'TypeScript', 'Python', 'FastAPI', 'Supabase', 'Groq', 'Vercel', 'Render'],
    links: [{ label: 'Live app', href: 'https://trail-head-tau.vercel.app' }],
  },
  {
    id: 'swarm',
    n: '03',
    title: 'Swarm',
    kind: 'Multi-agent repository maintenance',
    meta: 'Agents · A2A + MCP',
    tone: 'acid',
    span: 5,
    img: '/swarm.jpg',
    desc: 'Four specialised agents that triage, fix, test and review GitHub issues — and never merge anything without a human.',
    lead: 'Swarm takes the least glamorous part of maintaining a repository — tests that fail at random — and gives it a crew. Four LLM agents run as separate Agent2Agent services, find the next peer by skill, and hand work along a state-machine task board with streamed progress. A human stands at the end of it, and nothing merges without them.',
    details: [
      'Built four specialised agents — Triager, Coder, Tester, Reviewer — each a separate A2A service that discovers the next peer by skill rather than by hard-coded wiring.',
      'Aimed the system at flaky tests specifically: the Tester writes its own harness, proves it catches the bug on the old code and passes on the fix, then files it in a searchable registry for later tasks.',
      'Ran every agent-generated change in a sandboxed Docker container with no network access and hard resource limits; the worker runs on GitHub Actions and is started on demand by a FastAPI hub on Render.',
      'Opened real pull requests through GitHub OAuth, with the human-gated task board as the only path to a merge.',
      'Built an LLM layer that falls back across providers — Groq, Gemini, OpenRouter, Anthropic, with optional local Ollama — and combined model verdicts with heuristics, routing low-confidence decisions to a human.',
      'Exposed the whole system twice over: as an MCP server usable from Claude and other MCP clients, and as a public A2A agent.',
      'Locked the client down with passkey (WebAuthn) sign-in and Firestore rules that stop the browser moving a task on its own.',
      'Built the dashboard in React and TypeScript: live task board, charts, notifications, scroll-driven SVG motion graphics and a custom design system, shipped with a Firebase deploy script, GitHub Actions CI and a 65-test pytest suite.',
    ],
    tech: ['Python', 'FastAPI', 'A2A', 'MCP', 'React 19', 'TypeScript', 'Firebase', 'Docker', 'GitHub Actions', 'Render'],
    links: [
      { label: 'Live app', href: 'https://swarm-4ce56.web.app' },
      { label: 'GitHub', href: 'https://github.com/FrozenFalcon-Byte/Swarm' },
    ],
  },
  {
    id: 'risk',
    n: '04',
    title: 'Construction Risk Predictor',
    kind: 'Retrieval-augmented generation',
    meta: 'RAG · deployed',
    tone: 'paper',
    span: 7,
    img: '/Risk.png',
    desc: 'A dual-database RAG system that predicts construction violations, stop-work orders and safety risks before they land.',
    lead: 'A retrieval system that knows when it does not know. Given a project it has never seen, it declines rather than inventing a plausible risk profile — which, for a safety tool, is the only acceptable failure mode.',
    details: [
      'Engineered a retrieval confidence filter on normalised vector distance, dropping into a low-confidence mode for unseen projects so the model declines rather than hallucinates.',
      'Split the schema in two — the LLM’s raw generation target and the API’s output model — so a malformed generation never breaks JSON parsing downstream.',
      'Matched backend query templates to the structural formatting of the vectorised chunks, which moved historical match accuracy sharply upward.',
      'Containerised the Python, SQLite and ChromaDB environment and shipped it to Hugging Face Spaces.',
    ],
    tech: ['React', 'FastAPI', 'ChromaDB', 'SQLite', 'LangChain', 'Gemini', 'Docker'],
    links: [],
  },
  {
    id: 'billing',
    n: '05',
    title: 'Business Billing',
    kind: 'Full-stack platform',
    meta: 'SimpleSight Solutions · Nov 2025',
    tone: 'lilac',
    span: 4,
    img: '/image.png',
    desc: 'Invoicing, receipts, role-based access and analytics for small businesses on a single Postgres tenant model.',
    lead: 'Built for SimpleSight Solutions Pvt. Ltd.: the billing surface a small business actually touches every day, with the tenancy and permission model underneath it done properly the first time.',
    details: [
      'Architected role-based access control for secure tenant isolation across every table.',
      'Built real-time dashboard analytics on complex PostgreSQL aggregations.',
      'Automated receipt and PDF invoice generation, ledger updates and the email delivery pipeline behind them.',
    ],
    tech: ['React', 'Supabase', 'PostgreSQL'],
    links: [],
  },
  {
    id: 'imageproc',
    n: '06',
    title: 'Image Processor',
    kind: 'Computer vision + multimodal',
    meta: 'Python · Streamlit',
    tone: 'cyan',
    span: 4,
    img: '/img.png',
    desc: 'OCR, background removal and AI summarisation of visual data, wrapped in one tool.',
    lead: 'One place to take a messy image and get something structured out of it — text, a cut-out subject, or a written report on what the picture contains.',
    details: [
      'Built an automated background removal pipeline using segmentation-based computer vision.',
      'Integrated Tesseract OCR for high-accuracy extraction from dense document images.',
      'Connected multimodal LLM APIs to turn visual data into structured written reports.',
    ],
    tech: ['Python', 'Streamlit', 'Tesseract'],
    links: [],
  },
  {
    id: 'nature',
    n: '07',
    title: 'Nature Scene Classifier',
    kind: 'Deep learning',
    meta: 'TensorFlow · 94% val',
    tone: 'acid',
    span: 4,
    img: '/nature.jpeg',
    desc: 'A convolutional network trained on augmented landscape data, deployed as a live inference app.',
    lead: 'A straightforward supervised problem done carefully: the interesting work was in the augmentation, which is what stopped the network memorising a narrow set of landscapes.',
    details: [
      'Designed and trained a deep CNN reaching 94% validation accuracy.',
      'Applied heavy augmentation to stop the model overfitting a narrow landscape set.',
      'Packaged the inference engine behind an interactive Streamlit front end.',
    ],
    tech: ['TensorFlow', 'Keras', 'CNN'],
    links: [],
  },
];

/* Where an open panel settles. Computed rather than read back from CSS,
   so the opening tween has a real target before the panel is painted. */
const panelRect = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = vw < 720 ? 12 : Math.min(56, vw * 0.045);
  const width = Math.min(1180, vw - pad * 2);
  const height = Math.min(900, vh - pad * 2);
  return { left: (vw - width) / 2, top: (vh - height) / 2, width, height };
};

/* ------------------------------------------------------------------
   The splash.

   It grows out of the tile that was clicked — same image, same corner,
   expanding into the panel — so the whole thing reads as the card
   unfolding rather than a modal arriving from somewhere else.
   ------------------------------------------------------------------ */
const Splash = ({ index, from, onClose, onStep }) => {
  const p = PROJECTS[index];
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const bodyRef = useRef(null);
  const mediaRef = useRef(null);
  const sweepRef = useRef(null);
  const closeRef = useRef(null);
  const openedRef = useRef(false);
  const titleId = useId();

  /* Open. */
  useEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return undefined;

    const to = panelRect();

    if (reduced()) {
      gsap.set(panel, to);
      gsap.set(backdrop, { opacity: 1 });
      openedRef.current = true;
      closeRef.current?.focus();
      return undefined;
    }

    const tl = gsap.timeline({ onComplete: () => { openedRef.current = true; } });

    tl.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'none' }, 0)
      .fromTo(panel, { ...from, borderRadius: 20 }, { ...to, borderRadius: 26, duration: 0.74, ease: 'swift' }, 0)
      .fromTo(mediaRef.current, { scale: 1.18 }, { scale: 1, duration: 1.1, ease: 'swift' }, 0)
      .fromTo(sweepRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'glide' }, 0.08)
      .fromTo('.splash-text > *', { y: 26, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, stagger: 0.045, ease: 'swift',
      }, 0.26)
      .add(() => closeRef.current?.focus(), 0.5);

    return () => tl.kill();
    // `from` identifies the flight, and changing it mid-open would restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Close: back into whatever rect the tile occupies now. */
  const close = useCallback(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop || reduced()) { onClose(); return; }

    gsap.killTweensOf([panel, backdrop, bodyRef.current, mediaRef.current]);
    gsap.timeline({ onComplete: onClose })
      .to(bodyRef.current, { opacity: 0, duration: 0.2, ease: 'none' }, 0)
      .to(panel, { ...from, borderRadius: 20, duration: 0.58, ease: 'swift' }, 0.04)
      .to(backdrop, { opacity: 0, duration: 0.46, ease: 'none' }, 0.12);
  }, [from, onClose]);

  /* Stepping between projects: the panel holds still, the contents change. */
  useEffect(() => {
    if (!openedRef.current || reduced()) return undefined;
    const tl = gsap.timeline();
    tl.fromTo(bodyRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: 'swift' })
      .fromTo(mediaRef.current, { scale: 1.1 }, { scale: 1, duration: 0.85, ease: 'swift' }, 0)
      .fromTo(sweepRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'glide' }, 0);
    return () => tl.kill();
  }, [index]);

  /* Keys and page scroll belong to the panel while it is up. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') onStep(1);
      else if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    window.lenis?.stop();

    return () => {
      window.removeEventListener('keydown', onKey);
      window.lenis?.start();
    };
  }, [close, onStep]);

  /* A resize while it is open would leave it sized for the old viewport. */
  useEffect(() => {
    const onResize = () => gsap.set(panelRef.current, panelRect());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return createPortal(
    <div className="splash-root" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="splash-backdrop" ref={backdropRef} onClick={close} />

      <div className="splash-panel" ref={panelRef} data-tone="paper">
        <span className="splash-sweep" ref={sweepRef} aria-hidden="true" />

        <div className="splash-chrome">
          <span className="num splash-n">{p.n} / {String(PROJECTS.length).padStart(2, '0')}</span>
          <div className="splash-steps">
            <button type="button" onClick={() => onStep(-1)} aria-label="Previous project">
              <ChevronLeft size={17} strokeWidth={2.4} />
            </button>
            <button type="button" onClick={() => onStep(1)} aria-label="Next project">
              <ChevronRight size={17} strokeWidth={2.4} />
            </button>
            <button type="button" ref={closeRef} onClick={close} aria-label="Close project" className="splash-x">
              <X size={17} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <div className="splash-body" ref={bodyRef}>
          <div className="splash-media" data-tone={p.tone}>
            <img ref={mediaRef} src={p.img} alt={`${p.title} interface`} />
          </div>

          <div className="splash-text" data-lenis-prevent>
            <span className="tag splash-kind">{p.kind}</span>
            <h2 id={titleId} className="display splash-title">{p.title}</h2>
            <span className="mono splash-meta">{p.meta}</span>

            <p className="lead splash-lead">{p.lead}</p>

            <ul className="splash-points">
              {p.details.map((d) => (
                <li key={d}><span className="splash-bar" aria-hidden="true" />{d}</li>
              ))}
            </ul>

            <ul className="splash-tech">
              {p.tech.map((t) => <li key={t} className="tag">{t}</li>)}
            </ul>

            {p.links.length > 0 && (
              <div className="splash-links">
                {p.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="btn splash-link">
                    {l.label}
                    <ArrowUpRight size={16} strokeWidth={2.4} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const Tile = ({ p, i, onOpen }) => {
  const rootRef = useRef(null);

  useEffect(() => cleanup([
    riseIn(rootRef.current, { trigger: rootRef.current, start: 'top 92%', y: 36, delay: (i % 3) * 0.05 }),
  ]), [i]);

  return (
    <button
      type="button"
      ref={rootRef}
      className="tile"
      onClick={() => onOpen(i, rootRef.current)}
      aria-label={`Open ${p.title}`}
    >
      <span className="tile-media">
        <img src={p.img} alt="" loading="lazy" />
      </span>

      <span className="tile-foot">
        <span className="tile-top">
          <span className="num tile-n">{p.n}</span>
          <span className="tag tile-kind">{p.kind}</span>
        </span>

        <span className="display tile-title">{p.title}</span>
        <span className="tile-desc">{p.desc}</span>

        <span className="tile-open mono">
          Open
          <ArrowUpRight size={15} strokeWidth={2.6} />
        </span>
      </span>
    </button>
  );
};

const Work = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const headRef = useRef(null);

  const [open, setOpen] = useState(null);   // { index, from }
  const returnRef = useRef(null);           // the tile that opened it

  useEffect(() => {
    const fns = [
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' }),
      maskLines(headRef.current, { trigger: rootRef.current, start: 'top 76%', stagger: 0.08 }),
    ];
    return cleanup(fns);
  }, []);

  const openAt = (index, el) => {
    returnRef.current = el;
    const r = el.getBoundingClientRect();
    setOpen({ index, from: { top: r.top, left: r.left, width: r.width, height: r.height } });
  };

  /* Stepping re-aims the closing flight at the tile the reader has
     actually arrived at, so the panel never folds back into the wrong card. */
  const step = useCallback((dir) => {
    setOpen((o) => {
      if (!o) return o;
      const index = (o.index + dir + PROJECTS.length) % PROJECTS.length;
      const el = document.getElementById(`tile-${PROJECTS[index].id}`);
      const r = el?.getBoundingClientRect();
      return {
        index,
        from: r && r.width ? { top: r.top, left: r.left, width: r.width, height: r.height } : o.from,
      };
    });
  }, []);

  /* Focus goes back to the card the reader actually arrived at, not the
     one they started from — it should land where the panel folds to. */
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`tile-${PROJECTS[open.index].id}`);
    const btn = el?.querySelector('.tile');
    if (btn) returnRef.current = btn;
  }, [open]);

  const close = useCallback(() => {
    setOpen(null);
    returnRef.current?.focus();
  }, []);

  return (
    <section ref={rootRef} id="work" className="block work" data-tone="paper">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">03 — Selected work</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono work-count">{PROJECTS.length} projects</span>
        </div>

        <h2 ref={headRef} className="display display--l work-lede">
          Seven systems.<br />Open any of them.
        </h2>

        <div className="mosaic">
          {PROJECTS.map((p, i) => (
            <div key={p.id} id={`tile-${p.id}`} className="mosaic-cell" style={{ '--span': p.span }}>
              <Tile p={p} i={i} onOpen={openAt} />
            </div>
          ))}
        </div>
      </div>

      {/* No key on Splash: stepping between projects must keep the same
          instance alive, or the panel would re-fly from the tile each time. */}
      {open && (
        <Splash
          index={open.index}
          from={open.from}
          onClose={close}
          onStep={step}
        />
      )}

      <style>{`
        .work-count { color: var(--ink-3); white-space: nowrap; }
        .work-lede { margin: 0 0 clamp(2.5rem, 7vh, 4rem); max-width: 16ch; letter-spacing: -0.04em; }

        /* ---- mosaic ---- */
        .mosaic {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: clamp(0.75rem, 1.6vw, 1.4rem);
        }
        .mosaic-cell { grid-column: span var(--span); min-width: 0; }

        .tile {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          padding: clamp(0.7rem, 1.1vw, 1rem);
          text-align: left;
          border-radius: clamp(18px, 2vw, 26px);
          border: 1px solid var(--line);
          background: var(--paper);
          cursor: pointer;
          overflow: hidden;
          transition:
            border-color 0.45s var(--ease-out),
            background 0.45s var(--ease-out),
            transform 0.5s var(--ease-out);
        }
        .tile:hover { border-color: var(--mark); background: var(--paper-2); transform: translateY(-4px); }
        .tile:focus-visible { outline-offset: 4px; }

        .tile-media {
          position: relative;
          display: block;
          aspect-ratio: 16 / 10;
          border-radius: clamp(12px, 1.4vw, 18px);
          overflow: hidden;
          background: var(--paper-3);
          flex: none;
        }
        .tile-media img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.9s var(--ease-out);
        }
        .tile:hover .tile-media img { transform: scale(1.05); }

        .tile-foot {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          flex: 1;
          padding: clamp(0.9rem, 1.6vw, 1.25rem) clamp(0.35rem, 0.8vw, 0.6rem) clamp(0.3rem, 0.6vw, 0.5rem);
        }
        .tile-top { display: flex; align-items: center; gap: 0.65rem; min-width: 0; }
        .tile-n { color: var(--mark); font-size: var(--step--2); font-weight: 600; flex: none; }
        .tile-kind {
          background: color-mix(in srgb, var(--ink) 7%, transparent);
          border-color: transparent;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tile-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(1.25rem, 2.4vw, 2rem);
          letter-spacing: -0.035em;
          line-height: 1.05;
        }
        .tile-desc {
          color: var(--ink-2);
          font-size: var(--step--1);
          line-height: 1.6;
          max-width: 46ch;
        }
        .tile-open {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: auto;
          padding-top: 0.75rem;
          color: var(--ink-3);
          font-size: var(--step--2);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          transition: color 0.4s var(--ease-out), gap 0.4s var(--ease-out);
        }
        .tile:hover .tile-open { color: var(--mark); gap: 0.65rem; }

        /* ---- splash ---- */
        .splash-root { position: fixed; inset: 0; z-index: 9000; }
        .splash-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(10, 10, 14, 0.62);
          backdrop-filter: blur(10px) saturate(0.9);
          -webkit-backdrop-filter: blur(10px) saturate(0.9);
        }
        .splash-panel {
          position: absolute;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 26px;
          border: 1px solid var(--line);
          background: var(--paper);
          box-shadow: 0 40px 120px rgba(0, 0, 0, 0.45);
          will-change: top, left, width, height;
        }
        .splash-sweep {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--mark);
          transform: scaleX(0);
          transform-origin: left;
          z-index: 4;
        }

        .splash-chrome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: clamp(0.85rem, 1.6vw, 1.1rem) clamp(0.9rem, 1.8vw, 1.4rem);
          border-bottom: 1px solid var(--line);
          flex: none;
        }
        .splash-n { color: var(--ink-3); font-size: var(--step--2); letter-spacing: 0.1em; }
        .splash-steps { display: flex; gap: 0.4rem; }
        .splash-steps button {
          display: grid;
          place-items: center;
          width: 34px; height: 34px;
          border-radius: 999px;
          border: 1px solid var(--line);
          color: var(--ink-2);
          cursor: pointer;
          transition: color 0.3s var(--ease-out), border-color 0.3s var(--ease-out), background 0.3s var(--ease-out);
        }
        .splash-steps button:hover { color: var(--ink); border-color: var(--mark); }
        .splash-x:hover { background: var(--mark); border-color: var(--mark); color: #FFF; }

        .splash-body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          flex: 1;
          min-height: 0;
        }
        .splash-media {
          position: relative;
          overflow: hidden;
          background: var(--paper-2);
          border-right: 1px solid var(--line);
        }
        .splash-media img {
          width: 100%; height: 100%;
          object-fit: cover;
          will-change: transform;
        }

        .splash-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
          padding: clamp(1.25rem, 2.6vw, 2.25rem);
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
        }
        .splash-text::-webkit-scrollbar { width: 5px; }
        .splash-text::-webkit-scrollbar-thumb { background: var(--line); border-radius: 99px; }

        .splash-kind { background: color-mix(in srgb, var(--mark) 14%, transparent); border-color: transparent; color: var(--mark); }
        .splash-title { margin: 0; font-size: clamp(1.9rem, 4vw, 3.2rem); letter-spacing: -0.045em; }
        .splash-meta { color: var(--ink-3); }
        .splash-lead { max-width: 54ch; margin-top: 0.4rem; }

        .splash-points { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 0.6rem; }
        .splash-points li {
          display: flex;
          gap: 0.85rem;
          align-items: baseline;
          color: var(--ink-2);
          font-size: var(--step--1);
          line-height: 1.65;
        }
        .splash-bar { flex: none; width: 13px; height: 2px; border-radius: 2px; background: var(--mark); }

        .splash-tech { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.8rem; }
        .splash-links { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1rem; }
        .splash-link { padding: 0.75em 1.2em; font-size: var(--step--1); }

        /* ---- narrower ---- */
        @media (max-width: 1100px) {
          .mosaic-cell { grid-column: span 6; }
        }
        @media (max-width: 920px) {
          .splash-body { grid-template-columns: 1fr; grid-template-rows: minmax(0, 0.8fr) minmax(0, 1.2fr); }
          .splash-media { border-right: 0; border-bottom: 1px solid var(--line); }
        }
        @media (max-width: 680px) {
          .mosaic-cell { grid-column: span 12; }
          .splash-body { grid-template-rows: minmax(0, 0.6fr) minmax(0, 1.4fr); }
        }
      `}</style>
    </section>
  );
};

export default Work;
