import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, reduced, fx, fx0 } from '../lib/motion';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../lib/theme';
import Mark from './Mark';
import { useLocation } from 'react-router-dom';
import { useRouteTransition } from './RouteCurtain';

const LINKS = [
  { id: 'about',      n: '01', label: 'About' },
  { id: 'experience', n: '02', label: 'Experience' },
  { id: 'work',       n: '03', label: 'Work' },
  { id: 'assistant',  n: '04', label: 'Ask me' },
  { id: 'stack',      n: '05', label: 'Stack' },
  { id: 'leadership', n: '06', label: 'On the record' },
  { id: 'contact',    n: '07', label: 'Contact' },
];

const Nav = () => {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const barRef = useRef(null);
  const sheetRef = useRef(null);
  const logoRef = useRef(null);
  const ringRef = useRef(null);
  const jumpRef = useRef(null);
  const pillRef = useRef(null);
  const blobRef = useRef(null);
  const hopRef = useRef(null);
    const [active, setActive] = useState(null);
  const busy = useRef(false);
  const { pathname } = useLocation();
  const route = useRouteTransition();
  const where = useRef(pathname);
  where.current = pathname;

  /* ------------------------------------------------------------------
     Jump. A section link never scrolls the page through everything in
     between — with pinned scenes on the way that is a long, juddering
     ride. Instead a sheet rises with the destination's name on it, the
     page is moved underneath while it is covered, and the sheet lifts
     away again with the visitor already there.
     ------------------------------------------------------------------ */
  const jump = React.useCallback((id) => {
    const target = id === 'top' ? null : document.getElementById(id);
    /* Off the home page the sections do not exist here: go home under
       the route curtain and land on the section asked for. */
    if (where.current !== '/' && (id === 'top' || !target)) {
      const link = LINKS.find((l) => l.id === id);
      route(id === 'top' ? '/' : `/#${id}`, {
        title: link ? link.label : 'Home',
        kicker: 'Ajinkya Chavan · Portfolio',
      });
      return;
    }
    if (id !== 'top' && !target) return;
    const place = () => {
      const y = target ? target.getBoundingClientRect().top + window.scrollY - 70 : 0;
      if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
      ScrollTrigger.update();
    };
    const sheet = jumpRef.current;
    if (reduced() || !sheet || busy.current) { place(); return; }
    busy.current = true;
    const word = sheet.querySelector('.jump-word');
    const link = LINKS.find((l) => l.id === id);
    sheet.querySelector('.jump-t').textContent = link ? link.label : 'Ajinkya';
    sheet.querySelector('.jump-n').textContent = link ? link.n : '00';
    gsap.timeline({ onComplete: () => { busy.current = false; } })
      .set(sheet, { pointerEvents: 'auto', visibility: 'visible' })
      .fromTo(sheet,
        { clipPath: 'inset(100% 0% 0% 0% round 64px 64px 0px 0px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', duration: 0.6, ease: EASE.glide })
      .fromTo(word, { yPercent: 110, ...fx(12) }, { yPercent: 0, ...fx0(), duration: 0.55, ease: EASE.swift }, 0.18)
      .add(place, 0.62)
      .to(word, { yPercent: -110, ...fx(12), duration: 0.45, ease: 'power2.in' }, 0.85)
      .to(sheet, { clipPath: 'inset(0% 0% 100% 0% round 0px 0px 64px 64px)', duration: 0.7, ease: EASE.glide }, 0.95)
      .set(sheet, { pointerEvents: 'none', visibility: 'hidden' });
  }, [route]);

  /* Every in-page anchor on the site goes through the jump, so the
     hero's buttons and the footer behave exactly like the menu. */
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = e.target.closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      e.preventDefault();
      setOpen(false);
      jump(id);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [jump]);

  /* Which section is being read. The highlight in the pill slides to
     its link, so the bar doubles as a map of where you are. */
  useEffect(() => {
    setActive(null);
    if (pathname !== '/') return undefined;
    const sts = LINKS.map((l) => {
      const el = document.getElementById(l.id);
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 45%',
        end: 'bottom 45%',
        // Measured after every pinned scene has added its spacer, or
        // the sections below a pin are read at their unpinned offsets.
        refreshPriority: -10,
        onToggle: (self) => { if (self.isActive) setActive(l.id); },
        onLeaveBack: () => { if (l.id === 'about') setActive(null); },
      });
    }).filter(Boolean);
    return () => sts.forEach((t) => t.kill());
  }, [pathname]);

  useEffect(() => {
    const pill = pillRef.current;
    const blob = blobRef.current;
    if (!pill || !blob) return;
    const link = active && pill.querySelector(`[data-id="${active}"]`);
    if (!link) { gsap.to(blob, { opacity: 0, scale: 0.6, duration: 0.35, ease: EASE.swift }); return; }
    gsap.to(blob, {
      x: link.offsetLeft, width: link.offsetWidth, opacity: 1, scale: 1,
      duration: 0.6, ease: EASE.swift,
    });
  }, [active]);

  /* Hover: a soft pill glides under whichever link the pointer is on,
     separate from the ink one that marks the section being read. It
     appears in place on the first link and slides between the rest. */
  const hoverAt = useRef(false);
  const hover = (e) => {
    const link = e.currentTarget;
    const pill = hopRef.current;
    if (!pill) return;
    const to = { x: link.offsetLeft, width: link.offsetWidth };
    if (!hoverAt.current || reduced()) {
      gsap.set(pill, to);
      gsap.to(pill, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
    } else {
      gsap.to(pill, { ...to, opacity: 1, scale: 1, duration: 0.45, ease: EASE.swift, overwrite: 'auto' });
    }
    hoverAt.current = true;
  };
  const unhover = () => {
    hoverAt.current = false;
    gsap.to(hopRef.current, { opacity: 0, scale: 0.92, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
  };

  /* Out of the way while reading down, back the moment you scroll up.
     Small reversals (a trackpad settling, a snap) are ignored, and a
     jump never toggles it, so the bar does not flicker. */
  useEffect(() => {
    const bar = barRef.current;
    let anchor = window.scrollY;
    let hidden = false;
    if (open) bar.classList.remove('is-away');
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        if (open || busy.current) { anchor = y; return; }
        const d = y - anchor;
        let hide = hidden;
        if (y < window.innerHeight * 0.6) hide = false;
        else if (d > 24) hide = true;
        else if (d < -24) hide = false;
        if (Math.abs(d) > 24) anchor = y;
        if (hide === hidden) return;
        hidden = hide;
        bar.classList.toggle('is-away', hide);
      },
    });
    return () => st.kill();
  }, [open]);

  /* The bar floats as a pill and only grows its backing once the page
     has moved — over the hero it should be furniture, not chrome. */
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const st = ScrollTrigger.create({
      start: 'top -40',
      onToggle: (self) => bar.classList.toggle('is-stuck', self.isActive),
    });
    return () => st.kill();
  }, []);

  /* The ring around the logo closes as the page is read, so the mark
     doubles as a read-position indicator. */
  useEffect(() => {
    if (reduced()) return undefined;
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        gsap.set(ringRef.current, { strokeDashoffset: 1 - self.progress });
      },
    });
    return () => st.kill();
  }, []);

  /* Sheet: a dark panel wipes down, the links come up behind it. */
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return undefined;

    const links = sheet.querySelectorAll('.sheet-link-inner');
    const meta = sheet.querySelectorAll('.sheet-meta > *');

    if (open) {
      window.lenis?.stop();
      if (reduced()) {
        gsap.set(sheet, { clipPath: 'inset(0% 0% 0% 0%)', pointerEvents: 'auto' });
        gsap.set([links, meta], { yPercent: 0, y: 0, opacity: 1 });
      } else {
        gsap.set(sheet, { pointerEvents: 'auto' });
        gsap.timeline()
          .fromTo(sheet,
            { clipPath: 'inset(0% 0% 100% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.78, ease: EASE.glide })
          .fromTo(links,
            { yPercent: 115, ...fx(10) },
            { yPercent: 0, ...fx0(), duration: 0.9, stagger: 0.055, ease: EASE.swift }, 0.22)
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
          duration: 0.58,
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
    jump(id);
  };
  const top = (e) => go(e, 'top');

  return (
    <>
      <header className="nav" ref={barRef}>
        <a href="#top" className="nav-logo" onClick={top} aria-label="Ajinkya Chavan — back to top">
          <span className="nav-logo-spin" ref={logoRef}><Mark /></span>
          <svg className="nav-logo-ring" viewBox="0 0 44 44" aria-hidden="true">
            <circle
              ref={ringRef}
              cx="22" cy="22" r="20"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
            />
          </svg>
        </a>

        <nav className="nav-links" aria-label="Sections" ref={pillRef} onMouseLeave={unhover}>
          <span className="nav-hover" ref={hopRef} aria-hidden="true" />
          <span className="nav-blob" ref={blobRef} aria-hidden="true" />
          {LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={(e) => go(e, l.id)} onMouseEnter={hover} data-id={l.id} aria-label={l.label} className={`nav-link${active === l.id ? ' is-on' : ''}`}>
              <span className="nav-roll" aria-hidden="true">
                <span>{l.label}</span>
                <span>{l.label}</span>
              </span>
            </a>
          ))}
        </nav>

        <div className="nav-right">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <a href="#contact" className="nav-cta" onClick={(e) => go(e, 'contact')} data-cursor="hot" aria-label="Say hello">
            <span className="nav-cta-live" aria-hidden="true"><i /></span>
            <span className="nav-cta-roll" aria-hidden="true">
              <span>Say hello</span>
              <span>Open to work</span>
            </span>
            <span className="nav-cta-arr" aria-hidden="true">
              <svg viewBox="0 0 12 12"><path d="M3 9 L9 3 M4 3 H9 V8" /></svg>
              <svg viewBox="0 0 12 12"><path d="M3 9 L9 3 M4 3 H9 V8" /></svg>
            </span>
          </a>
          <button
            className={`nav-burger${open ? ' is-open' : ''}`}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span /><span />
          </button>
        </div>
      </header>

      <div className="jump" ref={jumpRef} data-surface="ink" data-acc="yellow" aria-hidden="true">
        <span className="jump-box">
          <span className="jump-word display"><span className="num jump-n" /><span className="jump-t" /><i className="jump-dot" /></span>
        </span>
      </div>

      <div className="sheet" ref={sheetRef} data-acc="yellow">
        <div className="shell sheet-in">
          <ol className="sheet-links">
            {LINKS.map((l) => (
              <li key={l.id} className="sheet-link-box">
                <a href={`#${l.id}`} onClick={(e) => go(e, l.id)} className="sheet-link">
                  <span className="sheet-link-inner">
                    <span className="num sheet-link-n">{l.n}</span>
                    <span className="display sheet-link-label">{l.label}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>

          <div className="sheet-meta">
            <a className="mono" href="mailto:frozenfalcon8494@gmail.com">frozenfalcon8494@gmail.com</a>
            <a className="mono" href="https://github.com/FrozenFalcon-Byte" target="_blank" rel="noreferrer">GitHub</a>
            <a className="mono" href="https://www.linkedin.com/in/ajinkyachavan4829/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="mono" href="/resume.pdf" download>Résumé</a>
          </div>
        </div>
      </div>

      <style>{`
        .nav {
          position: fixed;
          top: clamp(0.6rem, 1.6vh, 1.1rem);
          left: 50%;
          translate: -50% 0;
          z-index: 900;
          width: calc(100% - var(--gutter) * 2);
          max-width: var(--shell);
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 0.5rem 0.5rem 0.65rem;
          border-radius: var(--r-pill);
          border: 1px solid transparent;
          background: transparent;
          transition:
            background 0.5s var(--ease-out),
            border-color 0.5s var(--ease-out),
            backdrop-filter 0.5s var(--ease-out),
            padding 0.5s var(--ease-out),
            transform 0.55s var(--ease-out);
        }
        .nav.is-away { transform: translateY(calc(-100% - 2rem)); }
        .nav.is-stuck {
          background: color-mix(in srgb, var(--paper) 78%, transparent);
          border-color: var(--line-2);
          backdrop-filter: blur(16px) saturate(1.4);
        }

        .nav-logo {
          position: relative;
          display: grid;
          place-items: center;
          width: 44px; height: 44px;
          flex: none;
          color: var(--ink);
        }
        .nav-logo-spin { display: block; width: 24px; height: 24px; }
        /* Hovering the logo re-drops the full stop. */
        .nav-logo:hover .mark-dot { animation: nav-dot 0.8s var(--ease-out); }
        @keyframes nav-dot {
          0% { transform: translateY(0) scale(1, 1); }
          30% { transform: translateY(-38px) scale(0.9, 1.1); }
          62% { transform: translateY(0) scale(1.25, 0.75); }
          80% { transform: translateY(-8px) scale(1, 1); }
          100% { transform: translateY(0) scale(1, 1); }
        }
        .nav-logo-spin .mark { width: 100%; height: 100%; }
        .nav-logo-ring { position: absolute; inset: 0; }
        .nav-logo-ring circle {
          fill: none;
          stroke: var(--acc);
          stroke-width: 2;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }

        /* The links live in their own pill, centred on the bar; the
           highlight is one element that slides between them. */
        .nav-links {
          position: absolute;
          left: 50%;
          translate: -50% 0;
          display: flex;
          align-items: center;
          gap: 0;
          padding: 4px;
          border-radius: var(--r-pill);
          background: color-mix(in srgb, var(--paper-2) 82%, transparent);
          border: 1px solid var(--line-2);
          backdrop-filter: blur(14px) saturate(1.4);
        }
        .nav-blob, .nav-hover {
          position: absolute;
          left: 0; top: 4px; bottom: 4px;
          width: 0;
          border-radius: var(--r-pill);
          opacity: 0;
          pointer-events: none;
        }
        .nav-hover { background: color-mix(in srgb, var(--ink) 8%, transparent); }
        .nav-blob { background: var(--ink); }
        .nav-link {
          position: relative;
          display: block;
          padding: 0.55rem 0.95rem;
          border-radius: var(--r-pill);
          font-size: var(--step--1);
          font-weight: 550;
          color: var(--ink-2);
          transition: color 0.35s var(--ease-out);
        }
        .nav-link:hover { color: var(--ink); }
        .nav-link.is-on { color: var(--paper); }
        /* The label rolls over to a copy of itself: one clean motion,
           no letters jumping about. */
        .nav-roll { display: grid; height: 1.25em; line-height: 1.25em; overflow: hidden; white-space: nowrap; }
        .nav-roll > span { grid-area: 1 / 1; transition: transform 0.5s var(--ease-out); }
        .nav-roll > span:last-child { transform: translateY(100%); }
        .nav-link:hover .nav-roll > span:first-child { transform: translateY(-100%); }
        .nav-link:hover .nav-roll > span:last-child { transform: translateY(0); }

        /* The CTA is a status line you can press: a live dot says the
           door is open, and on hover the words roll over to say what
           for while the arrow goes out and comes back round. */
        .nav-cta {
          display: inline-flex; align-items: center; gap: 0.6em;
          height: 2.6rem;
          padding: 0 0.4rem 0 1rem;
          border-radius: var(--r-pill);
          background: var(--ink); color: var(--paper);
          font-family: var(--font-display); font-weight: 650; font-size: var(--step--1); letter-spacing: -0.02em;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12), 0 8px 18px -10px rgba(0, 0, 0, 0.5);
          transition: background 0.45s var(--ease-out), color 0.45s var(--ease-out), translate 0.45s var(--ease-out);
        }
        .nav-cta-live { position: relative; width: 8px; height: 8px; flex: none; }
        .nav-cta-live i, .nav-cta-live::after {
          position: absolute; inset: 0; border-radius: 99px; background: var(--lime);
        }
        .nav-cta-live::after { content: ""; animation: nav-live 2s var(--ease-out) infinite; }
        @keyframes nav-live { from { transform: scale(1); opacity: 0.7; } to { transform: scale(2.8); opacity: 0; } }
        .nav-cta-roll {
          display: grid; height: 1.3em; overflow: hidden; line-height: 1.3em; white-space: nowrap;
        }
        .nav-cta-roll > span { grid-area: 1 / 1; transition: transform 0.55s var(--ease-out), opacity 0.4s; }
        .nav-cta-roll > span:last-child { transform: translateY(110%); opacity: 0; }
        .nav-cta-arr {
          position: relative; display: grid; place-items: center;
          width: 1.9rem; height: 1.9rem; flex: none;
          border-radius: 99px;
          background: var(--paper); color: var(--ink);
          overflow: hidden;
          transition: background 0.45s var(--ease-out), color 0.45s;
        }
        .nav-cta-arr svg {
          grid-area: 1 / 1; width: 0.72rem; height: 0.72rem; max-width: none;
          fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
          transition: transform 0.55s var(--ease-out);
        }
        .nav-cta-arr svg:last-child { transform: translate(-160%, 160%); }
        .nav-cta:hover { background: var(--acc); color: var(--acc-ink); }
        .nav-cta:hover .nav-cta-roll > span:first-child { transform: translateY(-110%); opacity: 0; }
        .nav-cta:hover .nav-cta-roll > span:last-child { transform: translateY(0); opacity: 1; }
        .nav-cta:hover .nav-cta-arr { background: var(--acc-ink); color: var(--acc); }
        .nav-cta:hover .nav-cta-arr svg:first-child { transform: translate(160%, -160%); }
        .nav-cta:hover .nav-cta-arr svg:last-child { transform: translate(0, 0); }
        .nav-cta:active { translate: 0 1px; }

        /* ---- jump sheet ---- */
        .jump {
          position: fixed;
          inset: 0;
          z-index: 9500;
          display: grid;
          place-items: center;
          background: var(--paper);
          color: var(--ink);
          visibility: hidden;
          pointer-events: none;
          clip-path: inset(100% 0% 0% 0%);
        }
        .jump-box { overflow: hidden; padding: 0.1em var(--gutter) 0.2em; }
        .jump-word {
          display: inline-flex;
          align-items: baseline;
          gap: 0.25em;
          font-size: clamp(3rem, 11vw, 10rem);
          font-weight: 800;
          letter-spacing: -0.06em;
          line-height: 1;
        }
        .jump-n { font-size: 0.28em; color: var(--ink-3); letter-spacing: 0; align-self: flex-start; margin-top: 0.4em; }
        .jump-dot { width: 0.17em; height: 0.17em; margin-left: -0.2em; border-radius: 99px; background: var(--acc); }

        .nav-right { display: flex; align-items: center; gap: 0.5rem; flex: none; margin-left: auto; }

        .nav-burger {
          display: none;
          width: 42px; height: 42px;
          place-items: center;
          gap: 5px;
          border-radius: var(--r-pill);
          border: 1px solid var(--line);
          background: var(--paper-2);
          cursor: pointer;
        }
        .nav-burger span {
          display: block;
          width: 16px; height: 1.6px;
          border-radius: 2px;
          background: var(--ink);
          transition: transform 0.45s var(--ease-out);
        }
        .nav-burger.is-open span:first-child { transform: translateY(3.3px) rotate(45deg); }
        .nav-burger.is-open span:last-child  { transform: translateY(-3.3px) rotate(-45deg); }

        @media (max-width: 1180px) {
          .nav-links { display: none; }
          .nav-cta { display: none; }
          .nav-burger { display: grid; }
          .nav-right { margin-left: auto; }
        }

        /* ---- sheet ---- */
        .sheet {
          position: fixed;
          inset: 0;
          z-index: 880;
          background: #0E0E0D;
          color: #FAFAF7;
          clip-path: inset(0% 0% 100% 0%);
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .sheet-in { width: 100%; padding-block: clamp(5rem, 12vh, 8rem); }
        .sheet-links { margin-bottom: clamp(2rem, 6vh, 3.5rem); }
        .sheet-link-box { overflow: hidden; }
        .sheet-link { display: block; }
        .sheet-link-inner {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding-block: clamp(0.3rem, 1.2vh, 0.6rem);
          transition: transform 0.5s var(--ease-out), color 0.5s var(--ease-out);
        }
        .sheet-link:hover .sheet-link-inner { transform: translateX(1.2rem); color: var(--yellow); }
        .sheet-link-n { color: #6B6B66; font-size: var(--step--1); }
        .sheet-link-label {
          font-size: clamp(2rem, 7.5vw, 5.5rem);
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.045em;
        }
        .sheet-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem 2rem;
          padding-top: clamp(1.5rem, 4vh, 2.5rem);
          border-top: 1px solid rgba(250, 250, 247, 0.16);
        }
        .sheet-meta a { color: #A2A29C; transition: color 0.35s var(--ease-out); }
        .sheet-meta a:hover { color: var(--yellow); }
      `}</style>
    </>
  );
};

export default Nav;
