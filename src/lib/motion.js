import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

/* Two eases carry the whole site: `swift` for anything that enters,
   `glide` for anything that travels. Defined once so every section
   moves with the same hand. */
CustomEase.create('swift', '0.16, 1, 0.3, 1');
CustomEase.create('glide', '0.76, 0, 0.24, 1');

export const EASE = { swift: 'swift', glide: 'glide' };

export const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Read a CSS custom property off :root so JS never hardcodes a hue. */
export const token = (name, el = document.documentElement) =>
  getComputedStyle(el).getPropertyValue(name).trim();

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
    gsap.set(el, { opacity: 1, color: token('--fg') });
    return null;
  }

  const split = new SplitText(el, {
    type: 'words,chars',
    wordsClass: 'split-word',
    charsClass: 'split-char',
  });

  const dim = token('--fg-faint') || '#574F47';
  const hot = token('--amber') || '#FFB800';
  const lit = token('--fg') || '#EFEDE9';

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
    { yPercent: 108, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
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
    { y, opacity: 0 },
    {
      y: 0,
      opacity: 1,
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

/** Run a batch of teardown functions, skipping the nulls. */
export const cleanup = (fns) => () => fns.forEach((f) => typeof f === 'function' && f());

export { gsap, ScrollTrigger, SplitText };
