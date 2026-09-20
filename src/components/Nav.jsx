import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, reduced, magnetic, cleanup } from '../lib/motion';

const LINKS = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'stack', label: 'Stack' },
];

/* The active pill slides between items rather than cutting — the nav
   is the one element on screen the whole way down, so it carries the
   reader's position instead of just listing destinations. */
const Nav = () => {
  const [active, setActive] = useState('intro');
  const [open, setOpen] = useState(false);
  const railRef = useRef(null);
  const markerRef = useRef(null);
  const ctaRef = useRef(null);
  const menuRef = useRef(null);

  /* ---- scroll spy ---- */
  useEffect(() => {
    const triggers = ['intro', ...LINKS.map((l) => l.id)]
      .map((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        return ScrollTrigger.create({
          trigger: el,
          start: 'top 45%',
          end: 'bottom 45%',
          onToggle: (self) => self.isActive && setActive(id),
        });
      })
      .filter(Boolean);

    return () => triggers.forEach((t) => t.kill());
  }, []);

  /* ---- slide the marker under the active item ---- */
  useEffect(() => {
    const rail = railRef.current;
    const marker = markerRef.current;
    if (!rail || !marker) return;

    const target = rail.querySelector(`[data-nav="${active}"]`);
    if (!target) {
      gsap.to(marker, { opacity: 0, duration: 0.25 });
      return;
    }

    const r = target.getBoundingClientRect();
    const rr = rail.getBoundingClientRect();

    gsap.to(marker, {
      x: r.left - rr.left,
      width: r.width,
      opacity: 1,
      duration: reduced() ? 0 : 0.55,
      ease: EASE.swift,
    });
  }, [active]);

  /* ---- entrance ---- */
  useEffect(() => {
    if (reduced()) return;
    gsap.fromTo(
      '.nav',
      { y: -70, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, delay: 1.1, ease: EASE.swift }
    );
  }, []);

  useEffect(() => cleanup([magnetic(ctaRef.current, 0.3)]), []);

  /* ---- mobile sheet ---- */
  useEffect(() => {
    const sheet = menuRef.current;
    if (!sheet) return;

    if (open) {
      window.lenis?.stop();
      gsap.set(sheet, { display: 'flex' });
      gsap.fromTo(sheet, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.65, ease: EASE.glide });
      gsap.fromTo(sheet.querySelectorAll('a'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, delay: 0.15, ease: EASE.swift });
    } else {
      window.lenis?.start();
      gsap.to(sheet, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.45,
        ease: EASE.glide,
        onComplete: () => gsap.set(sheet, { display: 'none' }),
      });
    }
  }, [open]);

  const go = (e, id) => {
    e.preventDefault();
    setOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    if (window.lenis) window.lenis.scrollTo(el, { offset: -60, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className="nav">
        <a href="#intro" onClick={(e) => go(e, 'intro')} className="nav-mark" aria-label="Back to top">
          <span className="nav-mark-glyph">AC</span>
        </a>

        <nav className="nav-rail" ref={railRef} aria-label="Sections">
          <span className="nav-marker" ref={markerRef} aria-hidden="true" />
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              data-nav={l.id}
              onClick={(e) => go(e, l.id)}
              className={`nav-link mono ${active === l.id ? 'is-active' : ''}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a ref={ctaRef} href="#contact" onClick={(e) => go(e, 'contact')} className="nav-cta btn btn--solid">
          Contact
        </a>

        <button
          className="nav-burger"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <span className={open ? 'is-x' : ''} />
          <span className={open ? 'is-x' : ''} />
        </button>
      </header>

      <div className="nav-sheet" ref={menuRef}>
        {[...LINKS, { id: 'contact', label: 'Contact' }].map((l, i) => (
          <a key={l.id} href={`#${l.id}`} onClick={(e) => go(e, l.id)} className="display display--m">
            <span className="num nav-sheet-num">0{i + 1}</span>
            {l.label}
          </a>
        ))}
      </div>

      <style>{`
        .nav {
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px) + clamp(0.75rem, 2vh, 1.4rem));
          left: 50%;
          transform: translateX(-50%);
          z-index: 9000;
          width: min(calc(100% - 2 * var(--gutter)), var(--shell));
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          pointer-events: none;
        }
        .nav > * { pointer-events: auto; }

        .nav-mark {
          display: grid;
          place-items: center;
          width: 44px; height: 44px;
          flex: none;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(18, 16, 16, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          font-family: var(--font-display);
          font-weight: 900;
          font-stretch: 70%;
          font-size: 0.88rem;
          letter-spacing: 0.02em;
          color: var(--fg);
          transition: color 0.35s var(--ease-out), border-color 0.35s var(--ease-out);
        }
        .nav-mark:hover { color: var(--amber); border-color: var(--amber); }

        .nav-rail {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.15rem;
          padding: 5px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(18, 16, 16, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .nav-marker {
          position: absolute;
          top: 5px; left: 0;
          height: calc(100% - 10px);
          border-radius: 999px;
          background: var(--amber);
          opacity: 0;
          will-change: transform, width;
        }
        .nav-link {
          position: relative;
          z-index: 1;
          padding: 0.58em 1.05em;
          border-radius: 999px;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
          color: var(--fg-dim);
          transition: color 0.35s var(--ease-out);
          white-space: nowrap;
        }
        .nav-link:hover { color: var(--fg); }
        .nav-link.is-active { color: var(--on-accent); }

        .nav-cta { padding: 0.72em 1.25em; font-size: 0.7rem; flex: none; }

        .nav-burger {
          display: none;
          width: 44px; height: 44px;
          flex: none;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(18, 16, 16, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          cursor: pointer;
          position: relative;
        }
        .nav-burger span {
          position: absolute;
          left: 13px;
          width: 18px; height: 1.5px;
          background: var(--fg);
          transition: transform 0.4s var(--ease-out), opacity 0.3s;
        }
        .nav-burger span:first-child { top: 19px; }
        .nav-burger span:last-child { top: 25px; }
        .nav-burger span.is-x:first-child { transform: translateY(3px) rotate(45deg); }
        .nav-burger span.is-x:last-child { transform: translateY(-3px) rotate(-45deg); }

        .nav-sheet {
          position: fixed;
          inset: 0;
          z-index: 8999;
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: clamp(0.5rem, 2vh, 1rem);
          padding: var(--gutter);
          background: var(--ink);
          clip-path: inset(0 0 100% 0);
        }
        .nav-sheet a {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          color: var(--fg);
          transition: color 0.3s var(--ease-out);
        }
        .nav-sheet a:hover { color: var(--amber); }
        .nav-sheet-num { font-size: 0.75rem; color: var(--amber); }

        @media (max-width: 900px) {
          .nav-rail, .nav-cta { display: none; }
          .nav-burger { display: block; }
        }
      `}</style>
    </>
  );
};

export default Nav;
