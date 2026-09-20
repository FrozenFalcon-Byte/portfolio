import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, reduced } from '../lib/motion';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../lib/theme';

const LINKS = [
  { id: 'about',      n: '01', label: 'About' },
  { id: 'work',       n: '02', label: 'Work' },
  { id: 'assistant',  n: '03', label: 'Ask me' },
  { id: 'experience', n: '04', label: 'Experience' },
  { id: 'stack',      n: '05', label: 'Stack' },
  { id: 'contact',    n: '06', label: 'Contact' },
];

const Nav = () => {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const barRef = useRef(null);
  const sheetRef = useRef(null);
  const progressRef = useRef(null);

  /* The bar adopts the tone of whatever block is passing under it, so a
     dark section gets light chrome without a second set of styles. */
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;

    const blocks = Array.from(document.querySelectorAll('.block[data-tone]'));
    const triggers = blocks.map((block) =>
      ScrollTrigger.create({
        trigger: block,
        start: 'top 64px',
        end: 'bottom 64px',
        onToggle: (self) => { if (self.isActive) bar.dataset.tone = block.dataset.tone; },
      })
    );

    if (blocks[0]) bar.dataset.tone = blocks[0].dataset.tone;
    return () => triggers.forEach((t) => t.kill());
  }, []);

  /* Read-position hairline. */
  useEffect(() => {
    const el = progressRef.current;
    if (!el) return undefined;
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => gsap.set(el, { scaleX: self.progress }),
    });
    return () => st.kill();
  }, []);

  /* Sheet: a colour block wipes down, then the links come up behind it. */
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return undefined;

    const links = sheet.querySelectorAll('.sheet-link-inner');
    const meta = sheet.querySelectorAll('.sheet-meta > *');

    if (open) {
      window.lenis?.stop();
      if (reduced()) {
        gsap.set(sheet, { clipPath: 'inset(0% 0% 0% 0%)', pointerEvents: 'auto' });
        gsap.set([links, meta], { y: 0, opacity: 1 });
      } else {
        gsap.set(sheet, { pointerEvents: 'auto' });
        gsap.timeline()
          .fromTo(sheet,
            { clipPath: 'inset(0% 0% 100% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: EASE.glide })
          .fromTo(links,
            { yPercent: 115 },
            { yPercent: 0, duration: 0.85, stagger: 0.06, ease: EASE.swift }, 0.25)
          .fromTo(meta,
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: EASE.swift }, 0.5);
      }
    } else {
      window.lenis?.start();
      if (reduced()) {
        gsap.set(sheet, { clipPath: 'inset(0% 0% 100% 0%)', pointerEvents: 'none' });
      } else {
        gsap.to(sheet, {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 0.55,
          ease: EASE.glide,
          onComplete: () => gsap.set(sheet, { pointerEvents: 'none' }),
        });
      }
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (e, id) => {
    e.preventDefault();
    setOpen(false);
    const target = document.getElementById(id);
    if (!target) return;
    // Let the sheet start closing before the page moves underneath it.
    setTimeout(() => {
      if (window.lenis) window.lenis.scrollTo(target, { offset: -20, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    }, 120);
  };

  return (
    <>
      <span className="nav-progress" ref={progressRef} aria-hidden="true" />

      <header className="nav" ref={barRef}>
        <a className="nav-mark" href="#top" onClick={(e) => go(e, 'top')}>
          <span className="nav-mark-initials">AC</span>
          <span className="nav-mark-name">Ajinkya Chavan</span>
        </a>

        <div className="nav-cluster">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <button
            className={`nav-menu ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="nav-sheet"
          >
            <span className="nav-menu-word">{open ? 'Close' : 'Menu'}</span>
            <span className="nav-menu-bars" aria-hidden="true"><i /><i /></span>
          </button>
        </div>
      </header>

      <nav id="nav-sheet" className="sheet" ref={sheetRef} data-tone="ink" aria-label="Sections">
        <div className="shell sheet-inner">
          <ul className="sheet-list">
            {LINKS.map((l) => (
              <li key={l.id} className="sheet-link">
                <a href={`#${l.id}`} onClick={(e) => go(e, l.id)}>
                  <span className="sheet-link-inner">
                    <span className="num sheet-n">{l.n}</span>
                    <span className="display sheet-word">{l.label}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="sheet-meta">
            <a href="mailto:frozenfalcon8494@gmail.com" className="mono">frozenfalcon8494@gmail.com</a>
            <a href="https://www.linkedin.com/in/ajinkyachavan4829/" target="_blank" rel="noreferrer" className="mono">LinkedIn</a>
            <a href="https://github.com/FrozenFalcon-Byte" target="_blank" rel="noreferrer" className="mono">GitHub</a>
          </div>
        </div>
      </nav>

      <style>{`
        .nav-progress {
          position: fixed;
          top: 0; left: 0;
          z-index: 9001;
          width: 100%;
          height: 2px;
          background: var(--violet);
          transform: scaleX(0);
          transform-origin: left;
        }
        [data-theme="dark"] .nav-progress { background: var(--acid); }

        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 9000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: clamp(0.7rem, 1.6vh, 1.1rem) var(--gutter);
          pointer-events: none;
        }
        .nav[data-tone] { background: transparent; }
        .nav > * { pointer-events: auto; }

        .nav-mark {
          display: inline-flex;
          align-items: baseline;
          gap: 0.6rem;
          padding: 0.5rem 0.95rem 0.55rem;
          border-radius: 999px;
          background: var(--paper);
          border: 1px solid var(--line);
          font-family: var(--font-display);
          font-weight: 800;
          letter-spacing: -0.02em;
          transition: background 0.4s var(--ease-out), border-color 0.4s var(--ease-out);
        }
        .nav-mark-initials { font-size: 1rem; }
        .nav-mark-name { font-size: 0.78rem; font-weight: 600; color: var(--ink-2); letter-spacing: 0; }
        .nav-mark:hover { border-color: var(--ink-3); }

        .nav-cluster {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.28rem;
          border-radius: 999px;
          background: var(--paper);
          border: 1px solid var(--line);
          transition: background 0.4s var(--ease-out), border-color 0.4s var(--ease-out);
        }

        .nav-menu {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          height: 30px;
          padding: 0 0.85rem 0 1rem;
          border-radius: 999px;
          background: var(--ink);
          color: var(--paper);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }
        .nav-menu-word { min-width: 3.1em; text-align: left; }
        .nav-menu-bars { display: grid; gap: 4px; width: 15px; }
        .nav-menu-bars i {
          display: block; height: 1.8px; width: 100%;
          background: currentColor; border-radius: 2px;
          transition: transform 0.4s var(--ease-out);
        }
        .nav-menu.is-open .nav-menu-bars i:first-child { transform: translateY(2.9px) rotate(45deg); }
        .nav-menu.is-open .nav-menu-bars i:last-child  { transform: translateY(-2.9px) rotate(-45deg); }

        /* ---- sheet ---- */
        .sheet {
          position: fixed;
          inset: 0;
          z-index: 8900;
          display: flex;
          align-items: center;
          clip-path: inset(0% 0% 100% 0%);
          pointer-events: none;
          overflow-y: auto;
        }
        .sheet-inner {
          display: flex;
          flex-direction: column;
          gap: clamp(2rem, 6vh, 4rem);
          padding-block: clamp(6rem, 14vh, 9rem) clamp(2.5rem, 8vh, 5rem);
        }
        .sheet-list { display: flex; flex-direction: column; }
        .sheet-link a { display: block; overflow: hidden; }
        .sheet-link-inner {
          display: flex;
          align-items: baseline;
          gap: clamp(0.8rem, 2vw, 1.8rem);
          padding-block: clamp(0.15rem, 0.6vh, 0.4rem);
        }
        .sheet-n { font-size: 0.72rem; color: var(--ink-2); flex: none; }
        .sheet-word {
          font-size: clamp(2.6rem, 10vw, 6.5rem);
          line-height: 1;
          color: var(--ink);
          transition: color 0.35s var(--ease-out), transform 0.45s var(--ease-out);
        }
        .sheet-link a:hover .sheet-word { color: var(--mark); transform: translateX(0.18em); }

        .sheet-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem 1.6rem;
          padding-top: clamp(1.2rem, 4vh, 2rem);
          border-top: 1px solid var(--line);
        }
        .sheet-meta a { color: var(--ink-2); transition: color 0.3s var(--ease-out); }
        .sheet-meta a:hover { color: var(--mark); }

        @media (max-width: 520px) {
          .nav-mark-name { display: none; }
          .nav-menu-word { display: none; }
          .nav-menu { padding-inline: 0.72rem; }
        }
      `}</style>
    </>
  );
};

export default Nav;
