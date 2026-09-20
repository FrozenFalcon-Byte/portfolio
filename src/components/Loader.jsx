import React, { useEffect, useRef, useState } from 'react';
import { gsap, EASE, reduced } from '../lib/motion';

/* A short count-in, then the curtain wipes up and hands over to the
   hero. No click gate: the first thing a visitor does should not be
   asking permission to see the site. */
const Loader = () => {
  const rootRef = useRef(null);
  const barRef = useRef(null);
  const markRef = useRef(null);
  const [n, setN] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const done = () => {
      window.loaderIsDone = true;
      window.dispatchEvent(new Event('loader-complete'));
      setGone(true);
    };

    if (reduced()) {
      setN(100);
      gsap.set(rootRef.current, { display: 'none' });
      done();
      return;
    }

    window.lenis?.stop();

    const counter = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        window.lenis?.start();
        window.lenis?.scrollTo(0, { immediate: true });
        done();
      },
    });

    tl.to(counter, {
      v: 100,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => setN(Math.round(counter.v)),
    })
      .fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(markRef.current, { yPercent: -110, opacity: 0, duration: 0.6, ease: EASE.swift }, '-=0.15')
      .to(
        rootRef.current,
        {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.95,
          ease: EASE.glide,
          onComplete: () => gsap.set(rootRef.current, { display: 'none' }),
        },
        '-=0.3'
      );

    return () => {
      tl.kill();
      window.lenis?.start();
    };
  }, []);

  return (
    <div ref={rootRef} className="loader" aria-hidden={gone} role="status" aria-label="Loading">
      <div className="loader-inner shell" ref={markRef}>
        <span className="loader-name display display--m">Ajinkya Chavan</span>
        <span className="loader-n num">{String(n).padStart(3, '0')}</span>
      </div>
      <span className="loader-bar" ref={barRef} />

      <style>{`
        .loader {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: var(--ink);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-bottom: clamp(2rem, 7vh, 4rem);
          clip-path: inset(0 0 0% 0);
        }
        .loader-inner {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          width: 100%;
        }
        .loader-name {
          font-size: clamp(1.4rem, 5vw, 3rem);
          font-stretch: 70%;
          color: var(--fg);
        }
        .loader-n {
          font-size: clamp(1.4rem, 5vw, 3rem);
          color: var(--amber);
          font-weight: 500;
        }
        .loader-bar {
          margin-top: clamp(1rem, 3vh, 1.75rem);
          height: 1px;
          width: 100%;
          background: var(--heat);
          transform: scaleX(0);
          transform-origin: left;
        }
      `}</style>
    </div>
  );
};

export default Loader;
