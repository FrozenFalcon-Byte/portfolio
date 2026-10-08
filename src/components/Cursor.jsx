import React, { useEffect, useRef } from 'react';
import { gsap, EASE, fine, reduced } from '../lib/motion';

/* ------------------------------------------------------------------
   The cursor.

   Built the way plnty builds theirs: one drawn shape per state, all
   stacked on the hotspot, and only the one that matches what is under
   the pointer is shown.

     arrow — the resting pointer
     hand  — over anything you can press
     press — the hand, finger down, while the button is held
     beam  — over a text field

   Every shape is drawn as three layers of the same geometry: a fat
   ink stroke, a thinner paper stroke, then the accent fill. Stacked,
   they give a sticker outline, and because the layers are unions the
   hand can be built from plain rounded rectangles without seams.

   The shapes sit exactly on the hotspot — nothing about the pointer
   lags. Pinned to the tip is plnty's name tag: a small ink chip,
   squared off at the corner that touches the pointer, reading "You"
   like a multiplayer cursor. Over anything with somewhere to go it
   says where instead, with an arrow; the text rolls over in place
   and the chip eases to its new width, so it never jumps. Colours
   come off the section under the pointer.
   ------------------------------------------------------------------ */
const HOT = 'a, button, [role="button"], summary, label, select, [data-cursor="hot"]';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"], [data-cursor="text"]';

const labelFor = (el) => {
  const given = el.getAttribute('data-cursor-label');
  if (given) return given;
  if (el.matches('a[download]')) return 'Download';
  if (el.matches('a[target="_blank"]')) return 'Visit';
  if (el.matches('a[href^="mailto:"]')) return 'Email';
  return '';
};

const ARROW = 'M4.6 20.2 L3.9 6.5 C3.8 4.7 5.8 3.5 7.3 4.5 L18.8 11.9 '
  + 'C20.7 13.2 19.8 16.1 17.6 16.0 L13.0 15.9 C12.2 15.9 11.4 16.3 11.0 17.1 '
  + 'L8.8 21.1 C7.8 23.1 4.8 22.4 4.6 20.2 Z';

/* The hand: an index finger up, three knuckles, a palm and a thumb. */
const HAND = [
  { x: 9, y: 1, w: 7, h: 22, r: 3.5 },
  { x: 15.5, y: 11.5, w: 6.5, h: 12, r: 3.25 },
  { x: 21.5, y: 13, w: 6.5, h: 11, r: 3.25 },
  { x: 27, y: 15, w: 5.5, h: 9.5, r: 2.75 },
  { x: 6, y: 17, w: 26.5, h: 19, r: 8 },
  { x: 1.5, y: 17, w: 7, h: 14, r: 3.5, rot: 'rotate(-35 6 28)' },
];
/* Pressed: the finger has come down and the hand has closed a little. */
const PRESS = HAND.map((s, i) => (i === 0 ? { ...s, y: 6, h: 17 } : s));

const Layers = ({ children }) => (
  <>
    <g className="cur-l1">{children}</g>
    <g className="cur-l2">{children}</g>
    <g className="cur-l3">{children}</g>
  </>
);

const rects = (list) => list.map((s, i) => (
  <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} transform={s.rot} />
));

const Cursor = () => {
  const rootRef = useRef(null);
  const chipRef = useRef(null);
  const labelRef = useRef(null);
  const measureRef = useRef(null);
  const tiltRef = useRef(null);

  useEffect(() => {
    // Reduced motion keeps the cursor — it is the pointer, not an
    // ornament — and only drops the lean, the pops and the trailing.
    if (!fine()) return undefined;
    const still = reduced();

    const root = rootRef.current;
    const chip = chipRef.current;
    const label = labelRef.current;
    const measure = measureRef.current;
    const tiltEl = tiltRef.current;
    document.body.classList.add('has-cursor');

    const ptr = { x: innerWidth / 2, y: innerHeight / 2 };
    const last = { x: ptr.x, y: ptr.y };
    const tilt = { a: 0, v: 0 };
    const s = { scale: 1 };

    let state = 'arrow';
    let hot = false;
    let down = false;
    let accScope = null;

    const setState = (next) => {
      if (next === state) return;
      state = next;
      root.dataset.state = next;
      // Each swap lands with a small pop so the change is felt, not
      // just seen.
      if (still) return;
      gsap.fromTo(s, { scale: next === 'press' ? 0.86 : 0.8 }, { scale: 1, duration: 0.45, ease: 'back.out(3)', overwrite: true });
    };

    const recolour = (el) => {
      const scope = el?.closest?.('[data-acc], [data-surface], body');
      if (!scope || scope === accScope) return;
      accScope = scope;
      const cs = getComputedStyle(scope);
      const st = root.style;
      st.setProperty('--cur-acc', cs.getPropertyValue('--acc').trim() || '#E61A66');
      st.setProperty('--cur-on-acc', cs.getPropertyValue('--acc-ink').trim() || '#FFFFFF');
      st.setProperty('--cur-ink', cs.getPropertyValue('--ink').trim() || '#0E0E0D');
      st.setProperty('--cur-paper', cs.getPropertyValue('--paper').trim() || '#FFFFFF');
    };

    /* The tag. Its width is measured off a hidden twin and eased, and
       the new words roll up from under the old ones. */
    const YOU = 'You';
    let said = '';
    let arrow = null;
    const sizeTo = (text, withArrow) => {
      measure.textContent = text;
      const w = Math.ceil(measure.offsetWidth) + 24 + (withArrow ? 16 : 0);
      chip.style.width = `${w}px`;
    };
    const say = (text, withArrow) => {
      const next = text || YOU;
      if (next === said && withArrow === arrow) return;
      const first = !said;
      said = next; arrow = withArrow;
      chip.toggleAttribute('data-arrow', withArrow);
      sizeTo(next, withArrow);
      label.textContent = next;
      if (first || still) return;
      label.classList.remove('is-roll');
      void label.offsetWidth;          // restart the roll
      label.classList.add('is-roll');
    };
    const setChip = (text, el) => say(text, !!text && !!el?.matches?.('a, [data-cursor-arrow]'));
    /* State is read off whatever is actually under the hotspot, every
       few frames and on every scroll — content moves under a still
       pointer, sheets close, buttons unmount — so the cursor can never
       be left describing something that is no longer there. */
    let under;
    const evaluate = (el) => {
      if (el === under) return;
      under = el;
      if (!el || el.closest?.('.loader, .curtain')) {
        hot = false; setState('arrow'); setChip(''); return;
      }
      recolour(el);
      if (el.closest?.(TEXT)) { hot = false; setState('beam'); setChip(''); return; }
      const h = el.closest?.(HOT);
      hot = !!h;
      setState(hot ? (down ? 'press' : 'hand') : 'arrow');
      setChip(h ? labelFor(h) : '', h);
    };
    const probe = () => evaluate(document.elementFromPoint(ptr.x, ptr.y));

    let shown = false;
    const show = (on) => {
      if (on === shown) return;
      shown = on;
      // Set directly as well as tweened, so the pointer can never be
      // stranded invisible by a tween that did not get a frame.
      gsap.killTweensOf(root, 'opacity');
      root.style.opacity = on ? '1' : '0';
    };
    gsap.set(root, { opacity: 0 });
    // Fonts change the measured width, so the tag is sized once they land.
    say('', false);
    document.fonts?.ready.then(() => sizeTo(said, arrow));

    const onMove = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; show(true); };
    const onOver = (e) => evaluate(e.target);
    const onScroll = () => { under = undefined; probe(); };
    const onDown = () => {
      down = true;
      if (hot) setState('press');
      else gsap.to(s, { scale: 0.82, duration: 0.12, ease: 'power2.out', overwrite: true });
    };
    const onUp = () => {
      down = false;
      if (hot) setState('hand');
      else gsap.to(s, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)', overwrite: true });
      under = undefined;
    };
    const onLeave = () => { show(false); evaluate(null); };
    const onEnter = () => show(true);
    const onTheme = () => { accScope = null; under = undefined; };

    let frame = 0;
    const tick = (_t, delta) => {
      const dt = Math.min(delta / 16.667, 3);
      frame += 1;
      if (shown && frame % 5 === 0) { if (under && !under.isConnected) under = undefined; probe(); }

      const vx = ptr.x - last.x;
        last.x = ptr.x; last.y = ptr.y;

      // The shape leans into its own travel on a spring and settles
      // back upright.
      const want = still ? 0 : gsap.utils.clamp(-16, 16, vx * 0.9);
      tilt.v += (want - tilt.a) * 0.16 * dt;
      tilt.v *= 0.8;
      tilt.a += tilt.v;

      root.style.transform = `translate3d(${ptr.x}px, ${ptr.y}px, 0)`;
      tiltEl.style.transform = `rotate(${state === 'beam' ? tilt.a * 0.3 : tilt.a}deg) scale(${s.scale})`;
    };

    gsap.ticker.add(tick);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('blur', onLeave);
    window.addEventListener('themechange', onTheme);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('themechange', onTheme);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      document.body.classList.remove('has-cursor');
    };
  }, []);

  return (
    <div className="cur" ref={rootRef} data-state="arrow" aria-hidden="true">
      <div className="cur-tilt" ref={tiltRef}>
        <svg className="cur-shape cur-arrow" width="26" height="28" viewBox="0 0 26 28">
          <Layers><path d={ARROW} /></Layers>
        </svg>
        <svg className="cur-shape cur-hand" width="36" height="40" viewBox="-1 -1 36 40">
          <Layers>{rects(HAND)}</Layers>
        </svg>
        <svg className="cur-shape cur-press" width="36" height="40" viewBox="-1 -1 36 40">
          <Layers>{rects(PRESS)}</Layers>
          <circle className="cur-ring" cx="12.5" cy="4" r="6" />
        </svg>
        <svg className="cur-shape cur-beam" width="16" height="30" viewBox="0 0 16 30">
          <path className="cur-beam-rim" d="M8 3 V27 M3.5 3 H12.5 M3.5 27 H12.5" />
          <path className="cur-beam-line" d="M8 3 V27 M3.5 3 H12.5 M3.5 27 H12.5" />
        </svg>
      </div>

      <span className="cur-chip" ref={chipRef}>
        <span className="cur-chip-label" ref={labelRef} />
        <svg className="cur-chip-arrow" viewBox="0 0 10 10" width="10" height="10">
          <path d="M2 8 L8 2 M3.2 2 H8 V6.8" />
        </svg>
      </span>
      <span className="cur-chip-measure" ref={measureRef} />
    </div>
  );
};

export default Cursor;
