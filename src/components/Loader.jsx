import React, { useEffect, useRef, useState } from 'react';
import { gsap, EASE, reduced } from '../lib/motion';

const NAME = [['A', 'j', 'i', 'n', 'k', 'y', 'a'], ['C', 'h', 'a', 'v', 'a', 'n']];

/* No click gate. The first thing a visitor does should not be asking
   permission to see the site.
 *
 * The handoff is the point of this component: the name is set in the
 * same face the hero uses, and when the count finishes it flies to the
 * exact box the hero's name already occupies while the dark panel wipes
 * off it. The name never disappears and never re-enters — the ground
 * changes underneath it. */
const Loader = () => {
  const rootRef = useRef(null);
  const veilRef = useRef(null);
  const nameRef = useRef(null);
  const lineRef = useRef(null);
  const furnitureRef = useRef(null);
  const fillRef = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const done = () => {
      window.loaderIsDone = true;
      window.dispatchEvent(new Event('loader-complete'));
      window.lenis?.start();
      document.documentElement.classList.remove('is-loading');
      gsap.set(rootRef.current, { autoAlpha: 0, pointerEvents: 'none' });
    };

    if (reduced()) {
      setCount(100);
      done();
      return undefined;
    }

    window.lenis?.stop();
    document.documentElement.classList.add('is-loading');

    const chars = nameRef.current.querySelectorAll('.loader-char');
    const box = { v: 0 };
    const tl = gsap.timeline();

    gsap.set(chars, { yPercent: 118, opacity: 0 });

    tl.to(chars, {
      yPercent: 0,
      opacity: 1,
      duration: 0.9,
      stagger: { each: 0.035, from: 'start' },
      ease: EASE.swift,
    }, 0)
      .to(box, {
        v: 100,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: () => setCount(Math.round(box.v)),
      }, 0)
      .to(fillRef.current, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0)

      // Clear the furniture first so only the name is left to hand over.
      .to(furnitureRef.current.children, {
        y: -14,
        opacity: 0,
        duration: 0.35,
        stagger: 0.05,
        ease: EASE.swift,
      }, 1.25)

      .add(() => {
        const hero = document.querySelector('.hero-lockup .hero-line > span');
        const from = lineRef.current?.getBoundingClientRect();

        if (!hero || !from || !from.width) {
          gsap.to(nameRef.current, { opacity: 0, duration: 0.4 });
          return;
        }

        const to = hero.getBoundingClientRect();
        const heroStyle = getComputedStyle(hero);

        // Scale from the font sizes themselves, not from measured boxes:
        // the loader's line is built from per-character spans and the
        // hero's is one text run, so their box heights need not agree
        // even when the glyphs are identical.
        const scale =
          parseFloat(heroStyle.fontSize) /
          parseFloat(getComputedStyle(nameRef.current).fontSize);

        gsap.to(nameRef.current, {
          x: to.left - from.left,
          y: to.top - from.top,
          scale,
          color: heroStyle.color,
          transformOrigin: 'left top',
          duration: 1.1,
          ease: EASE.swift,
        });
      }, 1.5)

      .to(veilRef.current, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1,
        ease: EASE.swift,
      }, 1.55)

      // Swap the flying copy for the hero's own in a single frame, at the
      // instant they are the same size in the same place.
      .set('.hero-lockup', { opacity: 1 })
      .set(nameRef.current, { opacity: 0 })
      .add(done);

    return () => tl.kill();
  }, []);

  return (
    <div ref={rootRef} className="loader" aria-hidden="true">
      <div className="loader-veil" ref={veilRef} data-tone="ink" />

      <div className="shell loader-shell">
        <h2 className="loader-name display display--hero" ref={nameRef}>
          {NAME.map((word, w) => (
            <span className="loader-line" key={w} ref={w === 0 ? lineRef : undefined}>
              {word.map((c, i) => (
                <span className="loader-char-box" key={`${w}-${i}`}>
                  <span className="loader-char">{c}</span>
                </span>
              ))}
            </span>
          ))}
        </h2>

        <div className="loader-furniture" ref={furnitureRef}>
          <span className="mono loader-label">Loading portfolio</span>
          <span className="num loader-count">{String(count).padStart(3, '0')}</span>
          <span className="loader-track">
            <span className="loader-fill" ref={fillRef} />
          </span>
        </div>
      </div>

      <style>{`
        .loader { position: fixed; inset: 0; z-index: 9999; }
        .loader-veil { position: absolute; inset: 0; clip-path: inset(0% 0% 0% 0%); }

        .loader-shell {
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: clamp(1.5rem, 5vh, 2.5rem);
          padding-block: clamp(6.5rem, 15vh, 9rem) 0;
        }

        .loader-name {
          margin: 0;
          width: max-content;
          color: #F3F1EB;
          font-size: clamp(2.2rem, 9.5vw, 7.5rem);
          will-change: transform;
        }
        .loader-line { display: block; white-space: nowrap; }
        .loader-char-box { display: inline-block; overflow: hidden; vertical-align: top; }
        .loader-char { display: block; will-change: transform; }

        .loader-furniture {
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 520px;
        }
        .loader-label {
          color: #635F6D;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: var(--step--2);
          white-space: nowrap;
        }
        .loader-count { color: var(--acid); font-size: 0.95rem; font-weight: 500; }
        .loader-track { flex: 1; height: 2px; border-radius: 2px; background: rgba(243, 241, 235, 0.16); overflow: hidden; }
        .loader-fill {
          display: block;
          height: 100%;
          background: var(--acid);
          transform: scaleX(0);
          transform-origin: left;
        }

        html.is-loading { overflow: hidden; }

        @media (prefers-reduced-motion: reduce) {
          .loader { display: none; }
        }
      `}</style>
    </div>
  );
};

export default Loader;
