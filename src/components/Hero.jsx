import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Download } from 'lucide-react';
import {
  gsap, EASE, linesIn, scrambleHover, magnetic, reduced, cleanup,
} from '../lib/motion';
import Glyph from './Glyph';
import Mark from './Mark';

/* What the console is asked, on a loop. Each answer carries one marked
   phrase, and each exchange runs in its own accent. */
const RUNS = [
  {
    q: 'Where is he working right now?',
    a: ['At', '*Emerson,', 'as a PMO AI/ML intern — shipping two agent systems into production.'],
    src: 'experience · Dec 2025 — now',
    acc: 'blue',
  },
  {
    q: 'How does he do at university?',
    a: ['A', '*9.55 CGPA', 'in B.Tech CSE (AI/ML) at VIIT Pune, class of 2027.'],
    src: 'education · VIIT Pune',
    acc: 'yellow',
  },
  {
    q: 'Has he published anything?',
    a: ['Co-author of an', '*IEEE ICICIS 2026', 'paper on making language models check their own truthfulness.'],
    src: 'publications · IEEE',
    acc: 'pink',
  },
  {
    q: 'What has he actually shipped?',
    a: ['*Seven products', '— agent graphs, RAG, MCP servers and full-stack apps, end to end.'],
    src: 'projects · 7 entries',
    acc: 'lime',
  },
];
const STAGES = ['Guardrail', 'Intent', 'Retrieve', 'Answer'];

const words = (a) => a.flatMap((part) => (part.startsWith('*')
  ? [{ w: part.slice(1), hl: true }]
  : part.split(' ').map((w) => ({ w, hl: false }))));

/* ------------------------------------------------------------------
   Console — the hero's showreel, and a working demo of the thing he
   builds. A question types itself, the agent's four stages light one
   after the other with a charge running down the rail, and the answer
   streams in word by word with its key phrase marked. Then it clears
   and the next question, in the next accent, begins.
   ------------------------------------------------------------------ */
const Console = () => {
  const rootRef = useRef(null);
  const qRef = useRef(null);
  const [i, setI] = useState(0);
  const [live, setLive] = useState(false);
  const run = RUNS[i];

  // Start once the loader has gone, and only run while on screen.
  useEffect(() => {
    if (reduced()) return undefined;
    let io;
    const go = () => {
      io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.15 });
      io.observe(rootRef.current);
    };
    if (window.loaderIsDone) go();
    else window.addEventListener('loader-complete', go, { once: true });
    return () => { io?.disconnect(); window.removeEventListener('loader-complete', go); };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const q = qRef.current;
    if (reduced()) { q.textContent = run.q; return undefined; }
    const ws = root.querySelectorAll('.cs-w');
    const nodes = root.querySelectorAll('.cs-node');
    const meta = root.querySelectorAll('.cs-src, .cs-hl-bar');
    const typed = { n: 0 };

    gsap.set(ws, { opacity: 0, yPercent: 60 });
    gsap.set(meta, { opacity: 0 });
    root.style.setProperty('--run', 0);
    nodes.forEach((n) => n.classList.remove('is-on'));
    q.textContent = '';
    if (!live) return undefined;

    const tl = gsap.timeline({ onComplete: () => setI((n) => (n + 1) % RUNS.length) });
    tl.to(typed, {
      n: run.q.length,
      duration: run.q.length * 0.035,
      ease: 'none',
      onUpdate: () => { q.textContent = run.q.slice(0, Math.round(typed.n)); },
    }, 0.3);
    const t0 = tl.duration() + 0.15;
    STAGES.forEach((_, k) => {
      tl.add(() => nodes[k].classList.add('is-on'), t0 + k * 0.32);
    });
    tl.to(root, { '--run': 1, duration: STAGES.length * 0.32, ease: 'none' }, t0);
    const t1 = t0 + STAGES.length * 0.32;
    tl.to(ws, { opacity: 1, yPercent: 0, duration: 0.5, stagger: 0.045, ease: EASE.swift }, t1)
      .to(meta, { opacity: 1, duration: 0.5 }, t1 + 0.3)
      .to(ws, { opacity: 0, yPercent: -40, duration: 0.4, stagger: 0.01, ease: 'power2.in' }, '+=2.6')
      .to(meta, { opacity: 0, duration: 0.3 }, '<');
    return () => tl.kill();
  }, [i, live, run]);

  return (
    <div className="cs" ref={rootRef} data-surface="ink" data-acc={run.acc}>
      <div className="cs-bar">
        <span className="cs-who"><Mark className="cs-mark" />ajinkya<em>.agent</em></span>
        <span className="cs-live"><i />{live ? 'Running' : 'Idle'}</span>
      </div>

      <div className="cs-body">
        <div className="cs-main">
          <p className="cs-q">
            <span className="cs-q-k">Q</span>
            <span ref={qRef} className="cs-q-t" />
            <span className="cs-caret" aria-hidden="true" />
          </p>
          <p className="cs-a display" key={i}>
            {words(run.a).map((x, k) => (
              <span key={k} className={`cs-w${x.hl ? ' is-hl' : ''}`}>{x.w}</span>
            ))}
          </p>
          <span className="cs-src">from {run.src}</span>
        </div>

        <ol className="cs-graph" aria-hidden="true">
          <span className="cs-rail"><i /></span>
          {STAGES.map((s, k) => (
            <li key={s} className="cs-node">
              <span className="cs-node-n num">{k + 1}</span>
              <span className="cs-node-t">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <a className="cs-ask" href="#assistant" data-cursor-label="Ask it">
        Ask it yourself <ArrowUpRight size={16} strokeWidth={2.4} />
      </a>
    </div>
  );
};

/* ------------------------------------------------------------------
   Side — the empty half beside the name, put to work as a short
   timeline: where he is, what comes next, what he is open to. Each
   step is a stop on one rail in its own accent; the current one
   pulses. Above it, Pune's time with a ticking colon, so the page
   knows when it is being read.
   ------------------------------------------------------------------ */
const STEPS = [
  { k: 'Now', v: 'AI / ML intern', s: 'Emerson, PMO · since Dec ’25', acc: 'blue', live: true },
  { k: 'Next', v: 'B.Tech, AI / ML', s: 'VIIT Pune · class of 2027', acc: 'yellow' },
  { k: 'Open to', v: 'Full-time AI roles', s: 'Agents, RAG, ML systems', acc: 'lime' },
];

const Side = () => {
  const [hm, setHm] = useState(['--', '--']);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    const set = () => setHm(fmt.format(new Date()).split(':'));
    set();
    const id = setInterval(set, 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <aside className="hero-side" aria-label="Status">
      <p className="hs-clock">
        <span className="hs-city">Pune</span>
        <span className="num hs-time">{hm[0]}<i>:</i>{hm[1]}</span>
        <span className="hs-tz">IST</span>
      </p>
      <ol className="hs-steps">
        {STEPS.map((x) => (
          <li key={x.k} className={`hs-step${x.live ? ' is-live' : ''}`} data-acc={x.acc}>
            <span className="hs-dot" aria-hidden="true" />
            <span className="hs-k">{x.k}</span>
            <span className="display hs-v">{x.v}</span>
            <span className="hs-s">{x.s}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
};

const Hero = () => {
  const rootRef = useRef(null);
  const nameRef = useRef(null);
  const ledeRef = useRef(null);
  const ctaRef = useRef(null);

  /* Entrance, held until the loader has handed the logo to the nav. The
     name rises, its glyphs open and push the letters apart, and the
     console slides up into its peek below the fold line. */
  useEffect(() => {
    const root = rootRef.current;
    const glyphs = root.querySelectorAll('.hero-shell .glyph');
    const furniture = root.querySelectorAll('.hero-ctas, .hs-clock, .hs-step');
    const card = root.querySelector('.hero-reel');

    if (reduced()) return undefined;

    let start;
    const fns = [
      linesIn(nameRef.current, { play: (go) => { start = go; }, stagger: 0.1, duration: 1.2 }),
      linesIn(ledeRef.current, { play: (go) => { const prev = start; start = () => { prev(); go(); }; }, stagger: 0.08, delay: 0.35 }),
    ];
    gsap.set(glyphs, { '--open': 0 });
    gsap.set(furniture, { y: 24, opacity: 0 });
    gsap.set(card, { y: 160 });

    const play = () => {
      start?.();
      gsap.timeline({ defaults: { ease: EASE.swift } })
        .to(glyphs, { '--open': 1, duration: 1.1, stagger: 0.12, ease: EASE.glide }, 0.55)
        .to(furniture, { y: 0, opacity: 1, duration: 0.9, stagger: 0.09 }, 0.45)
        .to(card, { y: 0, duration: 1.3, ease: EASE.glide }, 0.5);
    };

    if (window.loaderIsDone) play();
    else window.addEventListener('loader-complete', play, { once: true });
    return () => {
      window.removeEventListener('loader-complete', play);
      cleanup(fns)();
    };
  }, []);

  /* On scroll the two halves of the name slide apart while the console
     grows out of its peek to the full width of the page, squaring its
     corners off as it arrives. */
  useEffect(() => {
    if (reduced()) return undefined;
    const root = rootRef.current;
    const st = { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 };
    const reel = root.querySelector('.hero-reel-in');
    const tweens = [
      gsap.to(root.querySelector('.hero-row--a'), { xPercent: -16, ease: 'none', scrollTrigger: st }),
      gsap.to(root.querySelector('.hero-row--b'), { xPercent: 12, ease: 'none', scrollTrigger: st }),
      gsap.fromTo(reel,
        { scale: 0.9, '--cs-r': '56px' },
        {
          scale: 1, '--cs-r': '28px', ease: 'none',
          scrollTrigger: { trigger: reel, start: 'top bottom', end: 'top 12%', scrub: 0.6 },
        }),
    ];
    return () => tweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
  }, []);

  useEffect(() => cleanup([
    scrambleHover(nameRef.current, { intro: false, radius: 90 }),
    magnetic(ctaRef.current, 0.22),
  ]), []);

  return (
    <section ref={rootRef} id="top" className="hero" data-acc="pink">
      <div className="hero-inner">
        <div className="shell hero-shell">
          <div className="hero-head">
          <h1 ref={nameRef} className="hero-name display display--hero">
            <span className="ln"><span className="ln-in hero-row hero-row--a">
              Ajinkya<Glyph kind="spark" acc="pink" />
            </span></span>
            <span className="ln"><span className="ln-in hero-row hero-row--b">
              Chavan<Glyph kind="graph" acc="blue" />
            </span></span>
          </h1>
          <Side />
          </div>

          <div className="hero-bottom">
            <p ref={ledeRef} className="hero-lede display">
              <span className="ln"><span className="ln-in">I build generative AI</span></span>
              <span className="ln"><span className="ln-in">
                <Glyph kind="type" acc="yellow" /> that actually
              </span></span>
              <span className="ln"><span className="ln-in">
                ships<Glyph kind="ship" acc="lime" /> to production.
              </span></span>
            </p>

            <div className="hero-ctas">
              <div className="hero-btns">
                <a className="btn btn--acc" href="#work" ref={ctaRef} data-cursor-label="See the work">
                  See the work
                  <ArrowDownRight size={17} strokeWidth={2.4} className="arrow" />
                </a>
                <a className="btn btn--ghost" href="/resume.pdf" download data-cursor-label="PDF">
                  Résumé
                  <Download size={16} strokeWidth={2.2} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shell hero-reel">
        <div className="hero-reel-in"><Console /></div>
      </div>

      <style>{`
        .hero { position: relative; }
        /* The text block is sized off the smaller of the viewport's width
           and height so it always fits, and it stops short of the bottom
           edge so the console's top is already showing on arrival. */
        .hero-inner {
          --peek: clamp(4.5rem, 14svh, 9rem);
          min-height: calc(100svh - var(--peek));
          display: flex;
          flex-direction: column;
          padding-block: clamp(5rem, 13svh, 7.5rem) clamp(1rem, 3.5svh, 2.25rem);
          overflow: hidden;
          background: var(--paper);
        }
        .hero-shell { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .hero-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; }

        /* ---- side timeline ---- */
        .hero-side { flex: none; width: clamp(15rem, 21vw, 21rem); padding-top: 0.6rem; }
        .hs-clock { display: flex; align-items: baseline; gap: 0.5rem; padding-bottom: 1rem; margin-bottom: 1.1rem; border-bottom: 1px solid var(--line-2); color: var(--ink-3); font-size: var(--step--1); }
        .hs-time { font-size: var(--step-2); color: var(--ink); letter-spacing: -0.03em; }
        .hs-time i { font-style: normal; animation: ex-blink 2s steps(2) infinite; }
        .hs-city { color: var(--ink-2); font-weight: 600; }
        .hs-tz { margin-left: auto; }
        .hs-steps { position: relative; display: grid; gap: clamp(0.9rem, 2.4svh, 1.4rem); }
        .hs-steps::before { content: ""; position: absolute; left: 6px; top: 0.6rem; bottom: 0.6rem; width: 2px; border-radius: 2px; background: var(--line-2); }
        .hs-step {
          position: relative;
          display: grid;
          grid-template-columns: 14px minmax(0, 1fr);
          column-gap: 1rem;
          cursor: default;
        }
        .hs-dot {
          grid-row: 1 / 4;
          position: relative;
          width: 14px; height: 14px; margin-top: 0.15rem;
          border-radius: 99px;
          background: var(--paper);
          border: 2.5px solid var(--acc);
          transition: background 0.3s, transform 0.5s var(--ease-out);
        }
        .hs-step.is-live .hs-dot { background: var(--acc); }
        .hs-step.is-live .hs-dot::after {
          content: ""; position: absolute; inset: -6px;
          border-radius: inherit; border: 2px solid var(--acc);
          animation: hs-ping 1.8s var(--ease-out) infinite;
        }
        @keyframes hs-ping { from { transform: scale(0.5); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
        .hs-k { font-size: var(--step--1); color: var(--ink-3); font-weight: 500; }
        .hs-v {
          justify-self: start;
          font-size: clamp(1.1rem, 1.55vw, 1.55rem); font-weight: 650; letter-spacing: -0.035em; line-height: 1.1;
          position: relative; z-index: 0;
        }
        .hs-v::after {
          content: ""; position: absolute; z-index: -1;
          left: -0.05em; right: -0.05em; bottom: 0.08em; height: 0.38em;
          background: var(--acc); border-radius: 0.08em;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.5s var(--ease-out);
        }
        .hs-s { font-size: var(--step--1); color: var(--ink-2); margin-top: 0.15rem; }
        .hs-step:hover .hs-dot { background: var(--acc); transform: scale(1.3); }
        .hs-step:hover .hs-v::after { transform: scaleX(1); }
        @media (max-width: 1180px) { .hero-side { display: none; } }

        .hero-name {
          margin: 0;
          font-size: clamp(2.8rem, min(13.4vw, 17.5svh), 14.5rem);
        }
        .hero-row { white-space: nowrap; will-change: transform; }
        .hero-row--b { padding-left: min(6vw, 9svh); }
        .hero-name .glyph { margin-inline: 0.08em; }

        .hero-bottom {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.8fr);
          gap: clamp(1.25rem, 4vw, 4rem);
          align-items: end;
          margin-top: clamp(1rem, 3.5svh, 2.5rem);
        }
        .hero-lede {
          font-size: clamp(1.3rem, min(3.1vw, 4.4svh), 3rem);
          font-weight: 650;
          line-height: 1.04;
          letter-spacing: -0.04em;
        }
        .hero-ctas { display: grid; gap: clamp(0.75rem, 2svh, 1.25rem); justify-items: end; text-align: right; }
        .hero-where { color: var(--ink-2); font-size: var(--step-0); line-height: 1.35; }
        .hero-btns { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: flex-end; }
        .hero-btns .btn { padding: min(0.95em, 1.6svh) 1.5em; }

        /* ---- the console ---- */
        .hero-reel { padding-bottom: var(--bay); }
        .hero-reel-in { transform-origin: 50% 0; will-change: transform; }
        .cs {
          --run: 0;
          position: relative;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: clamp(1.5rem, 4svh, 2.5rem);
          min-height: clamp(28rem, 74svh, 44rem);
          padding: clamp(1.25rem, 2.6vw, 2.25rem);
          border-radius: var(--cs-r, 28px);
          background: var(--paper);
          color: var(--ink);
          overflow: hidden;
        }
        .cs-bar { display: flex; justify-content: space-between; align-items: center; }
        .cs-who {
          display: inline-flex; align-items: center; gap: 0.55rem;
          font-family: var(--font-display); font-weight: 700; font-size: var(--step-0); letter-spacing: -0.03em;
        }
        .cs-who em { font-style: normal; color: var(--ink-3); }
        .cs-mark { width: 1.9rem; height: 1.9rem; padding: 0.3rem; border-radius: 99px; background: var(--ink); color: var(--paper); max-width: none; }
        .cs-live { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--ink-2); font-size: var(--step--1); font-weight: 500; }
        .cs-live i { width: 8px; height: 8px; border-radius: 99px; background: var(--acc); animation: ex-blink 1.4s steps(2) infinite; transition: background 0.5s; }

        .cs-body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) clamp(12rem, 20vw, 16rem);
          gap: clamp(1.5rem, 5vw, 5rem);
          align-items: center;
        }
        .cs-q { display: flex; align-items: baseline; gap: 0.7rem; font-size: var(--step-1); color: var(--ink-2); min-height: 1.4em; }
        .cs-q-k {
          flex: none; align-self: center;
          display: grid; place-items: center;
          width: 1.8rem; height: 1.8rem; border-radius: 99px;
          background: var(--acc); color: var(--acc-ink);
          font-family: var(--font-display); font-weight: 700; font-size: 0.85rem;
          transition: background 0.5s;
        }
        .cs-caret { width: 2px; height: 1.1em; align-self: center; background: var(--acc); animation: ex-blink 1s steps(2) infinite; margin-left: -0.5rem; }
        .cs-a {
          margin-top: clamp(1rem, 3svh, 1.75rem);
          font-size: clamp(1.7rem, 3.9vw, 3.9rem);
          font-weight: 650;
          line-height: 1.04;
          letter-spacing: -0.045em;
          max-width: 20ch;
          min-height: 3.2em;
        }
        .cs-w { display: inline-block; margin-right: 0.24em; }
        .cs-w.is-hl { position: relative; z-index: 0; }
        .cs-w.is-hl::after {
          content: ""; position: absolute; z-index: -1;
          left: -0.06em; right: -0.06em; bottom: 0.06em; height: 0.4em;
          background: var(--acc);
          border-radius: 0.08em;
        }
        .cs-src { display: block; margin-top: 1.1rem; color: var(--ink-3); font-size: var(--step--1); }

        .cs-graph { position: relative; display: grid; gap: 0.6rem; }
        .cs-rail { position: absolute; left: calc(1.15rem - 1.5px); top: 1.15rem; bottom: 1.15rem; width: 3px; border-radius: 3px; background: var(--paper-3); }
        .cs-rail i { position: absolute; inset: 0; border-radius: inherit; background: var(--acc); transform-origin: top; transform: scaleY(var(--run)); }
        .cs-node {
          position: relative;
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.0rem 1rem 0 0;
        }
        .cs-node-n {
          display: grid; place-items: center;
          width: 2.3rem; height: 2.3rem; flex: none;
          border-radius: 99px;
          background: var(--paper-3); color: var(--ink-3);
          font-size: 0.85rem;
          transition: background 0.4s var(--ease-out), color 0.4s, transform 0.5s var(--ease-out);
        }
        .cs-node-t { font-family: var(--font-display); font-weight: 650; font-size: var(--step-1); letter-spacing: -0.03em; color: var(--ink-3); transition: color 0.4s; }
        .cs-node.is-on .cs-node-n { background: var(--acc); color: var(--acc-ink); transform: scale(1.12); }
        .cs-node.is-on .cs-node-t { color: var(--ink); }

        .cs-ask {
          justify-self: start;
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-weight: 600;
          border-bottom: 1.5px solid var(--acc);
          padding-bottom: 0.1rem;
          transition: color 0.3s;
        }
        .cs-ask:hover { color: var(--acc); }

        @media (max-width: 860px) {
          .hero-bottom { grid-template-columns: minmax(0, 1fr); }
          .hero-ctas { justify-items: start; text-align: left; }
          .hero-btns { justify-content: flex-start; }
          .hero-row--b { padding-left: 0; }
          .cs-body { grid-template-columns: minmax(0, 1fr); }
          .cs-graph { grid-template-columns: repeat(4, auto); justify-content: start; gap: 0.4rem 1rem; }
          .cs-rail { display: none; }
          .cs-node-t { font-size: var(--step--1); }
          .cs-node-n { width: 1.8rem; height: 1.8rem; }
        }
        /* On a phone the name is the whole width; its glyphs would
           shrink it to a caption, so they step out and the type grows. */
        @media (max-width: 600px) {
          .hero-name { font-size: min(23vw, 14svh); }
          .hero-name .glyph { display: none; }
          .hero-lede { font-size: clamp(1.3rem, min(7vw, 4.2svh), 2rem); }
          .hero-where { display: none; }
          .cs-graph { grid-template-columns: repeat(2, auto); }
        }
        @media (max-height: 640px) { .hero-where { display: none; } }
      `}</style>
    </section>
  );
};

export default Hero;
