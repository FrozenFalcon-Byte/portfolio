import React, { useEffect, useRef } from 'react';
import { gsap, reduced } from '../lib/motion';

/* ------------------------------------------------------------------
   The cursor latches onto things.

   Free, it is a small disc that tracks closely — close enough that it
   never reads as lag — and stretches along its direction of travel.
   Over anything interactive it stops following the pointer and takes
   that element's exact box instead: position, size and corner radius.
   The pointer then only nudges it a few pixels, so the control feels
   held rather than hovered.

   A hairline dot stays on the true pointer position throughout, so
   precision is never traded for the effect.

   Fine pointers only. On touch there is no cursor to draw.
   ------------------------------------------------------------------ */

const HOT = 'a, button, [role="button"], summary, [data-cursor="hot"]';
const TEXT = 'input, textarea, [contenteditable="true"], [data-cursor="text"]';

const FREE = 26;          // resting diameter
const LERP = 0.22;        // free-follow response, per 60fps frame
const NUDGE = 0.055;      // how much the pointer pulls a latched cursor

const Cursor = () => {
  const fieldRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine || reduced()) return undefined;

    const field = fieldRef.current;
    const dot = dotRef.current;
    if (!field || !dot) return undefined;

    document.body.classList.add('has-cursor');

    const ptr = { x: innerWidth / 2, y: innerHeight / 2 };
    const pos = { x: ptr.x, y: ptr.y };
    let vx = 0;
    let vy = 0;

    /* The tweened half. The loop folds these into the transform every
       frame, so a state change and the follow never fight over the
       element. `w`/`h`/`r` are the box; `grip` is how much of the
       pointer still reaches a latched cursor. */
    const s = { w: FREE, h: FREE, r: 999, alpha: 1, dotA: 1, press: 1, grip: 1 };

    let latched = null;
    let held = false;

    const set = (vars, dur = 0.42) =>
      gsap.to(s, { duration: dur, ease: 'swift', overwrite: 'auto', ...vars });

    const release = () => {
      latched = null;
      set({ w: FREE, h: FREE, r: 999, alpha: 1, dotA: 1, grip: 1 });
    };

    /* ---- pointer ---- */
    const move = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; };

    const over = (e) => {
      const t = e.target;

      if (t.closest?.(TEXT)) {
        latched = null;
        set({ w: 2, h: 26, r: 2, alpha: 1, dotA: 0, grip: 1 });
        return;
      }

      const hot = t.closest?.(HOT);
      if (!hot) return;

      const b = hot.getBoundingClientRect();
      // Anything the size of a panel would swallow the cursor whole;
      // those just get a softer, larger disc.
      if (b.width > 420 || b.height > 220) {
        latched = null;
        set({ w: 58, h: 58, r: 999, alpha: 0.75, dotA: 1, grip: 1 });
        return;
      }

      latched = hot;
      const radius = parseFloat(getComputedStyle(hot).borderRadius) || 10;
      set({ w: b.width + 10, h: b.height + 10, r: radius + 5, alpha: 1, dotA: 0, grip: NUDGE });
    };

    const out = (e) => {
      if (e.target.closest?.(`${HOT}, ${TEXT}`)) release();
    };

    // A press is a quick squeeze with a little overshoot coming back —
    // the only place a spring ease is worth the frames.
    const down = () => {
      held = true;
      gsap.to(s, { press: 0.86, duration: 0.14, ease: 'power2.out', overwrite: 'auto' });
    };
    const up = () => {
      held = false;
      gsap.to(s, { press: 1, duration: 0.55, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
    };

    /* Sweeping a selection: thin down so the cursor stops covering the
       text being swept. */
    const onSelect = () => {
      if (!held || latched) return;
      const sel = document.getSelection();
      if (!sel || sel.isCollapsed) return;
      set({ w: 3, h: 30, r: 2, dotA: 0 }, 0.25);
    };

    const leave = () => gsap.to([field, dot], { opacity: 0, duration: 0.2, overwrite: 'auto' });
    const enter = () => gsap.to([field, dot], { opacity: 1, duration: 0.2, overwrite: 'auto' });

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.addEventListener('selectionchange', onSelect);
    document.addEventListener('pointerleave', leave);
    document.addEventListener('pointerenter', enter);

    /* ---- the loop ---- */
    const tick = (_t, delta) => {
      // Normalised to a 60fps frame and capped, so a dropped frame
      // nudges the follow instead of launching it.
      const dt = Math.min(delta / 16.667, 3);

      let tx = ptr.x;
      let ty = ptr.y;

      if (latched) {
        // Re-measured every frame: the page scrolls under the cursor,
        // and a latched element has to be tracked as it moves.
        if (!latched.isConnected) {
          release();
        } else {
          const b = latched.getBoundingClientRect();
          const cx = b.left + b.width / 2;
          const cy = b.top + b.height / 2;
          tx = cx + (ptr.x - cx) * s.grip;
          ty = cy + (ptr.y - cy) * s.grip;
        }
      }

      const nx = pos.x + (tx - pos.x) * Math.min(LERP * dt, 1);
      const ny = pos.y + (ty - pos.y) * Math.min(LERP * dt, 1);
      vx = nx - pos.x;
      vy = ny - pos.y;
      pos.x = nx;
      pos.y = ny;

      // Stretch along travel, but only while free — a latched cursor is
      // wearing a button's shape and must keep it.
      const speed = latched ? 0 : Math.hypot(vx, vy);
      const k = Math.min(speed * 0.014, 0.42);
      const angle = speed > 0.4 ? (Math.atan2(vy, vx) * 180) / Math.PI : 0;

      field.style.width = `${s.w}px`;
      field.style.height = `${s.h}px`;
      field.style.borderRadius = `${s.r}px`;
      field.style.opacity = s.alpha;
      field.style.transform =
        `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${angle}deg) ` +
        `scale(${(1 + k) * s.press}, ${(1 - k * 0.7) * s.press})`;

      dot.style.opacity = s.dotA;
      dot.style.transform = `translate3d(${ptr.x}px, ${ptr.y}px, 0)`;
    };

    gsap.ticker.add(tick);

    // Latching holds a live element reference, so a route change has to
    // let it go or the cursor tracks a node that is no longer on screen.
    window.addEventListener('scroll', () => { if (latched && !latched.isConnected) release(); }, { passive: true });

    return () => {
      gsap.ticker.remove(tick);
      document.body.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.removeEventListener('selectionchange', onSelect);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerenter', enter);
      gsap.killTweensOf([s, field, dot]);
    };
  }, []);

  return (
    <>
      <span ref={fieldRef} className="cursor-field" aria-hidden="true" />
      <span ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
};

export default Cursor;
