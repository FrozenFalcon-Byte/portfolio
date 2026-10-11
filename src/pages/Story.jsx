import React, { useEffect, useRef, useState } from 'react';
import { gsap, reduced } from '../lib/motion';
import Glyph from '../components/Glyph';
import { TransitionLink } from '../components/RouteCurtain';
import { PROJECTS } from '../data/projects';

/* ------------------------------------------------------------------
   Story — everything I build and have built, told as a graphic novel
   you scroll through, panel by panel. The site's own mark, a round
   "a." token, is the one travelling through it.

   The page is one tall track with a stage stuck to the viewport. Every
   scene lives on that stage at once, and a single clock places them all
   from the scroll position: `s` is how many screens down you are, and
   each scene gets its own `t = s - at`, so it can enter, hold, grow,
   tilt or shatter on its own schedule while overlapping the scenes
   around it. Nothing re-renders on scroll; everything moves by
   transform and clip-path, written only when it changes.

   Scenes, in the order you meet them:
     open     a full-bleed title pulls in to a framed panel; insets fly in
     climb    a panel grows to full bleed while the token climbs a graph
     near     a panel tilted back in space stands up as it reaches you
     crew     a slab slides over; hold to run four agents
     ring     a lens searches a shelf of past projects, finds nothing close
     drip     ink runs down the page
     hall     a hall of columns, a strip across it, a dolly to a plinth
     lift     hold, and the whole stack lifts into orbit
     record   four records rise at their own speeds and settle into a row
     back     the opening comes back, with an empty lot at the end
     ask      the invitation, a poster, and the builds on a turntable
   ------------------------------------------------------------------ */

const SCENES = [
  { id: 'open',   at: 0,    len: 3.6, acc: 'yellow', label: 'Open' },
  { id: 'climb',  at: 3.2,  len: 3.3, acc: 'blue',   label: 'Agents' },
  { id: 'near',   at: 6.1,  len: 2.3, acc: 'blue' },
  { id: 'crew',   at: 7.7,  len: 2.9, acc: 'lime',   label: 'Crew' },
  { id: 'ring',   at: 10.1, len: 2.4, acc: 'yellow', label: 'Retrieval' },
  { id: 'drip',   at: 12.2, len: 1.0, acc: 'violet' },
  { id: 'hall',   at: 13.2, len: 4.4, acc: 'violet', label: 'Stack' },
  { id: 'lift',   at: 17.3, len: 2.5, acc: 'pink' },
  { id: 'record', at: 19.5, len: 2.8, acc: 'teal',   label: 'Record' },
  { id: 'back',   at: 21.9, len: 2.7, acc: 'yellow', label: 'Next' },
  { id: 'ask',    at: 24.3, len: 3.4, acc: 'yellow' },
  { id: 'poster', at: 25.3, len: 2.0, acc: 'yellow' },
  { id: 'reel',   at: 27.0, len: 1.7, acc: 'pink',   label: 'Builds' },
];
const TOTAL = 27.0 + 1.7 + 1;   // screens of track; the last one is the stuck stage itself

const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => cl((t - a) / (b - a));
const mix = (a, b, k) => a + (b - a) * k;
const out = (x) => 1 - (1 - x) ** 3;
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/* ------------------------------------------------------------------
   Pieces drawn with the site's own parts.
   ------------------------------------------------------------------ */

// The main character: the site's mark, a round "a." in the scene's
// accent. It hops, rolls and floats; it never needs a face.
const Walker = ({ className = '', k }) => (
  <div className={`sx-walker ${className}`} data-k={k} aria-hidden="true">
    <span className="sx-tok"><b>a</b><i /></span>
  </div>
);

// The seven builds as a street of buildings, the way the Workshop
// draws them. `lot` adds an empty plot at the end of the street.
const TOWN = [58, 84, 50, 100, 70, 44, 78];
const Town = ({ k, lot = false, names = false }) => (
  <div className="sx-town" data-k={k} aria-hidden="true">
    {TOWN.map((h, i) => {
      const rows = Math.max(4, Math.round(h / 9));
      return (
        <div key={i} className="sx-bld" style={{ '--h': `${h}%` }}>
          <div className="sx-bld-win">
            {Array.from({ length: rows * 4 }, (_, j) => (
              <i key={j} className={(j * 7 + i * 5) % 9 === 0 || (j * 3 + i) % 13 === 0 ? 'is-lit' : ''} />
            ))}
          </div>
          {names && <span className="sx-bld-n">{PROJECTS[i].title.split(' ')[0]}</span>}
        </div>
      );
    })}
    {lot && (
      <div className="sx-lot" data-k="back.lot">
        <span className="sx-lot-n">Yours</span>
      </div>
    )}
  </div>
);

// A caption box. It draws itself open when its scene reaches `on`.
const Cap = ({ k, on, off, className = '', children }) => (
  <p className={`sx-cap ${className}`} data-k={k} data-on={on} data-off={off}>
    <span>{children}</span>
  </p>
);

const HoldButton = ({ label, onHold, k }) => {
  const down = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onHold(true);
  };
  const up = () => onHold(false);
  const key = (on) => (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (on && e.repeat) return;
    onHold(on);
  };
  return (
    <button
      type="button"
      className="sx-hold"
      data-k={k}
      data-cursor="hot"
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={key(true)}
      onKeyUp={key(false)}
      onBlur={up}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="sx-hold-track" cx="50" cy="50" r="46" />
        <circle className="sx-hold-fill" cx="50" cy="50" r="46" pathLength="1" />
      </svg>
      <span>{label}</span>
    </button>
  );
};

/* The PMO graph as a staircase: each stage is a step, production is
   the landing at the top. The token climbs it, fails a check on
   Validate, drops back a step to fix the SQL, and walks on up. */
const STEPS = ['Intake', 'Extract', 'SQL', 'Validate', 'Report', 'Production'];
const STEP_W = 0.13;
const STEP_X = (i) => 0.1 + STEP_W * i;
const STEP_TOP = (i) => 0.8 - i * 0.1;
const CLIMB = [[0, 0], [0.3, 3], [0.42, 3], [0.5, 2], [0.62, 2], [0.72, 3], [0.86, 4], [1, 5]];

const SOP = ['Guardrail', 'Intent', 'Plan', 'Generate', 'Validate', 'Execute', 'Stream'];
// Where each agent's panel floats on the slab: position, depth, tilt.
const CREW_AT = [
  { x: 0.19, y: 0.47, z: 0.7, ry: 14, rx: -6, r: -3 },
  { x: 0.76, y: 0.3, z: 1, ry: -12, rx: 6, r: 2 },
  { x: 0.33, y: 0.76, z: 0.9, ry: 10, rx: 8, r: 2 },
  { x: 0.74, y: 0.72, z: 0.6, ry: -14, rx: -8, r: -2 },
];
const CREW = [
  { n: 'Triager', c: 'Labels it a flaky test, not a real failure.', g: 'search' },
  { n: 'Coder', c: 'Writes the fix in a sandbox with no network.', g: 'code' },
  { n: 'Tester', c: 'Proves it fails before the fix and passes after.', g: 'check' },
  { n: 'Reviewer', c: 'Reads the diff and approves it.', g: 'doc' },
];
const COLS = [
  { t: 'Languages', i: 'Python · Java · C++ · JS · SQL' },
  { t: 'GenAI & ML', i: 'LangGraph · RAG · MCP · A2A' },
  { t: 'Web', i: 'React · TypeScript · FastAPI' },
  { t: 'Cloud', i: 'Azure · AWS · Vercel · Render' },
  { t: 'Tooling', i: 'Git · Docker · GitHub Actions' },
];
const CAPSULES = [
  { t: 'Agents', g: 'graph', i: ['LangGraph', 'MCP servers', 'A2A crews'] },
  { t: 'Retrieval', g: 'search', i: ['RAG', 'Vector search', 'Confidence gates'] },
  { t: 'Interfaces', g: 'click', i: ['React', 'Realtime', 'Motion'] },
];
const ORBIT = ['Python', 'LangGraph', 'React', 'Azure', 'FastAPI', 'MCP', 'Docker', 'TypeScript', 'RAG', 'PostgreSQL', 'A2A', 'TensorFlow'];
const RECORDS = [
  { big: '9.55', t: 'CGPA', c: 'B.Tech CSE (AI/ML), VIIT Pune, class of 2027.' },
  { big: 'IEEE', t: 'Co-author', c: 'Pre-output truthfulness control in LLMs, ICICIS 2026.' },
  { big: 'Lead', t: 'AIMSS club', c: 'Tech Lead 2024–26: workshops, mentoring, the club’s ML work.' },
  { big: 'CCNA', t: 'Certified', c: 'CISCO CCNAv7, plus machine and deep learning in Python and R.' },
];

// Each record card travels at its own speed and tilt, and settles
// into the row at the same moment.
const REC_SPEED = [1.18, 0.86, 1.32, 0.98];
const REC_TILT = [-7, 5, -4, 8];

// The shelf the lens searches: past projects, none of them close enough.
const SHELF = [
  ['Tower, 2019', '0.31'], ['Metro P3', '0.22'], ['Bridge B', '0.34'], ['Mall annex', '0.18'], ['Depot', '0.27'],
  ['Ring road', '0.12'], ['Plant 4', '0.29'], ['Hospital', '0.24'], ['Flyover', '0.33'], ['School', '0.15'],
];
const LENS = [0, 7, 2, 8, 4]; // the cards the lens visits, in order
const LENS_NARROW = [0, 4, 2, 3, 5]; // phones show six cards, three across
const back = (x) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2;
// A point on the gauge's half circle for a value 0..1.
const arcAt = (v) => [100 + 80 * Math.cos(Math.PI * (1 - v)), 100 - 80 * Math.sin(Math.PI * (1 - v))].map((n) => n.toFixed(1));

// Ink drips: one per column, each with its own start.
const DRIPS = Array.from({ length: 22 }, (_, i) => ({ d: ((i * 37) % 11) / 11 * 0.28, w: 1 + ((i * 13) % 5) * 0.12 }));

const Story = () => {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const crewRef = useRef({ hold: false, n: 0, done: false });
  const liftRef = useRef({ hold: false, p: 0 });
  const [flat] = useState(() => reduced());
  const [crewDone, setCrewDone] = useState(false);
  const [reel, setReel] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const $ = {};
    stage.querySelectorAll('[data-k]').forEach((el) => { $[el.dataset.k] = el; });
    const roots = SCENES.map((sc) => stage.querySelector(`[data-scene="${sc.id}"]`));
    const caps = SCENES.map((_, i) => Array.from(roots[i].querySelectorAll('[data-on]')).map((el) => ({
      el, on: +el.dataset.on, off: el.dataset.off ? +el.dataset.off : Infinity,
    })));
    const drips = Array.from(stage.querySelectorAll('.sx-drip i'));
    const shelf = Array.from(stage.querySelectorAll('.sx-shelf-card'));
    const askDrips = Array.from(stage.querySelectorAll('.sx-ask-drips i'));
    const cols = Array.from(stage.querySelectorAll('.sx-col'));
    const recs = Array.from(stage.querySelectorAll('.sx-rec'));
    const orbit = Array.from(stage.querySelectorAll('.sx-orb'));
    const steps = Array.from(stage.querySelectorAll('.sx-step'));
    const sop = Array.from(stage.querySelectorAll('.sx-sop-s'));
    const crewCards = Array.from(stage.querySelectorAll('.sx-agent'));
    const grain = Array.from(stage.querySelectorAll('.sx-grain i'));

    let W = 0; let H = 0; let F = 900; let gut = 40; let narrow = false;
    let plinthBase = 640;
    let shelfXY = [];
    const measure = () => {
      W = stage.clientWidth; H = stage.clientHeight;
      F = H * 1.0;
      narrow = W < 760;
      gut = narrow ? 12 : Math.min(W * 0.045, 64);
      // The plinth is sized so that, at the end of the dolly, it fills
      // most of the width it has.
      const sEnd = F / 600;
      plinthBase = Math.min(W * (narrow ? 0.94 : 0.8), 1000) / sEnd;
      $['hall.plinth'].style.width = `${plinthBase.toFixed(1)}px`;
      $['hall.plinth'].style.fontSize = `${(plinthBase / 42).toFixed(2)}px`;
      // Card centres on the shelf, so the lens lands on them at any width.
      shelfXY = shelf.map((el) => [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight / 2]);
    };
    measure();

    /* Writers that touch the DOM only when the value actually changes. */
    const tf = (el, v) => { if (el.$t !== v) { el.style.transform = v; el.$t = v; } };
    const op = (el, v) => {
      const s = v >= 0.999 ? '' : Math.max(0, v).toFixed(3);
      if (el.$o !== s) { el.style.opacity = s; el.$o = s; }
    };
    const cp = (el, top, r, b, l, rad) => {
      const v = top + r + b + l < 0.5 ? 'none'
        : `inset(${top.toFixed(1)}px ${r.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${rad.toFixed(1)}px)`;
      if (el.$c !== v) { el.style.clipPath = v; el.$c = v; }
    };
    const cls = (el, name, on) => {
      const key = `$${name}`;
      if (el[key] !== on) { el.classList.toggle(name, on); el[key] = on; }
    };
    const vis = (el, on) => { if (el.$v !== on) { el.style.visibility = on ? '' : 'hidden'; el.$v = on; } };
    const T = (x = 0, y = 0, s = 1, r = 0) => `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)${s !== 1 ? ` scale(${s.toFixed(4)})` : ''}${r ? ` rotate(${r.toFixed(2)}deg)` : ''}`;
    // An element that rests where the stylesheet put it at scene time
    // t0, and otherwise travels with the scroll at `speed`.
    const fl = (k, t, t0, speed = 1, x = 0, s = 1, r = 0) => tf($[k], T(x, -(t - t0) * H * speed, s, r));
    // A slab that rises from below, rests from `a` to `b`, then leaves up.
    const slab = (t, a, b = Infinity) => (t < a ? (a - t) * H : t > b ? -(t - b) * H : 0);

    let clock = 0;
    let orbitA = 0;

    const U = {
      open(t) {
        // Full bleed pulls in to a frame, holds while the insets land on
        // it, then leaves just as the portrait panel comes up under it.
        const k = io(seg(t, 0, 0.85));
        const gx = gut * k; const gt = H * 0.11 * k; const gb = H * 0.07 * k;
        const p = $['open.panel'];
        const leave = Math.max(0, t - 1.55) * H;
        tf(p, T(0, -leave));
        cp(p, gt, gx, gb, gx, 26 * k);
        tf($['open.title'], T(0, -t * H * 0.42));
        tf($['open.kick'], T(0, -t * H * 0.42));
        tf($['open.town'], T(0, -t * H * 0.1));
        const w = out(seg(t, 0.05, 1.05));
        tf($['open.walker'], T(Math.sin(t * 6) * 8, mix(H * 0.45, 0, w), 1, Math.sin(t * 13) * 3));
        op($['open.hint'], 1 - seg(t, 0, 0.12));
        fl('open.in1', t, 1.25, 1.45, -W * 0.14 * (1 - out(seg(t, 0.45, 1.15))));
        fl('open.in2', t, 1.5, 1.3, W * 0.14 * (1 - out(seg(t, 0.7, 1.4))));
        fl('open.c1', t, 1.0, 1);
        fl('open.c2', t, 1.45, 1);
        fl('open.face', t, 2.45, 1);
        // Inside the frame each layer keeps its own depth.
        const pf = (t - 2.45) * H;
        tf($['open.pfSun'], T(0, pf * 0.3));
        tf($['open.pfCity'], T(0, pf * 0.14));
        tf($['open.pfSay'], T(0, pf * -0.12, 1, -4 + (t - 2.45) * 5));
        fl('open.lines', t, 2.45, 1.32);
        fl('open.c3', t, 2.2, 1.08);
        fl('open.c4', t, 2.7, 0.92);
      },

      climb(t) {
        const fw = Math.min(W - gut * 2, 1180); const fh = Math.min(H * 0.7, fw * 0.66);
        const e = io(seg(t, 0.85, 1.5));
        const ix = ((W - fw) / 2) * (1 - e); const iy = ((H - fh) / 2) * (1 - e);
        const p = $['climb.panel'];
        tf(p, T(0, slab(t, 0.85, 2.7)));
        cp(p, iy, ix, iy, ix, 26 * (1 - e));
        // The content pushes in while the frame opens out.
        tf($['climb.world'], T(0, mix(H * 0.06, 0, seg(t, 0.2, 1.6)), mix(0.9, 1.05, seg(t, 0.2, 2.7))));
        tf($['climb.sun'], T(0, -seg(t, 0, 2.7) * H * 0.1));
        // Walk the staircase along its keyframes, hopping step to step.
        const c = seg(t, 0.95, 2.45);
        let j = 0; while (j < CLIMB.length - 2 && c > CLIMB[j + 1][0]) j += 1;
        const pos = mix(CLIMB[j][1], CLIMB[j + 1][1], seg(c, CLIMB[j][0], CLIMB[j + 1][0]));
        const a = Math.min(STEPS.length - 2, Math.floor(pos)); const f = pos - a;
        const cx = (i) => STEP_X(i) + STEP_W / 2;
        const x = mix(cx(a), cx(a + 1), f) * W;
        const hop = Math.sin(f * Math.PI) * H * 0.07;
        const y = Math.min(STEP_TOP(a), STEP_TOP(a + 1)) * H + Math.abs(STEP_TOP(a) - STEP_TOP(a + 1)) * H * (STEP_TOP(a + 1) > STEP_TOP(a) ? f : 1 - f) - hop;
        tf($['climb.walker'], T(x, y, 1, Math.sin(f * Math.PI) * -12));
        tf($['climb.say'], T(x, y));
        const bad = c > 0.3 && c < 0.5; const fix = c >= 0.5 && c < 0.72;
        steps.forEach((el, i) => {
          cls(el, 'is-on', pos >= i - 0.15 && !(bad && i === 3));
          cls(el, 'is-bad', bad && i === 3);
        });
        cls($['climb.say'], 'is-bad', bad);
        cls($['climb.say'], 'is-fix', fix);
        cls($['climb.sun'], 'is-on', pos > 4.85);
        fl('climb.in', t, 2.4, 1.35);
      },

      near(t) {
        const a = io(seg(t, -0.15, 0.95));
        const y = t < 0.95 ? (0.95 - t) * H * 0.92 : t > 1.5 ? -(t - 1.5) * H : 0;
        tf($['near.plane'], `translate3d(0, ${y.toFixed(1)}px, 0) perspective(1400px) rotateX(${mix(54, 0, a).toFixed(2)}deg) scale(${mix(0.84, 1, a).toFixed(4)})`);
        const lit = Math.floor(seg(t, 0.45, 1.4) * (SOP.length + 1));
        sop.forEach((el, i) => cls(el, 'is-on', i < lit));
        cls($['near.answer'], 'is-on', lit > SOP.length);
        fl('near.c1', t, 0.95, 1.1);
        fl('near.c2', t, 1.3, 1);
      },

      crew(t, dt) {
        const sy = slab(t, 0.9, 2.2);
        tf($['crew.slab'], T(0, sy));
        const st = crewRef.current;
        // The disc follows the pointer; the token chases the disc, harder
        // while you hold. Carry it to each agent, in order, to run them.
        if (st.px == null) { st.px = W * 0.5; st.py = H * 0.55; }
        const k1 = Math.min(1, dt * 12);
        st.dx = st.dx == null ? st.px : st.dx + (st.px - st.dx) * k1;
        st.dy = st.dy == null ? st.py : st.dy + (st.py - st.dy) * k1;
        const k2 = Math.min(1, dt * (st.hold ? 7 : 1.6));
        const gx = st.hold ? st.dx : W * 0.5 + (st.dx - W * 0.5) * 0.25;
        const gy = st.hold ? st.dy : H * 0.53 + (st.dy - H * 0.53) * 0.25;
        st.tx = st.tx == null ? gx : st.tx + (gx - st.tx) * k2;
        st.ty = st.ty == null ? gy : st.ty + (gy - st.ty) * k2;
        tf($['crew.disc'], T(st.dx, st.dy, st.hold ? 1.18 : 1));
        cls($['crew.disc'], 'is-held', st.hold);
        const label = st.done ? 'Done' : st.hold ? `To ${CREW[st.n].n}` : 'Hold &\nmove';
        if ($['crew.discT'].$l !== label) { $['crew.discT'].textContent = label; $['crew.discT'].$l = label; }
        tf($['crew.hand'], T(st.tx, st.ty + Math.sin(clock * 1.7) * (st.hold ? 0 : 7), st.hold ? 1.12 : 1, (st.tx - gx) * -0.05));
        const mx = st.dx / W * 2 - 1; const my = st.dy / H * 2 - 1;
        crewCards.forEach((el, i) => {
          const P = CREW_AT[i];
          const drift = -(t - 1.55) * H * 0.3 * P.z;
          const bob = Math.sin(clock * 1.1 + i * 1.7) * 8 * P.z;
          const px = -mx * 28 * P.z; const py = -my * 18 * P.z;
          const on = i < st.n;
          tf(el, `translate3d(${px.toFixed(1)}px, ${(drift + bob + py).toFixed(1)}px, 0) perspective(900px) rotateX(${(P.rx * (on ? 0.3 : 1) - my * 10 * P.z).toFixed(2)}deg) rotateY(${(P.ry * (on ? 0.3 : 1) + mx * 14 * P.z).toFixed(2)}deg) rotate(${P.r}deg)`);
          cls(el, 'is-on', on);
          cls(el, 'is-next', i === st.n && !st.done);
        });
        // Holding over the next agent hands it the work.
        if (st.hold && !st.done && t > 0.8 && t < 2.3) {
          const r = crewCards[st.n].getBoundingClientRect();
          const sr = stage.getBoundingClientRect();
          const x = st.px + sr.left; const y = st.py + sy + sr.top;
          if (x > r.left && x < r.right && y > r.top && y < r.bottom) {
            st.n += 1;
            if (st.n >= CREW.length) { st.done = true; setCrewDone(true); }
          }
        }
        grain.forEach((el, i) => tf(el, T(0, -((t * H * (0.15 + (i % 4) * 0.08)) % (H * 0.5)))));
      },

      ring(t) {
        // The panel arrives and stays; the ink drips down over it.
        const drift = -(t - 0.6) * H;
        tf($['ring.main'], T(0, Math.max(0, 0.6 - t) * H * 1.15 + drift * 0.06, 1, -1.5));
        // The lens walks the shelf; every card it reads gets a score.
        const path = narrow ? LENS_NARROW : LENS;
        const p = io(seg(t, 0.35, 1.15)) * (path.length - 1);
        const a = Math.floor(p); const f = p - a;
        const [x0, y0] = shelfXY[path[a]]; const [x1, y1] = shelfXY[path[Math.min(a + 1, path.length - 1)]];
        const lens = $['ring.lens'];
        tf(lens, T(mix(x0, x1, f), mix(y0, y1, f)));
        op(lens, seg(t, 0.25, 0.4) * (1 - seg(t, 1.2, 1.35)));
        const here = path[Math.round(p)];
        shelf.forEach((el, i) => {
          const k = path.indexOf(i);
          cls(el, 'is-lit', i === here && t > 0.3 && t < 1.25);
          cls(el, 'is-seen', t > 1.25 || (k >= 0 && k <= p + 0.3 && t > 0.3));
        });
        // The best score climbs, wobbles and stops well under the line.
        const g = out(seg(t, 0.55, 0.85));
        tf($['ring.gauge'], T((1 - g) * W * 0.4, drift * 0.05, 1, mix(18, 4, g)));
        const v = 0.34 * out(seg(t, 0.6, 1.2)) + Math.sin(t * 22) * 0.015 * (1 - seg(t, 1.0, 1.3));
        tf($['ring.needle'], `rotate(${(-90 + v * 180).toFixed(2)}deg)`);
        // Then it says so.
        const b = back(seg(t, 1.2, 1.5));
        tf($['ring.say'], T(drift * -0.03, drift * 0.08, Math.max(0, b), mix(-14, -3, cl(b))));
        op($['ring.say'], seg(t, 1.2, 1.26));
        fl('ring.c1', t, 1.0, 1.0);
        fl('ring.c2', t, 1.6, 0.4);
      },

      drip(t) {
        drips.forEach((el, i) => tf(el, `scaleY(${out(seg(t, DRIPS[i].d, DRIPS[i].d + 0.62)).toFixed(4)})`));
        op($['drip.fill'], seg(t, 0.86, 0.92));
      },

      hall(t) {
        // Nothing of the hall shows until the ink has covered the screen;
        // then the camera arrives from far back and walks the colonnade.
        const shown = t > -0.12;
        op($['hall.bg'], shown ? 1 : 0);
        const rise = 0;
        const cz = t < 1.15 ? mix(-2600, -200, out(seg(t, -0.12, 1.15))) : mix(-200, 2700, io(seg(t, 1.15, 3.3)));
        cols.forEach((el, i) => {
          const side = i % 2 ? 1 : -1; const z = 300 + Math.floor(i / 2) * 560;
          const d = z - cz;
          if (d < 90 || !shown) { vis(el, false); return; }
          vis(el, true);
          const s = F / d;
          tf(el, T(side * W * 0.33 * s, rise + H * 0.04 * s, s));
          op(el, cl((d - 90) / 260) * out(seg(t, -0.12, 0.35)));
        });
        const pd = 3300 - cz; const ps = F / pd;
        vis($['hall.plinth'], shown);
        tf($['hall.plinth'], T(0, rise + H * 0.2 * ps, ps));
        cls($['hall.plinth'], 'is-near', t > 3.1);
        fl('hall.strip', t, 0.95, 1);
        tf($['hall.stripText'], T(mix(W * 0.25, -W * 0.55, seg(t, -0.3, 2.0)), 0));
        fl('hall.walker', t, 2.35, 1.5, 0, 1, -6);
        fl('hall.c1', t, 0.55, 0.9);
        fl('hall.c2', t, 3.55, 0.6);
      },

      lift(t, dt) {
        tf($['lift.slab'], T(0, slab(t, 0.9, 1.95)));
        const st = liftRef.current;
        orbitA += dt * (0.22 + st.p * 2.1);
        const R = Math.min(W * 0.36, 520) * (1 + st.p * 0.22);
        orbit.forEach((el, i) => {
          const a = orbitA + (i / orbit.length) * Math.PI * 2;
          const depth = (Math.sin(a) + 1) / 2;
          tf(el, T(Math.cos(a) * R, Math.sin(a) * R * 0.34 - st.p * H * 0.1, 0.72 + depth * 0.4));
          op(el, 0.35 + depth * 0.65);
          const z = depth > 0.5 ? '3' : '1';
          if (el.$z !== z) { el.style.zIndex = z; el.$z = z; }
        });
        tf($['lift.lines'], `rotate(${(orbitA * 34 * (1 + st.p)).toFixed(2)}deg) scale(${(1 + st.p * 0.18).toFixed(3)})`);
        tf($['lift.walker'], T(0, Math.sin(clock * 1.8) * 10 - st.p * H * 0.14, 1 + st.p * 0.1, -st.p * 14));
        $['lift.slab'].style.setProperty('--p', st.p.toFixed(4));
      },

      record(t) {
        tf($['record.ground'], T(0, Math.max(0, 0.9 - t) * H));
        recs.forEach((el, i) => {
          const d = t - 1.3;
          const settle = 1 - io(seg(Math.abs(d), 0, 0.9));
          tf(el, T(0, -d * H * REC_SPEED[i], 1, REC_TILT[i] * Math.min(1, Math.abs(d) * 1.4) * Math.sign(d || 1)));
          cls(el, 'is-set', settle > 0.92);
        });
        fl('record.c1', t, 1.1, 0.7);
      },

      back(t) {
        const k = io(seg(t, 0.9, 1.5));
        const ix = gut * (1 - k); const it = H * 0.11 * (1 - k); const ib = H * 0.07 * (1 - k);
        const p = $['back.panel'];
        tf(p, T(0, Math.max(0, 0.9 - t) * H));
        cp(p, it, ix, ib, ix, 26 * (1 - k));
        tf($['back.title'], T(0, -(t - 1.3) * H * 0.16));
        tf($['back.town'], T(0, (1 - out(seg(t, 0, 1.2))) * H * 0.1));
        const lot = $['back.lot'];
        const lx = lot.offsetLeft + lot.offsetWidth * 0.35;
        const w = io(seg(t, 1.0, 2.15));
        const wx = mix(-W * 0.12, lx, w);
        tf($['back.walker'], T(wx, Math.abs(Math.sin(t * 16)) * -6 * (w < 1 ? 1 : 0), 1, Math.sin(t * 16) * 3 * (w < 1 ? 1 : 0)));
        cls(lot, 'is-on', w > 0.97);
        fl('back.c1', t, 1.45, 0.6);
        fl('back.c2', t, 1.95, 0.6);
      },

      ask(t) {
        tf($['ask.slab'], T(0, Math.max(0, 0.9 - t) * H));
        askDrips.forEach((el, i) => tf(el, `scaleY(${mix(0.15, 1, out(seg(t, 0.3 + (i % 5) * 0.06, 1.1 + (i % 3) * 0.1))).toFixed(4)})`));
        const leave = Math.max(0, t - 1.15) * H;
        tf($['ask.l1'], T(0, -t * H * 0.08 - leave * 1.05));
        tf($['ask.l2'], T(0, -t * H * 0.16 - leave * 1.2));
        tf($['ask.orn'], T(0, -t * H * 0.12 - leave * 1.1, 1, t * 40));
      },

      poster(t) {
        fl('poster.card', t, 1.0, 1);
        fl('poster.obj', t, 0.85, 1.5, 0, 1, (t - 1) * 30);
        const side = seg(t, 0.35, 0.8) * (1 - seg(t, 1.5, 1.9));
        ['poster.l', 'poster.r'].forEach((key) => { op($[key], side); tf($[key], T(0, -(t - 1) * H * 0.25)); });
      },

      reel(t) {
        tf($['reel.ground'], T(0, Math.max(0, 0.9 - t) * H));
        tf($['reel.card'], T(0, Math.max(0, 0.9 - t) * H * 1.25 + Math.sin(clock * 1.1) * 6));
        tf($['reel.word'], T(0, Math.max(0, 0.9 - t) * H * 0.7));
      },
    };

    const fill = $['sx.fill'];
    let last = '';
    let lastTime = performance.now();

    const frame = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now; clock += dt;

      // Holds run on time, not scroll.
      const lift = liftRef.current;
      lift.p = cl(lift.p + (lift.hold ? dt / 1.1 : -dt / 1.6));

      const top = trackRef.current.offsetTop;
      const s = cl((window.scrollY - top) / H, 0, TOTAL - 1);
      const ambient = SCENES.some((sc) => (sc.id === 'lift' || sc.id === 'crew' || sc.id === 'reel') && s - sc.at > -1.1 && s - sc.at < sc.len + 1.1);
      const key = `${s.toFixed(4)}|${W}|${H}`;
      if (key === last && !ambient) return;
      last = key;

      tf(fill, `scaleY(${(s / (TOTAL - 1)).toFixed(4)})`);
      SCENES.forEach((sc, i) => {
        const t = s - sc.at;
        const live = t > -1.1 && t < sc.len + 1.1;
        vis(roots[i], live);
        if (!live) return;
        U[sc.id](t, dt);
        caps[i].forEach((c) => cls(c.el, 'is-on', t >= c.on && t < c.off));
      });
    };

    if (flat) {
      // Reduced motion: each scene is drawn once, at the moment it is
      // most itself, and the scenes are read top to bottom.
      const REST = { open: 0.3, climb: 1.9, near: 1.2, crew: 1.6, ring: 1.2, drip: 0, hall: 3.9, lift: 1.3, record: 1.5, back: 2.3, ask: 1.0, poster: 1.0, reel: 1.6 };
      crewRef.current.n = CREW.length; crewRef.current.done = true; setCrewDone(true);
      const draw = () => {
        measure();
        SCENES.forEach((sc, i) => {
          if (sc.id === 'drip') return;
          vis(roots[i], true);
          U[sc.id](REST[sc.id], 0);
          caps[i].forEach((c) => cls(c.el, 'is-on', true));
        });
      };
      draw();
      window.addEventListener('resize', draw);
      return () => window.removeEventListener('resize', draw);
    }

    const ro = new ResizeObserver(() => { measure(); last = ''; });
    ro.observe(stage);
    gsap.ticker.add(frame);
    frame();
    return () => {
      gsap.ticker.remove(frame);
      ro.disconnect();
    };
  }, [flat]);

  const hold = (ref) => (on) => { ref.current.hold = on; };
  // A whole slab you can press and hold anywhere. Touch keeps vertical
  // scrolling: a swipe cancels the pointer, which releases the hold.
  const holdArea = (ref) => ({
    onPointerDown: (e) => {
      if (e.target.closest('a')) return;
      if (e.pointerType === 'mouse') e.currentTarget.setPointerCapture?.(e.pointerId);
      const r = e.currentTarget.getBoundingClientRect();
      ref.current.px = e.clientX - r.left; ref.current.py = e.clientY - r.top;
      ref.current.hold = true;
    },
    onPointerUp: () => { ref.current.hold = false; },
    onPointerCancel: () => { ref.current.hold = false; },
    onPointerMove: (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      ref.current.px = e.clientX - r.left; ref.current.py = e.clientY - r.top;
    },
    onContextMenu: (e) => e.preventDefault(),
  });

  const jump = (at) => {
    const y = trackRef.current.offsetTop + at * stageRef.current.clientHeight;
    if (window.lenis) window.lenis.scrollTo(y, { duration: 2.2 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const p = PROJECTS[reel];
  const step = (d) => setReel((r) => (r + d + PROJECTS.length) % PROJECTS.length);

  return (
    <div className={`sx${flat ? ' is-flat' : ''}`} ref={rootRef}>
      <div className="sx-track" ref={trackRef} style={{ '--total': TOTAL }}>
        <div className="sx-stage" ref={stageRef}>

          {/* ---------------- open ---------------- */}
          <section className="sx-scene" data-scene="open" data-acc="yellow" aria-label="Opening">
            <div className="sx-full sx-pnl-ink" data-k="open.panel" data-surface="ink">
              <p className="sx-op-kick" data-k="open.kick">Ajinkya Chavan · the whole reel</p>
              <h1 className="display sx-op-title" data-k="open.title">
                <span>Things</span>
                <span>I <Glyph kind="ship" acc="yellow" /> build.</span>
                <small>Agents, retrieval and the products around them, panel by panel.</small>
              </h1>
              <Town k="open.town" />
              <div className="sx-op-walk" data-k="open.walker"><Walker /></div>
              <p className="sx-op-hint" data-k="open.hint"><span className="sx-hint-track" aria-hidden="true"><i /></span>Scroll</p>
            </div>

            <div className="sx-pnl sx-op-in1" data-k="open.in1" aria-hidden="true">
              <Walker className="sx-op-in1-tok" />
              <p><strong className="display">Ajinkya Chavan</strong><span>AI/ML engineer · Pune</span></p>
            </div>
            <div className="sx-pnl sx-op-in2" data-k="open.in2" data-surface="ink" aria-hidden="true">
              <code><b>$</b> git push origin main</code>
              <code><i>→</i> build passed</code>
              <code><i>→</i> deployed</code>
            </div>
            <Cap k="open.c1" on={0.75} className="sx-op-c1">Somewhere between a lecture hall in Pune and a production server, a small round mark goes looking for hard problems.</Cap>
            <Cap k="open.c2" on={1.15} className="sx-op-c2">It belongs to Ajinkya. He builds agents, retrieval and the interfaces around them.</Cap>

            <div className="sx-lines sx-op-lines" data-k="open.lines" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--a': `${i * 30 + 8}deg`, '--l': `${0.7 + (i % 3) * 0.35}` }} />)}
            </div>
            <div className="sx-pnl sx-op-face" data-k="open.face" aria-hidden="true">
              <div className="sx-pf-sun" data-k="open.pfSun" />
              <div className="sx-pf-city" data-k="open.pfCity">
                {[46, 72, 38, 88, 56, 64, 30].map((h, i) => <i key={i} style={{ '--h': `${h}%` }} />)}
              </div>
              <div className="sx-pf-desk">
                <div className="sx-pf-screen" data-surface="ink">
                  <code><b>&gt;</b> when did it ship?</code>
                  <span className="sx-pf-type" />
                  <span className="sx-flip"><em>no source</em><em>cited, 2 docs</em></span>
                </div>
                <Walker className="sx-pf-me" />
              </div>
              <p className="sx-pf-say display" data-k="open.pfSay">Says who?</p>
            </div>
            <Cap k="open.c3" on={1.95} className="sx-op-c3">First lesson: a model is easy to call and hard to trust.</Cap>
            <Cap k="open.c4" on={2.4} className="sx-op-c4">So everything he builds checks its own work before anyone else has to.</Cap>
          </section>

          {/* ---------------- climb ---------------- */}
          <section className="sx-scene" data-scene="climb" data-acc="blue" aria-label="Agents in production">
            <div className="sx-full sx-pnl-paper" data-k="climb.panel">
              <div className="sx-full sx-climb-world" data-k="climb.world">
                <div className="sx-sun" data-k="climb.sun" />
                {STEPS.map((n, i) => (
                  <div key={n} className={`sx-step${i === STEPS.length - 1 ? ' sx-step--top' : ''}`} style={{ left: `${STEP_X(i) * 100}%`, top: `${STEP_TOP(i) * 100}%`, width: `${STEP_W * 100}%` }}>
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <strong className="display">{n}</strong>
                  </div>
                ))}
                <div className="sx-say" data-k="climb.say" aria-hidden="true">
                  <span className="sx-say-bad">Row count is off.</span>
                  <span className="sx-say-fix">Back to the SQL. Retry.</span>
                </div>
                <div className="sx-climb-walk" data-k="climb.walker"><Walker /></div>
              </div>
              <Cap k="climb.c1" on={1.05} className="sx-cl-c1">Two agent systems run in production at Emerson. This one writes the PMO’s reports.</Cap>
              <Cap k="climb.c2" on={1.75} className="sx-cl-c2">When a check fails, the run loops back and fixes it in the same pass. Nothing is thrown away.</Cap>
            </div>
            <div className="sx-pnl sx-cl-in" data-k="climb.in" data-surface="ink" aria-hidden="true">
              <code><i>✕</i> validate · row count off</code>
              <code><i>↺</i> retry · SQL agent</code>
              <code><b>✓</b> validate · report out</code>
            </div>
          </section>

          {/* ---------------- near ---------------- */}
          <section className="sx-scene" data-scene="near" data-acc="blue" aria-label="Plain-language planning">
            <div className="sx-pnl sx-near" data-k="near.plane">
              <header className="sx-near-head">
                <Glyph kind="chat" acc="blue" />
                <span>S&amp;OP Agent</span>
                <em>Sales &amp; Operations Planning</em>
              </header>
              <p className="sx-near-q">Where will we fall short of plan next quarter, and why?</p>
              <ol className="sx-sop">
                {SOP.map((n) => <li key={n} className="sx-sop-s">{n}</li>)}
              </ol>
              <div className="sx-near-a" data-k="near.answer">
                <span className="sx-near-bar"><i /></span>
                <p>Answer streaming over server-sent events, with the forecast benchmarked: <b>TimeGPT</b> against <b>SARIMA</b>.</p>
              </div>
            </div>
            <Cap k="near.c1" on={0.6} className="sx-nr-c1">Planners used to hand-write SQL for the same questions every week.</Cap>
            <Cap k="near.c2" on={1.15} className="sx-nr-c2">Now they ask in plain words. The query is checked at its syntax tree before it can touch the database.</Cap>
          </section>

          {/* ---------------- crew ---------------- */}
          <section className="sx-scene" data-scene="crew" data-acc="lime" aria-label="Swarm, a crew of agents">
            <div className="sx-full sx-crew" data-k="crew.slab" {...holdArea(crewRef)}>
              <Cap k="crew.c1" on={0.75} className="sx-cr-c1">Swarm is a crew of four agents that fixes flaky tests. Hold, and carry the work to each of them in order.</Cap>
              <div className="sx-grain" aria-hidden="true">
                {Array.from({ length: 26 }, (_, i) => <i key={i} style={{ left: `${(i * 3.9 + ((i * 7) % 5)) % 100}%`, '--w': `${1 + (i % 4)}px`, '--o': 0.12 + (i % 3) * 0.06 }} />)}
              </div>
              {CREW.map((a, i) => (
                <div key={a.n} className="sx-pnl sx-agent" style={{ left: `${CREW_AT[i].x * 100}%`, top: `${CREW_AT[i].y * 100}%` }}>
                  <header>
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <strong className="display">{a.n}</strong>
                    <span className="sx-agent-ok" aria-hidden="true"><Glyph kind="check" acc="lime" /></span>
                    <span className="sx-agent-tag" aria-hidden="true">Hold here</span>
                  </header>
                  <div className={`sx-mini sx-mini--${i}`} aria-hidden="true">
                    {i === 0 && ['test_login', 'test_cart', 'test_sync'].map((n, j) => (
                      <p key={n}><span>{n}</span><b className={j === 1 ? 'is-pass' : 'is-flip'}>{j === 1 ? 'passes' : <><em>fails</em><em>flaky</em></>}</b></p>
                    ))}
                    {i === 1 && [62, 84, 40, 72, 55].map((w, j) => <i key={j} style={{ '--w': `${w}%`, '--d': `${j * 0.35}s`, '--x': `${(j % 3) * 8}%` }} />)}
                    {i === 2 && <><b className="sx-flip"><em>fails</em><em>passes</em></b><span>before the fix · after</span></>}
                    {i === 3 && <>{[['-', 70], ['+', 82], ['+', 54], ['-', 40]].map(([m, w], j) => <p key={j} className={m === '+' ? 'is-add' : 'is-del'}><span>{m}</span><i style={{ width: `${w}%` }} /></p>)}<b className="sx-stamp">Approved</b></>}
                  </div>
                  <p>{a.c}</p>
                </div>
              ))}
              <div className="sx-crew-hand" data-k="crew.hand"><Walker /></div>
              <div className="sx-crew-disc" data-k="crew.disc" aria-hidden="true"><span data-k="crew.discT">{'Hold &\nmove'}</span></div>
              <div className={`sx-crew-end${crewDone ? ' is-on' : ''}`}>
                <p>Pull request opened. Waiting for a human.</p>
                <span className="sx-merge"><Glyph kind="lock" acc="lime" />Merge</span>
              </div>
            </div>
          </section>

          {/* ---------------- ring ---------------- */}
          <section className="sx-scene" data-scene="ring" data-acc="yellow" aria-label="Retrieval that admits doubt">
            <div className="sx-pnl sx-rg-main" data-k="ring.main">
              <header className="sx-rg-q">
                <Walker className="sx-rg-me" />
                <p className="sx-bubble">Risk profile for project 7Q? <em>Nothing like it has been built here before.</em></p>
              </header>
              <div className="sx-shelf">
                {SHELF.map(([n, sc]) => (
                  <div key={n} className="sx-shelf-card">
                    <strong>{n}</strong>
                    <i /><i />
                    <b>{sc}</b>
                  </div>
                ))}
                <span className="sx-lens" data-k="ring.lens" aria-hidden="true" />
              </div>
            </div>
            <div className="sx-pnl sx-rg-gauge" data-k="ring.gauge" aria-hidden="true">
              <svg viewBox="0 0 200 116">
                <path d="M20 100 A80 80 0 0 1 180 100" className="sx-g-bg" />
                <path d={`M${arcAt(0.7).join(' ')} A80 80 0 0 1 180 100`} className="sx-g-ok" />
                <g data-k="ring.needle" className="sx-g-needle"><line x1="100" y1="100" x2="100" y2="34" /><circle cx="100" cy="100" r="8" /></g>
              </svg>
              <p><span>Best match <b>0.34</b></span><span>Needs <b>0.70</b></span></p>
            </div>
            <div className="sx-rg-say" data-k="ring.say">
              <Walker className="sx-rg-say-me" />
              <span className="display">I don’t know.</span>
            </div>
            <Cap k="ring.c1" on={0.45} className="sx-rg-c1">Retrieval that knows when it doesn’t know.</Cap>
            <Cap k="ring.c2" on={1.05} className="sx-rg-c2">The construction-risk predictor declines on a project it has never seen, rather than inventing a plausible risk profile. For a safety tool, that is the only acceptable failure.</Cap>
          </section>

          {/* ---------------- drip ---------------- */}
          <section className="sx-scene" data-scene="drip" aria-hidden="true">
            <div className="sx-drip">
              {DRIPS.map((d, i) => <i key={i} style={{ '--w': d.w }} />)}
            </div>
            <div className="sx-full sx-drip-fill" data-k="drip.fill" />
          </section>

          {/* ---------------- hall ---------------- */}
          <section className="sx-scene" data-scene="hall" data-acc="violet" data-surface="ink" aria-label="The stack">
            <div className="sx-full sx-hall-bg" data-k="hall.bg" />
            {COLS.flatMap((c) => [0, 1].map((side) => (
              <div key={`${c.t}${side}`} className="sx-col" aria-hidden="true">
                <span>{side ? c.i : c.t}</span>
              </div>
            )))}
            <div className="sx-plinth" data-k="hall.plinth">
              <div className="sx-caps">
                {CAPSULES.map((c) => (
                  <div key={c.t} className="sx-capsule" data-cursor="hot">
                    <Glyph kind={c.g} acc="violet" />
                    <strong className="display">{c.t}</strong>
                    <ul>{c.i.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                ))}
              </div>
              <div className="sx-plinth-top" />
            </div>
            <div className="sx-pnl sx-strip" data-k="hall.strip" aria-hidden="true">
              <div className="display sx-strip-t" data-k="hall.stripText">Pick the tool the problem is shaped like.</div>
            </div>
            <div className="sx-hall-walk" data-k="hall.walker"><Walker /></div>
            <Cap k="hall.c1" on={0.4} off={2.2} className="sx-ha-c1">Everything he builds stands on five things: languages, GenAI and ML, the web, the cloud and the tooling.</Cap>
            <Cap k="hall.c2" on={3.15} className="sx-ha-c2">Three of them carry most of the weight.</Cap>
          </section>

          {/* ---------------- lift ---------------- */}
          <section className="sx-scene" data-scene="lift" data-acc="pink" data-surface="ink" aria-label="The whole stack">
            <div className="sx-full sx-lift" data-k="lift.slab">
              <div className="sx-lift-lines" data-k="lift.lines" aria-hidden="true">
                {Array.from({ length: 16 }, (_, i) => <i key={i} style={{ '--a': `${i * 22.5}deg`, '--r': `${30 + (i % 4) * 9}%`, '--l': `${10 + (i % 3) * 6}%` }} />)}
              </div>
              <div className="sx-orbit" aria-hidden="true">
                {ORBIT.map((w) => <span key={w} className="sx-orb">{w}</span>)}
                <div className="sx-lift-walk" data-k="lift.walker"><Walker /></div>
              </div>
              <Cap k="lift.c1" on={0.65} className="sx-lf-c1">Give it a hard problem and the whole stack lifts at once.</Cap>
              <Cap k="lift.c2" on={1.05} className="sx-lf-c2">Python to Azure, LangGraph to React: one person, the full height of the stack.</Cap>
              <HoldButton k="lift.hold" label="Hold to lift" onHold={hold(liftRef)} />
            </div>
          </section>

          {/* ---------------- record ---------------- */}
          <section className="sx-scene" data-scene="record" data-acc="teal" aria-label="On the record">
            <div className="sx-full sx-rec-ground" data-k="record.ground" />
            <div className="sx-rec-row">
              {RECORDS.map((r) => (
                <div key={r.big} className="sx-rec">
                  <div className="sx-rec-card">
                    <span className="sx-rec-t">{r.t}</span>
                    <strong className="display">{r.big}</strong>
                    <p>{r.c}</p>
                  </div>
                </div>
              ))}
            </div>
            <Cap k="record.c1" on={0.7} off={2.1} className="sx-rc-c1">On the record, too. Kept while building on the side.</Cap>
          </section>

          {/* ---------------- back ---------------- */}
          <section className="sx-scene" data-scene="back" data-acc="yellow" aria-label="What comes next">
            <div className="sx-full sx-pnl-ink" data-k="back.panel" data-surface="ink">
              <h2 className="display sx-op-title sx-back-title" data-k="back.title">
                <span>Things</span>
                <span>I’ll <Glyph kind="spark" acc="yellow" /> build next.</span>
              </h2>
              <Town k="back.town" lot names />
              <div className="sx-back-walk" data-k="back.walker"><Walker /></div>
              <Cap k="back.c1" on={1.2} className="sx-bk-c1">Seven builds stand on the street so far.</Cap>
              <Cap k="back.c2" on={1.85} className="sx-bk-c2">There is an empty lot at the end of it.</Cap>
            </div>
          </section>

          {/* ---------------- ask ---------------- */}
          <section className="sx-scene" data-scene="ask" data-acc="yellow" aria-label="An invitation">
            <div className="sx-full sx-ask" data-k="ask.slab">
              <div className="sx-ask-drips" aria-hidden="true">
                {DRIPS.map((d, i) => <i key={i} style={{ '--w': d.w }} />)}
              </div>
              <h2 className="display sx-ask-t">
                <span data-k="ask.l1">Bring the</span>
                <span className="sx-ask-orn" data-k="ask.orn" aria-hidden="true"><Glyph kind="spark" acc="yellow" /></span>
                <span data-k="ask.l2">hard problem.</span>
              </h2>
            </div>
          </section>

          {/* ---------------- poster ---------------- */}
          <section className="sx-scene" data-scene="poster" data-acc="yellow" aria-label="What I make">
            <p className="sx-side sx-side--l" data-k="poster.l"><b>Open to work</b><span>Internships and full-time</span><i /></p>
            <p className="sx-side sx-side--r" data-k="poster.r"><i /><b>Graduating 2027</b><span>Pune, India</span></p>
            <article className="sx-poster" data-k="poster.card">
              <header><span>Ajinkya Chavan</span><span>Agents · retrieval · products</span><span>2023 — now</span></header>
              <p className="display sx-poster-t">
                Agents that check their work. Retrieval that admits doubt. Interfaces that ship whole.
                What gets built next is up to you.
              </p>
              <footer>
                <Glyph kind="mark" acc="yellow" />
                <TransitionLink to="/#contact" title="Contact" kicker="Ajinkya Chavan · Portfolio" className="sx-poster-go" data-cursor="hot">Say hello</TransitionLink>
              </footer>
            </article>
            <div className="sx-poster-obj" data-k="poster.obj"><Walker /></div>
          </section>

          {/* ---------------- reel ---------------- */}
          <section className="sx-scene" data-scene="reel" data-acc={p.acc} aria-label="The builds">
            <div className="sx-full sx-reel" data-k="reel.ground">
              <div className="sx-reel-word display" data-k="reel.word" aria-hidden="true">
                <span key={p.id}>{p.title.split(' ')[0]}</span>
              </div>
              <div className="sx-reel-side sx-reel-side--l">
                <span className="num">{p.n} / {String(PROJECTS.length).padStart(2, '0')}</span>
                <b>{p.kind}</b>
                <span>{p.meta}</span>
              </div>
              <div className="sx-reel-side sx-reel-side--r">
                {p.tech.slice(0, 4).map((x) => <span key={x}>{x}</span>)}
              </div>
              <figure className="sx-reel-card" data-k="reel.card">
                <img key={p.id} src={p.img} alt={`${p.title}, screenshot`} loading="lazy" decoding="async" />
                <figcaption><strong className="display">{p.title}</strong><span>{p.desc}</span></figcaption>
              </figure>
              <div className="sx-reel-nav">
                <button type="button" onClick={() => step(-1)} aria-label="Previous build" data-cursor="hot">
                  <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M8 2 L4 6 L8 10" /></svg>
                </button>
                <TransitionLink to="/lab" title="The workshop" kicker="Seven builds, one map" className="sx-reel-go" data-cursor="hot">Walk the workshop</TransitionLink>
                <button type="button" onClick={() => step(1)} aria-label="Next build" data-cursor="hot">
                  <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2 L8 6 L4 10" /></svg>
                </button>
              </div>
            </div>
          </section>

          {/* Where you are, and a way to jump. */}
          <nav className="sx-rail" aria-label="Chapters">
            <span className="sx-rail-track"><i data-k="sx.fill" /></span>
            {SCENES.filter((sc) => sc.label).map((sc) => (
              <button key={sc.id} type="button" className="sx-rail-b" data-acc={sc.acc} style={{ top: `${(sc.at / (TOTAL - 1)) * 100}%` }} onClick={() => jump(sc.at + (sc.id === 'open' ? 0 : 1))} data-cursor="hot">
                <span>{sc.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <section className="sx-end" data-acc="pink">
        <p className="sx-side sx-side--l is-static"><b>The workshop</b><span>Seven builds, one map</span><i /></p>
        <div className="sx-end-mid">
          <Glyph kind="stack" acc="pink" />
          <h2 className="display">More builds<br />forthcoming.</h2>
          <div className="sx-end-row">
            <TransitionLink to="/lab" title="The workshop" kicker="Seven builds, one map" className="sx-end-go" data-cursor="hot">Open the workshop</TransitionLink>
            <TransitionLink to="/" title="Home" kicker="Ajinkya Chavan · Portfolio" className="sx-end-alt" data-cursor="hot">Back to the start</TransitionLink>
          </div>
        </div>
        <p className="sx-side sx-side--r is-static"><i /><b>Emerson</b><span>Two agent graphs</span></p>
      </section>

      <style>{STYLE}</style>
    </div>
  );
};

const STYLE = `
  .sx-track { position: relative; height: calc(var(--total) * 100svh); }
  .sx-stage {
    position: sticky; top: 0;
    height: 100svh; overflow: hidden;
    background: var(--paper);
    contain: strict;
  }
  .sx-scene { position: absolute; inset: 0; pointer-events: none; isolation: isolate; }
  /* Ink scenes paint their own ground, so they never show before they arrive. */
  .sx-scene[data-surface="ink"] { background: transparent; }
  .sx-scene * { pointer-events: none; }
  .sx-scene :is(button, a, .sx-capsule) { pointer-events: auto; }
  .sx-full { position: absolute; inset: 0; }
  [data-k] { will-change: transform; }

  /* Panels: the comic frame, in the site's own surface language. */
  .sx-pnl {
    position: absolute;
    border-radius: var(--r-m);
    overflow: hidden;
    background: var(--paper);
    box-shadow: 0 0 0 2px var(--ink), var(--ao-2);
  }
  .sx-pnl-ink { background: var(--paper); color: var(--ink); overflow: hidden; }
  .sx-pnl-paper { background: var(--paper-2); overflow: hidden; }

  /* Captions draw themselves open from the left, then the words rise. */
  .sx-cap {
    position: absolute; z-index: 6;
    max-width: min(24rem, 78vw);
    margin: 0; padding: 0.85rem 1.05rem;
    border-radius: var(--r-s);
    background: var(--paper); color: var(--ink);
    box-shadow: 0 0 0 2px var(--ink), var(--ao-2);
    font-size: var(--step--1); font-weight: 560; line-height: 1.42;
    clip-path: inset(0 100% 0 0 round var(--r-s));
    transition: clip-path 0.75s var(--ease-out);
  }
  .sx-cap > span { display: block; opacity: 0; translate: 0 0.5em; transition: opacity 0.45s, translate 0.6s var(--ease-out); }
  .sx-cap.is-on { clip-path: inset(-60px -60px -60px -60px round var(--r-s)); }
  .sx-cap.is-on > span { opacity: 1; translate: 0 0; transition-delay: 0.22s; }
  [data-surface="ink"] .sx-cap { --paper: #FFFFFF; --ink: #0E0E0D; }

  /* The token. */
  .sx-walker { position: absolute; left: 0; top: 0; font-size: clamp(56px, 9vh, 96px); }
  .sx-tok {
    position: relative; display: grid; place-items: center;
    width: 1em; height: 1em; border-radius: 50%;
    background: var(--acc);
    box-shadow: 0 0 0 0.035em #0E0E0D, var(--ao-2);
  }
  .sx-tok b {
    font-family: var(--font-display); font-weight: 800; font-size: 0.62em;
    line-height: 1; letter-spacing: -0.06em; color: var(--acc-ink);
    translate: -0.06em -0.08em;
  }
  .sx-tok i { position: absolute; left: 0.66em; top: 0.6em; width: 0.11em; height: 0.11em; border-radius: 50%; background: #0E0E0D; }

  /* The street. */
  .sx-town {
    position: absolute; left: 4%; right: 4%; bottom: 0; height: 36%;
    display: flex; align-items: flex-end; gap: 1.6%;
    border-bottom: 2px solid var(--ink-3);
  }
  .sx-bld {
    position: relative; flex: 1 1 0; min-width: 0; height: var(--h);
    border-radius: 10px 10px 0 0;
    background: var(--paper-3);
    overflow: hidden;
    padding: clamp(6px, 1.4vw, 20px) clamp(5px, 1.4vw, 20px) 0;
  }
  .sx-bld-win { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(3px, 0.5vw, 7px); }
  .sx-bld-win i { display: block; width: 100%; height: auto; aspect-ratio: 1; border-radius: 2px; background: var(--paper-2); }
  .sx-bld-win i.is-lit { background: var(--acc); }
  .sx-bld-n { position: absolute; left: 0; right: 0; bottom: calc(100% + 0.5rem); text-align: center; font-size: var(--step--2); font-weight: 600; color: var(--ink-2); }

  /* ---- open ---- */
  .sx-op-kick { position: absolute; left: 0; right: 0; top: 16%; margin: 0; text-align: center; font-weight: 600; font-size: var(--step--1); color: var(--ink-2); }
  .sx-op-title {
    position: absolute; left: 0; right: 0; top: 21%;
    margin: 0; display: grid; justify-items: center; text-align: center;
    font-size: clamp(3.6rem, 13vw, 12.5rem); font-weight: 800;
    line-height: 0.84; letter-spacing: -0.06em;
  }
  .sx-op-title .glyph { font-size: 0.8em; }
  .sx-op-title small {
    margin-top: 1.6rem; max-width: 26ch;
    font-family: var(--font-body); font-size: var(--step-0); font-weight: 500;
    letter-spacing: 0; line-height: 1.4; color: var(--ink-2);
  }
  .sx-op-walk { position: absolute; left: 50%; bottom: 6%; }
  .sx-op-walk .sx-walker { position: relative; }
  .sx-op-hint { position: absolute; left: 50%; bottom: 3.5%; translate: -50% 0; margin: 0; display: flex; align-items: center; gap: 0.6rem; color: var(--ink-2); font-size: var(--step--1); font-weight: 600; z-index: 2; }
  .sx-hint-track { position: relative; width: 4px; height: 1.6rem; border-radius: 4px; background: var(--line); overflow: hidden; }
  .sx-hint-track i { position: absolute; left: 0; top: 0; width: 100%; height: 40%; border-radius: 4px; background: var(--acc); animation: sx-hint 1.6s var(--ease-in-out) infinite; }
  @keyframes sx-hint { from { transform: translateY(-100%); } to { transform: translateY(260%); } }

  .sx-op-in1 { left: 2%; top: 56%; width: min(22rem, 46vw); background: var(--paper-2); }
  .sx-op-in1 { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.2rem; }
  .sx-op-in1 .sx-walker { position: relative; font-size: clamp(48px, 7vh, 72px); flex: none; }
  .sx-op-in1 p { margin: 0; display: grid; gap: 0.2rem; }
  .sx-op-in1 strong { font-size: var(--step-1); letter-spacing: -0.04em; line-height: 1; }
  .sx-op-in1 span { font-size: var(--step--1); color: var(--ink-2); font-weight: 550; }
  .sx-op-in2 {
    right: 2.5%; top: 63%; width: min(19rem, 44vw);
    display: grid; gap: 0.35rem; padding: 1rem 1.1rem;
    background: var(--paper); color: var(--ink);
  }
  .sx-pnl code, .sx-cl-in code { font-family: var(--font-mono); font-size: var(--step--1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sx-pnl code b { color: var(--acc); font-weight: 600; }
  .sx-pnl code i { font-style: normal; color: var(--ink-3); }
  .sx-op-c1 { left: 7%; top: 22%; }
  .sx-op-c2 { right: 7%; top: 36%; }
  .sx-op-face {
    left: 50%; top: 50%; translate: -50% -50%;
    width: min(26rem, 64vw); height: min(40rem, 70vh);
    background: var(--paper-2);
  }
  .sx-op-face { overflow: hidden; padding: 0; }
  .sx-pf-sun { position: absolute; right: 10%; top: 9%; width: 44%; aspect-ratio: 1; border-radius: 50%; background: var(--acc); }
  .sx-pf-city { position: absolute; left: -3%; right: -3%; bottom: 30%; height: 44%; display: flex; align-items: flex-end; gap: 5px; }
  .sx-pf-city i { position: relative; flex: 1 1 0; height: var(--h); background: var(--paper-3); border-radius: 5px 5px 0 0; box-shadow: inset 0 0 0 1.5px var(--line); }
  .sx-pf-city i::before, .sx-pf-city i::after { content: ''; position: absolute; left: 28%; width: 22%; aspect-ratio: 1; border-radius: 2px; background: var(--ink); opacity: 0.18; }
  .sx-pf-city i::before { top: 14%; }
  .sx-pf-city i::after { top: 34%; left: 58%; }
  .sx-pf-city i:nth-child(2n)::after, .sx-pf-city i:nth-child(3n)::before { background: var(--acc); opacity: 1; }
  .sx-pf-desk { position: absolute; left: 0; right: 0; bottom: 0; height: 31%; background: var(--paper); box-shadow: 0 -2px 0 var(--ink); }
  .sx-pf-screen {
    position: absolute; left: 7%; bottom: calc(100% - 0.6rem); width: 58%;
    display: grid; gap: 0.45rem; padding: 0.75rem 0.8rem 0.9rem;
    border-radius: var(--r-s); background: var(--paper); color: var(--ink); box-shadow: var(--ao-2);
    font-family: var(--font-mono); font-size: clamp(0.58rem, 1.1vw, 0.74rem);
  }
  .sx-pf-screen code { font-size: inherit; }
  .sx-pf-type { display: block; height: 0.45rem; width: 86%; border-radius: 4px; background: var(--ink-3); transform-origin: 0 50%; animation: sx-type 3.2s infinite both; }
  .sx-pf-screen .sx-flip { position: relative; display: inline-grid; justify-self: start; font-weight: 600; }
  .sx-pf-screen .sx-flip em { grid-area: 1 / 1; font-style: normal; padding: 0.12rem 0.5rem; border-radius: var(--r-pill); white-space: nowrap; }
  .sx-pf-screen .sx-flip em:first-child { background: var(--ink); color: var(--paper); }
  .sx-pf-screen .sx-flip em:last-child { color: var(--acc-ink); }
  .sx-pf-me { position: absolute; right: 9%; bottom: 62%; font-size: min(6.5rem, 15vw, 11vh); animation: sx-bob 2.6s var(--ease-in-out) infinite; }
  @keyframes sx-bob { 50% { translate: 0 -0.08em; rotate: -6deg; } }
  .sx-pf-say {
    position: absolute; right: 7%; top: 40%; margin: 0; z-index: 2;
    padding: 0.5rem 0.9rem; border-radius: var(--r-m);
    background: #FFFFFF; color: #0E0E0D; box-shadow: 0 0 0 2px #0E0E0D, var(--ao-2);
    font-size: clamp(1rem, 2vw, 1.5rem); font-weight: 750; letter-spacing: -0.03em;
  }
  .sx-pf-say::after { content: ''; position: absolute; right: 22%; top: 100%; width: 0.7rem; height: 0.7rem; translate: 0 -50%; rotate: 45deg; background: #FFFFFF; box-shadow: 2px 2px 0 #0E0E0D; }
  .sx-op-c3 { left: 6%; top: 40%; max-width: min(18rem, 70vw); }
  .sx-op-c4 { right: 6%; top: 66%; max-width: min(18rem, 70vw); }

  /* Speed lines: short ink strokes pointing at whatever they surround. */
  .sx-lines { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }
  .sx-lines i {
    position: absolute; left: 0; top: 0;
    width: calc(3rem * var(--l)); height: 3px; border-radius: 3px;
    background: var(--ink);
    transform: rotate(var(--a)) translateX(min(36vw, 26rem));
    transform-origin: 0 50%;
  }

  /* ---- climb ---- */
  .sx-climb-world { transform-origin: 50% 100%; }
  .sx-sun {
    position: absolute; left: 70%; top: 26%;
    width: min(50vh, 40vw); aspect-ratio: 1; translate: -50% -50%;
    border-radius: 50%;
    background: var(--paper-3);
    transition: background 0.8s var(--ease-out);
  }
  .sx-sun.is-on { background: var(--acc); }
  .sx-step {
    position: absolute; bottom: 0;
    display: flex; flex-direction: column; gap: 0.25em;
    padding: clamp(0.5rem, 1.2vw, 1rem);
    border-radius: 14px 14px 0 0;
    background: var(--paper);
    box-shadow: inset 0 0 0 2px var(--ink), var(--ao-2);
    color: var(--ink-3);
    transition: background 0.4s, color 0.4s;
  }
  .sx-step .num { font-size: var(--step--1); font-weight: 600; }
  .sx-step strong { font-size: clamp(0.9rem, 1.9vw, 1.7rem); letter-spacing: -0.04em; line-height: 1; }
  .sx-step.is-on { color: var(--ink); }
  .sx-step.is-on .num { color: var(--acc); }
  .sx-step.is-bad { background: var(--ink); color: var(--paper); }
  .sx-step--top.is-on { background: var(--acc); color: var(--acc-ink); }
  .sx-step--top.is-on .num { color: var(--acc-ink); }
  .sx-climb-walk { position: absolute; left: 0; top: 0; z-index: 3; font-size: clamp(56px, 9vh, 96px); }
  .sx-climb-walk .sx-walker { position: relative; font-size: 1em; translate: -0.5em -1em; }
  .sx-say {
    position: absolute; left: 0; top: 0; z-index: 4;
    font-size: clamp(56px, 9vh, 96px);
  }
  .sx-say span {
    position: absolute; left: 0.3em; bottom: 1.2em;
    padding: 0.6rem 0.9rem; border-radius: 16px 16px 16px 4px;
    font-size: var(--step--1); font-weight: 650; white-space: nowrap;
    opacity: 0; translate: 0 8px; scale: 0.9; transform-origin: 0 100%;
    transition: opacity 0.3s, translate 0.45s var(--ease-out), scale 0.45s var(--ease-out);
  }
  .sx-say-bad { background: var(--ink); color: var(--paper); }
  .sx-say-fix { background: var(--acc); color: var(--acc-ink); box-shadow: var(--ao-2); }
  .sx-say.is-bad .sx-say-bad, .sx-say.is-fix .sx-say-fix { opacity: 1; translate: 0 0; scale: 1; }
  .sx-cl-c1 { left: 6%; top: 16%; }
  .sx-cl-c2 { right: 5%; bottom: 10%; }
  .sx-cl-in { right: 4%; top: 72%; display: grid; gap: 0.3rem; padding: 1rem 1.1rem; width: min(19rem, 60vw); }

  /* ---- near ---- */
  .sx-near {
    left: 50%; top: 50%; margin: calc(min(34rem, 72vh) / -2) 0 0 calc(min(58rem, 90vw) / -2);
    width: min(58rem, 90vw); height: min(34rem, 72vh);
    padding: clamp(1.2rem, 3vw, 2.6rem);
    display: flex; flex-direction: column; gap: clamp(0.9rem, 2.4vh, 1.6rem);
    transform-origin: 50% 100%;
    background: var(--paper);
  }
  .sx-near-head { display: flex; align-items: center; gap: 0.7rem; font-weight: 650; }
  .sx-near-head .glyph { font-size: 1.8rem; }
  .sx-near-head em { font-style: normal; color: var(--ink-3); font-weight: 500; font-size: var(--step--1); }
  .sx-near-q {
    margin: 0; align-self: flex-end; max-width: 30ch;
    padding: 0.9rem 1.15rem; border-radius: 18px 18px 6px 18px;
    background: var(--ink); color: var(--paper);
    font-family: var(--font-display); font-weight: 650; font-size: clamp(1.1rem, 2.3vw, 1.8rem); line-height: 1.1; letter-spacing: -0.03em;
  }
  .sx-sop { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.45rem; }
  .sx-sop-s {
    padding: 0.42rem 0.8rem; border-radius: var(--r-pill);
    background: var(--paper-2); color: var(--ink-3);
    font-size: var(--step--1); font-weight: 600;
    transition: background 0.35s, color 0.35s;
  }
  .sx-sop-s.is-on { background: var(--acc); color: var(--acc-ink); box-shadow: var(--ao-1); }
  .sx-near-a { margin-top: auto; display: grid; gap: 0.7rem; opacity: 0.25; transition: opacity 0.5s; }
  .sx-near-a.is-on { opacity: 1; }
  .sx-near-a p { margin: 0; color: var(--ink-2); max-width: 46ch; }
  .sx-near-bar { display: block; height: 10px; border-radius: 10px; background: var(--paper-2); box-shadow: var(--ao-in); overflow: hidden; }
  .sx-near-bar i { display: block; height: 100%; width: 0; border-radius: 10px; background: var(--acc); transition: width 1.6s var(--ease-out); }
  .sx-near-a.is-on .sx-near-bar i { width: 72%; }
  .sx-nr-c1 { left: 4%; top: 7%; }
  .sx-nr-c2 { right: 5%; top: 72%; }

  /* ---- crew ---- */
  .sx-crew { background: var(--acc); color: var(--acc-ink); --p: 0; }
  .sx-cr-c1 { left: 5%; top: 14%; }
  .sx-crew { pointer-events: auto; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: none; overflow: hidden; }
  .sx-crew .sx-tok { background: #FFFFFF; }
  .sx-crew .sx-tok b { color: #0E0E0D; }
  .sx-grain { position: absolute; inset: 0 0 -50% 0; }
  .sx-grain i { position: absolute; top: 0; bottom: 0; width: var(--w); background: #0E0E0D; opacity: var(--o); border-radius: 4px; }
  .sx-agent {
    width: min(19rem, 40vw); translate: -50% -50%; overflow: visible;
    display: grid; gap: 0.7rem;
    padding: clamp(0.8rem, 1.5vw, 1.15rem);
    background: #FFFFFF; color: #0E0E0D;
    box-shadow: 0 0 0 2px #0E0E0D, var(--ao-3);
    transition: box-shadow 0.4s;
  }
  .sx-agent header { display: flex; align-items: baseline; gap: 0.55rem; }
  .sx-agent .num { font-size: var(--step--1); font-weight: 600; color: #91918B; }
  .sx-agent strong { font-size: clamp(1.2rem, 2.2vw, 1.9rem); letter-spacing: -0.045em; line-height: 1; }
  .sx-agent > p { margin: 0; font-size: var(--step--1); line-height: 1.4; color: #5C5C58; }
  .sx-agent-ok { margin-left: auto; font-size: 1.4rem; opacity: 0; scale: 0.4; transition: opacity 0.3s, scale 0.5s var(--ease-out); }
  .sx-agent.is-on .sx-agent-ok { opacity: 1; scale: 1; }
  .sx-agent.is-on { box-shadow: 0 0 0 2px #0E0E0D, 0 0 0 7px var(--acc), 0 0 0 9px #0E0E0D, var(--ao-3); }
  .sx-agent-tag {
    position: absolute; right: 0.9rem; top: -0.85rem;
    padding: 0.2rem 0.6rem; border-radius: var(--r-pill);
    background: #0E0E0D; color: #FFFFFF; font-size: 0.72rem; font-weight: 650;
    opacity: 0; translate: 0 6px; transition: opacity 0.3s, translate 0.4s var(--ease-out);
  }
  .sx-agent.is-next .sx-agent-tag { opacity: 1; translate: 0 0; }
  .sx-agent.is-next { animation: sx-next 1.4s var(--ease-in-out) infinite; }
  @keyframes sx-next { 50% { box-shadow: 0 0 0 2px #0E0E0D, 0 0 0 9px rgb(14 14 13 / 0.18), var(--ao-3); } }

  /* What each agent is doing, running in its panel. */
  .sx-mini { position: relative; height: clamp(4.6rem, 11vh, 6.4rem); border-radius: var(--r-s); background: #F3F3EF; box-shadow: var(--ao-in); overflow: hidden; padding: 0.6rem 0.75rem; display: grid; align-content: center; gap: 0.35rem; font-family: var(--font-mono); font-size: 0.72rem; }
  .sx-mini p { margin: 0; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
  .sx-mini b { position: relative; display: inline-grid; font-weight: 600; }
  .sx-mini b > em { grid-area: 1 / 1; font-style: normal; padding: 0.1rem 0.45rem; border-radius: var(--r-pill); }
  .sx-mini .is-pass { padding: 0.1rem 0.45rem; border-radius: var(--r-pill); background: var(--acc); }
  .is-flip em:first-child, .sx-flip em:first-child { background: #0E0E0D; color: #FFFFFF; animation: sx-out 3.2s infinite; }
  .is-flip em:last-child, .sx-flip em:last-child { background: var(--acc); animation: sx-in 3.2s infinite; }
  .sx-mini p:nth-child(3) .is-flip em { animation-delay: 0.8s; }
  @keyframes sx-out { 0%, 45% { opacity: 1; translate: 0 0; } 55%, 92% { opacity: 0; translate: 0 -60%; } 100% { opacity: 1; translate: 0 0; } }
  @keyframes sx-in { 0%, 45% { opacity: 0; translate: 0 60%; } 55%, 92% { opacity: 1; translate: 0 0; } 100% { opacity: 0; translate: 0 60%; } }
  .sx-mini--1 i { display: block; height: 0.42rem; border-radius: 4px; margin-left: var(--x); width: var(--w); background: #0E0E0D; opacity: 0.75; transform-origin: 0 50%; animation: sx-type 3.4s var(--d) infinite both; }
  .sx-mini--1 i:nth-child(2n) { background: var(--acc); opacity: 1; }
  @keyframes sx-type { 0% { transform: scaleX(0); } 30%, 85% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
  .sx-mini--2 { justify-items: center; }
  .sx-flip { font-size: 1.15rem; }
  .sx-mini--2 > span { color: #91918B; }
  .sx-mini--3 p { justify-content: flex-start; }
  .sx-mini--3 p i { display: block; height: 0.42rem; border-radius: 4px; }
  .sx-mini--3 .is-del i { background: #0E0E0D; opacity: 0.22; }
  .sx-mini--3 .is-add i { background: var(--acc); }
  .sx-mini .sx-stamp { position: absolute; right: 0.7rem; bottom: 0.55rem; padding: 0.15rem 0.5rem; border-radius: var(--r-pill); background: #0E0E0D; color: #FFFFFF; rotate: -8deg; animation: sx-stamp 3.6s var(--ease-out) infinite; }
  @keyframes sx-stamp { 0%, 40% { opacity: 0; scale: 1.8; } 50%, 90% { opacity: 1; scale: 1; } 100% { opacity: 0; scale: 1; } }

  .sx-crew-disc {
    position: absolute; left: 0; top: 0; z-index: 9;
    width: 5.4rem; height: 5.4rem; margin: -2.7rem 0 0 -2.7rem;
    display: grid; place-items: center; text-align: center;
    border-radius: 50%; background: #FFFFFF; color: #0E0E0D;
    box-shadow: 0 0 0 2px #0E0E0D, var(--ao-2);
    font-weight: 750; font-size: 0.78rem; line-height: 1.1; letter-spacing: 0.02em; text-transform: uppercase;
    transition: background 0.25s;
  }
  .sx-crew-disc span { white-space: pre-line; max-width: 4.6rem; }
  .sx-crew-disc.is-held { background: #0E0E0D; color: #FFFFFF; }
  .sx-crew-end {
    position: absolute; left: 50%; bottom: clamp(1.6rem, 6vh, 3.4rem); translate: -50% 12px;
    display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0.8rem 1rem;
    width: max-content; max-width: 92vw; z-index: 10;
    padding: 0.6rem 0.6rem 0.6rem 1.3rem; border-radius: var(--r-pill);
    background: #FFFFFF; color: #0E0E0D; box-shadow: 0 0 0 2px #0E0E0D, var(--ao-3);
    opacity: 0; transition: opacity 0.5s, translate 0.7s var(--ease-out);
  }
  .sx-crew-end.is-on { opacity: 1; translate: -50% 0; }
  .sx-crew-end p { margin: 0; font-weight: 650; font-size: var(--step-0); text-align: center; }
  .sx-merge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.1rem; border-radius: var(--r-pill); background: rgb(14 14 13 / 0.12); box-shadow: var(--ao-in); font-weight: 650; color: rgb(14 14 13 / 0.55); }
  .sx-merge .glyph { font-size: 1.2rem; }
  .sx-crew-hand { position: absolute; left: 0; top: 0; z-index: 8; }
  .sx-crew-hand .sx-walker { position: relative; font-size: clamp(64px, 10vh, 96px); translate: -0.5em -0.5em; }

  /* Hold buttons: a disc of ink with its progress drawn round the rim. */
  .sx-hold {
    position: absolute; left: 50%; bottom: clamp(1.4rem, 5vh, 3rem); translate: -50% 0; z-index: 7;
    width: clamp(5.6rem, 11vh, 7rem); aspect-ratio: 1;
    display: grid; place-items: center;
    border: 0; border-radius: 50%; padding: 0;
    background: #0E0E0D; color: #FFFFFF;
    font: inherit; font-weight: 650; font-size: var(--step--1); line-height: 1.1; text-align: center;
    cursor: pointer; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
    box-shadow: var(--ao-3);
    transition: scale 0.4s var(--ease-out);
  }
  .sx-hold:active { scale: 0.94; }
  .sx-hold span { position: relative; max-width: 4.2em; }
  .sx-hold svg { position: absolute; inset: 0; width: 100%; height: 100%; rotate: -90deg; }
  .sx-hold circle { fill: none; stroke-width: 5; }
  .sx-hold-track { stroke: rgb(255 255 255 / 0.18); }
  .sx-hold-fill { stroke: var(--acc); stroke-dasharray: 1; stroke-dashoffset: calc(1 - var(--p, 0)); stroke-linecap: round; }

  /* ---- ring ---- */
  .sx-rg-main {
    left: 50%; top: 55%; translate: -50% -50%;
    width: min(56rem, 90vw); padding: clamp(1rem, 2.2vw, 1.8rem);
    display: grid; gap: clamp(0.9rem, 2vh, 1.4rem);
    background: var(--paper-2);
  }
  .sx-rg-q { display: flex; align-items: center; gap: 1rem; }
  .sx-rg-me { position: relative; flex: none; font-size: clamp(44px, 7vh, 72px); }
  .sx-bubble {
    position: relative; margin: 0; max-width: 34rem;
    padding: 0.7rem 1rem; border-radius: var(--r-m);
    background: #FFFFFF; color: #0E0E0D; box-shadow: 0 0 0 2px #0E0E0D;
    font-weight: 650; font-size: var(--step-0); line-height: 1.3;
  }
  .sx-bubble em { display: block; font-style: normal; font-weight: 500; color: #5C5C58; font-size: var(--step--1); }
  .sx-bubble::before { content: ''; position: absolute; left: -0.4rem; top: 50%; width: 0.75rem; height: 0.75rem; translate: 0 -50%; rotate: 45deg; background: #FFFFFF; box-shadow: -2px 2px 0 #0E0E0D; }
  .sx-shelf { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: clamp(0.4rem, 1vw, 0.8rem); }
  .sx-shelf-card {
    position: relative; display: grid; gap: 0.35rem; align-content: start;
    min-height: clamp(5.6rem, 15vh, 8.5rem); padding: 0.7rem;
    border-radius: var(--r-s); background: var(--paper); box-shadow: var(--ao-1);
    transition: background 0.3s, box-shadow 0.3s;
  }
  .sx-shelf-card strong { font-size: var(--step--1); font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sx-shelf-card i { display: block; height: 0.32rem; border-radius: 4px; background: var(--line); }
  .sx-shelf-card i + i { width: 62%; }
  .sx-shelf-card b {
    position: absolute; right: 0.55rem; bottom: 0.55rem;
    font-family: var(--font-mono); font-size: 0.72rem; padding: 0.08rem 0.4rem; border-radius: var(--r-pill);
    background: var(--ink); color: var(--paper);
    opacity: 0; scale: 0.5; transition: opacity 0.25s, scale 0.4s var(--ease-out);
  }
  .sx-shelf-card.is-seen b { opacity: 1; scale: 1; }
  .sx-shelf-card.is-lit { background: #FFFFFF; box-shadow: 0 0 0 2px var(--ink), var(--ao-2); }
  .sx-lens {
    position: absolute; left: 0; top: 0; z-index: 2; pointer-events: none;
    width: clamp(5rem, 11vw, 8rem); aspect-ratio: 1; translate: -50% -50%;
    border-radius: 50%; box-shadow: 0 0 0 3px var(--ink), 0 0 0 9px var(--acc), 0 0 0 11px var(--ink), var(--ao-3);
  }
  .sx-lens::after { content: ''; position: absolute; left: 88%; top: 88%; width: 34%; height: 11px; border-radius: 6px; background: var(--ink); rotate: 45deg; transform-origin: 0 50%; }
  .sx-rg-gauge {
    right: max(3vw, calc(50% - min(56rem, 90vw) / 2 - 3rem)); top: 15%;
    width: clamp(11rem, 22vw, 17rem); padding: 0.9rem 1rem 0.8rem;
    display: grid; gap: 0.4rem; background: #FFFFFF; color: #0E0E0D;
    box-shadow: 0 0 0 2px #0E0E0D, var(--ao-3); z-index: 3;
  }
  .sx-rg-gauge svg { display: block; width: 100%; height: auto; overflow: visible; }
  .sx-g-bg, .sx-g-ok { fill: none; stroke-width: 16; }
  .sx-g-bg { stroke: #E6E6E1; }
  .sx-g-ok { stroke: var(--acc); }
  .sx-g-needle { transform-box: view-box; transform-origin: 100px 100px; }
  .sx-g-needle line { stroke: #0E0E0D; stroke-width: 6; stroke-linecap: round; }
  .sx-g-needle circle { fill: #0E0E0D; }
  .sx-rg-gauge p { margin: 0; display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.74rem; font-weight: 600; color: #5C5C58; }
  .sx-rg-gauge b { color: #0E0E0D; }
  .sx-rg-say {
    position: absolute; z-index: 4; right: max(4vw, calc(50% - min(56rem, 90vw) / 2 - 2rem)); bottom: 8%;
    padding: clamp(1rem, 2.4vw, 1.8rem) clamp(1.3rem, 3vw, 2.4rem);
    border-radius: var(--r-l); background: var(--acc); color: var(--acc-ink);
    box-shadow: 0 0 0 2px var(--ink), 0 0 0 10px var(--paper), 0 0 0 12px var(--ink), var(--ao-3);
    transform-origin: 20% 100%;
  }
  .sx-rg-say-me { position: absolute; left: -0.55em; bottom: -0.45em; z-index: 2; font-size: clamp(56px, 10vh, 92px); rotate: -10deg; }
  .sx-rg-say > span { position: relative; z-index: 1; display: block; font-size: clamp(2.2rem, 7vh, 5rem); font-weight: 800; line-height: 0.9; letter-spacing: -0.06em; white-space: nowrap; }
  .sx-rg-c1 { left: 5%; top: 16%; }
  .sx-rg-c2 { left: 5%; top: 78%; max-width: min(22rem, 80vw); }

  /* ---- drip ---- */
  .sx-drip { position: absolute; inset: 0; display: flex; }
  .sx-drip i {
    flex: var(--w); margin-right: -1px;
    background: #0E0E0D; border-radius: 0 0 999px 999px;
    transform: scaleY(0); transform-origin: 50% 0;
    height: 115%;
  }
  .sx-drip-fill { background: #0E0E0D; }

  /* ---- hall ---- */
  .sx-hall-bg { background: var(--paper); }
  .sx-col {
    position: absolute; left: 50%; top: 50%;
    width: 180px; height: 2600px; margin: -1300px 0 0 -90px;
    border-radius: 90px;
    background: var(--acc);
    box-shadow: inset -26px 0 0 rgb(0 0 0 / 0.22);
    display: grid; place-items: center;
  }
  .sx-col span {
    writing-mode: vertical-rl; rotate: 180deg;
    font-family: var(--font-display); font-weight: 750; font-size: 54px; letter-spacing: -0.03em;
    color: var(--acc-ink); white-space: nowrap;
  }
  .sx-plinth { position: absolute; left: 50%; top: 50%; translate: -50% -100%; transform-origin: 50% 100%; }
  .sx-caps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.2em; padding: 0 3em; align-items: end; }
  .sx-capsule {
    position: relative; display: grid; gap: 0.6em; justify-items: center; align-content: start;
    min-height: 24em; padding: 2.4em 1.2em 1.6em;
    border-radius: 999px 999px 2em 2em;
    background: #FFFFFF; color: #0E0E0D;
    box-shadow: inset -1.4em 0 0 rgb(14 14 13 / 0.08), var(--ao-2);
    text-align: center;
    transition: translate 0.6s var(--ease-out);
  }
  .sx-plinth:not(.is-near) .sx-capsule { pointer-events: none; }
  .sx-capsule .glyph { font-size: 3.4em; }
  .sx-capsule strong { font-size: 2.4em; letter-spacing: -0.045em; }
  .sx-capsule ul { list-style: none; margin: 0.4em 0 0; padding: 0; display: grid; gap: 0.35em; font-size: 1.15em; font-weight: 550; color: #5C5C58; }
  .sx-capsule:hover { translate: 0 -1.2em; }
  .sx-plinth-top { height: 3.2em; margin-top: -0.6em; border-radius: 1.2em; background: var(--paper-3); box-shadow: var(--ao-2); }
  .sx-strip {
    left: 50%; top: 50%;
    width: min(70rem, 94vw); height: min(15rem, 26vh);
    margin: calc(min(15rem, 26vh) / -2) 0 0 calc(min(70rem, 94vw) / -2);
    background: #FFFFFF; color: #0E0E0D;
    box-shadow: 0 0 0 2px #FFFFFF, var(--ao-3);
    display: flex; align-items: center;
  }
  .sx-strip-t { white-space: nowrap; font-size: min(22vh, 13rem); font-weight: 800; letter-spacing: -0.06em; line-height: 1; padding-left: 4%; }
  .sx-hall-walk { position: absolute; left: 6%; bottom: -6%; }
  .sx-hall-walk .sx-walker { position: relative; font-size: min(40vh, 22rem); }
  .sx-ha-c1 { left: 5%; top: 14%; }
  .sx-ha-c2 { right: 5%; top: 14%; }

  /* ---- lift ---- */
  .sx-lift { background: var(--paper); --p: 0; }
  .sx-lift-lines { position: absolute; left: 50%; top: 46%; width: 0; height: 0; }
  .sx-lift-lines i {
    position: absolute; left: 0; top: 0;
    width: max(var(--l), 5rem); height: 3px; border-radius: 3px;
    background: var(--ink); opacity: calc(0.25 + var(--p) * 0.5);
    transform: rotate(var(--a)) translateX(min(var(--r), 48vh));
    transform-origin: 0 50%;
  }
  .sx-orbit { position: absolute; left: 50%; top: 46%; width: 0; height: 0; }
  .sx-orb {
    position: absolute; left: 0; top: 0; translate: -50% -50%;
    padding: 0.45em 0.85em; border-radius: var(--r-pill);
    background: var(--paper-3); color: var(--ink);
    box-shadow: var(--ao-1);
    font-weight: 650; font-size: clamp(0.8rem, 1.5vw, 1.15rem); white-space: nowrap;
  }
  .sx-lift-walk { position: absolute; left: 0; top: 0; z-index: 2; }
  .sx-lift-walk .sx-walker { translate: -0.5em -0.5em; font-size: clamp(80px, 14vh, 140px); }
  .sx-lift-walk .sx-walker { position: relative; }
  .sx-lf-c1 { left: 5%; top: 14%; }
  .sx-lf-c2 { right: 5%; top: 64%; }

  /* ---- record ---- */
  .sx-rec-ground { background: var(--paper); }
  .sx-rec-row {
    position: absolute; left: 50%; top: 50%;
    width: min(76rem, 92vw);
    translate: -50% -50%;
    display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(0.6rem, 1.6vw, 1.4rem);
  }
  .sx-rec { position: relative; height: min(30rem, 62vh); }
  .sx-rec-card {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; gap: 0.6rem;
    padding: clamp(1rem, 2vw, 1.6rem);
    border-radius: var(--r-m);
    background: var(--acc); color: var(--acc-ink);
    box-shadow: inset 0 0 0 2px var(--ink), var(--ao-2);
    transition: scale 0.6s var(--ease-out);
  }
  .sx-rec.is-set .sx-rec-card { scale: 1.02; }
  .sx-rec-card strong { margin-top: auto; font-size: clamp(2.6rem, 6vw, 5.6rem); letter-spacing: -0.06em; line-height: 0.85; }
  .sx-rec-t { font-weight: 650; font-size: var(--step--1); }
  .sx-rec-card p { margin: 0; font-size: var(--step--1); line-height: 1.4; opacity: 0.86; }
  .sx-rc-c1 { left: 5%; top: 9%; }

  /* ---- back ---- */
  .sx-back-title { top: 17%; }
  .sx-lot {
    position: relative; flex: 1 1 0; min-width: 0; height: 26%;
    border-radius: 10px 10px 0 0;
    box-shadow: inset 0 0 0 2px var(--ink-3);
    display: grid; place-items: center;
    transition: background 0.6s var(--ease-out), box-shadow 0.6s;
  }
  .sx-lot-n { font-weight: 700; font-size: var(--step--1); color: var(--ink-2); }
  .sx-lot.is-on { background: var(--acc); box-shadow: none; }
  .sx-lot.is-on .sx-lot-n { color: var(--acc-ink); }
  .sx-back-walk { position: absolute; left: 4%; bottom: 0; }
  .sx-back-walk .sx-walker { position: relative; font-size: clamp(48px, 8vh, 84px); translate: 0 -100%; }
  .sx-bk-c1 { left: 6%; top: 14%; }
  .sx-bk-c2 { right: 6%; top: 50%; }

  /* ---- ask ---- */
  .sx-ask { background: var(--acc); color: var(--acc-ink); display: grid; place-items: center; overflow: hidden; }
  .sx-ask-drips { position: absolute; left: 0; right: 0; top: 0; height: 30%; display: flex; }
  .sx-ask-drips i { flex: var(--w); margin-right: -1px; background: #0E0E0D; border-radius: 0 0 999px 999px; transform-origin: 50% 0; }
  .sx-ask-drips i:nth-child(3n) { height: 70%; }
  .sx-ask-drips i:nth-child(4n+1) { height: 45%; }
  .sx-ask-t {
    position: relative; margin: 8vh 0 0; display: grid; justify-items: center; text-align: center;
    font-size: clamp(3.4rem, 12vw, 12rem); font-weight: 800; line-height: 0.86; letter-spacing: -0.065em;
  }
  .sx-ask-t > span { display: block; }
  .sx-ask-orn { font-size: 0.32em; margin: 0.2em 0; }

  /* ---- poster ---- */
  .sx-poster {
    position: absolute; left: 50%; top: 50%;
    width: min(40rem, 88vw); translate: -50% -50%;
    padding: clamp(1.1rem, 2.4vw, 2rem);
    border-radius: var(--r-l);
    background: #FFFFFF; color: #0E0E0D;
    box-shadow: 0 0 0 2px #0E0E0D, var(--ao-3);
  }
  .sx-poster header { display: flex; justify-content: space-between; gap: 1rem; font-weight: 650; font-size: var(--step--2); color: #5C5C58; }
  .sx-poster-t { margin: 1.6rem 0; text-align: center; font-size: clamp(1.7rem, 4.2vw, 3.4rem); font-weight: 800; line-height: 0.95; letter-spacing: -0.05em; }
  .sx-poster footer { display: flex; align-items: center; justify-content: space-between; }
  .sx-poster footer .glyph { font-size: 1.8rem; }
  .sx-poster-go, .sx-end-go, .sx-reel-go {
    display: inline-flex; align-items: center; gap: 0.5em;
    padding: 0.75rem 1.15rem; border-radius: var(--r-pill);
    background: #0E0E0D; color: #FFFFFF;
    font-weight: 650; font-size: var(--step--1);
    box-shadow: var(--ao-1);
    transition: background 0.35s, color 0.35s;
  }
  .sx-poster-go:hover, .sx-end-go:hover, .sx-reel-go:hover { background: var(--acc); color: var(--acc-ink); }
  .sx-poster-obj { position: absolute; left: 62%; top: 28%; }
  .sx-poster-obj .sx-walker { position: relative; font-size: min(24vh, 12rem); }
  .sx-side {
    position: absolute; top: 50%; margin: 0;
    display: grid; gap: 0.2rem; align-items: center;
    font-size: var(--step--2); font-weight: 650; color: var(--acc-ink);
  }
  .sx-side b { font-weight: 750; font-size: var(--step--1); }
  .sx-side i { display: block; width: clamp(2rem, 7vw, 6rem); height: 2px; border-radius: 2px; background: currentColor; }
  .sx-side--l { left: var(--gutter); grid-template-columns: auto; }
  .sx-side--r { right: var(--gutter); text-align: right; justify-items: end; }

  /* ---- reel ---- */
  .sx-reel { background: var(--paper); }
  .sx-reel-word {
    position: absolute; left: 0; right: 0; top: 50%; translate: 0 -55%;
    text-align: center; white-space: nowrap; overflow: hidden;
    font-size: clamp(5rem, 22vw, 22rem); font-weight: 800; letter-spacing: -0.07em; line-height: 0.85;
    color: var(--acc);
  }
  .sx-reel-word span { display: inline-block; animation: sx-roll 0.8s var(--ease-out) both; }
  @keyframes sx-roll { from { transform: translateY(40%); opacity: 0; } }
  .sx-reel-card {
    position: absolute; left: 50%; top: 50%;
    width: min(30rem, 72vw); margin: 0; translate: -50% -50%;
    border-radius: var(--r-l); overflow: hidden;
    background: var(--paper); box-shadow: 0 0 0 2px var(--ink), var(--ao-3);
  }
  .sx-reel-card img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; animation: sx-fade 0.6s var(--ease-out) both; }
  @keyframes sx-fade { from { opacity: 0; scale: 1.04; } }
  .sx-reel-card figcaption { display: grid; gap: 0.3rem; padding: 1rem 1.2rem 1.2rem; }
  .sx-reel-card strong { font-size: var(--step-1); letter-spacing: -0.035em; }
  .sx-reel-card span { font-size: var(--step--1); color: var(--ink-2); line-height: 1.4; }
  .sx-reel-side { position: absolute; top: 50%; translate: 0 -50%; display: grid; gap: 0.3rem; font-size: var(--step--1); font-weight: 600; max-width: 12rem; }
  .sx-reel-side--l { left: var(--gutter); }
  .sx-reel-side--l b { font-size: var(--step-0); }
  .sx-reel-side--l .num { color: var(--acc); font-size: var(--step-1); }
  .sx-reel-side--r { right: var(--gutter); text-align: right; color: var(--ink-2); }
  .sx-reel-nav { position: absolute; left: 50%; bottom: clamp(1.2rem, 5vh, 2.6rem); translate: -50% 0; display: flex; align-items: center; gap: 0.8rem; }
  .sx-reel-nav button {
    width: 3rem; height: 3rem; border: 0; border-radius: 50%;
    display: grid; place-items: center;
    background: var(--paper-2); color: var(--ink); cursor: pointer; box-shadow: var(--ao-1);
    transition: background 0.3s, color 0.3s;
  }
  .sx-reel-nav button:hover { background: var(--acc); color: var(--acc-ink); }
  .sx-reel-nav svg { width: 0.8rem; height: 0.8rem; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

  /* ---- progress rail ---- */
  .sx-rail { position: absolute; right: 0.7rem; top: 18vh; bottom: 18vh; width: 1.2rem; z-index: 50; }
  .sx-rail-track { position: absolute; right: 0.45rem; top: 0; bottom: 0; width: 3px; border-radius: 3px; background: rgb(128 128 128 / 0.28); overflow: hidden; }
  .sx-rail-track i { position: absolute; inset: 0; background: var(--pink); transform: scaleY(0); transform-origin: 50% 0; }
  .sx-rail-b {
    position: absolute; right: 0; translate: 0 -50%;
    width: 1.2rem; height: 1.2rem; padding: 0; border: 0; background: none; cursor: pointer;
  }
  .sx-rail-b::after { content: ''; position: absolute; right: 0.25rem; top: 50%; width: 0.45rem; height: 0.45rem; margin-top: -0.225rem; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 2px var(--paper); }
  .sx-rail-b span {
    position: absolute; right: 1.5rem; top: 50%; translate: 6px -50%;
    padding: 0.3rem 0.6rem; border-radius: var(--r-pill);
    background: #0E0E0D; color: #FFFFFF; font-size: var(--step--2); font-weight: 650; white-space: nowrap;
    opacity: 0; transition: opacity 0.25s, translate 0.35s var(--ease-out);
  }
  .sx-rail-b:hover span, .sx-rail-b:focus-visible span { opacity: 1; translate: 0 -50%; }

  /* ---- after the track ---- */
  .sx-end { position: relative; min-height: 100svh; display: grid; place-items: center; padding: var(--bay) var(--gutter); background: var(--paper); }
  .sx-end .sx-side { color: var(--ink-2); }
  .sx-end .sx-side b { color: var(--acc); }
  .sx-end-mid { display: grid; justify-items: center; gap: 1.6rem; text-align: center; }
  .sx-end-mid .glyph { font-size: 3rem; }
  .sx-end-mid h2 { margin: 0; font-size: var(--step-4); font-weight: 800; letter-spacing: -0.06em; line-height: 0.88; }
  .sx-end-row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1.2rem; }
  .sx-end-alt { color: var(--ink-2); font-weight: 600; transition: color 0.3s; }
  .sx-end-alt:hover { color: var(--ink); }

  @media (max-width: 760px) {
    .sx-op-c1 { left: 4%; top: 18%; }
    .sx-op-c2 { right: 4%; top: 30%; }
    .sx-op-in1 { top: 52%; }
    .sx-op-in2 { top: 60%; }
    .sx-town { gap: 2.5%; height: 30%; }
    .sx-bld-win { gap: 3px; }
    .sx-bld-n { display: none; }
    .sx-step { padding: 0.4rem 0.3rem; }
    .sx-step strong { font-size: 0.62rem; letter-spacing: -0.02em; }
    .sx-cl-c1 { top: 10%; }
    .sx-cl-c2 { bottom: 6%; }
    .sx-agent { width: 44vw; padding: 0.6rem; gap: 0.45rem; }
    .sx-agent > p { display: none; }
    .sx-mini { height: 3.6rem; font-size: 0.6rem; padding: 0.4rem; }
    .sx-crew-disc { width: 4.4rem; height: 4.4rem; margin: -2.2rem 0 0 -2.2rem; font-size: 0.66rem; }
    .sx-shelf { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .sx-shelf-card:nth-child(n+7) { display: none; }
    .sx-rg-gauge { top: 7%; width: 9.5rem; }
    .sx-rg-c1 { top: 20%; }
    .sx-rec-row { grid-template-columns: 1fr 1fr; }
    .sx-rec { height: min(17rem, 33vh); }
    .sx-rec-card p { display: none; }
    .sx-caps { gap: 1em; padding: 0 0.6em; }
    .sx-capsule { min-height: 30em; padding: 2em 0.6em 1.4em; }
    .sx-capsule strong { font-size: 2.6em; }
    .sx-capsule ul { font-size: 1.5em; }
    .sx-side, .sx-reel-side { display: none; }
    .sx-end .sx-side { display: none; }
    .sx-rail { display: none; }
    .sx-poster-obj { left: 58%; top: 18%; }
  }

  /* Reduced motion: every scene drawn once, read top to bottom. */
  .sx.is-flat .sx-track { height: auto; }
  .sx.is-flat .sx-stage { position: relative; height: auto; contain: none; overflow: visible; }
  .sx.is-flat .sx-scene { position: relative; height: 100svh; overflow: hidden; }
  .sx.is-flat .sx-scene[data-scene="drip"], .sx.is-flat .sx-rail { display: none; }
  .sx.is-flat .sx-cap, .sx.is-flat .sx-cap > span { transition: none; }
`;

export default Story;
