import React, { useEffect, useRef } from 'react';
import { gsap, EASE, reduced } from '../lib/motion';

/* A dot that tracks exactly and a ring that lags behind it, swelling
   over anything interactive. Fine pointers only — on touch there is no
   cursor to draw, and the body keeps its native one. */
const Cursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine || reduced()) return;

    document.body.classList.add('has-cursor');

    const dot = dotRef.current;
    const ring = ringRef.current;

    const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'none' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'none' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.42, ease: EASE.swift });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.42, ease: EASE.swift });

    const move = (e) => {
      dx(e.clientX); dy(e.clientY);
      rx(e.clientX); ry(e.clientY);
    };

    const HOT = 'a, button, [role="button"], input, textarea, summary';
    const over = (e) => {
      if (e.target.closest?.(HOT)) gsap.to(ring, { scale: 2.1, opacity: 0.55, duration: 0.35, ease: EASE.swift });
    };
    const out = (e) => {
      if (e.target.closest?.(HOT)) gsap.to(ring, { scale: 1, opacity: 1, duration: 0.35, ease: EASE.swift });
    };
    const down = () => gsap.to(ring, { scale: 0.75, duration: 0.2 });
    const up = () => gsap.to(ring, { scale: 1, duration: 0.3 });

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);

    return () => {
      document.body.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <>
      <span ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <span ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
};

export default Cursor;
