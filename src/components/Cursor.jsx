import React, { useEffect, useRef } from 'react';
import { gsap, EASE, fine, calm } from '../lib/motion';
import { getPrefs } from '../lib/prefs';

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

export const ARROW = 'M4.6 20.2 L3.9 6.5 C3.8 4.7 5.8 3.5 7.3 4.5 L18.8 11.9 '
  + 'C20.7 13.2 19.8 16.1 17.6 16.0 L13.0 15.9 C12.2 15.9 11.4 16.3 11.0 17.1 '
  + 'L8.8 21.1 C7.8 23.1 4.8 22.4 4.6 20.2 Z';

/* The hand: one drawn outline, index finger up with its tip on the
   hotspot, three folded fingers stepping down to the right, the thumb
   reaching in from the left. Creases between the knuckles are drawn on
   top so it reads as a hand at 30px. */
export const HAND = 'M9 3 C9 1.3 10.3 0 12 0 C13.7 0 15 1.3 15 3 V11.2 '
  + 'C15.4 10.4 16.2 9.9 17.1 9.9 C18.4 9.9 19.4 10.9 19.4 12.2 V12.9 '
  + 'C19.8 12.1 20.6 11.6 21.5 11.6 C22.8 11.6 23.8 12.6 23.8 13.9 V14.6 '
  + 'C24.2 13.9 25 13.4 25.9 13.4 C27.1 13.4 28.1 14.4 28.1 15.6 V22 '
  + 'C28.1 27.2 24.1 31 19 31 H16.4 C13.4 31 10.8 29.6 9.2 27.2 L3.6 19.2 '
  + 'C2.8 18 3 16.4 4.2 15.6 C5.4 14.8 7 15.1 7.8 16.3 L9 18 Z';
export const CREASES = 'M15 11.2 V16 M19.4 12.9 V16.6 M23.8 14.6 V17.4';

/* The text beam, built from the same rounded bars as everything else. */
const BEAM = [
  { x: 6.5, y: 2.5, w: 3, h: 23, r: 1.5 },
  { x: 2, y: 1, w: 12, h: 3, r: 1.5 },
  { x: 2, y: 24, w: 12, h: 3, r: 1.5 },
];

/* Plain words count as text only where the pointer is on the element
   that holds them, not on the padding of some box around them. */
const PROSE = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, dd, dt, span, em, strong, small, label, time';
const hasOwnText = (el) => {
  if (!el.matches?.(PROSE)) return false;
  for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
  return false;
};

const Layers = ({ children }) => (
  <>
    <g className="cur-l1">{children}</g>
    <g className="cur-l2">{children}</g>
    <g className="cur-l3">{children}</g>
  </>
);

const rects = (list) => list.map((s, i) => (
  <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} />
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
    // Calm and still motion both keep the pointer and drop the extras.
    let still = calm();

    const root = rootRef.current;
    const chip = chipRef.current;
    const label = labelRef.current;
    const measure = measureRef.current;
    const tiltEl = tiltRef.current;
    document.body.classList.add('has-cursor');

    const ptr = { x: innerWidth / 2, y: innerHeight / 2 };
    const last = { x: ptr.x, y: ptr.y };
    const tilt = { a: 0, v: 0 };
    const s = { scale: 1, sx: 1 };

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
      if (next === 'beam') {
        gsap.fromTo(s, { scale: 1, sx: 0.15 }, { sx: 1, duration: 0.42, ease: 'back.out(2.4)', overwrite: true });
      } else {
        gsap.fromTo(s, { scale: next === 'press' ? 0.86 : 0.78, sx: 1 }, { scale: 1, duration: 0.45, ease: 'back.out(3)', overwrite: true });
      }
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
      // A colour picked in settings wins over the section's.
      const own = getPrefs().tagAcc;
      if (own !== 'section') {
        st.setProperty('--cur-acc', getComputedStyle(document.documentElement).getPropertyValue(`--${own}`).trim());
        st.setProperty('--cur-on-acc', ['yellow', 'lime', 'violet'].includes(own) ? '#0E0E0D' : '#FFFFFF');
      }
    };

    /* The tag. Its width is measured off a hidden twin and eased, and
       the new words roll up from under the old ones. */
    let YOU = getPrefs().tag;
    let said = '';
    let arrow = null;
    const sizeTo = (text, withArrow) => {
      measure.textContent = text;
      const w = text !== '' ? Math.ceil(measure.offsetWidth) + 24 + (withArrow ? 16 : 0) : 28;
      chip.style.width = `${w}px`;
    };
    const say = (text, withArrow) => {
      const next = text || (withArrow ? '' : YOU);
      if (next === said && withArrow === arrow) return;
      const first = said === '';
      said = next; arrow = withArrow;
      chip.toggleAttribute('data-arrow', withArrow);
      chip.toggleAttribute('data-bare', !next);
      sizeTo(next, withArrow);
      label.textContent = next;
      if (first || still) return;
      label.classList.remove('is-roll');
      void label.offsetWidth;          // restart the roll
      label.classList.add('is-roll');
    };
    const setChip = (text, el) => say(text, !!el?.matches?.('a, button, [data-cursor-arrow], [data-cursor="hot"]'));
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
      if (!hot && hasOwnText(el)) { setState('beam'); setChip(''); return; }
      setState(hot ? (down ? 'press' : 'hand') : 'arrow');
      // A tag that only repeats the words already on the button says
      // nothing; it shrinks to just the arrow instead.
      let text = h ? labelFor(h) : '';
      if (h && text && text.trim().toLowerCase() === h.textContent.trim().toLowerCase()) text = '';
      setChip(text, h);
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
    /* A click leaves a mark where it landed: a ring opens and four
       short strokes fly out from the tip, in the section's colour. */
    const burst = () => {
      if (still) return;
      const b = document.createElement('span');
      b.className = 'cur-burst';
      b.style.left = `${ptr.x}px`;
      b.style.top = `${ptr.y}px`;
      b.innerHTML = '<i></i><b></b><b></b><b></b><b></b><b></b><b></b>';
      document.body.appendChild(b);
      setTimeout(() => b.remove(), 650);
    };
    const onDown = () => {
      down = true;
      burst();
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
    // A new name or colour from settings shows straight away, rolling in
    // like any other change of tag.
    const onPrefs = () => {
      still = calm();
      YOU = getPrefs().tag;
      accScope = null; under = undefined; said = null;
      probe();
    };

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

      // A resting cursor writes nothing: styles only change when a value does.
      const pos = `translate3d(${ptr.x}px, ${ptr.y}px, 0)`;
      const lean = `rotate(${(state === 'beam' ? tilt.a * 0.3 : tilt.a).toFixed(2)}deg) scale(${(s.scale * s.sx).toFixed(3)}, ${s.scale.toFixed(3)})`;
      if (pos !== wrote.pos) { root.style.transform = pos; wrote.pos = pos; }
      if (lean !== wrote.lean) { tiltEl.style.transform = lean; wrote.lean = lean; }
    };
    const wrote = { pos: '', lean: '' };

    gsap.ticker.add(tick);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('blur', onLeave);
    window.addEventListener('themechange', onTheme);
    window.addEventListener('prefschange', onPrefs);
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
      window.removeEventListener('prefschange', onPrefs);
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
        <svg className="cur-shape cur-hand" width="32" height="34" viewBox="0 0 32 34">
          <Layers><path d={HAND} /></Layers>
          <path className="cur-crease" d={CREASES} />
        </svg>
        <svg className="cur-shape cur-press" width="32" height="34" viewBox="0 0 32 34">
          <g transform="translate(16 31) scale(1.04 0.9) translate(-16 -31)">
            <Layers><path d={HAND} /></Layers>
            <path className="cur-crease" d={CREASES} />
          </g>
        </svg>
        <svg className="cur-shape cur-beam" width="16" height="28" viewBox="0 0 16 28">
          <Layers>{rects(BEAM)}</Layers>
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
