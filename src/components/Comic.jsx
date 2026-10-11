import React, { useEffect } from 'react';
import { reduced } from '../lib/motion';

/* ------------------------------------------------------------------
   Comic — the Story page's motion, lent to the landing page.

   Nothing here owns a section. Sections mark what should move and one
   loop moves it, using the independent `translate`, `rotate` and
   `scale` properties so it composes with whatever GSAP is already
   doing to the same element's transform:

     data-depth="0.1"   drifts against the scroll, like an inset panel
                        sitting at its own depth (negative: with it)
     data-tilt="-4"     arrives tilted and settles flat as it rises in
     .cc-cap            a caption box that draws on when it comes into
                        view, and draws off again below the fold
     <Drip />           ink that runs down over the end of the page
                        and becomes the footer
   ------------------------------------------------------------------ */

export const Cap = ({ children, className = '', depth = 0.12, tilt = -1.2 }) => (
  <p className={`cc-cap ${className}`} data-depth={depth} style={{ '--tilt': `${tilt}deg` }}>
    <span>{children}</span>
  </p>
);

export const Token = ({ className = '' }) => (
  <span className={`cc-tok ${className}`} aria-hidden="true"><b>a</b><i /></span>
);

const DRIPS = Array.from({ length: 22 }, (_, i) => ({ d: ((i * 37) % 11) / 11 * 0.3, w: 1 + ((i * 13) % 5) * 0.12 }));

export const Drip = () => (
  <div className="cc-drip" data-surface="ink" aria-hidden="true">
    <div className="cc-drip-in">
      {DRIPS.map((d, i) => <i key={i} style={{ flexGrow: d.w }} />)}
    </div>
  </div>
);

const cl = (v) => Math.min(1, Math.max(0, v));
const out = (x) => 1 - (1 - x) ** 3;

export const ComicLayer = () => {
  useEffect(() => {
    const caps = Array.from(document.querySelectorAll('.cc-cap'));
    if (reduced()) {
      caps.forEach((c) => c.classList.add('is-on'));
      return undefined;
    }

    // Captions: on as they come up past the fold, off again when they
    // drop back below it, so scrolling back up plays them again.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('is-on');
        else if (e.boundingClientRect.top > 0) e.target.classList.remove('is-on');
      });
    }, { rootMargin: '0px 0px -14% 0px' });
    caps.forEach((c) => io.observe(c));

    const depth = Array.from(document.querySelectorAll('[data-depth]')).map((el) => ({ el, k: +el.dataset.depth, y: 0 }));
    const tilt = Array.from(document.querySelectorAll('[data-tilt]')).map((el) => ({ el, r: +el.dataset.tilt, v: '' }));
    const drips = Array.from(document.querySelectorAll('.cc-drip')).map((el) => ({
      el, cols: Array.from(el.querySelectorAll('i')), v: [],
    }));

    let lastY = -1; let lastH = 0; let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const H = window.innerHeight; const y = window.scrollY;
      if (y === lastY && H === lastH) return;
      lastY = y; lastH = H;

      // Read everything first, then write, so no write forces a layout
      // before the next read.
      const dRects = depth.map((d) => d.el.getBoundingClientRect());
      const tRects = tilt.map((t) => t.el.getBoundingClientRect());
      const pRects = drips.map((d) => d.el.getBoundingClientRect());

      depth.forEach((d, i) => {
        const r = dRects[i];
        if (r.bottom < -H || r.top > 2 * H) return;
        const c = r.top - d.y + r.height / 2;
        const next = Math.round((c - H / 2) * d.k * 10) / 10;
        if (next !== d.y) { d.el.style.translate = `0 ${next}px`; d.y = next; }
      });
      tilt.forEach((t, i) => {
        const k = out(cl((H - tRects[i].top) / (H * 0.6)));
        const v = k >= 1 ? '' : `${(t.r * (1 - k)).toFixed(2)}deg`;
        if (v !== t.v) {
          t.el.style.rotate = v;
          t.el.style.scale = k >= 1 ? '' : (0.94 + 0.06 * k).toFixed(4);
          t.v = v;
        }
      });
      drips.forEach((d, i) => {
        // The ink runs while the band's sticky layer holds the screen.
        const p = cl(-pRects[i].top / H);
        d.cols.forEach((el, j) => {
          const s = out(cl((p - DRIPS[j].d) / 0.62)).toFixed(4);
          if (d.v[j] !== s) { el.style.transform = `scaleY(${s})`; d.v[j] = s; }
        });
      });
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      depth.forEach((d) => { d.el.style.translate = ''; });
      tilt.forEach((t) => { t.el.style.rotate = ''; t.el.style.scale = ''; });
    };
  }, []);

  return (
    <style>{`
      /* Captions: the Story page's comic caption boxes. */
      .cc-cap {
        position: absolute; z-index: 6;
        max-width: min(25rem, 78vw);
        margin: 0; padding: 0.85rem 1.05rem;
        border-radius: var(--r-s);
        background: #FFFFFF; color: #0E0E0D;
        box-shadow: 0 0 0 2px #0E0E0D, var(--ao-2);
        font-size: var(--step--1); font-weight: 560; line-height: 1.42;
        rotate: var(--tilt);
        clip-path: inset(0 100% 0 0 round var(--r-s));
        transition: clip-path 0.8s var(--ease-out);
        pointer-events: none;
      }
      .cc-cap > span { display: block; opacity: 0; translate: 0 0.5em; transition: opacity 0.45s, translate 0.6s var(--ease-out); }
      .cc-cap.is-on { clip-path: inset(-60px round var(--r-s)); }
      .cc-cap.is-on > span { opacity: 1; translate: 0 0; transition-delay: 0.25s; }
      /* Sitting across a section's top edge, in the gap between two. */
      .cc-cap--edge { top: 0; margin-top: -1.6rem; left: max(var(--gutter), calc((100% - var(--shell)) / 2 + var(--gutter))); }
      .cc-cap--edge-r { left: auto; right: max(var(--gutter), calc((100% - var(--shell)) / 2 + var(--gutter))); }

      /* The token: a small round mark that stands in for Ajinkya. */
      .cc-tok {
        position: relative; display: inline-grid; place-items: center; flex: none;
        width: 1em; height: 1em; border-radius: 50%;
        background: var(--acc);
        box-shadow: 0 0 0 0.035em #0E0E0D, var(--ao-2);
      }
      .cc-tok b { font-family: var(--font-display); font-weight: 800; font-size: 0.62em; line-height: 1; color: #0E0E0D; translate: -0.04em -0.06em; }
      .cc-tok i { position: absolute; left: 0.66em; top: 0.6em; width: 0.11em; height: 0.11em; border-radius: 50%; background: #0E0E0D; }

      /* Ink drip: a band the height of two screens pulled up over the
         last screen of the section before it. Its layer holds the
         screen while the ink runs down, then the footer, already ink,
         takes over. */
      .cc-drip { position: relative; z-index: 5; height: 200svh; margin-top: -100svh; pointer-events: none; }
      .cc-drip[data-surface="ink"] { background: transparent; }
      .cc-drip-in { position: sticky; top: 0; height: 100svh; display: flex; overflow: hidden; }
      .cc-drip-in i {
        flex: 1 1 0; margin-right: -1px; height: 112%;
        background: var(--paper); border-radius: 0 0 999px 999px;
        transform: scaleY(0); transform-origin: 50% 0;
      }
      .cc-drip + .contact { margin-top: 0; border-radius: 0; }

      @media (prefers-reduced-motion: reduce) {
        .cc-drip { display: none; }
      }
      html[data-motion="still"] .cc-drip { display: none; }
    `}</style>
  );
};
