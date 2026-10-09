import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

// Phones resize the viewport whenever the address bar slides in or out.
// Re-measuring every pinned scene on each of those is what made long
// pages jump mid-scroll on mobile; only a real width change counts.
ScrollTrigger.config({ ignoreMobileResize: true });

/* Two eases carry the whole site: `swift` for anything that enters,
   `glide` for anything that travels. Defined once so every section
   moves with the same hand. */
CustomEase.create('swift', '0.16, 1, 0.3, 1');
CustomEase.create('glide', '0.76, 0, 0.24, 1');

export const EASE = { swift: 'swift', glide: 'glide' };

export const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------
   Motion blur.

   A filter is paid for per pixel, per frame, so blur is used only
   where a machine can afford it: enough cores and memory, no data
   saver, no reduced motion, and a first second of frames that actually
   came in on time. Every use is short and clears itself afterwards, so
   at rest nothing on the page carries a filter.

   fx(n) is spread into a tween's from-state, fx0() into its to-state;
   on a machine that cannot afford it both are empty and the tween runs
   exactly as it would have without blur.
   ------------------------------------------------------------------ */
let blurOK = null;
export const canBlur = () => {
  if (blurOK !== null) return blurOK;
  if (typeof window === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 8;
  blurOK = !reduced() && cores >= 4 && mem >= 4 && !navigator.connection?.saveData;
  return blurOK;
};
if (typeof window !== 'undefined') {
  // A frame-rate probe: if the opening second is already dropping
  // frames, blur is switched off for the rest of the visit.
  let n = 0; let t0 = 0;
  const probe = (t) => {
    if (!t0) t0 = t;
    n += 1;
    if (n < 40) { requestAnimationFrame(probe); return; }
    if ((t - t0) / (n - 1) > 24) blurOK = false;
  };
  requestAnimationFrame(probe);
}
const shrink = () => (typeof window !== 'undefined' && window.innerWidth < 700 ? 0.6 : 1);
export const fx = (px) => (canBlur() ? { filter: `blur(${(px * shrink()).toFixed(1)}px)` } : {});
// Always clears, even when blur has since been switched off: the probe can
// turn it off between the tween that set a blur and the one lifting it.
export const fx0 = () => ({ filter: 'blur(0px)', clearProps: 'filter' });

/** Read a CSS custom property off :root so JS never hardcodes a hue. */
export const token = (name, el = document.documentElement) =>
  getComputedStyle(el).getPropertyValue(name).trim();

/** Does this pointer hover? Used to gate anything with no touch equivalent. */
export const fine = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------------
   splitChars — the signature reveal.

   Characters sit dim and unsaturated, heat up to amber as the scrub
   line passes over them, then settle to full foreground behind it.
   The scrub ties it to the scrollbar, so the reader is doing the
   lighting, not watching a canned animation.
   ------------------------------------------------------------------ */
export function splitChars(el, opts = {}) {
  if (!el) return null;

  const { start = 'top 82%', end = 'bottom 62%', each = 0.55 } = opts;

  if (reduced()) {
    gsap.set(el, { opacity: 1, color: token('--ink') });
    return null;
  }

  const split = new SplitText(el, {
    type: 'words,chars',
    wordsClass: 'split-word',
    charsClass: 'split-char',
  });

  const scope = el.closest('[data-acc], [data-surface]') || el;
  const dim = token('--ink-3', scope) || '#908C99';
  const hot = token('--acc', scope) || '#E61A66';
  const lit = token('--ink', scope) || '#16151A';

  const tween = gsap.fromTo(
    split.chars,
    { color: dim },
    {
      keyframes: [
        { color: hot, duration: 0.35, ease: 'none' },
        { color: lit, duration: 0.65, ease: 'none' },
      ],
      stagger: { each, from: 'start' },
      scrollTrigger: { trigger: el, start, end, scrub: 0.6 },
    }
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    split.revert();
  };
}

/* ------------------------------------------------------------------
   maskLines — display type rises out of a clipped line box.
   ------------------------------------------------------------------ */
export function maskLines(el, opts = {}) {
  if (!el) return null;

  const { delay = 0, stagger = 0.09, duration = 1.05, trigger, start = 'top 85%' } = opts;

  const split = new SplitText(el, { type: 'lines', linesClass: 'split-line-inner' });
  // SplitText's own line divs need a clipping parent to rise out of.
  const wrapped = split.lines.map((line) => {
    const box = document.createElement('span');
    box.className = 'split-line';
    line.parentNode.insertBefore(box, line);
    box.appendChild(line);
    return line;
  });

  if (reduced()) {
    gsap.set(wrapped, { yPercent: 0, opacity: 1 });
    return () => split.revert();
  }

  const tween = gsap.fromTo(
    wrapped,
    { yPercent: 108, opacity: 0, ...fx(8) },
    {
      yPercent: 0,
      opacity: 1,
      ...fx0(),
      duration,
      delay,
      stagger,
      ease: EASE.swift,
      scrollTrigger: trigger === false ? undefined : { trigger: trigger || el, start, once: true },
    }
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    split.revert();
  };
}

/* ------------------------------------------------------------------
   riseIn — the default entrance for anything that isn't type.
   ------------------------------------------------------------------ */
export function riseIn(targets, opts = {}) {
  if (!targets) return null;
  const { y = 34, stagger = 0.08, duration = 0.95, start = 'top 88%', trigger, delay = 0 } = opts;

  if (reduced()) {
    gsap.set(targets, { y: 0, opacity: 1 });
    return null;
  }

  const tween = gsap.fromTo(
    targets,
    { y, opacity: 0, ...fx(10) },
    {
      y: 0,
      opacity: 1,
      ...fx0(),
      duration,
      delay,
      stagger,
      ease: EASE.swift,
      scrollTrigger: { trigger: trigger || targets, start, once: true },
    }
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}

/* ------------------------------------------------------------------
   drawRule — hairlines draw from their origin instead of appearing.
   ------------------------------------------------------------------ */
export function drawRule(el, opts = {}) {
  if (!el) return null;
  if (reduced()) { gsap.set(el, { scaleX: 1 }); return null; }

  const tween = gsap.fromTo(
    el,
    { scaleX: 0 },
    {
      scaleX: 1,
      duration: 1.1,
      ease: EASE.glide,
      scrollTrigger: { trigger: opts.trigger || el, start: opts.start || 'top 90%', once: true },
    }
  );
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}

/* ------------------------------------------------------------------
   pillReveal — dkton's showreel aperture.

   A tall rounded pill widens into a full-bleed frame while its image
   counter-scales, so the subject holds still as the mask opens.
   ------------------------------------------------------------------ */
export function pillReveal(el, opts = {}) {
  if (!el) return null;
  const media = el.querySelector('img, video');

  if (reduced()) {
    gsap.set(el, { clipPath: 'inset(0% 0% round 12px)' });
    if (media) gsap.set(media, { scale: 1 });
    return null;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: opts.trigger || el,
      start: opts.start || 'top 90%',
      end: opts.end || 'top 32%',
      scrub: 0.7,
    },
  });

  // A narrow rounded aperture widens into the full frame. The image
  // counter-scales so the subject holds still while the mask opens.
  tl.fromTo(
    el,
    { clipPath: 'inset(0% 34% round 999px)' },
    { clipPath: 'inset(0% 0% round 12px)', ease: 'none' },
    0
  );
  if (media) tl.fromTo(media, { scale: 1.34 }, { scale: 1, ease: 'none' }, 0);

  return () => { tl.scrollTrigger?.kill(); tl.kill(); };
}

/* ------------------------------------------------------------------
   parallax — subtle depth, capped so nothing detaches from its section.
   ------------------------------------------------------------------ */
export function parallax(el, distance = 70, opts = {}) {
  if (!el || reduced()) return null;
  const tween = gsap.fromTo(
    el,
    { y: -distance / 2 },
    {
      y: distance / 2,
      ease: 'none',
      scrollTrigger: { trigger: opts.trigger || el, start: 'top bottom', end: 'bottom top', scrub: 1 },
    }
  );
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}

/* ------------------------------------------------------------------
   magnetic — pointer-following pull on small controls. Fine pointers
   only: on touch there is no hover to express.
   ------------------------------------------------------------------ */
export function magnetic(el, strength = 0.32) {
  if (!el || reduced()) return null;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return null;

  const xTo = gsap.quickTo(el, 'x', { duration: 0.55, ease: EASE.swift });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.55, ease: EASE.swift });

  const move = (e) => {
    const r = el.getBoundingClientRect();
    xTo((e.clientX - (r.left + r.width / 2)) * strength);
    yTo((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => { xTo(0); yTo(0); };

  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);

  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    gsap.set(el, { x: 0, y: 0 });
  };
}

/* ------------------------------------------------------------------
   countTo — a number that counts up when it comes into view.
   ------------------------------------------------------------------ */
export function countTo(el, value, opts = {}) {
  if (!el) return null;
  const { suffix = '', prefix = '', decimals = 0 } = opts;
  const write = (v) => { el.textContent = prefix + v.toFixed(decimals) + suffix; };

  if (reduced()) { write(value); return null; }

  const box = { v: 0 };
  write(0);
  const tween = gsap.to(box, {
    v: value,
    duration: 1.6,
    ease: EASE.glide,
    onUpdate: () => write(box.v),
    scrollTrigger: { trigger: opts.trigger || el, start: opts.start || 'top 90%', once: true },
  });
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}

/** Run a batch of teardown functions, skipping the nulls. */
export const cleanup = (fns) => () => fns.forEach((f) => typeof f === 'function' && f());

export { gsap, ScrollTrigger, SplitText };

/* ==================================================================
   The additions below are the vocabulary the rebuilt sections share.
   Each one is scroll- or pointer-driven and cleans itself up, so a
   section only ever has to say what it wants, never how to tear it down.
   ================================================================== */

/* ------------------------------------------------------------------
   clipReveal — a block wipes up from nothing behind a moving edge.

   Used where riseIn would be too soft: the element is not sliding into
   place, it is being uncovered.
   ------------------------------------------------------------------ */
export function clipReveal(targets, opts = {}) {
  if (!targets) return null;
  const { stagger = 0.08, duration = 1.1, start = 'top 88%', trigger, from = 'bottom' } = opts;

  if (reduced()) { gsap.set(targets, { clipPath: 'inset(0%)', opacity: 1 }); return null; }

  const shut = {
    bottom: 'inset(100% 0% 0% 0%)',
    top: 'inset(0% 0% 100% 0%)',
    left: 'inset(0% 100% 0% 0%)',
    right: 'inset(0% 0% 0% 100%)',
  }[from];

  const tween = gsap.fromTo(
    targets,
    { clipPath: shut, opacity: 0, ...fx(8) },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      opacity: 1,
      ...fx0(),
      duration,
      stagger,
      ease: EASE.swift,
      scrollTrigger: { trigger: trigger || targets, start, once: true },
    }
  );
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}

/* ------------------------------------------------------------------
   scrubWords — the statement reveal, word by word, on the scrollbar.

   splitChars heats characters through token colours, which go stale
   after a theme switch. This one only animates opacity and y, so it
   survives a theme change and reads calmer at display sizes.
   ------------------------------------------------------------------ */
export function scrubWords(el, opts = {}) {
  if (!el) return null;
  const { start = 'top 80%', end = 'bottom 65%' } = opts;

  const split = new SplitText(el, { type: 'words', wordsClass: 'scrub-word' });

  if (reduced()) {
    gsap.set(split.words, { opacity: 1, y: 0 });
    return () => split.revert();
  }

  const tween = gsap.fromTo(
    split.words,
    { opacity: 0.12, y: '0.12em' },
    {
      opacity: 1,
      y: 0,
      ease: 'none',
      stagger: { each: 0.4, from: 'start' },
      scrollTrigger: { trigger: el, start, end, scrub: 0.5 },
    }
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    split.revert();
  };
}

/* ------------------------------------------------------------------
   marquee — a seamless loop that also answers to the scrollbar.

   The track holds two identical runs and is wrapped with modulus, so
   there is no snap at the seam. Scroll velocity is added to the base
   drift, which ties the strip to the page instead of letting it run on
   its own clock.
   ------------------------------------------------------------------ */
export function marquee(track, opts = {}) {
  if (!track || reduced()) return null;
  const { speed = 38, direction = -1 } = opts;   // px/second

  let half = track.scrollWidth / 2;
  let x = 0;
  let boost = 0;
  const measure = () => { half = track.scrollWidth / 2; };

  const onScroll = (e) => {
    // Lenis reports velocity in px/frame; a short-lived boost reads as
    // the strip being dragged along by the page.
    const v = typeof e?.velocity === 'number' ? e.velocity : 0;
    boost = gsap.utils.clamp(-26, 26, v * 2.2);
  };

  const tick = (_t, delta) => {
    const dt = delta / 1000;
    boost *= 0.92;
    x += (speed * direction + boost) * dt;
    if (half > 0) x = ((x % half) + half) % half - half;
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  gsap.ticker.add(tick);
  window.addEventListener('resize', measure);
  window.lenis?.on?.('scroll', onScroll);
  const raf = requestAnimationFrame(measure);

  return () => {
    cancelAnimationFrame(raf);
    gsap.ticker.remove(tick);
    window.removeEventListener('resize', measure);
    window.lenis?.off?.('scroll', onScroll);
  };
}

/* ------------------------------------------------------------------
   scramble — a value that decodes into place when it arrives.

   Deliberately short: at this length it reads as a readout settling,
   and any longer it reads as a gimmick.
   ------------------------------------------------------------------ */
const GLYPHS = '▚▞░▒█/\\|<>-_=+*#%@0123456789';

export function scramble(el, opts = {}) {
  if (!el) return null;
  const text = opts.text ?? el.textContent;
  if (reduced()) { el.textContent = text; return null; }

  const state = { p: 0 };
  el.textContent = '';

  const write = () => {
    const cut = Math.floor(state.p * text.length);
    let out = text.slice(0, cut);
    for (let i = cut; i < text.length; i += 1) {
      // Spaces are left alone so the word shape is legible throughout.
      out += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
  };

  const tween = gsap.to(state, {
    p: 1,
    duration: 0.9 + Math.min(text.length, 40) * 0.016,
    ease: 'power2.inOut',
    onUpdate: write,
    onComplete: () => { el.textContent = text; },
    scrollTrigger: { trigger: opts.trigger || el, start: opts.start || 'top 92%', once: true },
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    el.textContent = text;
  };
}

/* ------------------------------------------------------------------
   tilt — a panel leans towards the pointer.

   Rotation is capped low on purpose: enough for the surface to catch
   the light, not enough to turn a readable panel into a diorama.
   ------------------------------------------------------------------ */
export function tilt(el, opts = {}) {
  if (!el || reduced() || !fine()) return null;
  const { max = 7, scale = 1.012, perspective = 1200 } = opts;

  gsap.set(el, { transformPerspective: perspective, transformOrigin: '50% 50%' });

  const rx = gsap.quickTo(el, 'rotateX', { duration: 0.6, ease: EASE.swift });
  const ry = gsap.quickTo(el, 'rotateY', { duration: 0.6, ease: EASE.swift });
  const sc = gsap.quickTo(el, 'scale', { duration: 0.6, ease: EASE.swift });

  const move = (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    ry(gsap.utils.clamp(-max, max, px * max));
    rx(gsap.utils.clamp(-max, max, -py * max));
    sc(scale);
  };
  const leave = () => { rx(0); ry(0); sc(1); };

  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);

  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    gsap.set(el, { rotateX: 0, rotateY: 0, scale: 1 });
  };
}

/* ------------------------------------------------------------------
   drawPath — an SVG path draws itself.

   Expects pathLength="1" on the path so one unit of dash offset is the
   whole line, whatever the geometry.
   ------------------------------------------------------------------ */
export function drawPath(paths, opts = {}) {
  if (!paths) return null;
  const { duration = 1.4, stagger = 0.12, start = 'top 88%', trigger, scrub = false, end } = opts;

  if (reduced()) { gsap.set(paths, { strokeDashoffset: 0 }); return null; }

  const tween = gsap.fromTo(
    paths,
    { strokeDasharray: 1, strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      duration,
      stagger,
      ease: scrub ? 'none' : EASE.glide,
      scrollTrigger: scrub
        ? { trigger: trigger || paths, start, end: end || 'bottom 60%', scrub: 0.6 }
        : { trigger: trigger || paths, start, once: true },
    }
  );
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}

/* ------------------------------------------------------------------
   floatY — a slow idle drift, so a static panel is never quite still.
   ------------------------------------------------------------------ */
export function floatY(el, opts = {}) {
  if (!el || reduced()) return null;
  const { distance = 9, duration = 4.2, delay = 0 } = opts;
  const tween = gsap.to(el, {
    y: distance,
    duration,
    delay,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });
  return () => tween.kill();
}

/* ------------------------------------------------------------------
   scrubTo — the general scroll-linked tween: whatever the section
   needs, driven by the scrollbar between two markers.
   ------------------------------------------------------------------ */
export function scrubTo(targets, from, to, opts = {}) {
  if (!targets || reduced()) return null;
  const { trigger, start = 'top bottom', end = 'bottom top', scrub = 0.6 } = opts;
  const tween = gsap.fromTo(targets, from, {
    ...to,
    ease: 'none',
    scrollTrigger: { trigger: trigger || targets, start, end, scrub },
  });
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}

/* ------------------------------------------------------------------
   scrambleHover — the headline effect.

   The heading is rebuilt as per-character spans. On entry the whole
   line decodes once; after that, moving the pointer across it scrambles
   only the characters the pointer is near, which resolve a beat later.
   The reader is effectively running a finger through wet type.

   Symbols only in the glyph pool: swapping a letter for another letter
   reads as a typo, swapping it for a symbol reads as a machine.
   ------------------------------------------------------------------ */
const SYMBOLS = '*/<>+=#%&$!?~^|\\';

const pick = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

export function scrambleHover(el, opts = {}) {
  if (!el) return null;
  const {
    radius = 72,        // px from the pointer that a character reacts within
    settle = 420,       // ms a disturbed character stays scrambled
    intro = true,       // decode once when the heading first arrives
    start = 'top 86%',
  } = opts;

  const label = el.textContent.replace(/\s+/g, ' ').trim();
  if (!label) return null;

  /* Only text nodes are rebuilt. Anything else inside the heading — an
     animated glyph, a line wrapper, a <br> — is walked into or left
     alone, so React's own elements survive and the originals can be put
     back exactly on cleanup. */
  const swaps = [];                 // [originalTextNode, [replacement nodes]]
  const chars = [];
  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        if (!child.textContent.trim()) return;
        const made = [];
        child.textContent.split(/(\s+)/).forEach((chunk) => {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) { made.push(document.createTextNode(chunk)); return; }
          const word = document.createElement('span');
          word.className = 'sc-word';
          word.setAttribute('aria-hidden', 'true');
          chunk.split('').forEach((c) => {
            const span = document.createElement('span');
            span.className = 'sc-ch';
            span.textContent = c;
            span.dataset.c = c;
            word.appendChild(span);
            chars.push(span);
          });
          made.push(word);
        });
        made.forEach((m) => child.parentNode.insertBefore(m, child));
        child.parentNode.removeChild(child);
        swaps.push([child, made]);
      } else if (child.nodeType === 1 && !child.classList.contains('glyph')) {
        walk(child);
      }
    });
  };
  walk(el);
  // The scrambled copy is noise to a screen reader; the real line is here.
  el.setAttribute('aria-label', label);

  const fns = [];
  const until = new WeakMap();      // char -> timestamp it resolves at

  if (!reduced()) {
    const tick = () => {
      const now = performance.now();
      for (const c of chars) {
        const t = until.get(c);
        if (!t) continue;
        if (now >= t) { c.textContent = c.dataset.c; until.delete(c); }
        else if (Math.random() < 0.5) c.textContent = pick();
      }
    };
    gsap.ticker.add(tick);
    fns.push(() => gsap.ticker.remove(tick));

    const disturb = (c, ms) => until.set(c, performance.now() + ms);

    if (fine()) {
      const move = (e) => {
        for (const c of chars) {
          const r = c.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          // Nearer characters hold their scramble longer, so the
          // disturbance has a soft edge rather than a hard circle.
          const d = Math.hypot(dx, dy);
          if (d < radius) disturb(c, settle * (1 - d / radius) + 90);
        }
      };
      el.addEventListener('pointermove', move);
      fns.push(() => el.removeEventListener('pointermove', move));
    }

    if (intro) {
      const tween = gsap.to({}, {
        duration: 0.01,
        scrollTrigger: {
          trigger: opts.trigger || el,
          start,
          once: true,
          onEnter: () => chars.forEach((c, i) => disturb(c, 220 + i * 22)),
        },
      });
      fns.push(() => { tween.scrollTrigger?.kill(); tween.kill(); });
    }
  }

  return () => {
    fns.forEach((f) => f());
    swaps.forEach(([orig, made]) => {
      const first = made[0];
      if (first?.parentNode) first.parentNode.insertBefore(orig, first);
      made.forEach((m) => m.parentNode && m.parentNode.removeChild(m));
    });
    el.removeAttribute('aria-label');
  };
}

/* ------------------------------------------------------------------
   linesIn — a heading built as .ln > .ln-in rises line by line out of
   its own clipping windows. Written by hand in the JSX rather than by
   SplitText, so glyphs inside a line ride up with their words.
   ------------------------------------------------------------------ */
export function linesIn(el, opts = {}) {
  if (!el) return null;
  const lines = el.querySelectorAll('.ln-in');
  if (!lines.length) return null;
  const { start = 'top 86%', stagger = 0.09, duration = 1.1, delay = 0, trigger, play } = opts;
  if (reduced()) { gsap.set(lines, { yPercent: 0 }); return null; }

  gsap.set(lines, { yPercent: 112, rotate: 2.5, ...fx(9) });
  const tl = gsap.timeline({
    paused: !!play,
    delay,
    scrollTrigger: play ? undefined : { trigger: trigger || el, start, once: true },
  });
  tl.to(lines, { yPercent: 0, rotate: 0, ...fx0(), duration, stagger, ease: EASE.swift });
  if (play) play(() => tl.play());
  return () => { tl.scrollTrigger?.kill(); tl.kill(); };
}

/* ------------------------------------------------------------------
   glyphsOpen — the in-text motion graphics open as the heading scrolls
   through, pushing the words apart to make room for themselves. The
   width is a CSS variable, so the type reflows naturally around it.
   ------------------------------------------------------------------ */
export function glyphsOpen(root, opts = {}) {
  if (!root) return null;
  const glyphs = root.querySelectorAll('.glyph');
  if (!glyphs.length) return null;
  if (reduced()) { gsap.set(glyphs, { '--open': 1 }); return null; }
  const { start = 'top 92%', end = 'top 45%', scrub = 0.7, trigger } = opts;
  const tweens = Array.from(glyphs).map((g, i) => gsap.fromTo(
    g,
    { '--open': 0 },
    {
      '--open': 1,
      ease: 'none',
      scrollTrigger: {
        trigger: trigger || g,
        start,
        end,
        scrub: scrub + i * 0.05,
      },
    }
  ));
  return () => tweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
}

/* ------------------------------------------------------------------
   heading — the full treatment for a section title: lines rise, glyphs
   open on the scrollbar, and the pointer scrambles what it passes.
   ------------------------------------------------------------------ */
export function heading(el, opts = {}) {
  if (!el) return null;
  return cleanup([
    linesIn(el, opts),
    glyphsOpen(el, opts.glyphs || {}),
    scrambleHover(el, { intro: false, ...(opts.scramble || {}) }),
  ]);
}

/* ------------------------------------------------------------------
   charsIn — per-character entrance for display type.

   maskLines() clips whole lines, which is right for a paragraph-shaped
   heading. This is for the short ones, where the characters should
   arrive individually.
   ------------------------------------------------------------------ */
export function charsIn(el, opts = {}) {
  if (!el) return null;
  const { stagger = 0.028, duration = 1, start = 'top 86%', trigger, delay = 0 } = opts;

  const split = new SplitText(el, { type: 'chars,words', charsClass: 'sc-ch' });

  if (reduced()) {
    gsap.set(split.chars, { yPercent: 0, opacity: 1 });
    return () => split.revert();
  }

  const tween = gsap.fromTo(
    split.chars,
    { yPercent: 115, opacity: 0, rotate: 5, ...fx(6) },
    {
      yPercent: 0,
      opacity: 1,
      rotate: 0,
      ...fx0(),
      duration,
      delay,
      stagger,
      ease: EASE.swift,
      scrollTrigger: trigger === false ? undefined : { trigger: trigger || el, start, once: true },
    }
  );

  return () => { tween.scrollTrigger?.kill(); tween.kill(); split.revert(); };
}

/* ------------------------------------------------------------------
   stickyScale — a block shrinks and dims as the next one rides over it.

   The deck behaviour, pulled out of the sections that used to own it so
   Work, the record deck and the stack all recede identically.
   ------------------------------------------------------------------ */
export function stickyScale(el, opts = {}) {
  if (!el || reduced()) return null;
  const { scale = 0.92, start = 'top 16%', end = 'bottom 30%' } = opts;
  const tween = gsap.fromTo(
    el,
    { scale: 1, opacity: 1 },
    {
      scale,
      opacity: 0.55,
      ease: 'none',
      scrollTrigger: { trigger: opts.trigger || el, start, end, scrub: 0.6 },
    }
  );
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}

/* ------------------------------------------------------------------
   stepSnap — for a pinned scene told in steps. When the scroll comes
   to rest inside the pin, it is carried to a step: the next one in
   the direction it was travelling once it is a fifth of the way there,
   otherwise back to the one it left. A fast flick therefore lands on a
   step instead of sailing past several, and the reader is never left
   between two. Returns a disposer.
   ------------------------------------------------------------------ */
export const stepSnap = (st, steps) => {
  let from = 0;
  let busy = false;
  let moving = false;
  let timer = 0;
  const n = steps - 1;
  const settle = () => {
    moving = false;
    if (busy || !st.isActive) return;
    const f = st.progress * n;
    let k = from;
    if (f - from > 0.2) k = Math.min(n, Math.max(from + 1, Math.round(f - 0.3)));
    else if (from - f > 0.2) k = Math.max(0, Math.min(from - 1, Math.round(f + 0.3)));
    from = k;
    const y = st.start + (st.end - st.start) * (k / n);
    if (Math.abs(y - window.scrollY) < 2) return;
    busy = true;
    const done = () => { busy = false; from = k; };
    // A wheel during the glide can cancel it without a callback; the
    // timeout makes sure the snap is never left stuck on.
    setTimeout(done, 900);
    if (window.lenis) window.lenis.scrollTo(y, { duration: 0.7, easing: (t) => 1 - (1 - t) ** 3, onComplete: done });
    else { window.scrollTo({ top: y, behavior: 'smooth' }); setTimeout(done, 700); }
  };
  // Scroll start and rest are read off the window's own scroll events,
  // so this works the same under Lenis, native scroll and touch.
  const onScroll = () => {
    if (!busy && !moving) { moving = true; from = Math.round(st.progress * n); }
    clearTimeout(timer);
    timer = setTimeout(settle, 160);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll); };
};
