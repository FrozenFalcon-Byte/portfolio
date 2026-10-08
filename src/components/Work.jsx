import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus, X } from 'lucide-react';
import { gsap, ScrollTrigger, EASE, heading, drawRule, riseIn, reduced, cleanup, canBlur, fx, fx0 } from '../lib/motion';
import { PROJECTS } from '../data/projects';
import Glyph from './Glyph';

const N = PROJECTS.length;

/* ------------------------------------------------------------------
   Sheet — the full case for one project, as a two-page spread.

   The left page is ink and holds the identity of the thing: its
   number, its name, what it is built from and where it lives. It
   stays put. The right page is paper and scrolls: the argument, the
   screenshot, then what was built, one numbered step per row. The two
   pages slide in from opposite edges and meet in the middle; paging
   to the next project swaps the contents in place, so the spread
   never closes between cases.
   ------------------------------------------------------------------ */
const Sheet = ({ project, onClose }) => {
  const asideRef = useRef(null);
  const mainRef = useRef(null);
  const scrimRef = useRef(null);
  const closing = useRef(false);
  const [idx, setIdx] = useState(() => PROJECTS.findIndex((x) => x.id === project.id));
  const p = PROJECTS[idx];

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduced()) { onClose(); return; }
    gsap.timeline({ onComplete: onClose })
      .to(asideRef.current, { xPercent: -104, duration: 0.7, ease: EASE.glide }, 0)
      .to(mainRef.current, { xPercent: 104, duration: 0.7, ease: EASE.glide }, 0.04)
      .to(scrimRef.current, { opacity: 0, duration: 0.5 }, 0.2);
  }, [onClose]);

  const page = useCallback((dir) => {
    if (reduced()) { setIdx((i) => (i + dir + N) % N); return; }
    const parts = [asideRef.current.querySelectorAll('.sh-swap'), mainRef.current.querySelectorAll('.sh-swap')];
    gsap.to(parts, {
      y: -24 * dir, opacity: 0, duration: 0.3, stagger: 0.02, ease: 'power2.in',
      onComplete: () => { setIdx((i) => (i + dir + N) % N); },
    });
  }, []);

  // Each new case deals in from below once React has painted it.
  useEffect(() => {
    mainRef.current.scrollTop = 0;
    if (reduced()) return;
    const parts = [asideRef.current.querySelectorAll('.sh-swap'), mainRef.current.querySelectorAll('.sh-swap')];
    gsap.fromTo(parts, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, stagger: 0.04, ease: EASE.swift, delay: 0.05 });
  }, [idx]);

  useEffect(() => {
    window.lenis?.stop();
    if (!reduced()) {
      gsap.timeline()
        .fromTo(scrimRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
        .fromTo(asideRef.current, { xPercent: -104 }, { xPercent: 0, duration: 0.95, ease: EASE.swift }, 0)
        .fromTo(mainRef.current, { xPercent: 104 }, { xPercent: 0, duration: 0.95, ease: EASE.swift }, 0.05);
    }
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') page(1);
      if (e.key === 'ArrowLeft') page(-1);
    };
    window.addEventListener('keydown', onKey);
    mainRef.current.querySelector('.sh-close')?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.lenis?.start();
    };
  }, [close, page]);

  return createPortal(
    <div className="sh" role="dialog" aria-modal="true" aria-label={p.title} data-acc={p.acc}>
      <div className="sh-scrim" ref={scrimRef} onClick={close} />
      <div className="sh-spread">
        <aside className="sh-aside" ref={asideRef} data-surface="ink">
          <div className="sh-top sh-swap">
            <span className="num sh-n">{p.n}<em>/{String(N).padStart(2, '0')}</em></span>
            <span className="sh-kind">{p.kind}</span>
          </div>

          <h2 className="display sh-title sh-swap">{p.title}<i className="sh-stop" aria-hidden="true" /></h2>

          <div className="sh-foot">
            <div className="sh-swap">
              <span className="sh-label">Built with</span>
              <p className="sh-stack">
                {p.tech.map((t) => <span className="tag" key={t}>{t}</span>)}
              </p>
            </div>
            {p.links.length > 0 && (
              <div className="sh-links sh-swap">
                {p.links.map((l) => (
                  <a key={l.href} className="btn btn--acc" href={l.href} target="_blank" rel="noreferrer">
                    {l.label}<ArrowUpRight size={17} strokeWidth={2.4} className="arrow" />
                  </a>
                ))}
              </div>
            )}
            <div className="sh-pager">
              <button onClick={() => page(-1)} aria-label="Previous project" data-cursor-label="Previous">
                <ArrowLeft size={18} strokeWidth={2.4} />
              </button>
              <span className="sh-pager-t">{PROJECTS[(idx + 1) % N].title}</span>
              <button onClick={() => page(1)} aria-label="Next project" data-cursor-label="Next">
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </aside>

        <div className="sh-main" ref={mainRef} data-lenis-prevent>
          <button className="sh-close" onClick={close} aria-label="Close" data-cursor-label="Close">
            <X size={20} strokeWidth={2.4} />
          </button>
          <div className="sh-main-in">
            <span className="sh-meta sh-swap">{p.meta}</span>
            <p className="display sh-lead sh-swap">{p.lead}</p>
            <div className="sh-shot sh-swap"><img src={p.img} alt="" /></div>
            <span className="sh-label sh-swap">What I built</span>
            <ol className="sh-steps">
              {p.details.map((d, i) => (
                <li key={i} className="sh-step sh-swap">
                  <span className="display sh-step-n">{String(i + 1).padStart(2, '0')}</span>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
            <button className="sh-next sh-swap" onClick={() => page(1)} data-cursor-label="Next case">
              <span className="sh-label">Next case</span>
              <span className="display sh-next-t">{PROJECTS[(idx + 1) % N].title}<ArrowRight size={28} strokeWidth={2.6} /></span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------
   Reel — plnty's "A new class of creative tools".

   The section pins and the scrollbar rolls a column of name pills past
   a fixed reading line. The pill on the line is the active one: it
   fills with that project's accent and the panel beside it changes to
   match. Pills further from the line shrink and fade with their
   distance, so the column reads as a drum turning, not a list moving.
   The roll is continuous; only the active index goes through React.
   ------------------------------------------------------------------ */
const Reel = ({ onOpen }) => {
  const sceneRef = useRef(null);
  const trackRef = useRef(null);
  const filmRef = useRef(null);
  const copyRef = useRef(null);
  const stRef = useRef(null);
  const [active, setActive] = useState(0);
  const prev = useRef(0);
  const last = useRef(-1);

  useEffect(() => {
    const scene = sceneRef.current;
    const track = trackRef.current;
    const pills = Array.from(track.children);
    const film = filmRef.current;
    const strip = film.querySelector('.wk-strip');
    const frames = Array.from(strip.children);
    const blur = canBlur();

    const paint = (f) => {
      const step = pills[0].offsetHeight + 10;
      track.style.transform = `translate3d(0, ${-f * step}px, 0)`;
      pills.forEach((el, i) => {
        const d = Math.abs(i - f);
        el.style.opacity = String(Math.max(0.12, 1 - d * 0.3));
        el.style.transform = `scale(${Math.max(0.78, 1 - d * 0.07)})`;
      });
      /* The frames are a deck, not a strip: the one on the line sits
         flat and whole; its neighbours wait just behind it, a little
         smaller and lower, and as the scroll turns them one lifts away
         while the next rises into its place, smeared by motion blur
         for the instant it is moving. At rest every frame is exactly
         its screenshot, uncropped and unscaled. */
      frames.forEach((fr, i) => {
        const d = i - f;
        const a = Math.abs(d);
        if (a >= 1) { fr.style.visibility = 'hidden'; return; }
        fr.style.visibility = '';
        if (d <= 0) {
          // Leaving: on top, lifting off and smearing as it goes.
          fr.style.zIndex = '2';
          fr.style.opacity = String(Math.max(0, 1 - a * 1.4));
          fr.style.transform = `translate3d(0, ${-a * 18}%, 0) rotate(${-a * 3}deg) scale(${1 + a * 0.04})`;
          fr.style.filter = blur && a > 0.02 ? `blur(${(a * 16).toFixed(1)}px)` : '';
        } else {
          // Arriving: solid underneath, settling up into place.
          fr.style.zIndex = '1';
          fr.style.opacity = '1';
          fr.style.transform = `translate3d(0, ${a * 6}%, 0) scale(${1 - a * 0.06})`;
          fr.style.filter = blur && a > 0.02 ? `blur(${(a * 6).toFixed(1)}px)` : '';
        }
      });
    };
    paint(0);

    const st = ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: () => `+=${window.innerHeight * 0.6 * (N - 1)}`,
      pin: true,
      scrub: true,
      snap: { snapTo: 1 / (N - 1), duration: { min: 0.25, max: 0.6 }, delay: 0.08, ease: 'power2.inOut' },
      onUpdate: (self) => {
        const f = self.progress * (N - 1);
        paint(f);
        const i = Math.round(f);
        if (i !== prev.current) { last.current = prev.current; prev.current = i; setActive(i); }
      },
    });
    stRef.current = st;
    return () => st.kill();
  }, []);

  // The copy is re-set word by word: each word rises out of its own
  // mask, the tags follow, the buttons last.
  useEffect(() => {
    const el = copyRef.current;
    if (!el || reduced()) return undefined;
    const words = el.querySelectorAll('.wk-w > span');
    const rest = el.querySelectorAll('.wk-tags .tag, .wk-actions > *');
    const tl = gsap.timeline()
      .fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.012, ease: EASE.swift }, 0)
      .fromTo(rest, { y: 18, opacity: 0, ...fx(8) }, { y: 0, opacity: 1, ...fx0(), duration: 0.6, stagger: 0.04, ease: EASE.swift }, 0.15);
    return () => tl.kill();
  }, [active]);

  const jump = (i) => {
    const st = stRef.current;
    if (!st) return;
    const y = st.start + (st.end - st.start) * (i / (N - 1));
    if (window.lenis) window.lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const p = PROJECTS[active];

  return (
    // The wrapper keeps React's node outside the pin spacer, so the reel
    // can unmount (on a resize below the breakpoint) while pinned.
    <div className="wk-pinwrap">
    <div className="wk-scene" ref={sceneRef} data-acc={p.acc}>
      <div className="shell wk-stage">
        <div className="wk-col">
        <div className="wk-reel">
          <span className="wk-line" aria-hidden="true" />
          <ol className="wk-track" ref={trackRef}>
            {PROJECTS.map((x, i) => (
              <li key={x.id} className={`wk-pill${i === active ? ' is-on' : ''}`} data-acc={x.acc}>
                <button onClick={() => (i === active ? onOpen(x) : jump(i))} data-cursor-label={i === active ? 'Open case' : 'Go'}>
                  <span className="num wk-pill-n">{x.n}</span>
                  <span className="wk-pill-t">{x.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
          {/* The position is told in the projects' own colours: one dot
              each, and the current one stretches into a pill carrying its
              number — the same full stop as the logo, put to work. */}
          <div className="wk-dots">
            {PROJECTS.map((x, i) => (
              <button
                key={x.id}
                className={`wk-dot${i === active ? ' is-on' : ''}`}
                data-acc={x.acc}
                onClick={() => jump(i)}
                aria-label={`${x.n} — ${x.title}`}
                data-cursor-label={x.title}
              >
                <span className="num">{x.n}</span>
              </button>
            ))}
          </div>
        </div>

        <article className="wk-panel">
          {/* The screenshots are a deck turned by the same scroll as the
              reel, so the picture is always exactly as far along as the
              name on the line. */}
          <div className="wk-film" ref={filmRef} data-cursor="hot" data-cursor-label="Open case" onClick={() => onOpen(p)}>
            <div className="wk-strip">
              {PROJECTS.map((x, i) => (
                <div key={x.id} className="wk-frame" data-acc={x.acc}>
                  <div className="wk-chrome" aria-hidden="true">
                    <i /><i /><i />
                    <span className="wk-url">{x.title.toLowerCase().replace(/\s+/g, '-')}</span>
                    <span className="wk-media-tag">{x.meta}</span>
                  </div>
                  <div className="wk-frame-in">
                    <img src={x.img} alt="" loading={i < 2 ? 'eager' : 'lazy'} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="wk-copy" key={p.id} ref={copyRef}>
            <span className="mono wk-kind"><span className="wk-w"><span>{p.kind}</span></span></span>
            <p className="wk-desc">
              {p.desc.split(' ').map((w, k) => <span className="wk-w" key={k}><span>{w}</span></span>)}
            </p>
            <div className="wk-tags">
              {p.tech.slice(0, 5).map((t) => <span className="tag" key={t}>{t}</span>)}
            </div>
            <div className="wk-actions">
              <button className="btn btn--acc" onClick={() => onOpen(p)} data-cursor-label="Open case">
                Read the case <Plus size={17} strokeWidth={2.6} className="arrow" />
              </button>
              {p.links[0] && (
                <a className="btn btn--ghost" href={p.links[0].href} target="_blank" rel="noreferrer">
                  {p.links[0].label} <ArrowUpRight size={17} strokeWidth={2.4} className="arrow" />
                </a>
              )}
            </div>
          </div>
        </article>

      </div>
    </div>
    </div>
  );
};

/* Below the reel's breakpoint the same projects are a column of cards. */
const Cards = ({ onOpen }) => {
  const ref = useRef(null);
  useEffect(() => cleanup([riseIn(ref.current?.children, { trigger: ref.current, start: 'top 90%', stagger: 0.08, y: 40 })]), []);
  return (
    <div className="shell">
      <ul className="wk-cards" ref={ref}>
        {PROJECTS.map((p) => (
          <li key={p.id} className="wk-card" data-acc={p.acc}>
            <button onClick={() => onOpen(p)}>
              <div className="media wk-card-media"><img src={p.img} alt="" loading="lazy" /></div>
              <div className="wk-card-top">
                <span className="tag tag--acc">{p.n}</span>
                <span className="mono wk-kind">{p.kind}</span>
              </div>
              <h3 className="display wk-card-t">{p.title}</h3>
              <p className="wk-card-d">{p.desc}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Work = () => {
  const rootRef = useRef(null);
  const ruleRef = useRef(null);
  const headRef = useRef(null);
  const [open, setOpen] = useState(null);
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

  return (
    <section ref={rootRef} id="work" className="block work" data-acc="pink">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow"><b>03</b>Work</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono wk-note">{N} projects · scroll the reel</span>
        </div>
        <h2 ref={headRef} className="display display--l wk-head">
          <span className="ln"><span className="ln-in">Seven things,</span></span>
          <span className="ln"><span className="ln-in">built and<Glyph kind="ship" acc="pink" />shipped.</span></span>
        </h2>
      </div>

      {wide ? <Reel onOpen={setOpen} /> : <Cards onOpen={setOpen} />}
      {open && <Sheet project={open} onClose={() => setOpen(null)} />}

      <style>{`
        .work { padding-bottom: 0; }
        .wk-note { color: var(--ink-3); white-space: nowrap; }
        .wk-head { margin-bottom: clamp(1.5rem, 5vh, 3rem); }

        /* ---- the pinned scene ---- */
        .wk-scene { height: 100svh; display: flex; align-items: center; }
        .wk-stage {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: clamp(1.5rem, 4vw, 4rem);
          align-items: center;
          height: min(78svh, 46rem);
          padding-top: 4.5rem;
        }

        .wk-col { display: flex; flex-direction: column; gap: 1rem; height: 100%; min-height: 0; }
        .wk-reel {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          /* The reading line sits a third of the way down: the active
             pill is near the top of the column, with the queue below. */
          --rl: 34%;
        }
        .wk-line {
          position: absolute;
          left: 0; right: 0;
          top: var(--rl);
          border-top: 1px dashed var(--line);
        }
        .wk-track {
          position: absolute;
          left: 0; right: 0;
          top: calc(var(--rl) - 2.3rem);
          display: grid;
          gap: 10px;
          will-change: transform;
        }
        .wk-pill { transform-origin: left center; will-change: transform, opacity; }
        .wk-pill button {
          display: inline-flex;
          align-items: center;
          gap: 0.9rem;
          height: 4.6rem;
          padding: 0 1.8rem 0 0.7rem;
          border-radius: var(--r-pill);
          border: 1.5px solid var(--line);
          background: var(--paper);
          color: var(--ink);
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.5s var(--ease-out), border-color 0.5s var(--ease-out), color 0.5s var(--ease-out);
        }
        .wk-pill-n {
          display: grid; place-items: center;
          width: 3.2rem; height: 3.2rem;
          border-radius: 99px;
          background: var(--paper-3);
          font-size: 0.85rem; font-weight: 600;
          transition: background 0.5s var(--ease-out), color 0.5s;
        }
        .wk-pill-t {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: clamp(1.6rem, 2.6vw, 2.6rem);
          letter-spacing: -0.045em;
        }
        .wk-pill.is-on button { background: var(--acc); border-color: var(--acc); color: var(--acc-ink); }
        .wk-pill.is-on .wk-pill-n { background: var(--acc-ink); color: var(--acc); }

        .wk-panel {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1.25rem;
          height: 100%;
          min-height: 0;
        }
        /* The window is the screenshots' own shape, so each one shows
           whole: nothing is cropped and nothing is scaled at rest. */
        .wk-film {
          position: relative;
          flex: none;
          width: min(100%, calc((min(78svh, 46rem) - 15rem) * 1.6));
          aspect-ratio: 1.6 / 1.075;
          cursor: pointer;
        }
        .wk-strip { position: absolute; inset: 0; }
        .wk-frame {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          padding: 0 6px 6px;
          border-radius: 22px;
          background: var(--paper-2);
          box-shadow:
            inset 0 0 0 1px var(--line-2),
            0 1px 2px rgba(0, 0, 0, 0.06),
            0 24px 50px -24px rgba(0, 0, 0, 0.35);
          transform-origin: 50% 0;
          will-change: transform, opacity;
        }
        .wk-chrome {
          display: flex; align-items: center; gap: 6px;
          height: 34px; flex: none;
          padding: 0 8px;
          font-size: var(--step--2);
          color: var(--ink-3);
        }
        .wk-chrome i { width: 9px; height: 9px; border-radius: 99px; background: var(--paper-3); }
        .wk-chrome i:first-child { background: var(--acc); }
        .wk-url {
          margin-left: 10px; padding: 3px 12px;
          border-radius: 99px; background: var(--paper);
          font-family: var(--font-mono);
        }
        .wk-media-tag { margin-left: auto; font-weight: 600; color: var(--ink-2); }
        .wk-frame-in {
          position: relative; flex: 1; min-height: 0;
          border-radius: 16px; overflow: hidden;
          background: var(--paper);
        }
        .wk-frame-in img { width: 100%; height: 100%; object-fit: contain; object-position: 50% 0; transition: scale 0.8s var(--ease-out); }
        .wk-film:hover .wk-frame-in img { scale: 1.02; }

        .wk-w { display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: 0.08em; margin-bottom: -0.08em; }
        .wk-w > span { display: inline-block; }
        .wk-desc .wk-w { margin-right: 0.25em; }
        .wk-kind { color: var(--ink-3); letter-spacing: -0.01em; font-size: var(--step--2); }
        .wk-desc { margin-top: 0.45rem; font-size: var(--step-1); line-height: 1.35; letter-spacing: -0.015em; max-width: 46ch; }
        .wk-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.85rem; }
        .wk-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }

        .wk-dots {
          position: relative;
          display: flex; align-items: center; gap: 6px;
        }
        .wk-dot {
          display: grid; place-items: center;
          width: 12px; height: 12px;
          padding: 0;
          border-radius: 99px;
          background: var(--acc);
          opacity: 0.32;
          cursor: pointer;
          overflow: hidden;
          transition: width 0.6s var(--ease-out), height 0.6s var(--ease-out), opacity 0.4s;
        }
        .wk-dot:hover { opacity: 0.7; }
        .wk-dot .num { font-size: 0.8rem; color: var(--acc-ink); opacity: 0; transition: opacity 0.3s; }
        .wk-dot.is-on { width: 3.2rem; height: 1.7rem; opacity: 1; }
        .wk-dot.is-on .num { opacity: 1; transition-delay: 0.2s; }

        /* ---- cards (narrow) ---- */
        .wk-cards { display: grid; gap: 1rem; padding-bottom: var(--bay); }
        .wk-card button { display: grid; gap: 0.7rem; width: 100%; text-align: left; cursor: pointer; }
        .wk-card-media { aspect-ratio: 16 / 10; }
        .wk-card-top { display: flex; align-items: center; gap: 0.6rem; }
        .wk-card-t { font-size: var(--step-2); }
        .wk-card-d { color: var(--ink-2); }

        /* ---- sheet: a two-page spread ---- */
        .sh { position: fixed; inset: 0; z-index: 900; }
        .sh-scrim { position: absolute; inset: 0; background: rgba(14, 14, 13, 0.5); backdrop-filter: blur(6px); }
        .sh-spread {
          position: absolute;
          inset: 0.75rem;
          display: grid;
          grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
          gap: 0.75rem;
          pointer-events: none;
        }
        .sh-aside, .sh-main { pointer-events: auto; border-radius: var(--r-xl); min-height: 0; }

        .sh-aside {
          display: flex; flex-direction: column;
          padding: clamp(1.5rem, 3vw, 2.75rem);
          background: var(--paper);
          color: var(--ink);
          overflow: hidden;
        }
        .sh-top { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
        .sh-n { font-size: var(--step-2); color: var(--acc); }
        .sh-n em { font-style: normal; color: var(--ink-3); font-size: 0.6em; margin-left: 0.15em; }
        .sh-kind { color: var(--ink-3); font-size: var(--step--1); text-align: right; }
        .sh-title {
          margin: auto 0;
          padding-block: 2rem;
          font-size: clamp(2.8rem, 5.6vw, 6.5rem);
          letter-spacing: -0.06em;
          line-height: 0.92;
          overflow-wrap: anywhere;
        }
        .sh-stop { display: inline-block; width: 0.17em; height: 0.17em; margin-left: 0.06em; border-radius: 99px; background: var(--acc); }
        .sh-foot { display: grid; gap: 1.25rem; }
        .sh-label { display: block; margin-bottom: 0.6rem; color: var(--ink-3); font-size: var(--step--1); font-weight: 500; }
        .sh-stack { display: flex; flex-wrap: wrap; row-gap: 0.35rem; }
        .sh-links { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .sh-pager {
          display: flex; align-items: center; gap: 0.75rem;
          padding-top: 1.1rem;
          border-top: 1px solid var(--line-2);
        }
        .sh-pager button {
          display: grid; place-items: center;
          width: 2.75rem; height: 2.75rem; flex: none;
          border-radius: 99px;
          background: var(--paper-3); color: var(--ink);
          cursor: pointer;
          transition: background 0.3s, color 0.3s, transform 0.4s var(--ease-out);
        }
        .sh-pager button:hover { background: var(--acc); color: var(--acc-ink); transform: scale(1.08); }
        .sh-pager-t { flex: 1; text-align: center; color: var(--ink-3); font-size: var(--step--1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sh-pager-t::before { content: "Next: "; }

        .sh-main {
          position: relative;
          background: var(--paper);
          color: var(--ink);
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .sh-close {
          position: sticky; top: 1rem; float: right;
          margin: 1rem 1rem 0 0;
          display: grid; place-items: center;
          width: 3rem; height: 3rem;
          border-radius: 99px;
          background: var(--ink); color: var(--paper);
          cursor: pointer; z-index: 2;
          transition: transform 0.5s var(--ease-out), background 0.4s, color 0.4s;
        }
        .sh-close:hover { transform: rotate(90deg); background: var(--acc); color: var(--acc-ink); }
        .sh-main-in { padding: clamp(1.5rem, 3vw, 2.75rem); padding-top: clamp(1.75rem, 3.4vw, 3rem); }
        .sh-meta { display: inline-block; color: var(--ink-3); font-size: var(--step--1); }
        .sh-lead {
          margin-top: 0.75rem;
          font-size: clamp(1.35rem, 2.1vw, 2.1rem);
          font-weight: 600;
          line-height: 1.12;
          letter-spacing: -0.035em;
          max-width: 30ch;
        }
        .sh-shot { margin: clamp(1.5rem, 4vh, 2.5rem) 0; aspect-ratio: 16 / 10; border-radius: var(--r-l); overflow: hidden; background: var(--acc); }
        .sh-shot img { width: 100%; height: 100%; object-fit: cover; }
        .sh-steps { display: grid; }
        .sh-step {
          display: grid;
          grid-template-columns: clamp(3.5rem, 6vw, 5.5rem) minmax(0, 1fr);
          gap: 1rem;
          padding: 1.1rem 0;
          border-top: 1px solid var(--line-2);
          color: var(--ink-2);
          line-height: 1.55;
        }
        .sh-step-n {
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          line-height: 0.9;
          letter-spacing: -0.05em;
          color: var(--line);
          transition: color 0.35s var(--ease-out), transform 0.5s var(--ease-out);
          transform-origin: left center;
        }
        .sh-step:hover { color: var(--ink); }
        .sh-step:hover .sh-step-n { color: var(--acc); transform: scale(1.08); }
        [data-acc="yellow"] .sh-step:hover .sh-step-n, [data-acc="lime"] .sh-step:hover .sh-step-n { color: var(--ink); }
        .sh-next {
          display: block; width: 100%;
          margin-top: 1.5rem;
          padding: 1.5rem;
          border-radius: var(--r-l);
          background: var(--acc); color: var(--acc-ink);
          text-align: left; cursor: pointer;
          transition: transform 0.5s var(--ease-out);
        }
        .sh-next .sh-label { color: inherit; opacity: 0.7; }
        .sh-next-t { display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-size: clamp(1.6rem, 3vw, 2.8rem); letter-spacing: -0.05em; }
        .sh-next-t svg { transition: transform 0.5s var(--ease-out); }
        .sh-next:hover .sh-next-t svg { transform: translateX(6px); }

        @media (max-width: 860px) {
          .sh-spread { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); inset: 0.5rem; gap: 0.5rem; }
          .sh-title { padding-block: 1rem; font-size: clamp(2.2rem, 11vw, 3.5rem); }
          .sh-aside .sh-foot > div:not(.sh-pager) { display: none; }
        }
      `}</style>
    </section>
  );
};

export default Work;
