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
     climb    a panel grows to full bleed while a report writes itself
     near     a panel tilted back in space stands up as it reaches you
     crew     a slab slides over; hold to pass a test down four agents
     ring     a lens searches a shelf of past projects, finds nothing close
     drip     ink runs down the page
     hall     the stack, dropped in layer by layer, with the builds on top
     lift     hold, and a question rides the stack down and back up
     record   a comic page of records, each panel running its own picture
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
  { id: 'hall',   at: 13.2, len: 3.0, acc: 'violet', label: 'Stack' },
  { id: 'lift',   at: 15.9, len: 2.5, acc: 'pink' },
  { id: 'record', at: 18.1, len: 2.8, acc: 'teal',   label: 'Record' },
  { id: 'back',   at: 20.5, len: 2.7, acc: 'yellow', label: 'Next' },
  { id: 'ask',    at: 22.9, len: 3.4, acc: 'yellow' },
  { id: 'poster', at: 23.9, len: 2.0, acc: 'yellow' },
  { id: 'reel',   at: 25.6, len: 1.7, acc: 'pink',   label: 'Builds' },
];
const TOTAL = 25.6 + 1.7 + 1;   // screens of track; the last one is the stuck stage itself

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
    <span className="sx-legs"><i /><i /></span>
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
    onHold(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* the hold still runs */ }
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

/* The PMO graph as a report that writes itself: each stage fills in
   one part of the page. The run reaches Validate, the totals do not
   match, it goes back to the SQL, fixes the join and carries on. */
const STEPS = ['Intake', 'Extract', 'SQL', 'Validate', 'Report', 'Production'];
const CLIMB = [[0, 0], [0.3, 3], [0.42, 3], [0.5, 2], [0.62, 2], [0.72, 3], [0.86, 4], [1, 5]];
const SLIP = [['North', 12], ['East', 9], ['West', 6], ['South', 4]];

const SOP = ['Guardrail', 'Intent', 'Plan', 'Generate', 'Validate', 'Execute', 'Stream'];
const CREW = [
  { n: 'Triager', c: 'Labels it a flaky test, not a real failure.', now: 'The Triager reads the failure: flaky, not broken.' },
  { n: 'Coder', c: 'Writes the fix in a sandbox with no network.', now: 'The Coder writes a fix in a sandbox with no network.' },
  { n: 'Tester', c: 'Proves it fails before the fix and passes after.', now: 'The Tester proves it fails before the fix and passes after.' },
  { n: 'Reviewer', c: 'Reads the diff and approves it.', now: 'The Reviewer reads the diff and approves it.' },
];
const CREW_IDLE = 'Hold the seal. The test only moves while you hold.';
// Where each panel of the crew page flies in from, and the tilt it keeps.
const CREW_IN = [[-0.45, 0.1, -9, -1.2], [0, -0.7, 5, 0.8], [0.45, 0.1, 9, -0.7], [-0.35, 0.7, -6, 0.6], [0.4, 0.7, 7, -0.9]];
const CREW_DONE = 'Pull request opened. Merging it is left to a human.';
// The stack, top layer first; the page drops them in bottom first.
const LAYERS = [
  { t: 'GenAI & ML', i: ['LangGraph', 'RAG', 'MCP', 'A2A', 'TensorFlow'] },
  { t: 'Web', i: ['React', 'TypeScript', 'FastAPI'] },
  { t: 'Cloud', i: ['Azure', 'AWS', 'Vercel', 'Render'] },
  { t: 'Tooling', i: ['Git', 'Docker', 'GitHub Actions'] },
  { t: 'Languages', i: ['Python', 'Java', 'C++', 'JavaScript', 'SQL'] },
];
const CAPSULES = [
  { t: 'Agents', g: 'graph', i: ['LangGraph', 'MCP servers', 'A2A crews'] },
  { t: 'Retrieval', g: 'search', i: ['RAG', 'Vector search', 'Confidence gates'] },
  { t: 'Interfaces', g: 'click', i: ['React', 'Realtime', 'Motion'] },
];
// One question through one build, floor by floor, top to bottom.
const FLOORS = [
  { l: 'Interface', t: 'React', d: 'Takes the question, streams the answer back.' },
  { l: 'API', t: 'FastAPI', d: 'Checks it and opens a stream.' },
  { l: 'Agent', t: 'LangGraph', d: 'Decides it needs the release notes.' },
  { l: 'Retrieval', t: 'RAG', d: 'Finds the two notes that answer it.' },
  { l: 'Data', t: 'PostgreSQL', d: 'Where the notes live.' },
];
// The records page: where each panel flies in from (fractions of the
// screen), the tilt it arrives with, the tilt it rests at, and how fast
// it drifts once it has landed.
const REC_IN = [
  { a: 0.3, x: -0.35, y: 0.25, r: -9, rest: -0.8, sp: 0.18 },
  { a: 0.45, x: 0.35, y: 0.15, r: 8, rest: 1.1, sp: 0.3 },
  { a: 0.6, x: -0.15, y: 0.8, r: -6, rest: 0.9, sp: 0.24 },
  { a: 0.75, x: 0.2, y: 0.9, r: 7, rest: -1.2, sp: 0.36 },
];
const PAPER_LINES = [92, 100, 86, 96, 70, 88, 54];
const NET_LINKS = 'M20 60 L80 25 L150 60 L220 30 M20 60 L80 95 L150 60 L220 90 M80 25 L80 95';
const NET_ROUTE = 'M20 60 L80 25 L150 60 L220 90 L150 60 L80 95 L20 60';
const NET_NODES = [[20, 60], [80, 25], [80, 95], [150, 60], [220, 30], [220, 90]];

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
  const crewRef = useRef({ hold: false, p: 0 });
  const liftRef = useRef({ hold: false, p: 0 });
  const [flat] = useState(() => reduced());
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
    const drawers = Array.from(stage.querySelectorAll('.sx-drawer'));
    const builds = Array.from(stage.querySelectorAll('.sx-build'));
    const recs = Array.from(stage.querySelectorAll('.sx-rec'));
    const meter = Array.from(stage.querySelectorAll('.sx-meter i b'));
    const paperLines = Array.from(stage.querySelectorAll('.sx-paper i'));
    const crowd = Array.from(stage.querySelectorAll('.sx-crowd i'));
    const netLinks = stage.querySelector('.sx-net-links');
    const floors = Array.from(stage.querySelectorAll('.sx-floor'));
    const monLines = Array.from(stage.querySelectorAll('.sx-mon-l'));
    const liftPanels = Array.from(stage.querySelectorAll('.sx-lf-pn'));
    const sop = Array.from(stage.querySelectorAll('.sx-sop-s'));
    const crewCards = Array.from(stage.querySelectorAll('.sx-cr-p'));

    let W = 0; let H = 0; let F = 900; let gut = 40; let narrow = false;
    let shelfXY = [];
    let crewXY = []; let floorY = []; let shaftH = 1;
    let chest = { x: 0, y: 0, w: 0, rows: [] };
    const measure = () => {
      W = stage.clientWidth; H = stage.clientHeight;
      F = H * 1.0;
      narrow = W < 760;
      gut = narrow ? 12 : Math.min(W * 0.045, 64);
      // Where the test stands in each panel of the crew page.
      crewXY = crewCards.map((el) => [el.offsetLeft + el.offsetWidth * (narrow ? 0.24 : 0.2), el.offsetTop + el.offsetHeight * (narrow ? 0.4 : 0.36)]);
      // The toolbox: where each drawer sits, so the token can stand on it.
      const ch = $['hall.chest'];
      chest = { x: ch.offsetLeft, y: ch.offsetTop, w: ch.offsetWidth, rows: drawers.map((d) => d.offsetTop) };
      // Floor centres for the lift car.
      floorY = floors.map((el) => el.offsetTop + el.offsetHeight / 2);
      shaftH = floors[0].parentElement.offsetHeight || 1;
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
        tf($['climb.world'], T(0, mix(H * 0.06, 0, seg(t, 0.2, 1.4)), mix(0.94, 1, seg(t, 0.2, 1.4))));
        // The run, stage by stage: up to Validate, back to the SQL, on.
        const c = seg(t, 0.95, 2.45);
        let j = 0; while (j < CLIMB.length - 2 && c > CLIMB[j + 1][0]) j += 1;
        const pos = mix(CLIMB[j][1], CLIMB[j + 1][1], seg(c, CLIMB[j][0], CLIMB[j + 1][0]));
        const reached = c < 0.3 ? pos : Math.max(3, pos);
        const bad = c > 0.3 && c < 0.5; const fix = c >= 0.5 && c < 0.72;
        const label = bad ? 'Validate: totals off' : fix ? 'SQL: fixing the join' : STEPS[Math.round(pos)];
        if ($['climb.stage'].$l !== label) { $['climb.stage'].textContent = label; $['climb.stage'].$l = label; }
        cls($['climb.world'], 'is-bad', bad);
        monLines.forEach((el, i) => tf(el, `scaleX(${seg(reached, i * 0.95, i * 0.95 + 0.95).toFixed(3)})`));
        // The check, close up, slides in from the right.
        const k2 = out(seg(t, 0.95, 1.35));
        tf($['climb.p2'], T((1 - k2) * W * 0.55, 0, 1, mix(12, 1.6, k2)));
        cls($['climb.p2'], 'is-bad', bad);
        cls($['climb.p2'], 'is-fix', fix);
        cls($['climb.p2'], 'is-ok', c >= 0.72);
        // The printer comes up from below and prints the report.
        const k3 = out(seg(t, 1.75, 2.15));
        tf($['climb.p3'], T(0, (1 - k3) * H * 0.8, 1, mix(-10, -1.4, k3)));
        tf($['climb.paper'], `translate3d(0, ${((1 - out(seg(c, 0.84, 1))) * 100).toFixed(2)}%, 0)`);
        cls($['climb.p3'], 'is-sent', pos > 4.85);
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

      crew(t) {
        const slabEl = $['crew.slab'];
        tf(slabEl, T(0, slab(t, 0.9, 2.2)));
        const st = crewRef.current;
        // The panels fly in from every side and land on the page.
        crewCards.forEach((el, i) => {
          const P = CREW_IN[i];
          const k = out(seg(t, 0.3 + i * 0.09, 0.8 + i * 0.09));
          tf(el, T(P[0] * W * (1 - k), P[1] * H * (1 - k), 1, mix(P[2], P[3], k)));
        });
        // The test stays with each agent while it works, then walks on.
        const p = st.p;
        const a = Math.min(CREW.length, Math.floor(p));
        const at = a >= CREW.length ? CREW.length : a + io(seg(p - a, 0.7, 1));
        const i0 = Math.min(CREW.length, Math.floor(at)); const i1 = Math.min(CREW.length, i0 + 1);
        const g = at - i0;
        const moving = g > 0.01 && g < 0.99;
        const [x0, y0] = crewXY[i0]; const [x1, y1] = crewXY[i1];
        tf($['crew.ticket'], T(mix(x0, x1, g), mix(y0, y1, g) - (moving ? Math.sin(g * Math.PI) * H * 0.06 : 0)));
        cls($['crew.ticket'], 'is-walk', moving);
        crewCards.forEach((el, i) => {
          cls(el, 'is-on', i < CREW.length ? p >= i + 1 : p >= CREW.length);
          cls(el, 'is-run', p > 0 && i === a && i < CREW.length);
        });
        const now = p >= CREW.length ? CREW_DONE : p > 0 ? CREW[a].now : CREW_IDLE;
        if ($['crew.now'].$l !== now) { $['crew.now'].textContent = now; $['crew.now'].$l = now; }
        slabEl.style.setProperty('--p', (p / CREW.length).toFixed(4));
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
        tf($['ring.gauge'], T((1 - g) * W * 1.4, drift * 0.05, 1, mix(18, 4, g)));
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
        // Nothing of the hall shows until the ink has covered the screen.
        const shown = t > -0.12;
        op($['hall.bg'], shown ? 1 : 0);
        vis($['hall.page'], shown);
        const k1 = out(seg(t, -0.1, 0.3));
        tf($['hall.p1'], T(-(1 - k1) * W * 0.5, 0, 1, mix(-8, -0.8, k1)));
        const k2 = out(seg(t, 0.25, 0.6));
        tf($['hall.p2'], T((1 - k2) * W * 0.5, 0, 1, mix(9, 1.4, k2)));
        const k3 = out(seg(t, 1.45, 1.8));
        tf($['hall.p3'], T(0, (1 - k3) * H * 0.8, 1, mix(-7, -1, k3)));
        // Drawers open bottom first, one after another, and stay open,
        // so they make a staircase the token climbs.
        const n = drawers.length;
        // Lower drawers pull out further, so each one leaves a ledge.
        const OPEN = (i) => chest.w * (1.04 + 0.16 * i);
        const openAt = (i) => io(seg(t, 0.3 + (n - 1 - i) * 0.24, 0.5 + (n - 1 - i) * 0.24)) * OPEN(i);
        drawers.forEach((el, i) => tf(el, T(openAt(i), 0)));
        const q = cl((t - 0.42) / 0.24, 0, n - 1);
        const a = Math.min(n - 2, Math.floor(q)); const f = q - a;
        const spot = (order) => { const i = n - 1 - order; return [chest.x + openAt(i) + chest.w * 0.88, chest.y + chest.rows[i]]; };
        const [ax, ay] = spot(a); const [bx, by] = spot(a + 1);
        const step = f > 0.05 && f < 0.95 && t < 0.42 + (n - 1) * 0.24;
        tf($['hall.tok'], T(mix(ax, bx, f), mix(ay, by, f) - Math.sin(f * Math.PI) * H * 0.05));
        cls($['hall.tok'], 'is-walk', step);
        // The close-up names the drawer the token is standing on.
        const cur = n - 1 - Math.round(q);
        if ($['hall.zoomT'].$l !== cur) {
          $['hall.zoomT'].textContent = LAYERS[cur].t;
          $['hall.zoomI'].textContent = LAYERS[cur].i.join(' · ');
          $['hall.zoomN'].textContent = `Drawer ${n - cur} of ${n}`;
          $['hall.zoomT'].$l = cur;
          cls($['hall.p2'], 'is-flash', false);
          void $['hall.p2'].offsetWidth;
          cls($['hall.p2'], 'is-flash', true);
        }
        builds.forEach((el, i) => cls(el, 'is-on', t > 1.75 + i * 0.12));
      },

      lift(t) {
        tf($['lift.slab'], T(0, slab(t, 0.9, 1.95)));
        const LIN = [[-0.5, 0, -8], [0.5, -0.3, 7], [0.4, 0.3, -6], [0.5, 0.2, 8], [0.3, 0.7, -5]];
        const REST = [-0.8, 1.2, -1.6, 1.4, -0.6];
        liftPanels.forEach((el, i) => {
          const k = out(seg(t, 0.3 + i * 0.08, 0.75 + i * 0.08));
          tf(el, T(LIN[i][0] * W * (1 - k), LIN[i][1] * H * (1 - k), 1, mix(LIN[i][2], REST[i], k)));
        });
        const st = liftRef.current;
        // Down to the data with the question, back up with the answer.
        const last = FLOORS.length - 1;
        const pos = st.p < 0.5 ? (st.p / 0.5) * last : (1 - (st.p - 0.5) / 0.5) * last;
        const a = Math.min(last - 1, Math.floor(pos)); const f = pos - a;
        const y = mix(floorY[a], floorY[a + 1], f);
        tf($['lift.car'], T(0, y));
        tf($['lift.cable'], `scaleY(${(y / shaftH).toFixed(4)})`);
        const up = st.p >= 0.5;
        const here = Math.round(pos);
        floors.forEach((el, i) => {
          cls(el, 'is-on', st.p > 0 && (up || i <= pos + 0.2));
          cls(el, 'is-here', st.p > 0 && Math.abs(pos - i) < 0.35);
        });
        // The dial and the close-up follow the car.
        tf($['lift.needle'], `rotate(${(mix(-70, 70, pos / last) + Math.sin(clock * 9) * 1.2).toFixed(2)}deg)`);
        const num = String(FLOORS.length - here);
        if ($['lift.num'].$l !== num) { $['lift.num'].textContent = num; $['lift.num'].$l = num; }
        const fl0 = FLOORS[here];
        const desc = st.p > 0 ? (up && here === 0 && st.p >= 0.999 ? 'Streams the answer back, with its sources.' : fl0.d) : 'The car waits on the top floor.';
        if ($['lift.fd'].$l !== desc) {
          $['lift.fd'].textContent = desc; $['lift.fd'].$l = desc;
          $['lift.ft'].textContent = fl0.t; $['lift.fl'].textContent = `Floor ${num} · ${fl0.l}`;
        }
        cls($['lift.say'], 'is-done', st.p >= 0.999);
        cls($['lift.say'], 'is-wait', st.p > 0 && st.p < 0.999);
        $['lift.slab'].style.setProperty('--p', st.p.toFixed(4));
      },

      record(t) {
        tf($['record.ground'], T(0, Math.max(0, 0.75 - t) * H));
        // Panels fly in from all sides, land on the page, then each
        // drifts at its own depth.
        recs.forEach((el, i) => {
          const P = REC_IN[i];
          const k = out(seg(t, P.a, P.a + 0.6));
          const drift = -(t - 1.5) * H * P.sp;
          tf(el, T(P.x * W * (1 - k), P.y * H * (1 - k) + drift + Math.max(0, 0.75 - t) * H * 1.4, mix(0.86, 1, k), mix(P.r, P.rest, k)));
        });
        // CGPA rolls up and fills its meter.
        const v = 9.55 * out(seg(t, 0.55, 1.35));
        const txt = v.toFixed(2);
        if ($['record.num'].$v !== txt) { $['record.num'].textContent = txt; $['record.num'].$v = txt; }
        meter.forEach((el, j) => tf(el, `scaleX(${cl(v - j).toFixed(3)})`));
        // The paper writes itself, then gets its stamp.
        tf($['record.paper'], T(0, (1 - out(seg(t, 0.6, 1.2))) * H * 0.16));
        paperLines.forEach((el, j) => tf(el, `scaleX(${out(seg(t, 0.75 + j * 0.06, 0.95 + j * 0.06)).toFixed(3)})`));
        const st = back(seg(t, 1.3, 1.55));
        tf($['record.stamp'], `scale(${(mix(2.2, 1, cl(st)) * (st > 0 ? 1 : 0)).toFixed(3)}) rotate(-12deg)`);
        op($['record.stamp'], seg(t, 1.3, 1.36));
        // The room fills.
        crowd.forEach((el, j) => cls(el, 'is-in', t > 0.85 + j * 0.04));
        // The network draws its links.
        const nl = (1 - seg(t, 0.95, 1.5)).toFixed(3);
        if (netLinks.$d !== nl) { netLinks.style.strokeDashoffset = nl; netLinks.$d = nl; }
        fl('record.c1', t, 1.5, 0.3);
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
        cls($['back.walker'], 'is-walk', w > 0.01 && w < 0.97);
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
      // Both stay where you let go.
      const lift = liftRef.current;
      if (lift.hold) lift.p = cl(lift.p + dt / 3.2);
      const crew = crewRef.current;
      if (crew.hold) crew.p = Math.min(CREW.length, crew.p + dt / 1.05);

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
      const REST = { open: 0.3, climb: 1.9, near: 1.2, crew: 1.6, ring: 1.2, drip: 0, hall: 2.0, lift: 1.3, record: 1.5, back: 2.3, ask: 1.0, poster: 1.0, reel: 1.6 };
      crewRef.current.p = CREW.length; liftRef.current.p = 1;
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
                <div className="sx-cp sx-cl-p1">
                  <span className="sx-cp-lab">Emerson, after hours</span>
                  <span className="sx-hatch sx-room-wall" aria-hidden="true" />
                  <span className="sx-room-win" aria-hidden="true"><i /></span>
                  <span className="sx-room-floor" aria-hidden="true" />
                  <span className="sx-clock" aria-hidden="true"><i /><i /></span>
                  <div className="sx-desk" aria-hidden="true">
                    <div className="sx-mon">
                      <p className="sx-mon-stage" data-k="climb.stage">Intake</p>
                      <div className="sx-mon-lines">{[86, 64, 92, 48, 74, 58].map((w, i) => <i key={i} className="sx-mon-l" style={{ '--w': `${w}%` }} />)}</div>
                    </div>
                    <span className="sx-mon-neck" />
                    <span className="sx-desk-top" />
                    <span className="sx-mug"><i /><i /></span>
                    <span className="sx-desk-leg" /><span className="sx-desk-leg" />
                  </div>
                  <div className="sx-typist" aria-hidden="true"><Walker /></div>
                </div>
                <div className="sx-cp sx-cl-p2" data-k="climb.p2">
                  <span className="sx-cp-lab">Validate</span>
                  <code className="sx-chk-sql">JOIN plans p ON <span className="sx-chk-fix"><em>p.id = m.id</em><em>p.project_id = m.project_id</em></span></code>
                  <p className="sx-chk-say"><em>Rows: 412?</em><em>Totals don’t match.</em><em>Back to the SQL.</em><em>412 rows. Checks out.</em></p>
                  <span className="sx-caret" aria-hidden="true" />
                </div>
                <div className="sx-cp sx-cl-p3" data-k="climb.p3">
                  <span className="sx-cp-lab">Report</span>
                  <div className="sx-print-out">
                    <div className="sx-print-paper" data-k="climb.paper">
                      <strong className="display">Q3 slippage by region</strong>
                      {SLIP.map(([r, d]) => <p key={r}><span>{r}</span><i style={{ '--v': d / 12 }} /></p>)}
                      <b className="sx-print-stamp">Sent to the PMO</b>
                    </div>
                  </div>
                  <div className="sx-print-body" aria-hidden="true"><i /></div>
                </div>
              </div>
              <Cap k="climb.c1" on={1.0} className="sx-cl-c1">Two agent systems run in production at Emerson. This one writes the PMO’s reports.</Cap>
              <Cap k="climb.c2" on={1.4} className="sx-cl-c2">When a check fails, the run goes back, fixes the query and carries on.</Cap>
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
            <div className="sx-full sx-crew" data-k="crew.slab">
              <Cap k="crew.c1" on={0.7} className="sx-cr-c1">Swarm: four agents fix a flaky test between them, each with one job.</Cap>
              {CREW.map((a, i) => (
                <div key={a.n} className={`sx-cp sx-cr-p sx-cr-p${i}`}>
                  <span className="sx-cp-lab">{String(i + 1).padStart(2, '0')} · {a.n}</span>
                  <span className="sx-cr-ok" aria-hidden="true"><Glyph kind="check" acc="lime" /></span>
                  <div className="sx-cr-who" aria-hidden="true"><Walker /></div>
                  <div className={`sx-act sx-act--${i}`} aria-hidden="true">
                    {i === 0 && (
                      <div className="sx-sheet">
                        {['test_login', 'test_cart', 'test_sync'].map((n, j) => (
                          <p key={n}><span>{n}</span><b className={j === 1 ? 'is-pass' : 'is-flip'}>{j === 1 ? 'passes' : <><em>fails</em><em>flaky</em></>}</b></p>
                        ))}
                        <span className="sx-mag"><i /></span>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="sx-sand">
                        <div className="sx-sand-scr">{[62, 84, 40, 72].map((w, j) => <i key={j} style={{ '--w': `${w}%`, '--d': `${j * 0.4}s` }} />)}</div>
                        <span className="sx-sand-box"><span className="sx-hatch" /></span>
                        <b className="sx-sand-tag">No network</b>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="sx-lamps">
                        <p><i className="is-a" /><span>Before the fix</span><b>fails</b></p>
                        <p><i className="is-b" /><span>After the fix</span><b>passes</b></p>
                      </div>
                    )}
                    {i === 3 && (
                      <div className="sx-diff">
                        {[['-', 70], ['+', 82], ['+', 54], ['-', 40]].map(([m, w], j) => <p key={j} className={m === '+' ? 'is-add' : 'is-del'}><span>{m}</span><i style={{ width: `${w}%` }} /></p>)}
                        <b className="sx-diff-stamp">Approved</b>
                      </div>
                    )}
                  </div>
                  <p className="sx-cr-say">{a.c}</p>
                </div>
              ))}
              <div className="sx-cp sx-cr-p sx-cr-p4">
                <span className="sx-cp-lab">Pull request</span>
                <div className="sx-door" aria-hidden="true">
                  <span className="sx-door-sign">Merge</span>
                  <span className="sx-door-lock"><Glyph kind="lock" acc="lime" /></span>
                  <i className="sx-door-knob" />
                </div>
                <p className="sx-cr-say">Opened. Only a human merges it.</p>
              </div>
              <div className="sx-ticket" data-k="crew.ticket" aria-hidden="true">
                <span className="sx-slip">test_sync</span>
              </div>
              <p className="sx-cap is-on sx-crew-now" aria-live="polite"><span data-k="crew.now">{CREW_IDLE}</span></p>
              <HoldButton k="crew.hold" label="Hold to run" onHold={hold(crewRef)} />
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
            <Cap k="ring.c1" on={0.45} off={1.05} className="sx-rg-c1">Retrieval that knows when it doesn’t know.</Cap>
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
            <div className="sx-full" data-k="hall.page">
              <div className="sx-cp sx-ha-p1" data-k="hall.p1">
                <span className="sx-cp-lab">The toolbox</span>
                <span className="sx-ha-floor" aria-hidden="true" />
                <div className="sx-chest" data-k="hall.chest">
                  {LAYERS.map((l) => (
                    <div key={l.t} className="sx-drawer">
                      <ul>{l.i.map((x) => <li key={x}>{x}</li>)}</ul>
                      <span className="sx-drawer-n">{l.t}</span>
                    </div>
                  ))}
                  <span className="sx-chest-side" aria-hidden="true"><span className="sx-hatch" /></span>
                </div>
                <div className="sx-ha-tok" data-k="hall.tok" aria-hidden="true"><Walker /></div>
              </div>
              <div className="sx-cp sx-ha-p2" data-k="hall.p2">
                <span className="sx-cp-lab" data-k="hall.zoomN">Drawer 1 of 5</span>
                <strong className="display" data-k="hall.zoomT">Languages</strong>
                <p data-k="hall.zoomI">Python · Java · C++ · JavaScript · SQL</p>
              </div>
              <div className="sx-cp sx-ha-p3" data-k="hall.p3">
                <span className="sx-cp-lab">What comes out of it</span>
                <div className="sx-builds">
                  {CAPSULES.map((c) => (
                    <div key={c.t} className="sx-build" data-cursor="hot">
                      <Glyph kind={c.g} acc="violet" />
                      <strong className="display">{c.t}</strong>
                      <span>{c.i.join(' · ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Cap k="hall.c1" on={0.25} className="sx-ha-c1">Everything he builds comes out of one toolbox, five drawers deep.</Cap>
            <Cap k="hall.c2" on={1.85} className="sx-ha-c2">Three things come out of it most: agents, retrieval, and the screens people use them through.</Cap>
          </section>

          {/* ---------------- lift ---------------- */}
          <section className="sx-scene" data-scene="lift" data-acc="pink" data-surface="ink" aria-label="One question through the whole stack">
            <div className="sx-full sx-lift" data-k="lift.slab">
              <div className="sx-cp sx-lf-pn sx-lf-p1">
                <span className="sx-cp-lab">One build, five floors</span>
                <div className="sx-tower">
                  {FLOORS.map((f, i) => (
                    <div key={f.l} className="sx-floor">
                      <span className="num">{FLOORS.length - i}</span>
                      <strong className="display">{f.t}</strong>
                      <em>{f.l}</em>
                    </div>
                  ))}
                  <div className="sx-shaft" aria-hidden="true">
                    <span className="sx-hatch" />
                    <span className="sx-cable" data-k="lift.cable" />
                    <div className="sx-car" data-k="lift.car"><Walker /></div>
                  </div>
                </div>
              </div>
              <div className="sx-cp sx-lf-pn sx-lf-p2">
                <span className="sx-cp-lab">The question</span>
                <p className="sx-lf-q display">When did it ship?<span className="sx-caret" aria-hidden="true" /></p>
              </div>
              <div className="sx-cp sx-lf-pn sx-lf-p3" aria-hidden="true">
                <span className="sx-cp-lab">Floor</span>
                <svg viewBox="0 0 200 120" className="sx-dial">
                  <path d="M30 105 A70 70 0 0 1 170 105" />
                  {[0, 1, 2, 3, 4].map((i) => { const a = Math.PI * (1 - (i * 140 / 4 + 20) / 180); return <line key={i} x1={100 + 58 * Math.cos(a)} y1={105 - 58 * Math.sin(a)} x2={100 + 70 * Math.cos(a)} y2={105 - 70 * Math.sin(a)} />; })}
                  <g data-k="lift.needle"><line x1="100" y1="105" x2="100" y2="48" /><circle cx="100" cy="105" r="8" /></g>
                </svg>
                <b className="display" data-k="lift.num">5</b>
              </div>
              <div className="sx-cp sx-lf-pn sx-lf-p4">
                <span className="sx-cp-lab" data-k="lift.fl">Floor 5 · Interface</span>
                <strong className="display" data-k="lift.ft">React</strong>
                <p data-k="lift.fd">The car waits on the top floor.</p>
              </div>
              <div className="sx-cp sx-lf-pn sx-lf-p5" data-k="lift.say">
                <span className="sx-cp-lab">The answer</span>
                <p className="sx-lf-idle">Hold, and the question rides down.</p>
                <p className="sx-lf-dots" aria-hidden="true"><i /><i /><i /></p>
                <p className="sx-lf-a"><strong className="display">2 June.</strong> <span>Sources: 2 release notes.</span></p>
              </div>
              <Cap k="lift.c1" on={0.6} className="sx-lf-c1">One question, through every floor of one build.</Cap>
              <Cap k="lift.c2" on={1.0} className="sx-lf-c2">He built every floor himself, from the page you type into down to the database.</Cap>
              <HoldButton k="lift.hold" label="Hold to ask" onHold={hold(liftRef)} />
            </div>
          </section>

          {/* ---------------- record ---------------- */}
          <section className="sx-scene" data-scene="record" data-acc="teal" aria-label="On the record">
            <div className="sx-full sx-rec-ground" data-k="record.ground" />
            <div className="sx-rec-page">
              <div className="sx-pnl sx-rec sx-rec--cgpa">
                <header><span>CGPA</span><span>B.Tech CSE (AI/ML), VIIT Pune, class of 2027</span></header>
                <strong className="display" data-k="record.num">9.55</strong>
                <div className="sx-meter" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i}><b /></i>)}</div>
              </div>
              <div className="sx-pnl sx-rec sx-rec--ieee">
                <header><span>Co-author</span><span>IEEE, ICICIS 2026</span></header>
                <div className="sx-paper" data-k="record.paper">
                  <b>Pre-output truthfulness control in LLMs</b>
                  {PAPER_LINES.map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}
                  <em className="sx-paper-stamp" data-k="record.stamp">Published</em>
                </div>
                <strong className="display">IEEE</strong>
              </div>
              <div className="sx-pnl sx-rec sx-rec--lead">
                <header><span>AIMSS club</span><span>Tech Lead 2024–26</span></header>
                <div className="sx-room" aria-hidden="true">
                  <div className="sx-board"><i /><i /><i /></div>
                  <Walker className="sx-room-me" />
                  <div className="sx-crowd">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
                </div>
                <strong className="display">Lead</strong>
              </div>
              <div className="sx-pnl sx-rec sx-rec--ccna">
                <header><span>Certified</span><span>CISCO CCNAv7</span></header>
                <svg className="sx-net" viewBox="0 0 240 120" aria-hidden="true">
                  <path className="sx-net-links" d={NET_LINKS} pathLength="1" />
                  {NET_NODES.map(([x, y]) => <rect key={`${x}-${y}`} x={x - 9} y={y - 9} width="18" height="18" rx="4" />)}
                  <circle r="6" className="sx-net-pkt"><animateMotion dur="3.2s" repeatCount="indefinite" path={NET_ROUTE} /></circle>
                </svg>
                <strong className="display">CCNA</strong>
              </div>
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
  .sx-scene :is(button, a, .sx-build) { pointer-events: auto; }
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
    border-radius: 4px;
    background: var(--paper); color: var(--ink);
    box-shadow: 0 0 0 2px var(--ink), 5px 5px 0 var(--ink);
    font-size: var(--step--1); font-weight: 600; line-height: 1.42;
    clip-path: inset(0 100% 0 0 round 4px);
    transition: clip-path 0.75s var(--ease-out);
  }
  .sx-cap > span { display: block; opacity: 0; translate: 0 0.5em; transition: opacity 0.45s, translate 0.6s var(--ease-out); }
  .sx-cap.is-on { clip-path: inset(-60px -60px -60px -60px round 4px); }
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
  /* Its legs. Idle, one foot taps; walking, they stride. */
  .sx-tok { z-index: 1; }
  .sx-legs { position: absolute; left: 50%; top: 0.84em; width: 0.42em; height: 0.3em; translate: -50% 0; }
  .sx-legs i { position: absolute; top: 0; width: 0.085em; height: 0.26em; border-radius: 0.05em; background: #0E0E0D; transform-origin: 50% 0; }
  .sx-legs i::after { content: ''; position: absolute; left: -0.02em; bottom: -0.03em; width: 0.17em; height: 0.08em; border-radius: 0.06em; background: #0E0E0D; }
  .sx-legs i:first-child { left: 0.06em; }
  .sx-legs i:last-child { right: 0.06em; animation: sx-tap 2.6s var(--ease-in-out) infinite; transform-origin: 50% 0; }
  @keyframes sx-tap { 0%, 70%, 100% { rotate: 0deg; } 78% { rotate: -16deg; } 86% { rotate: 0deg; } 92% { rotate: -12deg; } }
  .is-walk .sx-legs i { animation: sx-stride 0.36s ease-in-out infinite alternate; }
  .is-walk .sx-legs i:last-child { animation-delay: -0.36s; }
  @keyframes sx-stride { from { rotate: -28deg; } to { rotate: 28deg; } }
  .is-walk .sx-tok { animation: sx-bob 0.36s ease-in-out infinite alternate; }
  @keyframes sx-bob { to { translate: 0 -0.05em; } }

  /* Comic panels: hard frames, ink borders, a hard offset shadow. */
  .sx-cp {
    position: absolute; overflow: hidden;
    border-radius: 4px;
    background: #FFFFFF; color: #0E0E0D;
    box-shadow: 0 0 0 3px #0E0E0D, 7px 7px 0 #0E0E0D;
  }
  .sx-cp-lab {
    position: absolute; left: 0; top: 0; z-index: 5;
    padding: 0.35rem 0.75rem 0.4rem;
    border-radius: 0 0 4px 0;
    background: #0E0E0D; color: #FFFFFF;
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
  }
  /* Hatching, drawn with an ink-coloured mask so it follows the theme. */
  .sx-hatch {
    position: absolute; inset: 0; background-color: #0E0E0D; opacity: 0.32;
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9'%3E%3Cpath d='M-2 2 L2 -2 M0 9 L9 0 M7 11 L11 7' stroke='black' stroke-width='1.2'/%3E%3C/svg%3E");
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9'%3E%3Cpath d='M-2 2 L2 -2 M0 9 L9 0 M7 11 L11 7' stroke='black' stroke-width='1.2'/%3E%3C/svg%3E");
  }
  .sx-caret { display: inline-block; width: 0.1em; height: 1em; margin-left: 0.12em; vertical-align: -0.12em; background: currentColor; animation: sx-blink 1s steps(1) infinite; }
  @keyframes sx-blink { 50% { opacity: 0; } }

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
  .sx-climb-world { transform-origin: 50% 50%; }
  .sx-cl-p1 { left: 4%; top: 13%; width: 57%; height: 76%; }
  .sx-room-wall { inset: 0 0 14% 0; opacity: 0.12; }
  /* A wall clock running fast: the night goes by while the report gets written. */
  .sx-clock { position: absolute; left: 7%; top: 58%; width: 8%; aspect-ratio: 1; border-radius: 50%; background: #FFFFFF; box-shadow: 0 0 0 3px #0E0E0D; }
  .sx-clock i { position: absolute; left: 50%; bottom: 50%; width: 3px; margin-left: -1.5px; border-radius: 2px; background: #0E0E0D; transform-origin: 50% 100%; }
  .sx-clock i:first-child { height: 26%; animation: sx-spin 48s linear infinite; }
  .sx-clock i:last-child { height: 40%; background: var(--acc); animation: sx-spin 4s linear infinite; }
  @keyframes sx-spin { to { rotate: 360deg; } }
  .sx-mug { position: absolute; right: 8%; bottom: 28%; width: 7%; height: 10%; border-radius: 0 0 4px 4px; background: var(--acc); box-shadow: 0 0 0 3px #0E0E0D; }
  .sx-mug i { position: absolute; bottom: 125%; width: 3px; height: 70%; border-radius: 2px; background: #0E0E0D; opacity: 0; animation: sx-steam 2.4s ease-in-out infinite; }
  .sx-mug i:first-child { left: 30%; }
  .sx-mug i:last-child { left: 62%; animation-delay: 1.2s; }
  @keyframes sx-steam { 0% { opacity: 0; translate: 0 40%; } 40% { opacity: 0.7; } 100% { opacity: 0; translate: 0 -60%; scale: 1 1.3; } }
  .sx-room-win { position: absolute; left: 7%; top: 14%; width: 25%; height: 34%; border-radius: 3px; background: #0E0E0D; box-shadow: 0 0 0 3px #0E0E0D; overflow: hidden; }
  .sx-room-win::before, .sx-room-win::after { content: ''; position: absolute; background: #FFFFFF; z-index: 1; }
  .sx-room-win::before { left: 50%; top: 0; bottom: 0; width: 3px; margin-left: -1.5px; }
  .sx-room-win::after { top: 50%; left: 0; right: 0; height: 3px; margin-top: -1.5px; }
  .sx-room-win i { position: absolute; right: 14%; top: 14%; width: 38%; aspect-ratio: 1; border-radius: 50%; background: var(--acc); }
  .sx-room-floor { position: absolute; left: 0; right: 0; bottom: 14%; height: 3px; background: #0E0E0D; }
  .sx-desk { position: absolute; left: 40%; right: 5%; bottom: 14%; height: 72%; }
  .sx-mon {
    position: absolute; left: 12%; right: 8%; top: 0; height: 58%;
    display: grid; align-content: start; gap: 0.6rem;
    padding: 0.9rem 1rem; border-radius: 6px;
    background: #0E0E0D; color: #FFFFFF; box-shadow: 0 0 0 3px #0E0E0D;
    transition: background 0.3s;
  }
  .sx-mon-stage { margin: 0; font-family: var(--font-mono); font-size: clamp(0.72rem, 1.2vw, 0.95rem); font-weight: 600; color: var(--acc); }
  .sx-mon-stage::before { content: '> '; color: #FFFFFF; }
  .sx-climb-world.is-bad .sx-mon { background: var(--acc); }
  .sx-climb-world.is-bad .sx-mon-stage { color: #0E0E0D; }
  .sx-mon-lines { display: grid; gap: 0.45rem; }
  .sx-mon-l { display: block; height: 0.45rem; width: var(--w); border-radius: 3px; background: rgb(255 255 255 / 0.85); transform-origin: 0 50%; transform: scaleX(0); }
  .sx-mon-neck { position: absolute; left: 50%; top: 58%; width: 8%; height: 14%; translate: -50% 0; background: #0E0E0D; }
  .sx-desk-top { position: absolute; left: 0; right: 0; top: 72%; height: 7%; border-radius: 3px; background: #0E0E0D; }
  .sx-desk-leg { position: absolute; top: 79%; bottom: 0; width: 4%; background: #0E0E0D; left: 6%; }
  .sx-desk-leg + .sx-desk-leg { left: auto; right: 6%; }
  .sx-typist { position: absolute; left: 28%; bottom: 14%; }
  .sx-typist .sx-walker { position: relative; font-size: clamp(80px, 16vh, 150px); translate: -50% 0; animation: sx-type-bob 0.5s ease-in-out infinite alternate; transform-origin: 50% 100%; }
  @keyframes sx-type-bob { to { rotate: 4deg; } }
  .sx-cl-p2 { left: 64%; top: 12%; width: 32%; height: 34%; padding: 2.6rem 1.2rem 1rem; display: grid; align-content: start; gap: 0.8rem; }
  .sx-chk-sql { font-family: var(--font-mono); font-size: 0.74rem; line-height: 1.5; color: #5C5C58; }
  .sx-chk-fix, .sx-chk-say { display: inline-grid; }
  .sx-chk-fix em, .sx-chk-say em { grid-area: 1 / 1; font-style: normal; transition: opacity 0.3s, translate 0.4s var(--ease-out); }
  .sx-chk-fix em { color: #0E0E0D; font-weight: 600; text-decoration: underline wavy #0E0E0D; text-underline-offset: 3px; }
  .sx-chk-fix em:last-child { opacity: 0; translate: 0 60%; text-decoration: none; background: var(--acc); color: var(--acc-ink); padding: 0 0.3em; }
  .sx-cl-p2:is(.is-fix, .is-ok) .sx-chk-fix em:first-child { opacity: 0; translate: 0 -60%; }
  .sx-cl-p2:is(.is-fix, .is-ok) .sx-chk-fix em:last-child { opacity: 1; translate: 0 0; }
  .sx-chk-say { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: clamp(1.3rem, 2.6vw, 2.3rem); letter-spacing: -0.04em; line-height: 1.02; }
  .sx-chk-say em { opacity: 0; translate: 0 0.3em; }
  .sx-cl-p2:not(.is-bad):not(.is-fix):not(.is-ok) .sx-chk-say em:nth-child(1),
  .sx-cl-p2.is-bad .sx-chk-say em:nth-child(2),
  .sx-cl-p2.is-fix .sx-chk-say em:nth-child(3),
  .sx-cl-p2.is-ok .sx-chk-say em:nth-child(4) { opacity: 1; translate: 0 0; }
  .sx-cl-p2.is-bad { background: #0E0E0D; color: #FFFFFF; }
  .sx-cl-p2.is-bad .sx-chk-sql { color: rgb(255 255 255 / 0.6); }
  .sx-cl-p2.is-bad .sx-chk-fix em:first-child { color: #FFFFFF; text-decoration-color: var(--acc); }
  .sx-cl-p2.is-bad .sx-cp-lab { background: var(--acc); color: var(--acc-ink); }
  .sx-cl-p2 .sx-caret { position: absolute; right: 1.2rem; bottom: 1rem; font-size: 1.4rem; }
  .sx-cl-p3 { left: 64%; top: 52%; width: 32%; height: 37%; }
  .sx-print-out { position: absolute; left: 12%; right: 12%; top: 2.4rem; bottom: 30%; overflow: hidden; }
  .sx-print-paper {
    position: absolute; left: 6%; right: 6%; bottom: 0; top: 0;
    display: grid; align-content: start; gap: 0.35rem;
    padding: 0.8rem 0.9rem; background: #FFFFFF; box-shadow: inset 0 0 0 2px #0E0E0D;
    transform: translate3d(0, 100%, 0);
  }
  .sx-print-paper strong { font-size: clamp(0.8rem, 1.2vw, 1rem); letter-spacing: -0.03em; }
  .sx-print-paper p { margin: 0; display: grid; grid-template-columns: 2.8rem 1fr; gap: 0.4rem; align-items: center; font-size: 0.66rem; font-weight: 600; }
  .sx-print-paper i { display: block; height: 0.5rem; border-radius: 2px; background: var(--acc); width: calc(var(--v) * 100%); }
  .sx-print-stamp { position: absolute; right: 0.6rem; bottom: 0.7rem; padding: 0.25rem 0.6rem; border: 2px solid #0E0E0D; border-radius: 4px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; rotate: -12deg; opacity: 0; scale: 2; transition: opacity 0.2s, scale 0.4s var(--ease-out); background: #FFFFFF; }
  .sx-cl-p3.is-sent .sx-print-stamp { opacity: 1; scale: 1; }
  .sx-print-body { position: absolute; left: 6%; right: 6%; bottom: 8%; height: 24%; border-radius: 6px; background: #0E0E0D; }
  .sx-print-body::before { content: ''; position: absolute; left: 14%; right: 14%; top: 0.5rem; height: 4px; border-radius: 2px; background: rgb(255 255 255 / 0.3); }
  .sx-print-body i { position: absolute; right: 8%; bottom: 30%; width: 0.6rem; height: 0.6rem; border-radius: 50%; background: var(--acc); animation: sx-blink 0.9s steps(1) infinite; }
  .sx-cl-c1 { left: 2.5%; top: 9%; max-width: min(22rem, 78vw); }
  .sx-cl-c2 { left: 60%; top: 43%; max-width: min(18rem, 78vw); }

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
  .sx-crew { background: var(--acc); color: var(--acc-ink); --p: 0; overflow: hidden; }
  .sx-cr-c1 { left: 3%; top: 8.5%; }
  .sx-crew .sx-tok { background: #FFFFFF; }
  .sx-crew .sx-tok b { color: #0E0E0D; }
  .sx-cr-p0 { left: 3%; top: 17%; width: 30%; height: 39%; }
  .sx-cr-p1 { left: 35.5%; top: 14%; width: 28%; height: 42%; }
  .sx-cr-p2 { left: 66%; top: 17%; width: 31%; height: 39%; }
  .sx-cr-p3 { left: 3%; top: 60%; width: 44%; height: 33%; }
  .sx-cr-p4 { left: 50%; top: 60%; width: 47%; height: 33%; background: #0E0E0D; color: #FFFFFF; box-shadow: 0 0 0 3px #0E0E0D, 7px 7px 0 rgb(14 14 13 / 0.6); }
  .sx-cr-p4 .sx-cp-lab { background: #FFFFFF; color: #0E0E0D; }
  .sx-act { position: absolute; left: 34%; right: 5%; top: 2.6rem; bottom: 28%; display: grid; align-items: center; }
  .sx-cr-say { position: absolute; left: 5%; right: 5%; bottom: 0.8rem; margin: 0; font-size: var(--step--1); font-weight: 600; line-height: 1.35; }
  .sx-cr-ok { position: absolute; right: 0.7rem; top: 0.6rem; font-size: 1.5rem; opacity: 0; scale: 0.3; rotate: -20deg; transition: opacity 0.3s, scale 0.5s var(--ease-out), rotate 0.5s var(--ease-out); }
  .sx-cr-p.is-on .sx-cr-ok { opacity: 1; scale: 1; rotate: 0deg; }
  .sx-cr-who { position: absolute; left: 16%; top: 2.6rem; bottom: 28%; display: grid; place-items: end center; }
  .sx-cr-who .sx-walker { position: relative; font-size: clamp(56px, 10vh, 96px); }
  .sx-cr-p .sx-tok { background: var(--acc); }
  .sx-cr-p.is-run .sx-legs i { animation: sx-stride 0.36s ease-in-out infinite alternate; }
  .sx-cr-p.is-run .sx-legs i:last-child { animation-delay: -0.36s; }
  .sx-cr-p.is-run .sx-tok { animation: sx-bob 0.36s ease-in-out infinite alternate; }
  .sx-cr-who { translate: -50% 0; }
  .sx-cr-p:not(.is-run) .sx-act *, .sx-cr-p:not(.is-run) .sx-act *::after { animation-play-state: paused !important; }
  .sx-cr-p.is-run { box-shadow: 0 0 0 3px #0E0E0D, 7px 7px 0 #0E0E0D, 0 0 0 9px #FFFFFF; }
  .sx-sheet { position: relative; display: grid; gap: 0.35rem; padding: 0.6rem 0.7rem; border-radius: 3px; box-shadow: inset 0 0 0 2px #0E0E0D; font-family: var(--font-mono); font-size: 0.68rem; }
  .sx-sheet p { margin: 0; display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; }
  .sx-sheet b { position: relative; display: inline-grid; font-weight: 600; }
  .sx-sheet b > em { grid-area: 1 / 1; font-style: normal; padding: 0.05rem 0.4rem; border-radius: 3px; }
  .sx-sheet .is-pass { padding: 0.05rem 0.4rem; border-radius: 3px; background: var(--acc); }
  .sx-mag { position: absolute; left: 0; top: 0; width: 2.2rem; height: 2.2rem; border-radius: 50%; box-shadow: 0 0 0 3px #0E0E0D; background: rgb(255 255 255 / 0.3); animation: sx-mag 3.2s var(--ease-in-out) infinite; }
  .sx-mag i { position: absolute; left: 85%; top: 85%; width: 0.9rem; height: 0.3rem; border-radius: 2px; background: #0E0E0D; rotate: 45deg; transform-origin: 0 50%; }
  @keyframes sx-mag { 0%, 100% { translate: 10% 5%; } 33% { translate: 260% 60%; } 66% { translate: 120% 130%; } }
  .is-flip em:first-child, .sx-flip em:first-child { background: #0E0E0D; color: #FFFFFF; animation: sx-out 3.2s infinite; }
  .is-flip em:last-child, .sx-flip em:last-child { background: var(--acc); animation: sx-in 3.2s infinite; }
  .sx-sheet p:nth-child(3) .is-flip em { animation-delay: 0.8s; }
  @keyframes sx-out { 0%, 45% { opacity: 1; translate: 0 0; } 55%, 92% { opacity: 0; translate: 0 -60%; } 100% { opacity: 1; translate: 0 0; } }
  @keyframes sx-in { 0%, 45% { opacity: 0; translate: 0 60%; } 55%, 92% { opacity: 1; translate: 0 0; } 100% { opacity: 0; translate: 0 60%; } }
  .sx-sand { position: relative; height: 100%; }
  .sx-sand-scr { position: absolute; left: 0; right: 0; top: 0; height: 52%; display: grid; align-content: center; gap: 0.35rem; padding: 0.5rem 0.6rem; border-radius: 4px; background: #0E0E0D; }
  .sx-sand-scr i { display: block; height: 0.38rem; width: var(--w); border-radius: 2px; background: var(--acc); transform-origin: 0 50%; animation: sx-type 3.2s var(--d) infinite both; }
  @keyframes sx-type { 0% { transform: scaleX(0); } 30%, 85% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
  .sx-sand-box { position: absolute; left: 6%; right: 6%; bottom: 0; height: 34%; border: 3px solid #0E0E0D; border-top: 0; border-radius: 0 0 6px 6px; overflow: hidden; }
  .sx-sand-tag { position: absolute; right: 0; bottom: 38%; padding: 0.15rem 0.45rem; border-radius: 3px; background: #FFFFFF; box-shadow: 0 0 0 2px #0E0E0D; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.04em; rotate: 6deg; }
  .sx-lamps { display: grid; gap: 0.7rem; }
  .sx-lamps p { margin: 0; display: grid; grid-template-columns: auto 1fr auto; gap: 0.55rem; align-items: center; font-size: 0.74rem; font-weight: 600; }
  .sx-lamps i { width: 1.5rem; aspect-ratio: 1; border-radius: 50%; box-shadow: 0 0 0 3px #0E0E0D; }
  .sx-lamps .is-a { background: #0E0E0D; }
  .sx-lamps .is-b { background: #FFFFFF; animation: sx-lamp 1.6s steps(1) infinite; }
  @keyframes sx-lamp { 50% { background: var(--acc); } }
  .sx-lamps b { font-family: var(--font-mono); font-size: 0.66rem; padding: 0.05rem 0.4rem; border-radius: 3px; background: #0E0E0D; color: #FFFFFF; }
  .sx-lamps p + p b { background: var(--acc); color: var(--acc-ink); }
  .sx-diff { position: relative; display: grid; gap: 0.45rem; padding: 0.6rem 0.7rem; border-radius: 3px; box-shadow: inset 0 0 0 2px #0E0E0D; }
  .sx-diff p { margin: 0; display: flex; gap: 0.5rem; align-items: center; font-family: var(--font-mono); font-size: 0.7rem; }
  .sx-diff p i { display: block; height: 0.42rem; border-radius: 2px; }
  .sx-diff .is-del i { background: #0E0E0D; opacity: 0.25; }
  .sx-diff .is-add i { background: var(--acc); }
  .sx-diff-stamp { position: absolute; right: 0.8rem; bottom: 0.4rem; padding: 0.25rem 0.6rem; border: 3px solid #0E0E0D; border-radius: 4px; background: #FFFFFF; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; rotate: -10deg; animation: sx-stamp 3s var(--ease-out) infinite; }
  @keyframes sx-stamp { 0%, 35% { opacity: 0; scale: 2.2; } 45%, 90% { opacity: 1; scale: 1; } 100% { opacity: 0; scale: 1; } }
  .sx-cr-p.is-on:not(.is-run) .sx-diff-stamp { animation: none; opacity: 1; }
  .sx-door { position: absolute; left: 44%; right: 8%; top: 2.4rem; bottom: 28%; border: 3px solid #FFFFFF; border-bottom: 0; border-radius: 6px 6px 0 0; }
  .sx-door-sign { position: absolute; left: 50%; top: 18%; translate: -50% 0; padding: 0.2rem 0.6rem; border-radius: 3px; background: #FFFFFF; color: #0E0E0D; font-weight: 700; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
  .sx-door-lock { position: absolute; left: 50%; top: 50%; translate: -50% -50%; font-size: 1.8rem; }
  .sx-door-knob { position: absolute; right: 10%; top: 58%; width: 0.7rem; height: 0.7rem; border-radius: 50%; background: #FFFFFF; }
  .sx-cr-p4 .sx-cr-say { right: 8%; }
  .sx-ticket { position: absolute; left: 0; top: 0; z-index: 8; width: 0; height: 0; }
  .sx-slip {
    position: absolute; left: 0; top: 0; translate: -10% -50%; z-index: 2; white-space: nowrap;
    padding: 0.35rem 0.7rem; border-radius: 3px;
    background: #FFFFFF; color: #0E0E0D; box-shadow: 0 0 0 2px #0E0E0D, 4px 4px 0 #0E0E0D;
    font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; rotate: -8deg;
  }
  .sx-ticket.is-walk .sx-slip { animation: sx-flap 0.3s ease-in-out infinite alternate; }
  @keyframes sx-flap { to { rotate: 6deg; } }
  .sx-crew-now { left: auto; right: 3%; top: 9%; max-width: min(24rem, 44vw); --paper: #0E0E0D; --ink: #FFFFFF; box-shadow: 0 0 0 2px #0E0E0D, 5px 5px 0 rgb(14 14 13 / 0.35); }
  .sx-crew .sx-hold { left: 48.5%; top: 76.5%; bottom: auto; translate: -50% -50%; z-index: 9; width: clamp(5rem, 10vh, 6.4rem); }
  .sx-cr-p4 .sx-cr-say { left: 10%; }

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
  .sx-ha-p1 { left: 3%; top: 13%; width: 58%; height: 80%; }
  .sx-ha-floor { position: absolute; left: 0; right: 0; bottom: 9%; height: 3px; background: #0E0E0D; }
  .sx-chest { position: absolute; left: 5%; bottom: 9%; width: 30%; height: 70%; }
  .sx-chest-side { position: absolute; inset: -3% -4% 0 -4%; z-index: 2; border-radius: 6px 6px 0 0; background: #0E0E0D; overflow: hidden; }
  .sx-chest-side .sx-hatch { inset: 0; background-color: #FFFFFF; opacity: 0.16; }
  .sx-drawer {
    position: absolute; left: 0; width: 100%; height: 19%;
    display: flex; flex-direction: column; justify-content: flex-end;
    border: 3px solid #0E0E0D; border-top: 0; border-radius: 0 0 4px 4px;
    background: var(--acc);
  }
  .sx-drawer:nth-child(1) { top: 0.5%; }
  .sx-drawer:nth-child(2) { top: 20.5%; }
  .sx-drawer:nth-child(3) { top: 40.5%; }
  .sx-drawer:nth-child(4) { top: 60.5%; }
  .sx-drawer:nth-child(5) { top: 80.5%; }
  .sx-drawer { justify-content: space-between; padding: 0.35rem 0.4rem 0.3rem; }
  .sx-drawer ul { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0.25rem; }
  .sx-drawer li { padding: 0.1rem 0.4rem; border-radius: 3px; background: #FFFFFF; box-shadow: 0 0 0 2px #0E0E0D; font-size: clamp(0.56rem, 0.9vw, 0.72rem); font-weight: 700; color: #0E0E0D; }
  .sx-drawer-n { position: relative; z-index: 1; align-self: flex-end; margin: 0; padding: 0.15rem 0.45rem; border-radius: 3px; background: #0E0E0D; color: #FFFFFF; font-size: clamp(0.56rem, 0.9vw, 0.72rem); font-weight: 700; white-space: nowrap; }
  .sx-drawer::after { content: ''; position: absolute; right: -0.9rem; top: 35%; width: 0.7rem; height: 30%; border-radius: 0 4px 4px 0; background: #0E0E0D; }
  .sx-ha-tok { position: absolute; left: 0; top: 0; z-index: 4; }
  .sx-ha-tok .sx-walker { position: relative; font-size: clamp(48px, 8vh, 80px); translate: -50% -1.14em; }
  .sx-ha-p2 { left: 64%; top: 13%; width: 33%; height: 29%; padding: 2.8rem 1.3rem 1.2rem; display: grid; align-content: start; gap: 0.6rem; }
  .sx-ha-p2 strong { font-size: clamp(1.8rem, 3.6vw, 3.4rem); letter-spacing: -0.05em; line-height: 0.95; }
  .sx-ha-p2 p { margin: 0; font-weight: 650; font-size: var(--step-0); color: #5C5C58; }
  .sx-ha-p2.is-flash strong, .sx-ha-p2.is-flash p { animation: sx-flash 0.5s var(--ease-out); }
  @keyframes sx-flash { from { opacity: 0; translate: 0 0.4em; } }
  .sx-ha-p3 { left: 64%; top: 47%; width: 33%; height: 46%; padding: 2.6rem 0.9rem 0.9rem; }
  .sx-builds { display: grid; grid-auto-rows: 1fr; gap: 0.45rem; height: 100%; }
  .sx-build {
    display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 0.7rem; align-items: center;
    padding: 0.5rem 0.7rem; border-radius: 4px; box-shadow: inset 0 0 0 2px #0E0E0D;
    opacity: 0; translate: 2rem 0; transition: opacity 0.4s, translate 0.6s var(--ease-out), background 0.3s;
  }
  .sx-build.is-on { opacity: 1; translate: 0 0; }
  .sx-build:hover { background: var(--acc); }
  .sx-build .glyph { grid-row: 1 / 3; font-size: 1.5rem; }
  .sx-build strong { font-size: clamp(0.95rem, 1.5vw, 1.25rem); letter-spacing: -0.04em; line-height: 1; }
  .sx-build span { font-size: 0.7rem; font-weight: 550; color: #5C5C58; }
  .sx-ha-c1 { left: 2%; top: 9%; }
  .sx-ha-c2 { left: 60%; top: 39%; max-width: min(20rem, 78vw); }

  /* ---- lift ---- */
  .sx-lift { background: var(--paper); --p: 0; }
  .sx-lf-p1 { left: 3%; top: 12%; width: 37%; height: 82%; }
  .sx-tower { position: absolute; left: 0; right: 0; top: 2.3rem; bottom: 0; display: grid; grid-template-columns: 1fr 26%; grid-template-rows: repeat(5, 1fr); }
  .sx-floor {
    grid-column: 1; position: relative;
    display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 0.8rem; align-content: center;
    padding: 0.4rem 1rem; border-top: 3px solid #0E0E0D; border-right: 3px solid #0E0E0D;
  }
  .sx-floor .num { grid-row: 1 / 3; align-self: center; font-family: var(--font-display); font-weight: 800; font-size: clamp(1.4rem, 2.6vw, 2.2rem); color: #C9C9C3; }
  .sx-floor strong { font-size: clamp(1rem, 1.8vw, 1.5rem); letter-spacing: -0.04em; line-height: 1.05; }
  .sx-floor em { font-style: normal; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #91918B; }
  .sx-floor.is-on .num { color: #0E0E0D; }
  .sx-floor.is-here { background: var(--acc); color: var(--acc-ink); }
  .sx-floor.is-here em, .sx-floor.is-here .num { color: inherit; }
  .sx-shaft { grid-column: 2; grid-row: 1 / -1; position: relative; border-top: 3px solid #0E0E0D; overflow: hidden; }
  .sx-shaft .sx-hatch { opacity: 0.15; }
  .sx-cable { position: absolute; left: 50%; top: 0; width: 3px; height: 100%; margin-left: -1.5px; background: #0E0E0D; transform-origin: 50% 0; }
  .sx-car { position: absolute; left: 50%; top: 0; width: 0; height: 0; }
  .sx-car::before { content: ''; position: absolute; left: 50%; top: 50%; width: clamp(62px, 10vh, 96px); height: clamp(70px, 12vh, 110px); translate: -50% -55%; border-radius: 4px; background: #FFFFFF; box-shadow: 0 0 0 3px #0E0E0D; }
  .sx-car .sx-walker { position: absolute; left: 0; top: 0; font-size: clamp(40px, 6.5vh, 62px); translate: -50% -0.72em; }
  .sx-lf-p2 { left: 44%; top: 12%; width: 52%; height: 23%; padding: 2.6rem 1.4rem 1rem; display: grid; align-content: center; }
  .sx-lf-q { margin: 0; font-size: clamp(1.8rem, 4vw, 3.4rem); font-weight: 800; letter-spacing: -0.05em; line-height: 1; }
  .sx-lf-p3 { left: 44%; top: 40%; width: 24%; height: 28%; display: grid; place-items: center; padding-top: 1.6rem; }
  .sx-dial { width: 84%; overflow: visible; }
  .sx-dial path { fill: none; stroke: #0E0E0D; stroke-width: 6; stroke-linecap: round; }
  .sx-dial line { stroke: #0E0E0D; stroke-width: 5; stroke-linecap: round; }
  .sx-dial g { transform-origin: 100px 105px; }
  .sx-dial g line { stroke: var(--acc); stroke-width: 6; }
  .sx-dial g circle { fill: #0E0E0D; }
  .sx-lf-p3 b { position: absolute; right: 0.8rem; bottom: 0.4rem; font-size: clamp(2rem, 4vw, 3.2rem); letter-spacing: -0.05em; }
  .sx-lf-p4 { left: 71%; top: 40%; width: 25%; height: 28%; padding: 2.6rem 1.1rem 1rem; display: grid; align-content: start; gap: 0.4rem; }
  .sx-lf-p4 .sx-cp-lab { background: var(--acc); color: var(--acc-ink); }
  .sx-lf-p4 strong { font-size: clamp(1.4rem, 2.6vw, 2.2rem); letter-spacing: -0.045em; line-height: 1; }
  .sx-lf-p4 p { margin: 0; font-weight: 600; font-size: var(--step--1); color: #5C5C58; line-height: 1.35; }
  .sx-lf-p5 { left: 44%; top: 73%; width: 52%; height: 21%; display: grid; align-content: center; padding: 2.2rem 1.4rem 0.8rem; }
  .sx-lf-p5 p { grid-area: 1 / 1; margin: 0; transition: opacity 0.35s, translate 0.45s var(--ease-out); }
  .sx-lf-idle { font-weight: 650; color: #5C5C58; }
  .sx-lf-dots { display: flex; gap: 0.4rem; opacity: 0; }
  .sx-lf-dots i { width: 0.7rem; height: 0.7rem; border-radius: 50%; background: #0E0E0D; animation: sx-dots 1s ease-in-out infinite; }
  .sx-lf-dots i:nth-child(2) { animation-delay: 0.15s; }
  .sx-lf-dots i:nth-child(3) { animation-delay: 0.3s; }
  @keyframes sx-dots { 50% { translate: 0 -0.4rem; } }
  .sx-lf-a { opacity: 0; translate: 0 0.5em; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.2rem 0.8rem; }
  .sx-lf-a strong { font-size: clamp(1.6rem, 3.4vw, 2.8rem); letter-spacing: -0.05em; }
  .sx-lf-a span { font-weight: 650; padding: 0.15rem 0.5rem; border-radius: 3px; background: var(--acc); color: var(--acc-ink); }
  .sx-lf-p5.is-wait .sx-lf-idle, .sx-lf-p5.is-done .sx-lf-idle { opacity: 0; }
  .sx-lf-p5.is-wait .sx-lf-dots { opacity: 1; }
  .sx-lf-p5.is-done .sx-lf-a { opacity: 1; translate: 0 0; }
  .sx-lf-c1 { left: 2%; top: 7.5%; max-width: min(22rem, 78vw); }
  .sx-lf-c2 { left: 41%; top: 67.5%; max-width: min(24rem, 78vw); }
  .sx-lift .sx-hold { left: 42%; top: 87%; bottom: auto; translate: -50% -50%; width: clamp(5rem, 10vh, 6.4rem); }

  /* ---- record ---- */
  .sx-rec-ground { background: var(--paper); }
  .sx-rec-page {
    position: absolute; left: 50%; top: 54%; translate: -50% -50%;
    width: min(72rem, 92vw); height: min(36rem, 70vh);
    display: grid; gap: clamp(0.7rem, 1.6vw, 1.2rem);
    grid-template-columns: 1.25fr 1fr 1fr; grid-template-rows: 1fr 1fr;
    grid-template-areas: "a a b" "c d b";
  }
  .sx-rec { position: relative; display: flex; flex-direction: column; gap: 0.6rem; min-height: 0; padding: clamp(0.9rem, 1.8vw, 1.4rem); background: var(--paper-2); }
  .sx-rec header { display: flex; justify-content: space-between; gap: 1rem; font-size: var(--step--1); font-weight: 650; }
  .sx-rec header span + span { opacity: 0.7; text-align: right; font-weight: 550; }
  .sx-rec strong { margin-top: auto; font-size: clamp(2rem, 4.4vw, 4rem); letter-spacing: -0.06em; line-height: 0.85; }
  .sx-rec--cgpa { grid-area: a; background: var(--acc); color: var(--acc-ink); }
  .sx-rec--cgpa strong { font-size: clamp(4rem, 11vw, 10rem); font-variant-numeric: tabular-nums; }
  .sx-rec--ieee { grid-area: b; }
  .sx-rec--lead { grid-area: c; }
  .sx-rec--ccna { grid-area: d; }
  .sx-meter { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 5px; }
  .sx-meter i { position: relative; height: 0.7rem; border-radius: 3px; background: rgb(14 14 13 / 0.16); overflow: hidden; }
  .sx-meter b { position: absolute; inset: 0; background: var(--acc-ink); transform-origin: 0 50%; transform: scaleX(0); }
  .sx-paper {
    position: relative; flex: 1 1 auto; min-height: 0; overflow: hidden;
    display: grid; align-content: start; gap: 0.55rem;
    padding: clamp(0.8rem, 1.5vw, 1.2rem); border-radius: var(--r-s);
    background: #FFFFFF; color: #0E0E0D; box-shadow: 0 0 0 2px #0E0E0D, var(--ao-1);
  }
  .sx-paper b { font-weight: 700; font-size: var(--step-0); line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
  .sx-paper i { display: block; height: 0.4rem; border-radius: 4px; background: #DADAD4; transform-origin: 0 50%; transform: scaleX(0); }
  .sx-paper-stamp {
    position: absolute; right: 0.9rem; bottom: 0.9rem;
    padding: 0.3rem 0.7rem; border-radius: var(--r-s);
    box-shadow: inset 0 0 0 3px var(--acc); color: var(--acc);
    font-style: normal; font-weight: 800; font-size: var(--step-0); text-transform: uppercase; letter-spacing: 0.04em;
  }
  .sx-room { position: relative; flex: 1 1 auto; min-height: 0; }
  .sx-board { position: absolute; left: 50%; top: 2%; translate: -50% 0; width: 58%; height: 36%; display: grid; align-content: center; gap: 0.35rem; padding: 0 0.7rem; border-radius: var(--r-s); background: var(--paper); box-shadow: 0 0 0 2px var(--ink); }
  .sx-board i { display: block; height: 0.32rem; border-radius: 4px; background: var(--acc); transform-origin: 0 50%; animation: sx-type 3.6s infinite both; }
  .sx-board i:nth-child(2) { width: 70%; animation-delay: 0.4s; background: var(--ink-3); }
  .sx-board i:nth-child(3) { width: 84%; animation-delay: 0.8s; }
  .sx-room-me { position: absolute; left: 76%; top: 8%; font-size: clamp(28px, 4.6vh, 44px); animation: sx-bob 2.4s var(--ease-in-out) infinite; }
  .sx-crowd { position: absolute; left: 4%; right: 4%; bottom: 8%; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; justify-items: center; }
  .sx-crowd i { width: min(100%, 1.15rem); aspect-ratio: 1; border-radius: 50%; background: var(--ink); scale: 0; transition: scale 0.45s var(--ease-out); }
  .sx-crowd i:nth-child(3n) { background: var(--acc); box-shadow: 0 0 0 2px var(--ink); }
  .sx-crowd i.is-in { scale: 1; }
  .sx-net { flex: 1 1 auto; min-height: 0; width: 100%; overflow: visible; }
  .sx-net-links { fill: none; stroke: var(--ink); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; }
  .sx-net rect { fill: var(--paper); stroke: var(--ink); stroke-width: 2.5; }
  .sx-net-pkt { fill: var(--acc); stroke: var(--ink); stroke-width: 2; }
  .sx-rc-c1 { left: 4%; top: 11%; z-index: 2; }

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
    .sx-cl-p1 { left: 4%; top: 15%; width: 92%; height: 44%; }
    .sx-cl-p2 { left: 4%; top: 63%; width: 44%; height: 28%; padding: 2.2rem 0.7rem 0.6rem; }
    .sx-chk-sql { display: none; }
    .sx-cl-p3 { left: 52%; top: 63%; width: 44%; height: 28%; }
    .sx-cl-c1 { left: 4%; right: 4%; top: 7%; max-width: none; }
    .sx-cl-c2 { left: 4%; right: 4%; top: auto; bottom: 2%; max-width: none; }
    .sx-cr-c1 { left: 4%; right: 4%; top: 7%; max-width: none; }
    .sx-crew-now { left: 4%; right: 4%; top: 77%; max-width: none; }
    .sx-cr-p0 { left: 4%; top: 16%; width: 44%; height: 21%; }
    .sx-cr-p1 { left: 52%; top: 16%; width: 44%; height: 21%; }
    .sx-cr-p2 { left: 4%; top: 40%; width: 44%; height: 21%; }
    .sx-cr-p3 { left: 52%; top: 40%; width: 44%; height: 21%; }
    .sx-cr-p4 { left: 4%; top: 64%; width: 92%; height: 10%; }
    .sx-crew .sx-hold { left: 50%; top: auto; bottom: 2%; translate: -50% 0; }
    .sx-cr-say { display: none; }
    .sx-act { left: 40%; right: 4%; top: 2.1rem; bottom: 0.5rem; }
    .sx-cp-lab { font-size: 0.56rem; padding: 0.25rem 0.5rem; }
    .sx-sheet, .sx-diff { padding: 0.3rem; font-size: 0.5rem; gap: 0.15rem; }
    .sx-mag { width: 1.4rem; height: 1.4rem; }
    .sx-lamps p { grid-template-columns: auto auto; font-size: 0.56rem; gap: 0.3rem; }
    .sx-lamps span { display: none; }
    .sx-lamps i { width: 1rem; }
    .sx-diff-stamp { font-size: 0.56rem; }
    .sx-sand-tag { display: none; }
    .sx-door { left: 50%; top: 1.6rem; bottom: 0; }
    .sx-door-sign { font-size: 0.56rem; top: 8%; }
    .sx-door-lock { font-size: 1.1rem; top: 62%; }
    .sx-slip { font-size: 0.56rem; }
    .sx-cr-who { left: 20%; bottom: 0.5rem; }
    .sx-cr-who .sx-walker { font-size: 34px; }
    .sx-ha-p1 { left: 4%; top: 15%; width: 92%; height: 50%; }
    .sx-chest { width: 32%; }
    .sx-drawer ul { display: none; }
    .sx-ha-p2 { left: 4%; top: 69%; width: 44%; height: 26%; padding: 2.2rem 0.7rem 0.6rem; }
    .sx-ha-p2 strong { font-size: 1.3rem; }
    .sx-ha-p2 p { font-size: 0.7rem; }
    .sx-ha-p3 { left: 52%; top: 69%; width: 44%; height: 26%; padding: 2rem 0.5rem 0.5rem; }
    .sx-build { padding: 0.25rem 0.4rem; column-gap: 0.4rem; }
    .sx-build span { display: none; }
    .sx-build .glyph { font-size: 1rem; grid-row: auto; }
    .sx-build strong { font-size: 0.8rem; }
    .sx-ha-c1, .sx-ha-c2 { left: 4%; right: 4%; top: 7%; max-width: none; }
    .sx-lf-p1 { left: 4%; top: 15%; width: 50%; height: 70%; }
    .sx-floor { padding: 0.3rem 0.5rem; column-gap: 0.4rem; }
    .sx-floor em { display: none; }
    .sx-floor strong { font-size: 0.8rem; }
    .sx-floor .num { font-size: 1.1rem; }
    .sx-lf-p2 { left: 58%; top: 15%; width: 38%; height: 18%; padding: 2rem 0.6rem 0.5rem; }
    .sx-lf-q { font-size: 1.15rem; }
    .sx-lf-p3 { left: 58%; top: 36%; width: 38%; height: 20%; }
    .sx-lf-p4 { display: none; }
    .sx-lf-p5 { left: 58%; top: 59%; width: 38%; height: 26%; padding: 2rem 0.6rem 0.5rem; }
    .sx-lf-a strong { font-size: 1.3rem; }
    .sx-lf-a span, .sx-lf-idle { font-size: 0.7rem; }
    .sx-lf-c1, .sx-lf-c2 { left: 4%; right: 4%; top: 7%; max-width: none; }
    .sx-lift .sx-hold { left: 50%; top: auto; bottom: 2%; translate: -50% 0; }
    .sx-typist { left: 24%; }
    .sx-typist .sx-walker { font-size: 64px; }
    .sx-clock { width: 12%; top: 62%; }
    .sx-car::before { width: 40px; height: 46px; }
    .sx-car .sx-walker { font-size: 28px; }    .sx-lift .sx-hold { left: 50%; bottom: 3%; }
    .sx-shelf { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .sx-shelf-card:nth-child(n+7) { display: none; }
    .sx-rg-main { top: 45%; }
    .sx-rg-gauge { top: auto; bottom: 3%; left: 4%; right: auto; width: 8.5rem; }
    .sx-rg-say { right: 7%; bottom: 18%; padding: 0.75rem 0.95rem; }
    .sx-rg-say > span { font-size: 1.6rem; }
    .sx-rg-gauge p { font-size: 0.66rem; flex-direction: column; gap: 0.1rem; }
    .sx-rg-say-me { font-size: 44px; }
    .sx-rg-c1, .sx-rg-c2 { top: 11%; left: 4%; right: 4%; max-width: none; }
    .sx-rec-page { height: min(40rem, 74vh); grid-template-columns: 1fr 1fr; grid-template-rows: 0.9fr 1.2fr 1fr; grid-template-areas: "a a" "b b" "c d"; }
    .sx-rec header span + span { display: none; }
    .sx-rec--ieee strong { display: none; }
    .sx-paper b { font-size: var(--step--1); }
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
