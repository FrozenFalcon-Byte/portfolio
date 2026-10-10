import React, { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap, ScrollTrigger, EASE, reduced, canBlur } from '../lib/motion';
import Glyph from './Glyph';
import { preloadRoute } from '../lib/routes';

const Ctx = createContext(() => {});

export const useRouteTransition = () => useContext(Ctx);

/* An anchor that still behaves like one — real href, modifier-clicks and
   middle-clicks fall through to the browser — but takes the curtain when
   it is an ordinary left click. */
export const TransitionLink = forwardRef(({ to, title, kicker, children, ...rest }, ref) => {
  const go = useRouteTransition();

  const onClick = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(to, { title, kicker });
  };

  return <a ref={ref} href={to} onClick={onClick} {...rest}>{children}</a>;
});
TransitionLink.displayName = 'TransitionLink';

/* ------------------------------------------------------------------
   The route change is a morph, not a curtain.

   Whatever you pressed — a tab, a card link, a button — grows out of
   its own outline into a full-screen panel in the destination's
   accent, carrying that page's glyph and name. Behind it the old page
   sinks back like a card being put down. The route swaps under the
   panel, and the panel then folds itself down into the destination's
   tab in the nav while the new page rises up to meet you, so the
   thing you clicked visibly becomes where you are.
   ------------------------------------------------------------------ */

const DEST = {
  '/': { acc: 'pink', glyph: 'mark' },
  '/story': { acc: 'yellow', glyph: 'ship' },
  '/lab': { acc: 'lime', glyph: 'stack' },
  '/experience/pmo': { acc: 'blue', glyph: 'graph' },
  '/settings': { acc: 'violet', glyph: 'dial' },
};

const box = (r) => ({ left: r.left, top: r.top, width: r.width, height: r.height });

export const RouteCurtain = ({ children }) => {
  const navigate = useNavigate();
  const morphRef = useRef(null);
  const busy = useRef(false);
  const pressed = useRef({ el: null, t: 0 });
  const [dest, setDest] = useState({ acc: 'pink', glyph: 'mark', title: '' });

  /* Remember what was pressed, so the morph can start from it. */
  useEffect(() => {
    const onDown = (e) => {
      pressed.current = { el: e.target.closest?.('a, button, [data-cursor="hot"]') || null, t: performance.now(), x: e.clientX, y: e.clientY };
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, []);

  const go = useCallback((to, { title } = {}) => {
    if (busy.current) return;
    if (reduced()) { navigate(to); return; }
    busy.current = true;

    const path = to.split('#')[0] || '/';
    // The page's code is fetched while the morph plays; the swap waits
    // for it only if the network is slower than the animation.
    let arrived = false;
    const chunk = preloadRoute(path).catch(() => {}).then(() => { arrived = true; });
    const d = DEST[path] || DEST['/'];
    setDest({ ...d, title: title || 'Ajinkya' });

    const morph = morphRef.current;
    const inner = morph.querySelector('.morph-in');
    const page = document.querySelector('main.page');
    const W = window.innerWidth; const H = window.innerHeight;
    const blur = canBlur();

    // Start from the pressed element, or a small pill at the pointer.
    const p = pressed.current;
    let from;
    if (p.el && performance.now() - p.t < 1500 && p.el.isConnected) {
      const r = p.el.getBoundingClientRect();
      from = r.width > W * 0.8 ? { left: (p.x || W / 2) - 40, top: (p.y || H / 2) - 22, width: 80, height: 44 } : box(r);
    } else {
      from = { left: W / 2 - 40, top: H / 2 - 22, width: 80, height: 44 };
    }
    const r0 = Math.min(from.height / 2, 28);

    window.lenis?.stop();
    const origin = `50% ${window.scrollY + H / 2}px`;

    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false;
        window.lenis?.start();
      },
    });

    tl.set(morph, { ...from, borderRadius: r0, visibility: 'visible', opacity: 1 })
      .set(inner, { opacity: 0, y: 30, scale: 0.92, ...(blur ? { filter: 'blur(10px)' } : {}) })
      // The pressed thing grows to fill the screen…
      .to(morph, { left: 0, top: 0, width: W, height: H, borderRadius: 0, duration: 0.72, ease: EASE.glide }, 0)
      // …while the page behind it is set down.
      .to(page, {
        transformOrigin: origin, scale: 0.9, opacity: 0.4,
        ...(blur ? { filter: 'blur(6px)' } : {}),
        duration: 0.7, ease: EASE.glide,
      }, 0)
      .to(inner, { opacity: 1, y: 0, scale: 1, ...(blur ? { filter: 'blur(0px)' } : {}), duration: 0.6, ease: EASE.swift }, 0.3)

      .add(() => {
        if (arrived) return;
        tl.pause();
        chunk.then(() => tl.resume());
      }, 0.84)
      .add(() => {
        navigate(to);
        gsap.set(page, { transformOrigin: `50% ${H / 2}px`, scale: 0.94, opacity: 0, y: 40, ...(blur ? { filter: 'blur(10px)' } : {}) });
      }, 0.85)

      .to(inner, { opacity: 0, y: -24, scale: 0.96, ...(blur ? { filter: 'blur(8px)' } : {}), duration: 0.4, ease: 'power2.in' }, 1.05)
      // …and folds down into the tab for the page you are now on.
      .add(() => {
        const tab = document.querySelector(`.nav-tab[data-to="${path}"]`);
        const r = tab?.getBoundingClientRect();
        const end = r && r.width ? box(r) : { left: W / 2 - 40, top: 18, width: 80, height: 40 };
        gsap.to(morph, {
          ...end, borderRadius: Math.min(end.height / 2, 28),
          duration: 0.75, ease: EASE.glide,
        });
        gsap.to(morph, { opacity: 0, duration: 0.25, delay: 0.62, ease: 'power1.out' });
        gsap.to(page, {
          scale: 1, opacity: 1, y: 0, ...(blur ? { filter: 'blur(0px)' } : {}),
          duration: 0.85, ease: EASE.swift,
          clearProps: 'transform,transformOrigin,opacity,filter',
          // Pins measured while the page was scaled down keep that size;
          // measure again now that it is back to full size.
          onComplete: () => ScrollTrigger.refresh(),
        });
      }, 1.2)
      .set(morph, { visibility: 'hidden' }, 2.1);
  }, [navigate]);

  return (
    <Ctx.Provider value={go}>
      {children}

      <div className="morph" ref={morphRef} data-acc={dest.acc} aria-hidden="true">
        <div className="morph-in">
          <span className="morph-g"><Glyph kind={dest.glyph} acc={dest.acc} /></span>
          <span className="morph-t display">{dest.title}<i /></span>
        </div>
      </div>

      <style>{`
        .morph {
          position: fixed;
          left: 0; top: 0; width: 0; height: 0;
          z-index: 9600;
          display: grid; place-items: center;
          overflow: hidden;
          background: var(--acc);
          color: var(--acc-ink);
          visibility: hidden;
          pointer-events: none;
          will-change: left, top, width, height;
        }
        .morph-in { display: grid; justify-items: center; gap: 1rem; padding-inline: var(--gutter); text-align: center; white-space: nowrap; }
        .morph-g { font-size: clamp(3rem, 7vw, 5.5rem); line-height: 0; }
        .morph .glyph { --acc: #0E0E0D; --acc-ink: #FFFFFF; }
        .morph-t {
          font-size: clamp(2.6rem, 9vw, 7.5rem);
          font-weight: 800; line-height: 1; letter-spacing: -0.06em;
        }
        .morph-t i {
          display: inline-block; width: 0.17em; height: 0.17em; margin-left: 0.06em;
          border-radius: 99px; background: currentColor;
        }
      `}</style>
    </Ctx.Provider>
  );
};

export default RouteCurtain;
