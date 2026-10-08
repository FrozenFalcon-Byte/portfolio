import React, { useEffect, useRef } from 'react';
import { gsap, EASE, fine, reduced } from '../lib/motion';

/* ------------------------------------------------------------------
   The cursor.

   A chunky rounded arrow with a light rim, sitting exactly on the
   hotspot — no spring, no lag, because anything that trails the pointer
   is a worse cursor than the one the OS already ships. What moves is
   the chip clipped to its tail: it carries a word about whatever is
   under the pointer, and it is the only part that is allowed to be
   late, so the cursor stays precise while still feeling alive.

   Over a text field the arrow is swapped for a beam. That is the whole
   state machine — two shapes, one chip. Five hand-drawn states would
   look like more work and read as less.

   Colour comes off the nearest [data-acc] ancestor of whatever is under
   the pointer, so the cursor belongs to the section it is in.
   ------------------------------------------------------------------ */
const HOT = 'a, button, [role="button"], summary, label, [data-cursor="hot"]';
const TEXT = 'input, textarea, [contenteditable="true"], [data-cursor="text"]';

const labelFor = (el) => {
  const given = el.getAttribute('data-cursor-label');
  if (given) return given;
  if (el.matches('a[download]')) return 'Download';
  if (el.matches('a[target="_blank"]')) return 'Visit';
  return '';
};

const Cursor = () => {
  const rootRef = useRef(null);
  const arrowRef = useRef(null);
  const beamRef = useRef(null);
  const chipRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!fine() || reduced()) return undefined;

    const root = rootRef.current;
    const arrow = arrowRef.current;
    const beam = beamRef.current;
    const chip = chipRef.current;
    const label = labelRef.current;
    document.body.classList.add('has-cursor');

    const ptr = { x: innerWidth / 2, y: innerHeight / 2 };
    const tilt = { a: 0, v: 0 };
    let lastX = ptr.x;
    // Tweened by the states; read once per frame by the loop, so nothing
    // ever fights over the same transform.
    const s = { scale: 1, lift: 0 };

    let mode = 'free';
    let accScope = null;

    const recolour = (el) => {
      const scope = el?.closest?.('[data-acc], [data-surface], body');
      if (!scope || scope === accScope) return;
      accScope = scope;
      const cs = getComputedStyle(scope);
      const style = root.style;
      style.setProperty('--cur-acc', cs.getPropertyValue('--acc').trim() || '#E61A66');
      style.setProperty('--cur-on-acc', cs.getPropertyValue('--acc-ink').trim() || '#FFFFFF');
      style.setProperty('--cur-rim', cs.getPropertyValue('--paper').trim() || '#FFFFFF');
    };

    const setChip = (text) => {
      if (text) {
        label.textContent = text;
        gsap.to(chip, { scale: 1, opacity: 1, duration: 0.42, ease: 'back.out(2)' });
      } else {
        gsap.to(chip, { scale: 0.4, opacity: 0, duration: 0.28, ease: EASE.swift });
      }
    };

    const apply = (next, text = '') => {
      if (next === mode && !text) return;
      const was = mode;
      mode = next;

      if (next === 'text') {
        gsap.to(arrow, { opacity: 0, scale: 0.6, duration: 0.25, ease: EASE.swift });
        gsap.to(beam, { opacity: 1, scale: 1, duration: 0.3, ease: EASE.swift });
        setChip('');
        return;
      }

      if (was === 'text') {
        gsap.to(beam, { opacity: 0, scale: 0.6, duration: 0.22, ease: EASE.swift });
        gsap.to(arrow, { opacity: 1, scale: 1, duration: 0.3, ease: EASE.swift });
      }

      if (next === 'hot') {
        // The arrow lifts off the surface rather than growing — it is
        // picking the control up, not pointing harder at it.
        gsap.to(s, { scale: 0.82, lift: -4, duration: 0.4, ease: EASE.swift });
        setChip(text);
      } else {
        gsap.to(s, { scale: 1, lift: 0, duration: 0.45, ease: EASE.swift });
        setChip('');
      }
    };

    /* State is decided by what is actually under the hotspot, not by
       which element last fired pointerover — content scrolls under a
       still pointer, sheets close, buttons unmount. So the element at
       the pointer is re-read every few frames and whenever the page
       scrolls, and the chip can never be left describing something
       that is no longer there. */
    let under = null;
    const evaluate = (el) => {
      if (el === under) return;
      under = el;
      if (!el || el.closest?.('.loader, .curtain')) { apply('free'); return; }
      recolour(el);
      const hot = el.closest?.(HOT);
      if (el.closest?.(TEXT)) apply('text');
      else if (hot) apply('hot', labelFor(hot));
      else apply('free');
    };
    const probe = () => evaluate(document.elementFromPoint(ptr.x, ptr.y));

    let shown = false;
    const show = (on) => {
      if (on === shown) return;
      shown = on;
      gsap.to(root, { opacity: on ? 1 : 0, duration: 0.25, overwrite: 'auto' });
    };
    gsap.set(root, { opacity: 0 });

    const onOver = (e) => evaluate(e.target);
    const onMove = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; show(true); };
    const onScroll = () => { under = null; probe(); };

    const onDown = () => gsap.to(s, { scale: mode === 'hot' ? 0.68 : 0.82, duration: 0.12, ease: 'power2.out' });
    const onUp = () => gsap.to(s, {
      scale: mode === 'hot' ? 0.82 : 1,
      duration: 0.55,
      ease: 'elastic.out(1, 0.5)',
    });

    const onLeave = () => { show(false); evaluate(null); };
    const onEnter = () => show(true);
    let frame = 0;

    const tick = (_t, delta) => {
      const dt = Math.min(delta / 16.667, 3);
      frame += 1;
      if (shown && frame % 6 === 0) { under = under && under.isConnected ? under : null; probe(); }

      // The arrow leans into its own travel on a spring, so it settles
      // back upright instead of snapping.
      const want = gsap.utils.clamp(-14, 14, (ptr.x - lastX) * 0.9);
      lastX = ptr.x;
      tilt.v += (want - tilt.a) * 0.16 * dt;
      tilt.v *= 0.8;
      tilt.a += tilt.v;

      root.style.transform = `translate3d(${ptr.x}px, ${ptr.y}px, 0)`;
      arrow.style.transform = `translate(0, ${s.lift}px) rotate(${tilt.a}deg) scale(${s.scale})`;
      beam.style.transform = `rotate(${tilt.a * 0.4}deg)`;
    };

    gsap.ticker.add(tick);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);
    window.addEventListener('blur', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    // A theme switch repoints every token; forget the cached scope so
    // the next move re-reads them.
    const onTheme = () => { accScope = null; };
    window.addEventListener('themechange', onTheme);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('themechange', onTheme);
      document.body.classList.remove('has-cursor');
    };
  }, []);

  /* The arrow is drawn twice over the same geometry: once as a fat
     stroke that becomes the rim, once filled on top. One path, so the
     two can never drift out of register. */
  const ARROW = 'M4.6 20.2 L3.9 6.5 C3.8 4.7 5.8 3.5 7.3 4.5 L18.8 11.9 '
    + 'C20.7 13.2 19.8 16.1 17.6 16.0 L13.0 15.9 C12.2 15.9 11.4 16.3 11.0 17.1 '
    + 'L8.8 21.1 C7.8 23.1 4.8 22.4 4.6 20.2 Z';

  return (
    <div className="cur" ref={rootRef} aria-hidden="true">
      <svg className="cur-arrow" ref={arrowRef} width="26" height="28" viewBox="0 0 26 28">
        <path className="cur-rim" d={ARROW} />
        <path className="cur-fill" d={ARROW} />
      </svg>

      <svg className="cur-beam" ref={beamRef} width="16" height="30" viewBox="0 0 16 30">
        <path className="cur-rim" d="M8 3 V27 M3.5 3 H12.5 M3.5 27 H12.5" />
        <path className="cur-beam-line" d="M8 3 V27 M3.5 3 H12.5 M3.5 27 H12.5" />
      </svg>

      <span className="cur-chip" ref={chipRef}>
        <span className="cur-chip-label" ref={labelRef} />
      </span>
    </div>
  );
};

export default Cursor;
