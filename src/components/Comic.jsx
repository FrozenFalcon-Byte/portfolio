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
     <Inset scene="…" />  a small live panel on a section's edge, the
                        token busy at something, like the walking feet
                        on the reference site; it plays only on screen
   ------------------------------------------------------------------ */

export const Cap = ({ children, className = '', depth = 0.12, tilt = -1.2 }) => (
  <p className={`cc-cap ${className}`} data-depth={depth} style={{ '--tilt': `${tilt}deg` }}>
    <span>{children}</span>
  </p>
);

export const Token = ({ className = '' }) => (
  <span className={`cc-tok ${className}`} aria-hidden="true"><b>a</b><i /></span>
);

// The token with legs. Idle, a foot taps; inside .is-walk, it strides.
const Walker = () => (
  <span className="cc-wk"><Token /><span className="cc-legs"><i /><i /></span></span>
);

const SCENES = {
  // Walking past the years.
  walk: () => (
    <>
      <span className="cc-posts">{['2023', '2024', '2025', '2026'].map((y, i) => <b key={y} style={{ '--i': i }}>{y}</b>)}</span>
      <span className="cc-ground"><i /></span>
      <span className="cc-at is-walk"><Walker /></span>
    </>
  ),
  // Typing at a desk, lines filling the screen.
  type: () => (
    <>
      <span className="cc-screen">{[70, 48, 84, 36].map((w, i) => <i key={i} style={{ '--w': `${w}%`, '--i': i }} />)}</span>
      <span className="cc-desk" />
      <span className="cc-at cc-at--l cc-bob"><Walker /></span>
    </>
  ),
  // Builds riding a belt out of the door, one after another.
  ship: () => (
    <>
      <span className="cc-belt">{[0, 1, 2].map((i) => <b key={i} style={{ '--i': i }} />)}<i /></span>
      <span className="cc-at cc-at--l"><Walker /></span>
    </>
  ),
  // Three steps put in order, again and again.
  sort: () => (
    <>
      <span className="cc-cards">{['3', '1', '2'].map((n, i) => <b key={n} className={`cc-c${i}`}>{n}</b>)}</span>
      <span className="cc-at cc-at--l"><Walker /></span>
    </>
  ),
  // Reading a source, then pointing at it.
  read: () => (
    <>
      <span className="cc-doc">{[80, 64, 90, 52].map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}<b>Source</b></span>
      <span className="cc-lens" />
    </>
  ),
  // Blocks landing on a stack.
  stack: () => (
    <>
      <span className="cc-blocks">{[0, 1, 2, 3].map((i) => <b key={i} style={{ '--i': i }} />)}</span>
      <span className="cc-ground cc-ground--still"><i /></span>
      <span className="cc-at cc-at--l"><Walker /></span>
    </>
  ),
  // Paperwork, stamped.
  stamp: () => (
    <>
      <span className="cc-paper">{[70, 54, 80].map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}<b>Done</b></span>
      <span className="cc-stamp"><i /></span>
    </>
  ),
};

export const Inset = ({ scene, className = '', depth = 0.18, tilt = 1.6 }) => {
  const S = SCENES[scene];
  return (
    <div className={`cc-ins cc-ins--${scene} ${className}`} data-depth={depth} style={{ '--tilt': `${tilt}deg` }} aria-hidden="true">
      <S />
    </div>
  );
};

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
    const ins = Array.from(document.querySelectorAll('.cc-ins'));
    if (reduced()) {
      [...caps, ...ins].forEach((c) => c.classList.add('is-on'));
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
      // Insets play while on screen. Checked here rather than by an
      // observer, which misses them inside sections that clip.
      const iRects = ins.map((el) => el.getBoundingClientRect());
      ins.forEach((el, i) => {
        const r = iRects[i];
        if (r.top < H * 0.86 && r.bottom > 0) el.classList.add('is-on');
        else if (r.top > H || r.bottom < -H) el.classList.remove('is-on');
      });

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

      /* Insets: small live panels on a section's edge. They draw on with
         the captions and only animate while they are on. */
      .cc-ins {
        position: absolute; z-index: 6; top: 0; margin-top: -4.4rem;
        width: 10.5rem; height: 7rem; overflow: hidden;
        border-radius: 4px; background: #FFFFFF; color: #0E0E0D;
        box-shadow: 0 0 0 3px #0E0E0D, 6px 6px 0 #0E0E0D;
        rotate: var(--tilt);
        opacity: 0; scale: 0.6;
        transition: opacity 0.3s 0.15s, scale 0.6s cubic-bezier(.3, 1.5, .5, 1) 0.15s;
        pointer-events: none;
        font-size: 2.1rem;
      }
      .cc-ins.is-on { opacity: 1; scale: 1; }
      .cc-ins:not(.is-on) *, .cc-ins:not(.is-on) *::before, .cc-ins:not(.is-on) *::after { animation-play-state: paused !important; }
      /* Beside the section's caption, in the gap between two sections:
         --r follows a caption on the left, --l a caption on the right. */
      .cc-ins--r { left: calc(max(var(--gutter), calc((100% - var(--shell)) / 2 + var(--gutter))) + 27rem); }
      .cc-ins--l { right: calc(max(var(--gutter), calc((100% - var(--shell)) / 2 + var(--gutter))) + 27rem); }
      .cc-ins * { position: absolute; }
      .cc-ins .cc-tok { position: relative; font-size: 1em; }
      .cc-ins .cc-tok b { position: static; }

      .cc-wk { position: relative; display: block; width: 1em; height: 1.24em; }
      .cc-wk .cc-tok { z-index: 1; }
      .cc-legs { left: 50%; top: 0.84em; width: 0.42em; height: 0.3em; translate: -50% 0; }
      .cc-legs i { top: 0; width: 0.085em; height: 0.26em; border-radius: 0.05em; background: #0E0E0D; transform-origin: 50% 0; }
      .cc-legs i::after { content: ''; position: absolute; left: -0.02em; bottom: -0.03em; width: 0.17em; height: 0.08em; border-radius: 0.06em; background: #0E0E0D; }
      .cc-legs i:first-child { left: 0.06em; }
      .cc-legs i:last-child { right: 0.06em; animation: cc-tap 2.6s ease-in-out infinite; }
      @keyframes cc-tap { 0%, 70%, 100% { rotate: 0deg; } 78% { rotate: -16deg; } 86% { rotate: 0deg; } 92% { rotate: -12deg; } }
      .is-walk .cc-legs i { animation: cc-stride 0.34s ease-in-out infinite alternate; }
      .is-walk .cc-legs i:last-child { animation-delay: -0.34s; }
      @keyframes cc-stride { from { rotate: -28deg; } to { rotate: 28deg; } }
      .is-walk .cc-tok, .cc-bob .cc-tok { animation: cc-bob 0.34s ease-in-out infinite alternate; }
      @keyframes cc-bob { to { translate: 0 -0.05em; } }

      .cc-at { left: 50%; bottom: 22%; translate: -50% 0; }
      .cc-at--l { left: 22%; }
      .cc-ground { left: 0; right: 0; bottom: 0; height: 22%; border-top: 3px solid #0E0E0D; overflow: hidden; }
      .cc-ground i {
        left: 0; top: 0; bottom: 0; width: calc(100% + 18px);
        background-color: #0E0E0D; opacity: 0.35;
        -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9'%3E%3Cpath d='M-2 2 L2 -2 M0 9 L9 0 M7 11 L11 7' stroke='black' stroke-width='1.2'/%3E%3C/svg%3E");
                mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9'%3E%3Cpath d='M-2 2 L2 -2 M0 9 L9 0 M7 11 L11 7' stroke='black' stroke-width='1.2'/%3E%3C/svg%3E");
        animation: cc-scroll 0.6s linear infinite;
      }
      .cc-ground--still i { animation: none; }
      @keyframes cc-scroll { to { translate: -18px 0; } }
      /* walk: year posts slide past behind the token */
      .cc-posts { inset: 0 0 22% 0; }
      .cc-posts b {
        left: 100%; bottom: 0; padding: 0.15rem 0.35rem; border-radius: 3px;
        background: var(--acc); box-shadow: 0 0 0 2px #0E0E0D;
        font-family: var(--font-mono); font-size: 0.62rem; line-height: 1.2;
        animation: cc-post 9s linear infinite; animation-delay: calc(var(--i) * -2.25s);
      }
      .cc-posts b::after { content: ''; position: absolute; left: 50%; top: 100%; width: 3px; height: 2.9rem; margin-left: -1.5px; background: #0E0E0D; }
      .cc-posts b { bottom: 2.9rem; }
      .cc-posts { z-index: 0; } .cc-ins--walk .cc-at { z-index: 1; }
      @keyframes cc-post { to { left: -3rem; } }
      /* type */
      .cc-screen { right: 8%; top: 12%; width: 50%; height: 46%; border-radius: 4px; background: #0E0E0D; padding: 0.55rem; display: grid; align-content: start; gap: 0.35rem; }
      .cc-screen i { position: relative; display: block; height: 0.32rem; width: var(--w); border-radius: 2px; background: var(--acc); transform-origin: 0 50%; animation: cc-line 3.2s ease-out infinite; animation-delay: calc(var(--i) * 0.45s); }
      @keyframes cc-line { 0% { transform: scaleX(0); } 25%, 85% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
      .cc-desk { left: 36%; right: 0; bottom: 22%; height: 0.45rem; border-radius: 2px; background: #0E0E0D; }
      .cc-ins--type::after { content: ''; position: absolute; left: 0; right: 0; bottom: 22%; height: 3px; background: #0E0E0D; }
      /* ship */
      .cc-belt { left: 0; right: 0; bottom: 18%; height: 30%; }
      .cc-belt i { left: 0; right: 0; bottom: 0; height: 0.9rem; border-radius: 999px; border: 3px solid #0E0E0D; }
      .cc-belt b { left: 34%; bottom: 0.9rem; width: 1.5rem; height: 1.5rem; border-radius: 3px; background: var(--acc); box-shadow: inset 0 0 0 3px #0E0E0D; animation: cc-ride 3.6s linear infinite; animation-delay: calc(var(--i) * -1.2s); }
      @keyframes cc-ride { 0% { left: 34%; opacity: 0; scale: 0.4; } 8% { opacity: 1; scale: 1; } 100% { left: 108%; } }
      .cc-ins--ship .cc-at { bottom: 48%; left: 18%; }
      /* sort */
      .cc-cards { right: 8%; top: 18%; width: 58%; height: 52%; }
      .cc-cards b { top: 0; width: 30%; height: 100%; display: grid; place-items: center; border-radius: 4px; background: #FFFFFF; box-shadow: inset 0 0 0 3px #0E0E0D; font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; animation: 4.8s cubic-bezier(.6,0,.2,1) infinite; }
      .cc-cards .cc-c0 { left: 0; animation-name: cc-s0; }
      .cc-cards .cc-c1 { left: 35%; animation-name: cc-s1; }
      .cc-cards .cc-c2 { left: 70%; animation-name: cc-s2; }
      @keyframes cc-s0 { 0%, 20% { left: 0; top: 0; } 35%, 85% { left: 70%; top: 0; background: var(--acc); } 28% { top: -30%; } 100% { left: 0; } }
      @keyframes cc-s1 { 0%, 20% { left: 35%; } 35%, 85% { left: 0; background: var(--acc); } 28% { top: 30%; } 100% { left: 35%; } }
      @keyframes cc-s2 { 0%, 20% { left: 70%; } 35%, 85% { left: 35%; background: var(--acc); } 100% { left: 70%; } }
      .cc-ins--sort .cc-at { bottom: 12%; left: 17%; }
      .cc-ins--sort { margin-top: -2.2rem; }
      /* The record section clips 3rem above itself. */
      .cc-ins--stamp { margin-top: -2.7rem; }
      /* read */
      .cc-doc { left: 10%; right: 10%; top: 14%; bottom: 14%; padding: 0.7rem; display: grid; align-content: start; gap: 0.4rem; border-radius: 3px; box-shadow: inset 0 0 0 3px #0E0E0D; }
      .cc-doc i { position: relative; display: block; height: 0.32rem; border-radius: 2px; background: #0E0E0D; opacity: 0.25; }
      .cc-doc b { right: 0.6rem; bottom: 0.5rem; padding: 0.15rem 0.45rem; border-radius: 3px; background: var(--acc); box-shadow: 0 0 0 2px #0E0E0D; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.05em; animation: cc-pop 3.6s ease-out infinite; }
      @keyframes cc-pop { 0%, 55% { opacity: 0; scale: 0.4; } 65%, 92% { opacity: 1; scale: 1; } 100% { opacity: 0; } }
      .cc-lens { left: 14%; top: 18%; width: 2.6rem; height: 2.6rem; border-radius: 50%; box-shadow: 0 0 0 3px #0E0E0D; background: rgb(255 255 255 / 0.35); animation: cc-scan 3.6s ease-in-out infinite; }
      .cc-lens::after { content: ''; position: absolute; left: 88%; top: 88%; width: 1rem; height: 0.32rem; border-radius: 2px; background: #0E0E0D; rotate: 45deg; transform-origin: 0 50%; }
      @keyframes cc-scan { 0% { left: 14%; top: 14%; } 20% { left: 55%; top: 14%; } 35% { left: 14%; top: 34%; } 50%, 100% { left: 58%; top: 42%; } }
      /* stack */
      .cc-blocks { right: 16%; bottom: 22%; width: 3.4rem; height: 70%; }
      .cc-blocks b { left: 0; right: 0; height: 22%; border-radius: 3px; background: var(--acc); box-shadow: inset 0 0 0 3px #0E0E0D; bottom: calc(var(--i) * 24%); animation: cc-drop 4.4s cubic-bezier(.5,0,.3,1.3) infinite; animation-delay: calc(var(--i) * 0.45s); }
      .cc-blocks b:nth-child(2) { left: -0.6rem; right: 0.6rem; }
      .cc-blocks b:nth-child(4) { left: 0.4rem; right: -0.4rem; }
      @keyframes cc-drop { 0% { translate: 0 -9rem; opacity: 1; } 18%, 80% { translate: 0 0; opacity: 1; } 92%, 100% { translate: 0 0; opacity: 0; } }
      /* stamp */
      .cc-paper { left: 12%; right: 12%; top: 22%; bottom: 10%; padding: 0.7rem; display: grid; align-content: start; gap: 0.4rem; border-radius: 3px; box-shadow: inset 0 0 0 3px #0E0E0D; }
      .cc-paper i { position: relative; display: block; height: 0.32rem; border-radius: 2px; background: #0E0E0D; opacity: 0.25; }
      .cc-paper b { right: 0.7rem; bottom: 0.6rem; padding: 0.15rem 0.5rem; border: 2px solid #0E0E0D; border-radius: 3px; background: var(--acc); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; rotate: -10deg; animation: cc-mark 2.8s infinite; }
      @keyframes cc-mark { 0%, 38% { opacity: 0; } 42%, 92% { opacity: 1; } 100% { opacity: 0; } }
      .cc-stamp { right: 1.2rem; top: 0; width: 2.2rem; height: 3.2rem; animation: cc-thud 2.8s cubic-bezier(.6,0,.3,1) infinite; }
      .cc-stamp::before { content: ''; position: absolute; left: 30%; right: 30%; top: 0; height: 60%; border-radius: 4px 4px 0 0; background: #0E0E0D; }
      .cc-stamp i { left: 0; right: 0; bottom: 0; height: 40%; border-radius: 3px; background: #0E0E0D; }
      @keyframes cc-thud { 0%, 20% { translate: 0 -3.4rem; } 38%, 44% { translate: 0 3.2rem; } 70%, 100% { translate: 0 -3.4rem; } }

      @media (max-width: 760px) {
        .cc-ins { display: none; }
      }

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
        .cc-ins * { animation: none !important; }
      }
      html[data-motion="still"] .cc-drip { display: none; }
      html[data-motion="still"] .cc-ins * { animation: none !important; }
    `}</style>
  );
};
