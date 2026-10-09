import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, reduced, canBlur, stepSnap } from '../lib/motion';
import Glyph from '../components/Glyph';
import { TransitionLink } from '../components/RouteCurtain';

/* ------------------------------------------------------------------
   Story — the same facts as the home page, told as a place you move
   through rather than a list you read.

   The page is one pinned stage with a camera in it. Every chapter is a
   cluster of flat cards standing at a depth along a road: the card
   itself, the chapter's big word set far behind it, a glyph close to
   the lens and a couple of stickers in between. Scrolling dollies the
   camera down the road; each chapter grows out of the distance, holds
   while you read it, then rushes past the lens and blurs out.

   Nothing here is CSS 3D. Each element is projected by hand every
   frame (scale = focal / depth), which keeps blur, fade and stacking
   entirely under our control — a CSS filter would flatten a
   preserve-3d tree, and the depth-of-field is the point.
   ------------------------------------------------------------------ */

const CH = [
  {
    when: 'Start', acc: 'yellow', glyph: 'mark', big: 'Story',
    title: 'My story, the long way round.',
    body: 'Nine stops between a first lecture in Pune and whatever comes next. Scroll, and the camera moves.',
    chips: ['Ajinkya Chavan', 'Pune, India'],
  },
  {
    when: '2023', acc: 'teal', glyph: 'type', big: '2023',
    title: 'Started a B.Tech in Computer Science, AI and ML.',
    body: 'Vishwakarma Institute of Information Technology, Pune. Class of 2027.',
    chips: ['VIIT Pune', 'AI / ML track'],
  },
  {
    when: 'CGPA', acc: 'lime', glyph: 'bars', big: '9.55',
    title: 'Kept a 9.55 while building on the side.',
    body: 'The coursework set the floor. The projects next to it are where most of the learning happened.',
    chips: ['B.Tech CSE (AI/ML)', 'CISCO CCNAv7'],
  },
  {
    when: '2024 – 26', acc: 'violet', glyph: 'hand', big: 'Lead',
    title: 'Tech Lead of the AIMSS club.',
    body: 'Running workshops, mentoring juniors and steering the club’s machine learning projects at VIIT.',
    chips: ['Workshops', 'Mentoring', 'Club ML'],
  },
  {
    when: 'Along the way', acc: 'pink', glyph: 'ship', big: '7',
    title: 'Built seven things that actually run.',
    body: 'FinMCP, Trailhead, Swarm, a construction-risk RAG system and more: agents, retrieval and the products around them.',
    chips: ['MCP', 'A2A agents', 'RAG'],
    link: { to: '/lab', label: 'Walk the workshop', title: 'The workshop', kicker: 'Seven builds, one map' },
  },
  {
    when: 'Nov 2025', acc: 'yellow', glyph: 'check', big: 'v1',
    title: 'Shipped Business Billing for SimpleSight Solutions.',
    body: 'Invoicing, receipts, role-based access and analytics for small businesses on one Postgres tenant model.',
    chips: ['React', 'Supabase', 'PostgreSQL'],
  },
  {
    when: 'Dec 2025', acc: 'blue', glyph: 'graph', big: 'Emerson',
    title: 'Joined Emerson as a PMO AI/ML intern.',
    body: 'Two agent systems now run in production there: the PMO Command Centre and the S&OP Agent.',
    chips: ['PMO Command Centre', 'S&OP Agent'],
    link: { to: '/experience/pmo', label: 'See the architecture', title: 'Two graphs', kicker: 'Emerson · PMO AI/ML' },
  },
  {
    when: '2026', acc: 'violet', glyph: 'doc', big: 'IEEE',
    title: 'Co-authored an IEEE paper at ICICIS 2026.',
    body: 'Intrinsic Uncertainty Modeling for Pre-Output Truthfulness Control in Large Language Models.',
    chips: ['Co-author', 'LLM truthfulness'],
  },
  {
    when: 'Next', acc: 'pink', glyph: 'spark', big: '2027',
    title: 'Graduating in 2027. Open to the next hard problem.',
    body: 'If you are building agents, retrieval or the products around them, I would like to hear about it.',
    chips: ['Open to work', 'Internships · full-time'],
    link: { to: '/#contact', label: 'Say hello', title: 'Contact', kicker: 'Ajinkya Chavan · Portfolio' },
  },
];

const N = CH.length;
const GAP = 1500;          // world depth between chapters
const FAR = 3000;          // beyond this a card has faded out

/* Where each piece of a chapter stands, relative to the chapter. dx and
   dy are fractions of the stage, dz is depth in world pixels. `side`
   flips with the chapter so the road zig-zags. */
const PARTS = {
  card:  { dx: 0.17,  dy: 0.02,  dz: 0 },
  big:   { dx: -0.25, dy: -0.04, dz: 600 },
  glyph: { dx: -0.03, dy: -0.25, dz: -180 },
  chip0: { dx: 0.30,  dy: -0.33, dz: 220 },
  chip1: { dx: -0.30, dy: 0.32,  dz: 140 },
  chip2: { dx: -0.10, dy: 0.36,  dz: 320 },
};

/* How far away each kind of piece is still drawn. Only the next
   chapter's word waits in the distance; its card, stickers and glyph
   arrive once the camera is on its way, so a held chapter is never
   cluttered with tiny bits of the one after it. */
const REACH = { card: 2250, big: FAR, glyph: 2150, chip0: 2150, chip1: 2150, chip2: 2150 };

const side = (i) => (i === 0 ? 0 : i % 2 ? 1 : -1);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

const Story = () => {
  const rootRef = useRef(null);
  const sceneRef = useRef(null);
  const stageRef = useRef(null);
  const stRef = useRef(null);
  const [at, setAt] = useState(0);
  const [flat] = useState(() => reduced());

  useEffect(() => {
    if (flat) return undefined;
    const stage = stageRef.current;
    const items = Array.from(stage.querySelectorAll('[data-part]')).map((el) => ({
      el,
      i: +el.dataset.ch,
      p: PARTS[el.dataset.part],
      far: REACH[el.dataset.part],
      card: el.dataset.part === 'card',
    }));
    const blur = canBlur();

    let W = 0; let H = 0; let F = 900;
    const measure = () => {
      W = stage.clientWidth; H = stage.clientHeight;
      F = Math.max(620, Math.min(1000, W * 0.62));
    };
    measure();

    const X = (i) => side(i) * W * 0.17;
    const Z = (i) => i * GAP;

    let target = 0; let cur = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    let last = '';

    const render = () => {
      cur += (target - cur) * 0.1;
      if (Math.abs(target - cur) < 1e-5) cur = target;
      ptr.x += (ptr.tx - ptr.x) * 0.06;
      ptr.y += (ptr.ty - ptr.y) * 0.06;
      const vel = Math.abs(target - cur) * (N - 1);
      const key = `${cur.toFixed(5)}|${ptr.x.toFixed(2)}|${ptr.y.toFixed(2)}|${W}`;
      if (key === last) return;
      last = key;

      /* The camera eases between stops and lingers on each one, so a
         chapter is read standing still rather than drifting past. */
      const k = cur * (N - 1);
      const a = Math.min(N - 2, Math.floor(k));
      const t = smooth(clamp01((k - a - 0.12) / 0.76));
      const czA = Z(a) - F; const czB = Z(a + 1) - F;
      const cz = czA + (czB - czA) * t;
      const cx = (X(a) + (X(a + 1) - X(a)) * t) * 0.45 + ptr.x * 46;
      const cy = Math.sin(k * Math.PI) * -18 + ptr.y * 30;
      const roll = (X(a + 1) - X(a)) / (W || 1) * Math.sin(t * Math.PI) * -2.4;
      stage.style.setProperty('--roll', `${roll.toFixed(3)}deg`);

      const proj = (x, y, z) => {
        const d = z - cz;
        const s = F / d;
        return [W / 2 + (x - cx) * s, H / 2 + (y - cy) * s, s, d];
      };

      items.forEach((it) => {
        const x = X(it.i) + it.p.dx * W * (side(it.i) || 1);
        const y = it.p.dy * H;
        const z = Z(it.i) + it.p.dz;
        const [px, py, s, d] = proj(x, y, z);
        const o = clamp01((it.far - d) / (it.far === FAR ? 1300 : 700)) * clamp01((d - 260) / 380);
        if (o <= 0.002) {
          if (it.on !== false) { it.el.style.visibility = 'hidden'; it.on = false; }
          return;
        }
        if (it.on !== true) { it.el.style.visibility = 'visible'; it.on = true; }
        it.el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%) scale(${s.toFixed(4)})`;
        it.el.style.opacity = o.toFixed(3);
        it.el.style.zIndex = String(Math.round(10000 - d));
        if (blur) {
          // Depth of field: soft far away, smeared as it rushes the
          // lens, and streaked a little more while the camera moves.
          const b = Math.max(0, (660 - d) / 22) + Math.max(0, (d - 2300) / 520) + vel * 6 * (it.card ? 0.6 : 1);
          it.el.style.filter = b > 0.25 ? `blur(${Math.min(16, b).toFixed(1)}px)` : '';
        }
      });

    };

    const st = ScrollTrigger.create({
      trigger: sceneRef.current,
      start: 'top top',
      end: () => `+=${window.innerHeight * 0.95 * (N - 1)}`,
      pin: true,
      onUpdate: (self) => {
        target = self.progress;
        setAt(Math.round(self.progress * (N - 1)));
      },
      onRefresh: measure,
    });
    stRef.current = st;
    const unsnap = stepSnap(st, N);

    const onMove = (e) => {
      ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    const ro = new ResizeObserver(() => { measure(); last = ''; });
    ro.observe(stage);
    gsap.ticker.add(render);
    render();

    return () => {
      gsap.ticker.remove(render);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      unsnap();
      st.kill();
      stRef.current = null;
    };
  }, [flat]);

  const goTo = (k) => {
    const st = stRef.current;
    if (!st) return;
    const y = st.start + (st.end - st.start) * (k / (N - 1));
    if (window.lenis) window.lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  // Arrow and page keys step through the chapters while the stage is on
  // screen; past either end they fall back to ordinary scrolling.
  useEffect(() => {
    if (flat) return undefined;
    const onKey = (ev) => {
      const st = stRef.current;
      if (!st?.isActive || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.target.closest?.('input, textarea, [contenteditable]')) return;
      const fwd = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(ev.key) || (ev.key === ' ' && !ev.shiftKey);
      const back = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(ev.key) || (ev.key === ' ' && ev.shiftKey);
      const now = Math.round(st.progress * (N - 1));
      if (fwd && now < N - 1) { ev.preventDefault(); goTo(now + 1); }
      else if (back && now > 0) { ev.preventDefault(); goTo(now - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flat]);

  return (
    <div className={`sy${flat ? ' is-flat' : ''}`} ref={rootRef}>
      <div className="sy-pinwrap">
        <section className="sy-scene" ref={sceneRef} data-acc={CH[at].acc} aria-label="My story">
          <div className="sy-stage" ref={stageRef}>

            {CH.map((c, i) => (
              <React.Fragment key={c.when}>
                <div className="sy-item sy-big display" data-part="big" data-ch={i} data-acc={c.acc} style={{ '--len': Math.max(4, c.big.length) }} aria-hidden="true">{c.big}<i /></div>
                <article
                  className={`sy-item sy-card${at === i ? ' is-on' : ''}`}
                  data-part="card" data-ch={i} data-acc={c.acc}
                >
                  <header className="sy-card-head">
                    <span className="num sy-card-n">{String(i).padStart(2, '0')}</span>
                    <span className="sy-card-when">{c.when}</span>
                  </header>
                  {i === 0
                    ? <h1 className="display sy-card-t">{c.title}</h1>
                    : <h2 className="display sy-card-t">{c.title}</h2>}
                  <p className="sy-card-b">{c.body}</p>
                  {c.link && (
                    <TransitionLink to={c.link.to} title={c.link.title} kicker={c.link.kicker} className="sy-card-go" data-cursor="hot">
                      {c.link.label}
                      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 L9 3 M4 3 H9 V8" /></svg>
                    </TransitionLink>
                  )}
                </article>
                <div className="sy-item sy-glyph" data-part="glyph" data-ch={i} aria-hidden="true">
                  <Glyph kind={c.glyph} acc={c.acc} />
                </div>
                {c.chips.map((t, j) => (
                  <span key={t} className="sy-item sy-chip" data-part={`chip${j}`} data-ch={i} data-acc={c.acc}>
                    <i aria-hidden="true" />{t}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>

          <div className="sy-hud" aria-hidden={flat ? 'true' : undefined}>
            <div className="sy-count">
              <span className="num sy-count-roll" style={{ '--at': at }}>
                {CH.map((c, i) => <span key={c.when}>{String(i).padStart(2, '0')}</span>)}
              </span>
              <span className="sy-count-of num">/ {String(N - 1).padStart(2, '0')}</span>
            </div>
            <ol className="sy-rail">
              {CH.map((c, i) => (
                <li key={c.when}>
                  <button
                    type="button"
                    className={`sy-rail-b${at === i ? ' is-on' : ''}${i < at ? ' is-past' : ''}`}
                    data-acc={c.acc}
                    onClick={() => goTo(i)}
                    data-cursor="hot"
                  >
                    <span className="sy-rail-l">{c.when}</span>
                    <i aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
            <p className={`sy-hint${at > 0 ? ' is-gone' : ''}`}>
              <span className="sy-hint-track" aria-hidden="true"><i /></span>
              Scroll or use the arrow keys
            </p>
          </div>
        </section>
      </div>

      <section className="sy-next shell" data-acc="lime">
        <p className="sy-next-k">That was the road.</p>
        <h2 className="display sy-next-t">
          Now walk the <Glyph kind="stack" acc="lime" /> workshop where the builds stand.
        </h2>
        <div className="sy-next-row">
          <TransitionLink to="/lab" title="The workshop" kicker="Seven builds, one map" className="sy-next-go" data-cursor="hot">
            Open the workshop
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 L9 3 M4 3 H9 V8" /></svg>
          </TransitionLink>
          <TransitionLink to="/" title="Home" kicker="Ajinkya Chavan · Portfolio" className="sy-next-alt" data-cursor="hot">Back to the start</TransitionLink>
        </div>
      </section>

      <style>{`
        .sy-scene {
          position: relative;
          height: 100svh;
          overflow: hidden;
          background: var(--paper);
        }
        .sy-stage {
          position: absolute; inset: 0;
          rotate: var(--roll, 0deg);
          contain: strict;
        }
        .sy-item {
          position: absolute; left: 0; top: 0;
          visibility: hidden;
          transform-origin: 50% 50%;
          will-change: transform, opacity, filter;
        }
        .sy-big {
          font-size: min(23vw, 21rem, calc(118vw / var(--len)));
          font-weight: 800;
          letter-spacing: -0.07em;
          line-height: 0.8;
          white-space: nowrap;
          color: var(--acc);
        }
        .sy-big i { display: inline-block; width: 0.15em; height: 0.15em; margin-left: 0.04em; border-radius: 99px; background: var(--ink); }
        .sy-card {
          width: min(28rem, 82vw);
          padding: clamp(1.25rem, 2.4vw, 1.9rem);
          border-radius: var(--r-l);
          background: var(--paper);
          box-shadow: 0 0 0 1px var(--line), 0 30px 60px -30px var(--shadow);
          pointer-events: none;
        }
        .sy-card.is-on { pointer-events: auto; }
        .sy-card-head { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.1rem; }
        .sy-card-n {
          display: grid; place-items: center;
          min-width: 2.2rem; height: 2.2rem; padding: 0 0.5rem;
          border-radius: var(--r-pill);
          background: var(--acc); color: var(--acc-ink);
          font-size: var(--step--1); font-weight: 600;
        }
        .sy-card-when { font-weight: 600; color: var(--ink-2); font-size: var(--step--1); }
        .sy-card-t {
          font-size: clamp(1.7rem, 2.6vw, 2.5rem);
          line-height: 1.02;
          letter-spacing: -0.035em;
          font-weight: 700;
          margin: 0 0 0.8rem;
        }
        .sy-card-b { color: var(--ink-2); line-height: 1.5; margin: 0; }
        .sy-card-go, .sy-next-go {
          display: inline-flex; align-items: center; gap: 0.55em;
          margin-top: 1.2rem;
          padding: 0.7rem 1.05rem;
          border-radius: var(--r-pill);
          background: var(--ink); color: var(--paper);
          font-weight: 600; font-size: var(--step--1);
          transition: background 0.4s var(--ease-out), color 0.4s var(--ease-out);
        }
        .sy-card-go svg, .sy-next-go svg {
          width: 0.7rem; height: 0.7rem; fill: none; stroke: currentColor;
          stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
          transition: transform 0.45s var(--ease-out);
        }
        .sy-card-go:hover, .sy-next-go:hover { background: var(--acc); color: var(--acc-ink); }
        .sy-card-go:hover svg, .sy-next-go:hover svg { transform: translate(2px, -2px); }

        .sy-glyph { font-size: clamp(3rem, 6vw, 5.2rem); line-height: 1; }
        .sy-chip {
          display: inline-flex; align-items: center; gap: 0.5em;
          padding: 0.55em 0.95em 0.55em 0.7em;
          border-radius: var(--r-pill);
          background: var(--paper-2);
          box-shadow: 0 10px 24px -14px var(--shadow);
          font-weight: 600; font-size: var(--step-0);
          white-space: nowrap;
        }
        .sy-chip i { width: 0.6em; height: 0.6em; border-radius: 99px; background: var(--acc); }

        /* HUD: where you are, where you can go. */
        .sy-hud { position: absolute; inset: 0; pointer-events: none; z-index: 20000; }
        .sy-count {
          position: absolute;
          left: var(--gutter); bottom: clamp(1.2rem, 4vh, 2.4rem);
          display: flex; align-items: baseline; gap: 0.4rem;
        }
        .sy-count-roll {
          display: grid; height: 1em; overflow: hidden; line-height: 1;
          font-size: clamp(2.6rem, 5vw, 4.2rem); font-weight: 700; letter-spacing: -0.04em;
        }
        .sy-count-roll > span {
          grid-area: 1 / 1;
          transform: translateY(calc((var(--i, 0) - var(--at)) * 100%));
          transition: transform 0.7s var(--ease-out);
        }
        ${CH.map((_, i) => `.sy-count-roll > span:nth-child(${i + 1}) { --i: ${i}; }`).join('\n')}
        .sy-count-of { color: var(--ink-3); font-size: var(--step-0); }

        .sy-rail {
          position: absolute;
          right: var(--gutter); top: 50%;
          translate: 0 -50%;
          display: grid; gap: 0.15rem;
          list-style: none; margin: 0; padding: 0;
          pointer-events: auto;
        }
        .sy-rail-b {
          display: flex; align-items: center; justify-content: flex-end; gap: 0.7rem;
          width: 100%;
          padding: 0.32rem 0;
          background: none; border: 0; cursor: pointer;
          color: var(--ink-3); font: inherit; font-size: var(--step--1); font-weight: 550;
        }
        .sy-rail-b i {
          width: 1.4rem; height: 3px; border-radius: 3px;
          background: var(--line);
          transition: width 0.5s var(--ease-out), background 0.5s var(--ease-out);
        }
        .sy-rail-l { opacity: 0.55; translate: 4px 0; transition: opacity 0.4s, translate 0.5s var(--ease-out), color 0.4s; }
        .sy-rail-b:hover .sy-rail-l, .sy-rail-b.is-on .sy-rail-l { opacity: 1; translate: 0 0; }
        .sy-rail-b.is-on .sy-rail-l { font-weight: 650; }
        .sy-rail-b.is-past i { background: var(--ink-3); }
        .sy-rail-b.is-on { color: var(--ink); }
        .sy-rail-b.is-on i { width: 2.6rem; background: var(--acc); }
        .sy-rail-b:hover { color: var(--ink); }

        .sy-hint {
          position: absolute; left: 50%; bottom: clamp(1.2rem, 4vh, 2.4rem);
          translate: -50% 0;
          display: flex; align-items: center; gap: 0.7rem;
          margin: 0;
          color: var(--ink-2); font-size: var(--step--1); font-weight: 550;
          transition: opacity 0.5s, translate 0.6s var(--ease-out);
        }
        .sy-hint.is-gone { opacity: 0; translate: -50% 12px; }
        .sy-hint-track { position: relative; width: 4px; height: 1.6rem; border-radius: 4px; background: var(--line); overflow: hidden; }
        .sy-hint-track i {
          position: absolute; left: 0; top: 0; width: 100%; height: 40%;
          border-radius: 4px; background: var(--acc);
          animation: sy-hint 1.6s var(--ease-in-out) infinite;
        }
        @keyframes sy-hint { from { transform: translateY(-100%); } to { transform: translateY(260%); } }

        /* After the road. */
        .sy-next { padding-block: var(--bay); }
        .sy-next-k { color: var(--ink-2); font-weight: 600; margin: 0 0 1rem; }
        .sy-next-t {
          font-size: var(--step-4);
          line-height: 0.95; letter-spacing: -0.055em; font-weight: 750;
          max-width: 14ch; margin: 0;
        }
        .sy-next-row { display: flex; flex-wrap: wrap; align-items: center; gap: 1.2rem; margin-top: 2.4rem; }
        .sy-next-go { margin: 0; font-size: var(--step-0); padding: 0.95rem 1.4rem; }
        .sy-next-alt { color: var(--ink-2); font-weight: 600; transition: color 0.3s; }
        .sy-next-alt:hover { color: var(--ink); }

        @media (max-width: 760px) {
          .sy-rail { display: none; }
          .sy-big { font-size: min(9rem, calc(150vw / var(--len))); }
          .sy-chip { font-size: var(--step--1); }
          .sy-hint { left: auto; right: var(--gutter); translate: 0 0; }
          .sy-hint.is-gone { translate: 0 12px; }
        }

        /* Reduced motion: the same cards, read top to bottom. */
        .sy.is-flat .sy-scene { height: auto; overflow: visible; padding: calc(var(--bay) + 2rem) var(--gutter) 2rem; }
        .sy.is-flat .sy-stage { position: static; display: grid; gap: 1.2rem; justify-items: start; contain: none; rotate: none; }
        .sy.is-flat .sy.is-flat .sy-big, .sy.is-flat .sy-glyph, .sy.is-flat .sy-chip, .sy.is-flat .sy-hud { display: none; }
        .sy.is-flat .sy-item { position: relative; visibility: visible; }
        .sy.is-flat .sy-card { pointer-events: auto; width: min(40rem, 100%); }
      `}</style>
    </div>
  );
};

export default Story;
