import React, { createContext, forwardRef, useCallback, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap, ScrollTrigger, EASE, reduced } from '../lib/motion';

const Ctx = createContext(() => {});

export const useRouteTransition = () => useContext(Ctx);

/* An anchor that still behaves like one — real href, modifier-clicks and
   middle-clicks fall through to the browser — but takes the curtain when
   it is an ordinary left click. */
export const TransitionLink = forwardRef(({ to, children, ...rest }, ref) => {
  const go = useRouteTransition();

  const onClick = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(to);
  };

  return <a ref={ref} href={to} onClick={onClick} {...rest}>{children}</a>;
});
TransitionLink.displayName = 'TransitionLink';

/* The route swap happens behind a closed curtain, so the visitor never
   sees the old page tear down or the new one measure itself. */
export const RouteCurtain = ({ children }) => {
  const navigate = useNavigate();
  const veilRef = useRef(null);
  const wordRef = useRef(null);
  const busy = useRef(false);

  const go = useCallback((to) => {
    if (busy.current) return;

    if (reduced()) { navigate(to); return; }

    busy.current = true;
    const veil = veilRef.current;
    const word = wordRef.current;

    window.lenis?.stop();

    gsap.timeline({
      onComplete: () => {
        busy.current = false;
        window.lenis?.start();
      },
    })
      .set(veil, { pointerEvents: 'auto' })
      .fromTo(veil,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.62, ease: EASE.glide })
      .fromTo(word,
        { yPercent: 120 },
        { yPercent: 0, duration: 0.55, ease: EASE.swift }, 0.2)

      .add(() => navigate(to))
      // One beat for React to commit the new route before it is uncovered.
      .to({}, { duration: 0.18 })
      .add(() => ScrollTrigger.refresh())

      .to(word, { yPercent: -120, duration: 0.5, ease: EASE.swift })
      .to(veil, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.72, ease: EASE.glide }, '<0.08')
      .set(veil, { pointerEvents: 'none', clipPath: 'inset(100% 0% 0% 0%)' })
      .set(word, { yPercent: 120 });
  }, [navigate]);

  return (
    <Ctx.Provider value={go}>
      {children}

      <div className="curtain" ref={veilRef} data-tone="ink" aria-hidden="true">
        <span className="curtain-box">
          <span className="curtain-word display" ref={wordRef}>Ajinkya Chavan</span>
        </span>
      </div>

      <style>{`
        .curtain {
          position: fixed;
          inset: 0;
          z-index: 9600;
          display: grid;
          place-items: center;
          clip-path: inset(100% 0% 0% 0%);
          pointer-events: none;
        }
        .curtain-box { display: block; overflow: hidden; padding-inline: var(--gutter); }
        .curtain-word {
          display: block;
          font-size: clamp(1.6rem, 6vw, 4rem);
          letter-spacing: -0.04em;
          color: var(--ink);
          transform: translateY(120%);
        }
      `}</style>
    </Ctx.Provider>
  );
};

export default RouteCurtain;
