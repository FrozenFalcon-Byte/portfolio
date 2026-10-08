import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, heading, countTo, drawRule, reduced, cleanup } from '../lib/motion';
import Glyph from './Glyph';

/* Separate from Experience on purpose: a degree, a paper and a club role
   are not jobs. They share this section because they share a register —
   the things that are on the record rather than in production. */
const YEARS = [2023, 2024, 2025, 2026, 2027];

/* ------------------------------------------------------------------
   Each record is drawn as the object it is, not as a generic card:
   the degree is a counter and a run of years, the paper is a page,
   the club role is a roster, the certificates are stamped.
   ------------------------------------------------------------------ */
const Degree = () => {
  const ref = useRef(null);
  useEffect(() => cleanup([countTo(ref.current, 9.55, { trigger: ref.current, start: 'top 95%', decimals: 2 })]), []);
  const now = new Date().getFullYear();
  return (
    <article className="rc rc--degree" data-acc="yellow">
      <span className="eyebrow"><b>01</b>Education</span>
      <div className="rc-big">
        <span className="display rc-num" ref={ref}>9.55</span>
        <span className="rc-unit">CGPA<br />out of 10</span>
      </div>
      <h3 className="display rc-title">B.Tech, Computer Science &amp; Engineering (AI/ML)</h3>
      <p className="rc-org">Vishwakarma Institute of Information Technology, Pune</p>
      <ol className="rc-years" aria-label="2023 to 2027">
        {YEARS.map((y) => (
          <li key={y} className={y < now ? 'is-done' : y === now ? 'is-now' : ''}>
            <i /><span>{y === now ? 'now' : `’${String(y).slice(2)}`}</span>
          </li>
        ))}
      </ol>
    </article>
  );
};

const Paper = () => (
  <article className="rc rc--paper" data-acc="pink">
    <span className="eyebrow"><b>02</b>Publication</span>
    <div className="rc-page">
      <div className="rc-page-top">
        <span className="rc-venue">IEEE · ICICIS 2026</span>
        <Glyph kind="doc" acc="pink" />
      </div>
      <h3 className="display rc-page-title">
        Intrinsic Uncertainty Modeling for Pre-Output Truthfulness Control in Large Language Models
      </h3>
      <p className="rc-page-abs">
        Reading a model’s own uncertainty before it commits to an answer — and using that signal to
        govern truthfulness at generation time, rather than auditing it afterwards.
      </p>
      <span className="rc-lines" aria-hidden="true"><i /><i /><i /><i /></span>
    </div>
    <p className="rc-org">Co-author</p>
  </article>
);

const Club = () => (
  <article className="rc rc--club" data-acc="teal" data-surface="ink">
    <span className="eyebrow"><b>03</b>Leadership</span>
    <h3 className="display rc-title rc-title--xl">Tech Lead,<br />AIMSS Club</h3>
    <p className="rc-org">VIIT Pune · 2024 — 2026</p>
    <ul className="rc-does">
      <li><Glyph kind="spark" acc="teal" />Runs the AI/ML workshops</li>
      <li><Glyph kind="chat" acc="teal" />Mentors the juniors</li>
      <li><Glyph kind="ship" acc="teal" />Ships the club’s own ML projects</li>
    </ul>
  </article>
);

const Certs = () => (
  <article className="rc rc--certs" data-acc="violet">
    <span className="eyebrow"><b>04</b>Certified</span>
    <ul className="rc-stamps">
      <li>
        <span className="rc-stamp" aria-hidden="true"><Glyph kind="check" acc="violet" /></span>
        <strong className="display">CISCO CCNAv7</strong>
        <span>Introduction to Networks</span>
      </li>
      <li>
        <span className="rc-stamp" aria-hidden="true"><Glyph kind="check" acc="violet" /></span>
        <strong className="display">Machine &amp; Deep Learning</strong>
        <span>in Python and R</span>
      </li>
    </ul>
  </article>
);

const CARDS = [Degree, Paper, Club, Certs];

const Leadership = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const headRef = useRef(null);
  const sceneRef = useRef(null);
  const trackRef = useRef(null);
  const [wide, setWide] = useState(() => typeof window !== 'undefined'
    && window.matchMedia('(min-width: 961px)').matches && !reduced());

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 961px)');
    const on = () => setWide(mq.matches && !reduced());
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => cleanup([
    drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 84%' }),
    heading(headRef.current),
  ]), []);

  /* The records slide past on a pinned rail. Each card leans as it
     travels and straightens as it reaches the middle of the screen, so
     the one being read is always the one standing up. */
  useEffect(() => {
    const track = trackRef.current;
    const scene = sceneRef.current;
    if (!track || !scene) return undefined;
    const cards = Array.from(track.children);
    if (!wide) {
      const t = gsap.from(cards, {
        y: 60, opacity: 0, rotate: (i) => (i % 2 ? 3 : -3), duration: 1, stagger: 0.1, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: track, start: 'top 85%', once: true },
      });
      return () => { t.scrollTrigger?.kill(); t.kill(); };
    }

    const dist = () => track.scrollWidth - scene.clientWidth;
    const lean = () => {
      const mid = window.innerWidth / 2;
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        const d = (r.left + r.width / 2 - mid) / window.innerWidth;
        c.style.transform = `rotate(${(d * 9).toFixed(2)}deg) translateY(${(Math.abs(d) * 70).toFixed(1)}px)`;
      });
    };
    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
        onUpdate: lean,
        onRefresh: lean,
      },
    });
    lean();
    return () => { tween.scrollTrigger?.kill(); tween.kill(); cards.forEach((c) => { c.style.transform = ''; }); };
  }, [wide]);

  return (
    <section ref={rootRef} id="leadership" className="block record" data-acc="teal">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow"><b>06</b>On the record</span>
          <span className="rule" ref={ruleRef} />
        </div>
        <h2 ref={headRef} className="display display--l rec-head">
          <span className="ln"><span className="ln-in">The paperwork</span></span>
          <span className="ln"><span className="ln-in">behind it<Glyph kind="doc" acc="teal" /></span></span>
        </h2>
      </div>

      <div className={wide ? 'rec-scene' : 'shell'} ref={sceneRef}>
        <div className="rec-track" ref={trackRef}>
          {CARDS.map((C, i) => <C key={i} />)}
        </div>
      </div>

      <style>{`
        .record { overflow: clip; }
        .rec-head { margin-bottom: clamp(2rem, 6vh, 3.5rem); }

        .rec-scene { height: 100svh; display: flex; align-items: center; overflow: hidden; }
        .rec-track {
          display: flex;
          gap: clamp(1rem, 2vw, 1.75rem);
          padding-inline: max(var(--gutter), calc((100vw - var(--shell)) / 2 + var(--gutter)));
          will-change: transform;
        }
        .shell .rec-track { flex-direction: column; padding-inline: 0; }

        .rc {
          flex: none;
          width: clamp(20rem, 34vw, 31rem);
          min-height: clamp(26rem, 68svh, 36rem);
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          padding: clamp(1.4rem, 2.4vw, 2.1rem);
          border-radius: var(--r-xl);
          background: var(--paper-2);
          color: var(--ink);
          transform-origin: 50% 100%;
          will-change: transform;
        }
        .shell .rc { width: 100%; min-height: 0; }
        .rc-title { font-size: clamp(1.4rem, 2vw, 1.9rem); letter-spacing: -0.035em; line-height: 1.05; }
        .rc-title--xl { font-size: clamp(2.4rem, 4.4vw, 4rem); letter-spacing: -0.055em; line-height: 0.95; margin-top: auto; }
        .rc-org { color: var(--ink-2); }

        /* degree */
        .rc--degree { background: var(--acc); color: var(--acc-ink); }
        .rc--degree .eyebrow, .rc--degree .eyebrow b, .rc--degree .rc-org { color: inherit; }
        .rc--degree .eyebrow::after { background: var(--acc-ink); }
        .rc-big { display: flex; align-items: flex-end; gap: 0.8rem; margin-top: auto; }
        .rc-num { font-size: clamp(5rem, 10vw, 9rem); font-weight: 800; line-height: 0.8; letter-spacing: -0.07em; font-variant-numeric: tabular-nums; }
        .rc-unit { font-weight: 600; line-height: 1.15; padding-bottom: 0.4rem; }
        .rc-years { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 0.4rem; }
        .rc-years li { display: grid; gap: 0.4rem; font-size: var(--step--1); font-weight: 600; }
        .rc-years i { height: 10px; border-radius: 99px; border: 1.5px solid currentColor; }
        .rc-years .is-done i { background: currentColor; }
        .rc-years i { position: relative; overflow: hidden; }
        .rc-years .is-now i::after { content: ""; position: absolute; inset: 0; width: 55%; background: currentColor; animation: rc-fill 2.4s var(--ease-in-out) infinite alternate; }
        @keyframes rc-fill { from { width: 35%; } to { width: 70%; } }

        /* paper */
        .rc-page {
          position: relative;
          flex: 1;
          display: flex; flex-direction: column; gap: 0.9rem;
          padding: 1.4rem 1.4rem 1.6rem;
          border-radius: var(--r-m);
          background: var(--paper);
          box-shadow: 0 30px 50px -36px var(--shadow);
          rotate: -1.5deg;
        }
        .rc-page-top { display: flex; justify-content: space-between; align-items: center; }
        .rc-venue { font-weight: 700; color: var(--acc); }
        .rc-page-top .glyph { --open: 1; font-size: 2.2rem; }
        .rc-page-title { font-size: clamp(1.3rem, 1.7vw, 1.65rem); line-height: 1.08; letter-spacing: -0.035em; }
        .rc-page-abs { color: var(--ink-2); font-size: var(--step--1); line-height: 1.55; }
        .rc-lines { display: grid; gap: 7px; margin-top: auto; }
        .rc-lines i { height: 6px; border-radius: 6px; background: var(--paper-3); }
        .rc-lines i:nth-child(2) { width: 88%; } .rc-lines i:nth-child(3) { width: 94%; } .rc-lines i:nth-child(4) { width: 52%; }

        /* club */
        .rc--club { background: var(--paper); }
        .rc-does { display: grid; gap: 0.7rem; margin-top: 0.6rem; }
        .rc-does li { display: flex; align-items: center; gap: 0.7rem; font-weight: 550; font-size: var(--step-0); }
        .rc-does .glyph { --open: 1; font-size: 1.6rem; flex: none; }

        /* certs */
        .rc-stamps { display: grid; gap: 1rem; margin-top: auto; }
        .rc-stamps li {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          column-gap: 1rem;
          align-items: center;
          padding: 1.1rem;
          border-radius: var(--r-l);
          background: var(--paper);
        }
        .rc-stamp { grid-row: span 2; font-size: 2.6rem; }
        .rc-stamp .glyph { --open: 1; }
        .rc-stamps strong { font-size: var(--step-1); letter-spacing: -0.03em; line-height: 1.05; }
        .rc-stamps li > span:last-child { color: var(--ink-2); font-size: var(--step--1); }
      `}</style>
    </section>
  );
};

export default Leadership;
