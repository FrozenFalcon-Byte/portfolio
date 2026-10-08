import React, { createContext, forwardRef, useCallback, useContext, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap, ScrollTrigger, EASE, reduced } from '../lib/motion';

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

/* The route swap happens behind a closed curtain, so the visitor never
   sees the old page tear down or the new one measure itself.

   The curtain is a beat, not a blink: it names where you are going,
   holds while a bar fills under the name, and only then lifts on the
   new page — long enough to register as a chapter break. */
export const RouteCurtain = ({ children }) => {
  const navigate = useNavigate();
  const veilRef = useRef(null);
  const shadeRef = useRef(null);
  const wordRef = useRef(null);
  const kickRef = useRef(null);
  const barRef = useRef(null);
  const busy = useRef(false);

  // Offsets live in GSAP only; a CSS transform here would be read as a
  // pixel offset and stack under yPercent.
  useLayoutEffect(() => {
    gsap.set(veilRef.current, { yPercent: 104 });
    gsap.set(wordRef.current, { yPercent: 120 });
  }, []);

  const go = useCallback((to, { title, kicker } = {}) => {
    if (busy.current) return;

    if (reduced()) { navigate(to); return; }

    busy.current = true;
    const veil = veilRef.current;
    const word = wordRef.current;
    const kick = kickRef.current;
    const shade = shadeRef.current;
    const bar = barRef.current;
    word.querySelector('.curtain-t').textContent = title || 'ajinkya';
    kick.textContent = kicker || '';

    window.lenis?.stop();

    gsap.timeline({
      onComplete: () => {
        busy.current = false;
        window.lenis?.start();
      },
    })
      .set(veil, { pointerEvents: 'auto', visibility: 'visible' })
      // The sheet rises with a soft shadow under its leading edge, and
      // the page beneath darkens as it is covered — ambient occlusion,
      // so the curtain reads as a thing in front of the page.
      .fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0)
      .fromTo(veil,
        { yPercent: 104, borderTopLeftRadius: '48px', borderTopRightRadius: '48px' },
        { yPercent: 0, borderTopLeftRadius: '0px', borderTopRightRadius: '0px', duration: 0.8, ease: EASE.glide }, 0)
      // Motion blur: the type smears along its own travel and resolves
      // as it lands.
      .fromTo(word,
        { yPercent: 120, filter: 'blur(14px)' },
        { yPercent: 0, filter: 'blur(0px)', duration: 0.75, ease: EASE.swift }, 0.3)
      .fromTo(kick, { yPercent: 120, opacity: 0, filter: 'blur(8px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: EASE.swift }, 0.45)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0.6)

      .add(() => navigate(to), 1.05)
      .add(() => ScrollTrigger.refresh(), 1.4)

      .to([kick, bar], { opacity: 0, filter: 'blur(6px)', duration: 0.3 }, 1.8)
      .to(word, { yPercent: -120, filter: 'blur(14px)', duration: 0.55, ease: 'power3.in' }, 1.85)
      .to(veil, {
        yPercent: -104, borderBottomLeftRadius: '48px', borderBottomRightRadius: '48px',
        duration: 0.85, ease: EASE.glide,
      }, 2.0)
      .to(shade, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, 2.1)
      .set(veil, { pointerEvents: 'none', visibility: 'hidden', yPercent: 104, borderRadius: 0 })
      .set(word, { yPercent: 120, filter: 'none' })
      .set([kick, bar], { opacity: 1, scaleX: 0, filter: 'none' });
  }, [navigate]);

  return (
    <Ctx.Provider value={go}>
      {children}

      <div className="curtain-shade" ref={shadeRef} aria-hidden="true" />
      <div className="curtain" ref={veilRef} data-surface="ink" data-acc="yellow" aria-hidden="true">
        <div className="curtain-in">
          <span className="curtain-kbox"><span className="curtain-kick" ref={kickRef} /></span>
          <span className="curtain-box">
            <span className="curtain-word display" ref={wordRef}><span className="curtain-t">ajinkya</span><i className="curtain-dot" /></span>
          </span>
          <span className="curtain-bar"><i ref={barRef} /></span>
        </div>
      </div>

      <style>{`
        .curtain {
          position: fixed;
          inset: 0;
          z-index: 9600;
          display: grid;
          place-items: center;
          pointer-events: none;
          visibility: hidden;
          background: var(--paper);
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 -30px 80px 10px rgba(0, 0, 0, 0.32), 0 30px 80px 10px rgba(0, 0, 0, 0.32);
          will-change: transform;
        }
        .curtain-shade {
          position: fixed; inset: 0; z-index: 9590;
          background: rgba(10, 10, 9, 0.38);
          opacity: 0;
          pointer-events: none;
        }
        .curtain-word, .curtain-kick { will-change: transform, filter; }
        .curtain-in { display: grid; justify-items: center; gap: 1.1rem; padding-inline: var(--gutter); text-align: center; }
        .curtain-kbox { display: block; overflow: hidden; }
        .curtain-kick { display: block; color: var(--ink-3); font-size: var(--step-0); font-weight: 500; min-height: 1.3em; }
        .curtain-bar { display: block; width: min(16rem, 50vw); height: 4px; border-radius: 4px; background: var(--paper-3); overflow: hidden; }
        .curtain-bar i { display: block; height: 100%; background: var(--acc); transform-origin: left; transform: scaleX(0); }
        .curtain-box { display: block; overflow: hidden; padding-bottom: 0.08em; }
        .curtain-word {
          display: block;
          font-size: clamp(2.6rem, 9vw, 7.5rem);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.06em;
          color: var(--ink);
        }
        .curtain-dot {
          display: inline-block;
          width: 0.17em; height: 0.17em;
          margin-left: 0.06em;
          border-radius: 99px;
          background: var(--acc);
        }
      `}</style>
    </Ctx.Provider>
  );
};

export default RouteCurtain;
