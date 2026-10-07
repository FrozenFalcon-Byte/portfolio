import React, { useEffect, useRef } from 'react';
import { ArrowDownRight, Asterisk, Download } from 'lucide-react';
import { gsap, ScrollTrigger, EASE, reduced, fine } from '../lib/motion';

const TICKER = [
  'LangGraph', 'Retrieval-augmented generation', 'Multi-agent systems',
  'Azure OpenAI', 'FastAPI', 'React', 'TensorFlow', 'Docker',
];

const Hero = () => {
  const rootRef = useRef(null);
  const chipRefs = useRef([]);
  const asideRef = useRef(null);
  const tickerRef = useRef(null);
  const trackRef = useRef(null);

  /* Entrance. The name is deliberately absent from this timeline — the
     loader hands it over in place, so animating it again would make the
     visitor watch it arrive twice. Everything around it comes in once
     the loader has cleared. */
  useEffect(() => {
    const chips = chipRefs.current.filter(Boolean);
    const aside = asideRef.current;
    const status = rootRef.current.querySelector('.hero-status');
    const tagline = rootRef.current.querySelector('.hero-tagline');

    if (reduced()) {
      gsap.set([chips, aside, status, tagline, tickerRef.current],
        { yPercent: 0, y: 0, opacity: 1, scale: 1 });
      return undefined;
    }

    // The loader is carrying the name across; keep this copy hidden until
    // it lands, or the two overlap as a double exposure mid-flight.
    const lockup = rootRef.current.querySelector('.hero-lockup');
    if (!window.loaderIsDone) gsap.set(lockup, { opacity: 0 });

    gsap.set(chips, { scale: 0.2, opacity: 0, rotate: -18 });
    gsap.set([aside?.children || [], status, tagline], { y: 26, opacity: 0 });
    gsap.set(tickerRef.current, { yPercent: 110 });

    const play = () => {
      gsap.set(lockup, { opacity: 1 });   // no-op if the loader already did it
      gsap.timeline({ defaults: { ease: EASE.swift } })
        .to(chips, { scale: 1, opacity: 1, rotate: 0, duration: 0.85, stagger: 0.1 }, 0)
        .to([status, tagline], { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.05)
        .to(aside?.children || [], { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.15)
        .to(tickerRef.current, { yPercent: 0, duration: 0.9 }, 0.2);
    };

    if (window.loaderIsDone) { play(); return undefined; }
    window.addEventListener('loader-complete', play, { once: true });
    return () => window.removeEventListener('loader-complete', play);
  }, []);

  /* The name drifts up a touch slower than the page, so the block below
     it slides over the lockup rather than past it. No fade: it was
     washing the name out within the first few pixels of scroll. */
  useEffect(() => {
    if (reduced()) return undefined;
    const tween = gsap.to('.hero-lockup', {
      yPercent: -10,
      ease: 'none',
      scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  /* The ticker runs on its own, then leans into whichever direction you
     are scrolling — the page's momentum shows up in the strip. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduced()) return undefined;

    const loop = gsap.to(track, {
      xPercent: -50,
      duration: 26,
      ease: 'none',
      repeat: -1,
    });

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-3.2, 3.2, self.getVelocity() / 380);
        loop.timeScale(1 + Math.abs(v));
        gsap.to(loop, { timeScale: 1, duration: 0.9, overwrite: true, ease: EASE.swift });
      },
    });

    return () => { st.kill(); loop.kill(); };
  }, []);

  /* Chips drift toward the pointer — void's floating badges, without
     asking a touch device to express a hover. */
  useEffect(() => {
    if (!fine() || reduced()) return undefined;
    const chips = chipRefs.current.filter(Boolean);
    const movers = chips.map((c, i) => ({
      el: c,
      x: gsap.quickTo(c, 'x', { duration: 1.1, ease: EASE.swift }),
      y: gsap.quickTo(c, 'y', { duration: 1.1, ease: EASE.swift }),
      k: 14 + i * 9,
    }));

    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => { m.x(nx * m.k); m.y(ny * m.k); });
    };

    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const chip = (i) => (el) => { chipRefs.current[i] = el; };

  return (
    <section ref={rootRef} id="top" className="hero block block--flat" data-tone="paper">
      <div className="shell hero-shell">
        <div className="hero-status">
          <span className="hero-live" aria-hidden="true" />
          <span className="mono">Interning at Emerson · Pune, India</span>
        </div>

        <h1 className="hero-lockup display display--hero">
          <span className="hero-line"><span>Ajinkya</span></span>
          <span className="hero-line hero-line--two">
            <span>
              Chavan
              <span ref={chip(0)} className="hero-chip hero-chip--acid" aria-hidden="true">
                <Asterisk size={22} strokeWidth={2.6} />
              </span>
            </span>
          </span>
        </h1>

        <div className="hero-foot">
          <p className="hero-tagline lead">
            AI/ML engineering student building production generative AI —
            multi-agent LangGraph pipelines, RAG, and MCP/A2A agent services,
            shipped full-stack on FastAPI and React, deployed on Azure.
          </p>

          <div className="hero-acts" ref={asideRef}>
            <a href="/resume.pdf" download className="btn">
              Download résumé
              <Download size={16} strokeWidth={2.4} />
            </a>
            <a href="#assistant" className="btn btn--ghost">
              Ask my portfolio
              <span ref={chip(1)} className="hero-chip hero-chip--mini" aria-hidden="true">
                <ArrowDownRight size={14} strokeWidth={2.6} />
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="hero-ticker" ref={tickerRef} aria-hidden="true">
        <div className="hero-track" ref={trackRef}>
          {[0, 1].map((copy) => (
            <span className="hero-run" key={copy}>
              {TICKER.map((t) => (
                <span className="hero-word" key={t + copy}>
                  {t}<i className="hero-sep">✳</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .hero {
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          /* The bottom padding is the landing strip for the next block's
             rounded shoulder, which otherwise covers the ticker. */
          padding-block: clamp(6.5rem, 15vh, 9rem) var(--round);
          overflow: hidden;
        }
        .hero-shell { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: clamp(1.6rem, 5vh, 3rem); }

        .hero-status { display: inline-flex; align-items: center; gap: 0.6rem; color: var(--ink-2); }
        .hero-live {
          width: 8px; height: 8px;
          border-radius: 999px;
          background: var(--mark);
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--mark) 60%, transparent);
          animation: pulse 2.4s var(--ease-out) infinite;
        }
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--mark) 55%, transparent); }
          70%  { box-shadow: 0 0 0 9px color-mix(in srgb, var(--mark) 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--mark) 0%, transparent); }
        }

        .hero-lockup { margin: 0; }
        .hero-line { display: block; overflow: hidden; }
        .hero-line > span { display: inline-block; }
        .hero-line--two > span { display: inline-flex; align-items: center; gap: 0.1em; }
        .hero-lockup {
          font-size: clamp(3.6rem, 17.5vw, 15rem);
        }

        .hero-chip {
          display: grid;
          place-items: center;
          flex: none;
          width: clamp(38px, 5.6vw, 76px);
          height: clamp(38px, 5.6vw, 76px);
          border-radius: 26%;
          background: var(--acid);
          color: #101403;
          transform-origin: center;
        }
        .hero-chip svg { width: 46%; height: 46%; }
        .hero-chip--mini {
          width: 22px; height: 22px;
          border-radius: 999px;
          background: var(--mark);
          color: var(--paper);
        }
        [data-theme="dark"] .hero-chip--mini { color: #101403; }
        .hero-chip--mini svg { width: 13px; height: 13px; }

        .hero-foot {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: clamp(1.5rem, 4vw, 3rem);
        }
        .hero-tagline { max-width: 42ch; }
        .hero-acts { display: flex; flex-wrap: wrap; gap: 0.6rem; }

        /* ---- ticker ---- */
        .hero-ticker {
          margin-top: clamp(2rem, 6vh, 3.5rem);
          padding-block: 0.7rem;
          background: var(--ink);
          color: var(--paper);
          overflow: hidden;
          white-space: nowrap;
        }
        [data-theme="dark"] .hero-ticker { background: var(--acid); color: #101403; }
        .hero-track { display: inline-flex; width: max-content; will-change: transform; }
        .hero-run { display: inline-flex; }
        .hero-word {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(0.92rem, 1.6vw, 1.25rem);
          letter-spacing: -0.015em;
        }
        .hero-sep { font-style: normal; opacity: 0.45; padding-inline: 0.7em; font-size: 0.8em; }

        @media (max-width: 720px) {
          .hero-foot { flex-direction: column; align-items: flex-start; }
          .hero-acts { width: 100%; }
          .hero-acts .btn { flex: 1 1 auto; justify-content: center; white-space: nowrap; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-live { animation: none; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
