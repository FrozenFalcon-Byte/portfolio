import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, reduced, fx, fx0 } from '../lib/motion';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../lib/theme';
import Mark from './Mark';
import Glyph from './Glyph';
import { useLocation } from 'react-router-dom';
import { useRouteTransition } from './RouteCurtain';

/* Sections of the home page, in reading order. */
const LINKS = [
  { id: 'about',      n: '01', label: 'About' },
  { id: 'experience', n: '02', label: 'Experience' },
  { id: 'work',       n: '03', label: 'Work' },
  { id: 'pair',       n: '04', label: 'Pair' },
  { id: 'assistant',  n: '05', label: 'Ask me' },
  { id: 'stack',      n: '06', label: 'Stack' },
  { id: 'leadership', n: '07', label: 'On the record' },
  { id: 'contact',    n: '08', label: 'Contact' },
];

/* Pages. The bar is about these; the sections live in the index. */
const PAGES = [
  { to: '/',      label: 'Home',     title: 'Home',         kicker: 'Ajinkya Chavan · Portfolio', glyph: 'mark',  acc: 'pink',   note: 'Everything, in one scroll' },
  { to: '/story', label: 'Story',    title: 'Story',        kicker: 'The long way round',         glyph: 'ship',  acc: 'yellow', note: 'A camera ride through the years' },
  { to: '/lab',   label: 'Workshop', title: 'The workshop', kicker: 'Seven builds, one map',      glyph: 'stack', acc: 'lime',   note: 'Every project, built floor by floor' },
];

/* Not a tab: reached from the slider button and the index. */
const SETTINGS = { to: '/settings', label: 'Settings', title: 'Settings', kicker: 'Make it yours', glyph: 'dial', acc: 'violet', note: 'Theme, motion, your cursor, the assistant' };

const Nav = () => {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const barRef = useRef(null);
  const tabsRef = useRef(null);
  const markRef = useRef(null);
  const panelRef = useRef(null);
  const jumpRef = useRef(null);
  const busy = useRef(false);
  const { pathname } = useLocation();
  const route = useRouteTransition();
  const where = useRef(pathname);
  where.current = pathname;

  /* ------------------------------------------------------------------
     Jump. A section link never scrolls the page through everything in
     between — with pinned scenes on the way that is a long, juddering
     ride. A sheet rises with the destination's name on it, the page is
     moved underneath while it is covered, and the sheet lifts away.
     ------------------------------------------------------------------ */
  const jump = useCallback((id) => {
    const target = id === 'top' ? null : document.getElementById(id);
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

  /* Every in-page anchor on the site goes through the jump. */
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

  /* Which section is being read, shown as one rolling label on the
     index button. A single trigger picks by position, so crossing back
     into the hero is one clean change rather than two triggers arguing
     over the boundary (which is what made "About" flicker). */
  useEffect(() => {
    setActive(null);
    if (pathname !== '/') return undefined;
    const pick = () => {
      const line = window.innerHeight * 0.45;
      let on = null;
      LINKS.forEach((l) => {
        const el = document.getElementById(l.id);
        if (el && el.getBoundingClientRect().top <= line) on = l.id;
      });
      setActive((prev) => (prev === on ? prev : on));
    };
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: pick, onRefresh: pick });
    return () => st.kill();
  }, [pathname]);

  /* The ink tab sits under the current page and slides on a route. */
  const placeTab = useCallback((animate) => {
    const tabs = tabsRef.current;
    if (!tabs) return;
    const ink = tabs.querySelector('.nav-ink');
    const link = tabs.querySelector(`[data-to="${pathname}"]`);
    if (!link) { gsap.to(ink, { opacity: 0, duration: 0.3 }); return; }
    const to = { x: link.offsetLeft, width: link.offsetWidth, opacity: 1 };
    if (animate && !reduced()) gsap.to(ink, { ...to, duration: 0.7, ease: EASE.swift });
    else gsap.set(ink, to);
  }, [pathname]);
  useEffect(() => { placeTab(true); }, [placeTab]);
  useEffect(() => {
    const on = () => placeTab(false);
    document.fonts?.ready.then(on);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [placeTab]);

  /* Out of the way while reading down, back the moment you scroll up. */
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

  useEffect(() => {
    const bar = barRef.current;
    const st = ScrollTrigger.create({
      start: 'top -40',
      onToggle: (self) => bar.classList.toggle('is-stuck', self.isActive),
    });
    return () => st.kill();
  }, [pathname]);

  /* The index drops in like a sheet of paper let down from the top of
     the screen: a yellow leaf leads, the ink sheet follows a beat behind
     with its lower edge still curled, and flattens as it lands. Then the
     rows rise into place. Closing lifts it back the way it came, the
     sheet first and the yellow after, so the page is uncovered in order. */
  const leadRef = useRef(null);
  useEffect(() => {
    const panel = panelRef.current;
    const lead = leadRef.current;
    if (!panel || !lead) return undefined;
    const rows = panel.querySelectorAll('.ix-in');
    const curl = '0px 0px 50% 50% / 0px 0px 140px 140px';
    const flat = '0px 0px 0% 0% / 0px 0px 0px 0px';
    gsap.killTweensOf([panel, lead, rows]);
    if (open) {
      window.lenis?.stop();
      panel.scrollTop = 0;
      gsap.set([panel, lead], { visibility: 'visible' });
      gsap.set(panel, { pointerEvents: 'auto' });
      if (reduced()) {
        gsap.set([panel, lead], { yPercent: 0, borderRadius: flat });
        gsap.set(rows, { opacity: 1, y: 0, rotate: 0 });
        return undefined;
      }
      gsap.timeline()
        .fromTo(lead, { yPercent: -100, borderRadius: curl }, { yPercent: 0, borderRadius: flat, duration: 0.75, ease: EASE.glide })
        .fromTo(panel, { yPercent: -100, borderRadius: curl }, { yPercent: 0, borderRadius: flat, duration: 0.8, ease: EASE.glide }, 0.1)
        .fromTo(rows,
          { y: 70, rotate: 2.5, opacity: 0, ...fx(8) },
          { y: 0, rotate: 0, opacity: 1, ...fx0(), duration: 0.9, stagger: 0.04, ease: EASE.swift }, 0.48);
    } else {
      window.lenis?.start();
      if (panel.style.visibility !== 'visible') return undefined;
      gsap.set(panel, { pointerEvents: 'none' });
      const dur = reduced() ? 0 : 1;
      gsap.timeline({ onComplete: () => gsap.set([panel, lead], { visibility: 'hidden' }) })
        .to(rows, { opacity: 0, y: -24, ...fx(6), duration: 0.22 * dur, stagger: 0.008, ease: 'power1.in' })
        .to(panel, { yPercent: -100, borderRadius: curl, duration: 0.7 * dur, ease: EASE.glide }, 0.1 * dur)
        .to(lead, { yPercent: -100, borderRadius: curl, duration: 0.7 * dur, ease: EASE.glide }, 0.22 * dur);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || e.target.closest?.('.nav-index')) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const go = (e, id) => {
    e.preventDefault();
    setOpen(false);
    jump(id);
  };

  const page = (e, p) => {
    e.preventDefault();
    setOpen(false);
    if (p.to === pathname) { jump('top'); return; }
    route(p.to, { title: p.title, kicker: p.kicker });
  };

  /* Logo hover: the full stop drops back in. */
  const bounce = () => {
    const dot = markRef.current?.querySelector('.mark-dot');
    if (!dot || reduced() || gsap.isTweening(dot)) return;
    gsap.timeline()
      .to(dot, { y: -30, scaleX: 0.9, scaleY: 1.1, duration: 0.34, ease: 'power2.out' })
      .to(dot, { y: 0, scaleX: 1, scaleY: 1, duration: 0.32, ease: 'power2.in' })
      .to(dot, { scaleX: 1.25, scaleY: 0.75, duration: 0.1, ease: 'power1.out' })
      .to(dot, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
  };

  const now = LINKS.find((l) => l.id === active);

  return (
    <>
      <header className="nav" ref={barRef}>
        <a href="#top" className="nav-logo" onClick={(e) => go(e, 'top')} onMouseEnter={bounce} aria-label="Ajinkya Chavan — back to top">
          <span className="nav-logo-mark"><Mark ref={markRef} /></span>
        </a>

        <nav className="nav-links" aria-label="Pages" ref={tabsRef}>
          <span className="nav-ink" aria-hidden="true" />
          {PAGES.map((p) => (
            <a
              key={p.to}
              href={p.to}
              data-to={p.to}
              onClick={(e) => page(e, p)}
              className={`nav-tab${pathname === p.to ? ' is-on' : ''}`}
              aria-current={pathname === p.to ? 'page' : undefined}
            >
              <span className="nav-roll" aria-hidden="true">
                <span>{p.label}</span>
                <span>{p.label}</span>
              </span>
              <span className="sr-only">{p.label}</span>
            </a>
          ))}
        </nav>

        <div className="nav-right">
          <a
            href="/settings"
            onClick={(e) => page(e, SETTINGS)}
            className={`nav-set${pathname === '/settings' ? ' is-on' : ''}`}
            aria-label="Settings"
            data-cursor-label="Settings"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 6h14M3 14h14" />
              <circle cx="7" cy="6" r="2.4" />
              <circle cx="13" cy="14" r="2.4" />
            </svg>
          </a>
          <ThemeToggle theme={theme} onToggle={toggle} />
          <button
            type="button"
                        className={`nav-index${open ? ' is-open' : ''}`}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="nav-ix"
            data-cursor="hot"
          >
            <span className="nav-now" aria-hidden="true">
              <span key={open ? 'close' : active || 'none'} className="nav-now-in">
                {open ? 'Close' : now ? <><i className="num">{now.n}</i>{now.label}</> : 'Index'}
              </span>
            </span>
            <span className="sr-only">{open ? 'Close the index' : 'Open the index'}</span>
            <span className={`nav-grid${open ? ' is-x' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span>
          </button>
        </div>
      </header>

      <div className="ix-lead" ref={leadRef} data-acc="yellow" aria-hidden="true" />
      <div className="ix" id="nav-ix" ref={panelRef} data-surface="ink" data-acc="yellow" role="dialog" aria-label="Index">
        <div className="ix-shell">
        <p className="ix-kick ix-in">{now ? <>You are reading <b>{now.label}</b></> : 'Where to?'}</p>
        <div className="ix-pages">
          <p className="ix-h ix-in">Pages</p>
          {PAGES.map((p) => (
            <a key={p.to} href={p.to} onClick={(e) => page(e, p)} className={`ix-page ix-in${pathname === p.to ? ' is-on' : ''}`} data-cursor="hot">
              <span className="ix-page-g"><Glyph kind={p.glyph} acc={p.acc} /></span>
              <span className="ix-page-t display">{p.label}</span>
              <span className="ix-page-n">{p.note}</span>
            </a>
          ))}
          <a
            href="/experience/pmo"
            onClick={(e) => { e.preventDefault(); setOpen(false); route('/experience/pmo', { title: 'Two graphs', kicker: 'Emerson · PMO AI/ML' }); }}
            className={`ix-page ix-in${pathname === '/experience/pmo' ? ' is-on' : ''}`}
            data-cursor="hot"
          >
            <span className="ix-page-g"><Glyph kind="graph" acc="blue" /></span>
            <span className="ix-page-t display">Emerson case</span>
            <span className="ix-page-n">Two agent systems, drawn out</span>
          </a>
          <a href="/settings" onClick={(e) => page(e, SETTINGS)} className={`ix-page ix-in${pathname === '/settings' ? ' is-on' : ''}`} data-cursor="hot">
            <span className="ix-page-g"><Glyph kind="dial" acc="violet" /></span>
            <span className="ix-page-t display">Settings</span>
            <span className="ix-page-n">{SETTINGS.note}</span>
          </a>
        </div>

        <div className="ix-secs">
          <p className="ix-h ix-in">On the home page</p>
          <ol>
            {LINKS.map((l) => (
              <li key={l.id} className="ix-in">
                <a href={`#${l.id}`} onClick={(e) => go(e, l.id)} className={`ix-sec${active === l.id ? ' is-on' : ''}`}>
                  <span className="num">{l.n}</span>
                  <span className="ix-sec-l">{l.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="ix-foot ix-in">
          <a href="mailto:frozenfalcon8494@gmail.com">frozenfalcon8494@gmail.com</a>
          <a href="https://github.com/FrozenFalcon-Byte" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/ajinkyachavan4829/" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="/resume.pdf" download>Résumé</a>
          <button type="button" className="ix-theme" onClick={toggle}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
        </div>
        </div>
      </div>

      <div className="jump" ref={jumpRef} data-surface="ink" data-acc="yellow" aria-hidden="true">
        <span className="jump-box">
          <span className="jump-word display"><span className="num jump-n" /><span className="jump-t" /><i className="jump-dot" /></span>
        </span>
      </div>

      <style>{`
        /* Three parts on one line: who, which page, where on it. */
        .nav {
          position: fixed;
          top: clamp(0.6rem, 1.6vh, 1.1rem);
          left: 50%;
          translate: -50% 0;
          z-index: 900;
          width: calc(100% - var(--gutter) * 2);
          max-width: var(--shell);
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1rem;
          pointer-events: none;
          transition: transform 0.55s var(--ease-out);
        }
        .nav > * { pointer-events: auto; }
        .nav.is-away { transform: translateY(calc(-100% - 2rem)); }

        .nav-logo {
          justify-self: start;
          display: inline-flex; align-items: center; gap: 0.7rem;
          padding: 0.3rem;
          border-radius: var(--r-pill);
          color: var(--ink);
          transition: background 0.5s var(--ease-out), box-shadow 0.5s var(--ease-out);
        }
        .nav-logo-mark {
          display: grid; place-items: center;
          width: 40px; height: 40px;
          border-radius: 99px;
          background: var(--paper-2);
        }
        .nav-logo-mark .mark { width: 22px; height: 22px; }

        .nav-links {
          position: relative;
          display: flex; align-items: center;
          padding: 4px;
          border-radius: var(--r-pill);
          background: color-mix(in srgb, var(--paper-2) 86%, transparent);
          backdrop-filter: blur(14px) saturate(1.4);
          box-shadow: inset 0 0 0 1px var(--line-2);
        }
        .nav-ink {
          position: absolute; left: 0; top: 4px; bottom: 4px; width: 0;
          border-radius: var(--r-pill);
          background: var(--ink);
          opacity: 0;
          pointer-events: none;
        }
        .nav-tab {
          position: relative;
          padding: 0.6rem 1.15rem;
          border-radius: var(--r-pill);
          font-size: var(--step--1); font-weight: 600;
          color: var(--ink-2);
          transition: color 0.4s var(--ease-out);
        }
        .nav-tab:hover { color: var(--ink); }
        .nav-tab.is-on { color: var(--paper); }
        .nav-roll { display: grid; height: 1.25em; line-height: 1.25em; overflow: hidden; white-space: nowrap; }
        .nav-roll > span { grid-area: 1 / 1; transition: transform 0.5s var(--ease-out); }
        .nav-roll > span:last-child { transform: translateY(100%); }
        .nav-tab:hover .nav-roll > span:first-child { transform: translateY(-100%); }
        .nav-tab:hover .nav-roll > span:last-child { transform: translateY(0); }

        .nav-right { justify-self: end; display: flex; align-items: center; gap: 0.5rem; }
        .nav-set {
          display: grid; place-items: center; flex: none;
          width: 38px; height: 38px; border-radius: 99px;
          color: var(--ink);
          transition: background 0.3s var(--ease-out), transform 0.5s var(--ease-out);
        }
        .nav-set svg { width: 20px; height: 20px; fill: var(--paper); stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; overflow: visible; }
        .nav-set circle { transition: transform 0.5s var(--ease-out); }
        .nav-set:hover, .nav-set.is-on { background: var(--paper-2); }
        .nav-set:hover circle:first-of-type { transform: translateX(6px); }
        .nav-set:hover circle:last-of-type { transform: translateX(-6px); }

        /* The index button reads out the section you are in; the label
           rolls up to the next one rather than swapping in place. */
        .nav-index {
          display: inline-flex; align-items: center; gap: 0.75rem;
          height: 2.75rem;
          padding: 0 0.4rem 0 1.05rem;
          border: 0; border-radius: var(--r-pill);
          background: color-mix(in srgb, var(--paper-2) 86%, transparent);
          backdrop-filter: blur(14px) saturate(1.4);
          box-shadow: inset 0 0 0 1px var(--line-2);
          color: var(--ink);
          font: inherit; font-size: var(--step--1); font-weight: 600;
          cursor: pointer;
        }
        .nav-now { display: block; height: 1.3em; overflow: hidden; line-height: 1.3em; min-width: 4.5rem; text-align: left; }
        .nav-now-in { display: inline-flex; gap: 0.45em; white-space: nowrap; animation: nav-now 0.6s var(--ease-out); }
        .nav-now-in i { font-style: normal; color: var(--ink-3); }
        @keyframes nav-now { from { transform: translateY(100%); opacity: 0; } to { transform: none; opacity: 1; } }
        .nav-grid {
          display: grid; grid-template-columns: repeat(2, 5px); gap: 4px;
          place-content: center;
          width: 2rem; height: 2rem;
          border-radius: 99px;
          background: var(--ink);
          transition: rotate 0.6s var(--ease-out), background 0.4s;
        }
        .nav-grid i { width: 5px; height: 5px; border-radius: 2px; background: var(--paper); transition: border-radius 0.4s, transform 0.5s var(--ease-out), background 0.4s; }
        .nav-index:hover .nav-grid { rotate: 45deg; }
        .nav-index.is-open .nav-grid { rotate: 45deg; background: var(--yellow); }
        .nav-index.is-open .nav-grid i { border-radius: 99px; background: #0E0E0D; }
        .nav-index.is-open .nav-grid i:nth-child(1) { transform: translate(2px, 2px); }
        .nav-index.is-open .nav-grid i:nth-child(2) { transform: translate(-2px, 2px); }
        .nav-index.is-open .nav-grid i:nth-child(3) { transform: translate(2px, -2px); }
        .nav-index.is-open .nav-grid i:nth-child(4) { transform: translate(-2px, -2px); }

        .nav.is-stuck .nav-logo {
          background: color-mix(in srgb, var(--paper) 80%, transparent);
          backdrop-filter: blur(14px) saturate(1.4);
          box-shadow: inset 0 0 0 1px var(--line-2);
        }

        /* ---- index sheet ---- */
        .ix {
          position: fixed; inset: 0;
          z-index: 899;
          overflow: auto;
          overscroll-behavior: contain;
          background: var(--paper);
          color: var(--ink);
          visibility: hidden;
          pointer-events: none;
        }
        .ix-lead {
          position: fixed; inset: 0;
          z-index: 898;
          background: var(--acc);
          visibility: hidden;
          pointer-events: none;
        }
        .ix-shell {
          width: calc(100% - var(--gutter) * 2);
          max-width: var(--shell);
          min-height: 100%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto 1fr auto;
          gap: clamp(1.5rem, 4vh, 3rem) clamp(2rem, 6vw, 6rem);
          padding: calc(clamp(0.6rem, 1.6vh, 1.1rem) + 2.75rem + clamp(1.5rem, 6vh, 4.5rem)) 0 clamp(1.25rem, 3vh, 2rem);
        }
        .ix-kick { grid-column: 1 / -1; margin: 0; color: var(--ink-3); font-size: var(--step-0); font-weight: 550; }
        .ix-kick b { color: var(--acc); font-weight: 650; }
        .ix-h { color: var(--ink-3); font-size: var(--step--2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.7rem; }
        .ix-pages { display: grid; gap: 0.3rem; align-content: start; }
        .ix-page {
          display: grid;
          grid-template-columns: clamp(4.6rem, 7.6vw, 6.6rem) 1fr;
          column-gap: 1.2rem;
          align-items: center;
          padding: clamp(0.7rem, 1.6vh, 1.1rem) 1rem;
          margin-inline: -1rem;
          border-radius: 24px;
          transition: background 0.35s var(--ease-out);
        }
        .ix-page:hover, .ix-page.is-on { background: var(--paper-2); }
        .ix-page-g { grid-row: 1 / 3; justify-self: start; font-size: clamp(2.4rem, 4vw, 3.5rem); line-height: 0; transition: transform 0.6s var(--ease-out); }
        .ix-page:hover .ix-page-g { transform: rotate(-8deg) scale(1.08); }
        .ix-page-t { font-size: clamp(1.8rem, 3.6vw, 3.2rem); font-weight: 750; letter-spacing: -0.05em; line-height: 1; }
        .ix-page-n { color: var(--ink-2); font-size: var(--step--1); margin-top: 0.3rem; }
        .ix-page.is-on .ix-page-t::after { content: ""; display: inline-block; width: 0.2em; height: 0.2em; margin-left: 0.08em; border-radius: 99px; background: var(--acc); }

        .ix-secs ol { list-style: none; margin: 0; padding: 0; display: grid; }
        .ix-sec {
          display: flex; align-items: baseline; gap: 1rem;
          padding: clamp(0.35rem, 1vh, 0.6rem) 0;
          border-bottom: 1px solid var(--line-2);
          font-family: var(--font-display); font-weight: 700;
          font-size: clamp(1.6rem, 3.2vw, 2.9rem); letter-spacing: -0.05em; line-height: 1.05;
          color: var(--ink-2);
          transition: color 0.3s, padding 0.5s var(--ease-out);
        }
        .ix-sec .num { font-family: var(--font-body); font-size: var(--step--1); font-weight: 600; color: var(--ink-3); letter-spacing: 0; min-width: 1.6rem; }
        .ix-sec:hover { color: var(--ink); padding-left: 0.8rem; }
        .ix-sec.is-on { color: var(--acc); }

        .ix-foot {
          grid-column: 1 / -1;
          align-self: end;
          display: flex; flex-wrap: wrap; gap: 0.5rem 1.8rem;
          padding-top: 1.2rem;
          border-top: 1px solid var(--line);
          font-size: var(--step--1); font-weight: 550;
        }
        .ix-foot a { color: var(--ink-2); transition: color 0.3s; }
        .ix-foot a:hover, .ix-theme:hover { color: var(--acc); }
        .ix-theme { display: none; margin-left: auto; padding: 0; border: 0; background: none; font: inherit; color: var(--ink-2); cursor: pointer; transition: color 0.3s; }

        /* ---- jump sheet ---- */
        .jump {
          position: fixed; inset: 0; z-index: 9500;
          display: grid; place-items: center;
          background: var(--paper); color: var(--ink);
          visibility: hidden; pointer-events: none;
          clip-path: inset(100% 0% 0% 0%);
        }
        .jump-box { overflow: hidden; padding: 0.1em var(--gutter) 0.2em; }
        .jump-word {
          display: inline-flex; align-items: baseline; gap: 0.25em;
          font-size: clamp(3rem, 11vw, 10rem);
          font-weight: 800; letter-spacing: -0.06em; line-height: 1;
        }
        .jump-n { font-size: 0.28em; color: var(--ink-3); letter-spacing: 0; align-self: flex-start; margin-top: 0.4em; }
        .jump-dot { width: 0.17em; height: 0.17em; margin-left: -0.2em; border-radius: 99px; background: var(--acc); }

        @media (max-width: 980px) {
        }
        @media (max-width: 760px) {
          .nav { grid-template-columns: auto 1fr auto; gap: 0.4rem; }
          .nav-links { justify-self: center; }
          .nav-tab { padding: 0.55rem 0.7rem; }
          .nav-now { display: none; }
          .nav-index { padding: 0 0.38rem; gap: 0; }
          .nav-right .theme-toggle, .nav-right .nav-set { display: none; }
          .ix-theme { display: inline; }
          .ix-shell { grid-template-columns: 1fr; grid-template-rows: none; }
        }
        @media (max-width: 420px) {
          .nav-tab { padding: 0.5rem 0.5rem; font-size: var(--step--2); }
        }
      `}</style>
    </>
  );
};

export default Nav;
