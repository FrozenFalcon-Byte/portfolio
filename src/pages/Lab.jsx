import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, ScrollTrigger, reduced, stepSnap } from '../lib/motion';
import Glyph from '../components/Glyph';
import { TransitionLink } from '../components/RouteCurtain';
import { PROJECTS } from '../data/projects';

/* ------------------------------------------------------------------
   The workshop — the projects drawn as a small town.

   Story is about time; this page is about structure. Each project is a
   building on an isometric map, and each floor of that building is one
   layer of how the thing actually works: FinMCP is a ledger with an
   MCP server on it and its clients on top, Swarm is four agent towers
   and a human at the gate, the classifier is a stack of network layers.

   The map starts as empty plots. Scrolling flies a camera to each one
   in turn — pulling back as it travels, pitching down as it lands —
   and the building goes up floor by floor while you read about it.
   The last step pulls right out and looks down on everything built.

   Like Story, nothing is CSS 3D: every face is projected by hand into
   one SVG each frame, so pitch can change continuously and the whole
   town stays crisp at any zoom.
   ------------------------------------------------------------------ */

const FH = 44;   // world height of one floor
const GAPZ = 1.5; // the slab line between storeys

/* Footprints are in world units on the ground grid; `at` is the plot's
   corner, towers are placed inside it. A floor with a label gets a
   callout when its building is in focus. */
const SITES = [
  {
    id: 'finmcp', at: [-520, -200],
    towers: [{ x: 0, y: 0, w: 150, d: 150, floors: ['Postgres · row-level security', 'MCP server · 34 tools', 'Web app + in-app agent', 'Claude Desktop · Code · Cursor'] }],
  },
  {
    id: 'trailhead', at: [-230, -520],
    towers: [{ x: 0, y: 0, w: 130, d: 160, floors: ['Any public GitHub repo', 'Snapshot + index', 'Cited answers', 'Reading tours · first issues'] }],
  },
  {
    id: 'swarm', at: [180, -540],
    towers: [
      { x: 0, y: 0, w: 66, d: 66, floors: ['', 'Triager'] },
      { x: 92, y: 0, w: 66, d: 66, floors: ['', '', 'Coder'] },
      { x: 0, y: 92, w: 66, d: 66, floors: ['', '', 'Tester'] },
      { x: 92, y: 92, w: 66, d: 66, floors: ['Reviewer'] },
      { x: 184, y: 120, w: 40, d: 40, floors: ['A human merges'], short: true },
    ],
  },
  {
    id: 'risk', at: [450, -210],
    towers: [
      { x: 0, y: 0, w: 80, d: 150, floors: ['', 'SQLite records'] },
      { x: 104, y: 0, w: 80, d: 150, floors: ['', '', 'ChromaDB vectors'] },
      { x: 52, y: 176, w: 80, d: 60, floors: ['Confidence filter', 'Gemini answer'] },
    ],
  },
  {
    id: 'billing', at: [380, 230],
    towers: [{ x: 0, y: 0, w: 170, d: 130, floors: ['Postgres tenant model', 'Roles + access', 'Invoices + receipts', 'Analytics'] }],
  },
  {
    id: 'imageproc', at: [-60, 470],
    towers: [
      { x: 0, y: 0, w: 70, d: 110, floors: ['', 'OCR · Tesseract'] },
      { x: 92, y: 0, w: 70, d: 110, floors: ['Background removal'] },
      { x: 184, y: 0, w: 70, d: 110, floors: ['', 'AI summary'] },
    ],
  },
  {
    id: 'nature', at: [-500, 250],
    towers: [{ x: 0, y: 0, w: 140, d: 140, thin: true, floors: ['Augmented data', 'Conv', 'Conv', 'Pool', 'Dense', 'Live inference · 94% val'] }],
  },
].map((s) => ({ ...s, p: PROJECTS.find((p) => p.id === s.id) }));

/* A glyph for every labelled floor, so a building reads at a glance:
   what is data, what is an agent, what a person touches. */
const FLOOR_GLYPH = {
  'Postgres · row-level security': 'lock', 'MCP server · 34 tools': 'plug', 'Web app + in-app agent': 'bot',
  'Claude Desktop · Code · Cursor': 'code', 'Any public GitHub repo': 'git', 'Snapshot + index': 'db',
  'Cited answers': 'search', 'Reading tours · first issues': 'ship', Triager: 'search', Coder: 'code',
  Tester: 'check', Reviewer: 'doc', 'A human merges': 'hand', 'SQLite records': 'db',
  'ChromaDB vectors': 'graph', 'Confidence filter': 'bars', 'Gemini answer': 'spark',
  'Postgres tenant model': 'db', 'Roles + access': 'lock', 'Invoices + receipts': 'doc', Analytics: 'bars',
  'OCR · Tesseract': 'type', 'Background removal': 'spark', 'AI summary': 'bot',
  'Augmented data': 'cloud', Conv: 'bars', Pool: 'stack', Dense: 'graph', 'Live inference · 94% val': 'ship',
};

const HUB = { x: -60, y: -60, w: 120, d: 120 };

/* The town sits on a board, like a model on a table, so the map is an
   object with edges rather than lines floating in the dark. */
const BOARD = { x0: -660, x1: 760, y0: -680, y1: 680, h: 46 };
const N = SITES.length + 2;      // overview, seven sites, the whole town

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/* Every tower, flattened, carrying where it sits and how tall it is,
   and sorted far-to-near so painting in order is correct. */
const TOWERS = (() => {
  const out = [];
  SITES.forEach((s, si) => s.towers.forEach((t) => {
    const fh = t.thin ? 22 : t.short ? 30 : FH;
    out.push({ ...t, si, acc: s.p.acc, fh, X: s.at[0] + t.x, Y: s.at[1] + t.y });
  }));
  return out.sort((a, b) => (a.X + a.Y + a.w / 2 + a.d / 2) - (b.X + b.Y + b.w / 2 + b.d / 2));
})();

/* Trees fill the board between the plots and the streets: scattered
   from a fixed seed so every visit grows the same town. */
const TREES = (() => {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const out = [];
  const clear = (x, y) => {
    if (Math.abs(x) < 110 && Math.abs(y) < 110) return false;
    if (Math.abs(x) < 26 || Math.abs(y) < 26) return false;
    return SITES.every((s) => s.towers.every((t) => {
      const ax = s.at[0] + t.x; const ay = s.at[1] + t.y;
      return x < ax - 60 || x > ax + t.w + 60 || y < ay - 60 || y > ay + t.d + 60;
    }));
  };
  for (let i = 0; i < 400 && out.length < 46; i += 1) {
    const x = BOARD.x0 + 40 + rnd() * (BOARD.x1 - BOARD.x0 - 80);
    const y = BOARD.y0 + 40 + rnd() * (BOARD.y1 - BOARD.y0 - 80);
    if (clear(x, y) && out.every((t) => Math.hypot(t.x - x, t.y - y) > 46)) out.push({ x, y, r: 11 + rnd() * 7 });
  }
  return out.sort((a, b) => (a.x + a.y) - (b.x + b.y));
})();

/* A plot is the towers' footprint plus a margin. */
const PLOTS = SITES.map((s) => {
  const xs = s.towers.flatMap((t) => [t.x, t.x + t.w]);
  const ys = s.towers.flatMap((t) => [t.y, t.y + t.d]);
  const m = 34;
  const x0 = s.at[0] + Math.min(...xs) - m; const x1 = s.at[0] + Math.max(...xs) + m;
  const y0 = s.at[1] + Math.min(...ys) - m; const y1 = s.at[1] + Math.max(...ys) + m;
  const top = Math.max(...s.towers.map((t) => t.floors.length * (t.thin ? 22 : t.short ? 30 : FH)));
  return { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, top };
});

const Lab = () => {
  const sceneRef = useRef(null);
  const mapRef = useRef(null);
  const stRef = useRef(null);
  const [at, setAt] = useState(0);
  const [flat] = useState(() => reduced());

  const mode = at === 0 || at === N - 1 ? 'map' : 'site';
  const focus = mode === 'site' ? at - 1 : -1;

  useEffect(() => {
    const svg = mapRef.current;
    const scene = sceneRef.current;
    const q = (s) => Array.from(svg.querySelectorAll(s));
    const roads = q('.lab-road');
    const lanes = q('.lab-lane');
    const traffic = q('.lab-traffic');
    const board = q('.lab-board polygon');
    const shadows = q('.lab-shadow');
    const trees = q('.lab-tree');
    const pulses = q('.lab-pulse');
    const plots = q('.lab-plot');
    const names = q('.lab-name');
    const hub = q('.lab-hub polygon');
    const hubMark = svg.querySelector('.lab-hub-mark');
    const floors = TOWERS.map((_, ti) => q(`[data-t="${ti}"] .lab-floor`).map((g) => Array.from(g.children)));
    const roofs = TOWERS.map((_, ti) => q(`[data-t="${ti}"] .lab-roof polygon`));
    const tags = TOWERS.map((_, ti) => tw0(ti));
    function tw0(ti) {
      return TOWERS[ti].floors.map((label, j) => (label ? {
        line: svg.querySelector(`[data-tag="${ti}-${j}"] path`),
        el: scene.querySelector(`[data-lab="${ti}-${j}"]`),
      } : null));
    }

    let W = 0; let H = 0; let small = false;
    const measure = () => {
      // Layout size, not the painted rect: the page arrives scaled by
      // the route transition, and a scaled measure leaves the map drawn
      // at one size and the HTML labels at another.
      W = scene.clientWidth; H = scene.clientHeight;
      small = W < 860;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    };
    measure();

    /* Camera stops. Overview sits low and wide; a site is close, steep
       and parked to the right of the reading panel; the finale pulls
       out and looks almost straight down on the finished town. */
    const fit = () => Math.min((W * (small ? 0.9 : 0.5)) / 1500, (H * (small ? 0.5 : 0.86)) / 900);
    const stops = () => {
      const z0 = fit();
      const ax = small ? 0.5 : 0.66;
      const sx = small ? 0.3 : 0.6;   // a close-up sits further left so its labels fit
      const ay = small ? 0.33 : 0.55;
      return [
        { fx: 0, fy: 0, fz: 0, zoom: z0 * 1.05, S: 0.36, ax, ay: small ? 0.36 : 0.52 },
        ...PLOTS.map((p) => ({
          fx: p.cx, fy: p.cy, fz: p.top * 0.45,
          zoom: z0 * (small ? 2.3 : 2.6), S: 0.52, ax: sx, ay,
        })),
        { fx: 0, fy: 0, fz: 0, zoom: z0 * 0.98, S: 0.66, ax, ay: small ? 0.36 : 0.5 },
      ];
    };
    let STOPS = stops();

    let target = flat ? 1 : 0; let cur = target;
    let last = '';

    const render = () => {
      cur += (target - cur) * 0.09;
      if (Math.abs(target - cur) < 1e-5) cur = target;
      const key = `${cur.toFixed(5)}|${W}|${H}`;
      if (key === last) return;
      last = key;

      const k = cur * (N - 1);
      const a = Math.min(N - 2, Math.floor(k));
      const t = smooth(clamp01((k - a - 0.1) / 0.8));
      const A = STOPS[a]; const B = STOPS[a + 1];
      const S = lerp(A.S, B.S, t);
      const C = Math.sqrt(1 - S * S);
      // The camera pulls back while it travels and comes in to land.
      const zoom = lerp(A.zoom, B.zoom, t) * (1 - 0.28 * Math.sin(t * Math.PI));
      const iso = (x, y, z) => [(x - y) * 0.866, (x + y) * S - z * C];
      const [fix, fiy] = iso(lerp(A.fx, B.fx, t), lerp(A.fy, B.fy, t), lerp(A.fz, B.fz, t));
      const ox = W * lerp(A.ax, B.ax, t); const oy = H * lerp(A.ay, B.ay, t);
      const P = (x, y, z) => {
        const [ix, iy] = iso(x, y, z);
        return [ox + (ix - fix) * zoom, oy + (iy - fiy) * zoom];
      };
      const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
      const poly = (...ps) => ps.map(pt).join(' ');
      const dpath = (...ps) => `M${ps.map(pt).join('L')}`;

      // Plots, the roads to them, and the names painted beside them.
      PLOTS.forEach((p, i) => {
        plots[i].setAttribute('points', poly(P(p.x0, p.y0, 0), P(p.x1, p.y0, 0), P(p.x1, p.y1, 0), P(p.x0, p.y1, 0)));
        const ex = Math.abs(p.cx) > Math.abs(p.cy) ? (p.cx > 0 ? p.x0 : p.x1) : p.cx;
        const ey = Math.abs(p.cx) > Math.abs(p.cy) ? p.cy : (p.cy > 0 ? p.y0 : p.y1);
        const d = dpath(P(0, 0, 0), P(ex, 0, 0), P(ex, ey, 0));
        roads[i].setAttribute('d', d);
        roads[i].style.strokeWidth = `${(30 * zoom).toFixed(2)}px`;
        lanes[i].setAttribute('d', d);
        traffic[i].setAttribute('d', d);
        pulses[i].setAttribute('d', d);
        const [nx, ny] = P(p.x1 + 18, p.y1 + 18, 0);
        names[i].setAttribute('x', nx.toFixed(1));
        names[i].setAttribute('y', ny.toFixed(1));
      });

      // The board: its top, and the two edges that face the camera.
      const { x0: bx0, x1: bx1, y0: by0, y1: by1, h: bh } = BOARD;
      board[0].setAttribute('points', poly(P(bx0, by1, 0), P(bx1, by1, 0), P(bx1, by1, -bh), P(bx0, by1, -bh)));
      board[1].setAttribute('points', poly(P(bx1, by0, 0), P(bx1, by1, 0), P(bx1, by1, -bh), P(bx1, by0, -bh)));
      board[2].setAttribute('points', poly(P(bx0, by0, 0), P(bx1, by0, 0), P(bx1, by1, 0), P(bx0, by1, 0)));

      // Trees: a round crown on a short trunk, each with its own shadow.
      TREES.forEach((tr, i) => {
        const [gx, gy] = P(tr.x, tr.y, 0);
        const [cx, cy] = P(tr.x, tr.y, tr.r * 1.6);
        const r = tr.r * zoom;
        const [shadow, trunk, crown] = trees[i].children;
        shadow.setAttribute('cx', (gx + r * 0.7).toFixed(1)); shadow.setAttribute('cy', gy.toFixed(1));
        shadow.setAttribute('rx', (r * 1.1).toFixed(1)); shadow.setAttribute('ry', (r * 1.1 * S).toFixed(1));
        trunk.setAttribute('d', dpath([gx, gy], [cx, cy]));
        trunk.style.strokeWidth = `${(3.2 * zoom).toFixed(2)}px`;
        crown.setAttribute('cx', cx.toFixed(1)); crown.setAttribute('cy', cy.toFixed(1)); crown.setAttribute('r', r.toFixed(1));
      });

      // The hub: a plinth with the mark on it.
      const hz = 26;
      const { x: hx, y: hy, w: hw, d: hd } = HUB;
      hub[0].setAttribute('points', poly(P(hx, hy + hd, 0), P(hx + hw, hy + hd, 0), P(hx + hw, hy + hd, hz), P(hx, hy + hd, hz)));
      hub[1].setAttribute('points', poly(P(hx + hw, hy, 0), P(hx + hw, hy + hd, 0), P(hx + hw, hy + hd, hz), P(hx + hw, hy, hz)));
      hub[2].setAttribute('points', poly(P(hx, hy, hz), P(hx + hw, hy, hz), P(hx + hw, hy + hd, hz), P(hx, hy + hd, hz)));
      const [mx, my] = P(0, 0, hz);
      hubMark.setAttribute('transform', `translate(${mx.toFixed(1)} ${my.toFixed(1)}) scale(${(zoom * 0.9).toFixed(3)})`);

      /* Buildings. A site starts going up just before the camera lands
         on it and each floor follows the one below. */
      const placed = [];
      TOWERS.forEach((tw, ti) => {
        const b = clamp01((k - (tw.si + 1) + 0.85) / 0.7);
        const n = tw.floors.length;
        let z = 0;
        tw.floors.forEach((label, j) => {
          const grow = smooth(clamp01(b * n - j));
          const [l, r, top, win, lite] = floors[ti][j];
          const tag = tags[ti][j];
          if (grow <= 0.001) {
            l.setAttribute('points', ''); r.setAttribute('points', ''); top.setAttribute('points', '');
            win.setAttribute('d', ''); lite.setAttribute('d', '');
            if (tag) { tag.line.style.opacity = '0'; tag.el.style.opacity = '0'; }
            return;
          }
          const h = (tw.fh - GAPZ) * grow;
          const { X: x, Y: y, w, d } = tw;
          l.setAttribute('points', poly(P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)));
          r.setAttribute('points', poly(P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)));
          top.setAttribute('points', poly(P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)));

          /* A storey, not a slab: a row of windows along both faces, a
             few of them lit, and a door in the middle of the ground floor. */
          let glass = ''; let lit = '';
          const za = z + h * 0.3; const zb = z + h * 0.78;
          const row = (len, at, face) => {
            const cols = Math.max(2, Math.floor(len / 24));
            const cell = len / cols; const ww = cell * 0.5;
            for (let c = 0; c < cols; c += 1) {
              const u0 = cell * c + (cell - ww) / 2; const u1 = u0 + ww;
              const door = j === 0 && face === 0 && c === Math.floor(cols / 2);
              const z0 = door ? z + 0.5 : za; const z1 = door ? z + h * 0.82 : zb;
              const q4 = face === 0
                ? [P(x + u0, at, z0), P(x + u1, at, z0), P(x + u1, at, z1), P(x + u0, at, z1)]
                : [P(at, y + u0, z0), P(at, y + u1, z0), P(at, y + u1, z1), P(at, y + u0, z1)];
              const dd = `${dpath(...q4)}Z`;
              if (!door && (ti * 7 + j * 3 + c * 5 + face) % 6 === 0) lit += dd; else glass += dd;
            }
          };
          if (h > 6) { row(w, y + d, 0); row(d, x + w, 1); }
          win.setAttribute('d', glass);
          lite.setAttribute('d', lit);
          if (tag) {
            const [ax0, ay0] = P(x + w, y + d / 2, z + h / 2);
            const pl = PLOTS[tw.si];
            // Beside the plot, but never past the screen's edge.
            if (!tag.w) tag.w = tag.el.offsetWidth;
            const tx = Math.min(W - tag.w - (small ? 10 : 30), Math.max(ax0 + (small ? 14 : 24), Math.min(
              Math.max(P(x + w, y, 0)[0], P(pl.x1, pl.y0, 0)[0]) + (small ? 12 : 22),
              W - tag.w - 30,
            )));
            placed.push({ tag, ax0, ay0, tx, ly: ay0, grow, si: tw.si });
          }
          z += tw.fh * grow;
        });

        // Its shadow, thrown down-right by a light from the far left.
        {
          const { X, Y, w, d } = tw;
          const len = z * 0.9;
          shadows[ti].setAttribute('points', z > 0.5
            ? poly(P(X, Y, 0), P(X + w + len, Y, 0), P(X + w + len, Y + d, 0), P(X, Y + d, 0))
            : '');
        }

        // A plant box on the roof once the last storey is up.
        const rg = smooth(clamp01((b * n - n + 0.4) / 0.4));
        const [rl, rr, rt] = roofs[ti];
        if (rg <= 0.001 || tw.thin) {
          rl.setAttribute('points', ''); rr.setAttribute('points', ''); rt.setAttribute('points', '');
        } else {
          const { X, Y, w, d } = tw;
          const bw = Math.max(14, w * 0.32); const bd = Math.max(14, d * 0.32);
          const bx = X + w * 0.58 - bw / 2; const by = Y + d * 0.36 - bd / 2;
          const bz = z - GAPZ; const bh = 11 * rg;
          rl.setAttribute('points', poly(P(bx, by + bd, bz), P(bx + bw, by + bd, bz), P(bx + bw, by + bd, bz + bh), P(bx, by + bd, bz + bh)));
          rr.setAttribute('points', poly(P(bx + bw, by, bz), P(bx + bw, by + bd, bz), P(bx + bw, by + bd, bz + bh), P(bx + bw, by, bz + bh)));
          rt.setAttribute('points', poly(P(bx, by, bz + bh), P(bx + bw, by, bz + bh), P(bx + bw, by + bd, bz + bh), P(bx, by + bd, bz + bh)));
        }
      });

      /* Towers on one plot can put floors at the same height, so a
         site's labels are spread into a column with room for each, and
         every leader bends once to reach its own label. */
      const gap = small ? 26 : 36;
      const bySite = {};
      placed.forEach((t) => { (bySite[t.si] ||= []).push(t); });
      Object.values(bySite).forEach((list) => {
        list.sort((p, q) => p.ay0 - q.ay0);
        for (let i = 1; i < list.length; i += 1) list[i].ly = Math.max(list[i].ly, list[i - 1].ly + gap);
        const shift = (list.reduce((acc, t) => acc + t.ly - t.ay0, 0)) / list.length;
        const tx = Math.max(...list.map((t) => t.tx));
        list.forEach((t) => {
          const ly = t.ly - shift;
          const bend = tx - 18;
          t.tag.line.setAttribute('d', `M${t.ax0.toFixed(1)} ${t.ay0.toFixed(1)}H${bend.toFixed(1)}L${tx.toFixed(1)} ${ly.toFixed(1)}`);
          t.tag.el.style.transform = `translate3d(${(tx + 6).toFixed(1)}px, ${ly.toFixed(1)}px, 0) translateY(-50%)`;
          t.tag.line.style.opacity = String(t.grow);
          t.tag.el.style.opacity = String(t.grow);
        });
      });
    };

    const ro = new ResizeObserver(() => { measure(); STOPS = stops(); last = ''; tags.flat().forEach((t) => { if (t) t.w = 0; }); });
    ro.observe(scene);
    const remeasure = () => { measure(); STOPS = stops(); last = ''; };
    window.addEventListener('resize', remeasure);
    ScrollTrigger.addEventListener('refresh', remeasure);
    gsap.ticker.add(render);
    render();

    if (flat) {
      return () => { gsap.ticker.remove(render); ro.disconnect(); window.removeEventListener('resize', remeasure); ScrollTrigger.removeEventListener('refresh', remeasure); };
    }

    const st = ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: () => `+=${window.innerHeight * 0.9 * (N - 1)}`,
      pin: true,
      onUpdate: (self) => {
        target = self.progress;
        setAt(Math.round(self.progress * (N - 1)));
      },
    });
    stRef.current = st;
    const unsnap = stepSnap(st, N);

    return () => {
      gsap.ticker.remove(render);
      ro.disconnect();
      window.removeEventListener('resize', remeasure);
      ScrollTrigger.removeEventListener('refresh', remeasure);
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

  const accAt = mode === 'site' ? SITES[focus].p.acc : 'yellow';

  const tagList = useMemo(() => TOWERS.map((tw, ti) => tw.floors.map((label, j) => (label ? (
    <g key={`${ti}-${j}`} className="lab-tag" data-tag={`${ti}-${j}`} data-site={tw.si}>
      <path />
    </g>
  ) : null))), []);

  return (
    <div className={`lab${flat ? ' is-flat' : ''}`}>
      <div className="lab-pinwrap">
        <section className="lab-scene" ref={sceneRef} data-surface="ink" data-acc={accAt} data-mode={mode} aria-label="The workshop">
          <svg className="lab-map" ref={mapRef} aria-hidden="true">
            <g className="lab-board">
              <polygon className="lab-board-l" /><polygon className="lab-board-r" /><polygon className="lab-board-top" />
            </g>
            {SITES.map((s, i) => <path key={`r${s.id}`} className={`lab-road${focus === i ? ' is-on' : ''}`} />)}
            {SITES.map((s) => <path key={`l${s.id}`} className="lab-lane" />)}
            {SITES.map((s, i) => <path key={`c${s.id}`} className="lab-traffic" style={{ animationDelay: `${-i * 0.7}s` }} />)}
            {SITES.map((s, i) => <path key={`q${s.id}`} className={`lab-pulse${focus === i ? ' is-on' : ''}`} data-acc={s.p.acc} />)}
            {SITES.map((s, i) => (
              <polygon key={`p${s.id}`} className={`lab-plot${focus === i ? ' is-on' : ''}`} data-acc={s.p.acc} />
            ))}
            {SITES.map((s, i) => (
              <text key={`n${s.id}`} className={`lab-name${focus === i ? ' is-on' : ''}`}>{s.p.title}</text>
            ))}

            <g className="lab-shadows">
              {TOWERS.map((tw, ti) => <polygon key={`s${ti}`} className="lab-shadow" />)}
            </g>
            <g className="lab-trees">
              {TREES.map((tr, i) => (
                <g key={i} className="lab-tree"><ellipse className="lab-tree-s" /><path className="lab-tree-t" /><circle className="lab-tree-c" /></g>
              ))}
            </g>

            <g className="lab-hub">
              <polygon className="lab-l" /><polygon className="lab-r" /><polygon className="lab-top" />
              <g className="lab-hub-mark">
                <g transform="translate(-30 -52) scale(0.6)">
                  <path d="M60 50 A22 22 0 0 0 16 50 A22 22 0 0 0 60 50" />
                  <line x1="60" y1="28" x2="60" y2="72" />
                  <circle cx="84" cy="72" r="8.5" />
                </g>
              </g>
            </g>

            {TOWERS.map((tw, ti) => (
              <g
                key={`t${ti}`}
                data-t={ti}
                data-acc={tw.acc}
                className={`lab-tower${focus === tw.si ? ' is-on' : ''}`}
              >
                {tw.floors.map((_, j) => (
                  <g key={j} className="lab-floor">
                    <polygon className="lab-l" /><polygon className="lab-r" /><polygon className="lab-top" />
                    <path className="lab-win" /><path className="lab-lit" />
                  </g>
                ))}
                <g className="lab-roof">
                  <polygon className="lab-l" /><polygon className="lab-r" /><polygon className="lab-top" />
                </g>
              </g>
            ))}

            <g className={`lab-tags${focus >= 0 ? ` is-site-${focus}` : ''}`}>{tagList}</g>
          </svg>

          <div className={`lab-labels${focus >= 0 ? ` is-site-${focus}` : ''}`} aria-hidden="true">
            {TOWERS.map((tw, ti) => tw.floors.map((label, j) => (label ? (
              <span key={`${ti}-${j}`} className="lab-lab" data-lab={`${ti}-${j}`} data-site={tw.si}>
                <Glyph kind={FLOOR_GLYPH[label] || 'spark'} acc={tw.acc} />
                {label}
              </span>
            ) : null)))}
          </div>

          <div className="lab-panels">
            <article className={`lab-p${at === 0 ? ' is-on' : ''}`} data-acc="yellow">
              <p className="lab-k"><span className="num">00</span> The workshop</p>
              <h1 className="display lab-t">Seven builds, <Glyph kind="stack" acc="yellow" /> one map.</h1>
              <p className="lab-b">
                Each building is a project and each floor is one layer of how it works.
                The plots are empty for now: scroll and the camera walks the map,
                putting each one up as it arrives.
              </p>
            </article>

            {SITES.map((s, i) => (
              <article key={s.id} className={`lab-p${at === i + 1 ? ' is-on' : ''}`} data-acc={s.p.acc}>
                <p className="lab-k"><span className="num">{s.p.n}</span> {s.p.kind}</p>
                <h2 className="display lab-t">{s.p.title}</h2>
                <p className="lab-b">{s.p.desc}</p>
                <p className="lab-tech">
                  {(s.p.tech || []).slice(0, 6).map((t) => <span key={t}>{t}</span>)}
                </p>
                <div className="lab-row">
                  <TransitionLink to="/#work" title="Work" kicker={s.p.title} className="lab-go" data-cursor="hot">
                    The full write-up
                    <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 L9 3 M4 3 H9 V8" /></svg>
                  </TransitionLink>
                  {s.p.links?.[0] && (
                    <a className="lab-alt" href={s.p.links[0].href} target="_blank" rel="noreferrer" data-cursor="hot">{s.p.links[0].label}</a>
                  )}
                </div>
              </article>
            ))}

            <article className={`lab-p${at === N - 1 ? ' is-on' : ''}`} data-acc="lime">
              <p className="lab-k"><span className="num">08</span> From above</p>
              <h2 className="display lab-t">All of it, built by one person who is still building.</h2>
              <p className="lab-b">That is the structure. The road that led to it is on the other page.</p>
              <div className="lab-row">
                <TransitionLink to="/story" title="Story" kicker="The long way round" className="lab-go" data-cursor="hot">
                  Read the story
                  <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 L9 3 M4 3 H9 V8" /></svg>
                </TransitionLink>
                <TransitionLink to="/#contact" title="Contact" kicker="Ajinkya Chavan · Portfolio" className="lab-alt" data-cursor="hot">Say hello</TransitionLink>
              </div>
            </article>
          </div>

          <ol className="lab-steps">
            {Array.from({ length: N }, (_, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={`lab-step${at === i ? ' is-on' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={i === 0 ? 'Overview' : i === N - 1 ? 'From above' : SITES[i - 1].p.title}
                  data-cursor-label={i === 0 ? 'Overview' : i === N - 1 ? 'From above' : SITES[i - 1].p.title}
                >
                  <i />
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <style>{`
        .lab-scene {
          position: relative;
          height: 100svh;
          overflow: hidden;
          background: var(--paper);
          color: var(--ink);
        }
        .lab-map {
          position: absolute; inset: 0;
          width: 100%; height: 100%; max-width: none;
          overflow: visible;
        }
        .lab-board-top { fill: var(--paper-2); }
        .lab-board-l { fill: color-mix(in srgb, var(--paper-2) 60%, #000); }
        .lab-board-r { fill: color-mix(in srgb, var(--paper-2) 40%, #000); }
        .lab-road { fill: none; stroke: var(--paper-3); stroke-width: 6; stroke-linecap: butt; stroke-linejoin: round; }
        .lab-lane { fill: none; stroke: var(--ink-3); stroke-width: 1.2; stroke-dasharray: 6 9; opacity: 0.55; }
        .lab-traffic {
          fill: none; stroke: var(--ink-2); stroke-width: 3.5; stroke-linecap: round;
          stroke-dasharray: 0.1 90; opacity: 0.8;
          animation: lab-drive 6s linear infinite;
        }
        @keyframes lab-drive { to { stroke-dashoffset: -180; } }
        .lab-shadow { fill: #000; opacity: 0.28; }
        .lab-tree-s { fill: #000; opacity: 0.22; }
        .lab-tree-t { fill: none; stroke: color-mix(in srgb, var(--ink) 22%, var(--paper)); stroke-linecap: round; }
        .lab-tree-c { fill: color-mix(in srgb, var(--ink) 20%, var(--paper-2)); stroke: color-mix(in srgb, var(--ink) 30%, var(--paper-2)); stroke-width: 1; }
        .lab-scene[data-mode="site"] .lab-trees { opacity: 0.75; }
        .lab-trees { transition: opacity 0.6s; }
        .lab-pulse {
          fill: none; stroke: var(--acc); stroke-width: 2.5; stroke-linecap: round;
          stroke-dasharray: 2 14; opacity: 0;
          transition: opacity 0.6s;
          animation: lab-flow 1.2s linear infinite;
        }
        .lab-pulse.is-on { opacity: 1; }
        @keyframes lab-flow { to { stroke-dashoffset: -32; } }
        .lab-plot {
          fill: var(--paper-3); stroke: var(--line); stroke-width: 1;
          transition: fill 0.6s, stroke 0.6s;
        }
        .lab-plot.is-on { fill: color-mix(in srgb, var(--acc) 14%, var(--paper)); stroke: var(--acc); }
        .lab-name {
          fill: var(--ink-2);
          font-family: var(--font-display); font-weight: 650; font-size: 15px; letter-spacing: -0.02em;
          transition: opacity 0.5s, fill 0.5s;
        }
        .lab-scene[data-mode="site"] .lab-name { opacity: 0; }

        .lab-l, .lab-r, .lab-top { stroke-width: 1; stroke-linejoin: round; transition: fill 0.6s, stroke 0.6s; }
        .lab-tower .lab-top { fill: var(--paper-3); stroke: var(--line); }
        .lab-tower .lab-l { fill: var(--paper-2); stroke: var(--line); }
        .lab-tower .lab-r { fill: color-mix(in srgb, var(--paper-2) 60%, #000); stroke: var(--line); }
        .lab-tower.is-on .lab-top { fill: var(--acc); stroke: var(--acc); }
        .lab-tower.is-on .lab-l { fill: color-mix(in srgb, var(--acc) 74%, #000); stroke: color-mix(in srgb, var(--acc) 74%, #000); }
        .lab-tower.is-on .lab-r { fill: color-mix(in srgb, var(--acc) 52%, #000); stroke: color-mix(in srgb, var(--acc) 52%, #000); }
        .lab-win, .lab-lit { stroke: none; transition: fill 0.6s; }
        .lab-tower .lab-win { fill: color-mix(in srgb, var(--paper) 70%, #000); }
        .lab-tower .lab-lit { fill: color-mix(in srgb, var(--ink) 55%, var(--paper)); }
        .lab-tower.is-on .lab-win { fill: color-mix(in srgb, var(--acc) 22%, #0E0E0D); }
        .lab-tower.is-on .lab-lit { fill: color-mix(in srgb, var(--acc) 30%, #FFFFFF); }

        .lab-hub .lab-top { fill: var(--ink); stroke: var(--ink); }
        .lab-hub .lab-l { fill: color-mix(in srgb, var(--ink) 70%, #000); stroke: none; }
        .lab-hub .lab-r { fill: color-mix(in srgb, var(--ink) 50%, #000); stroke: none; }
        .lab-hub-mark path, .lab-hub-mark line { fill: none; stroke: var(--paper); stroke-width: 13; stroke-linecap: round; }
        .lab-hub-mark circle { fill: var(--acc); }

        .lab-tower, .lab-hub, .lab-plot, .lab-road { transition: opacity 0.6s var(--ease-out); }
        .lab-scene[data-mode="site"] .lab-tower:not(.is-on),
        .lab-scene[data-mode="site"] .lab-hub,
        .lab-scene[data-mode="site"] .lab-plot:not(.is-on),
        .lab-scene[data-mode="site"] .lab-road:not(.is-on) { opacity: 0.3; }
        .lab-tag path { fill: none; stroke: var(--ink-2); stroke-width: 1; stroke-linejoin: round; opacity: 0; }
        .lab-tags .lab-tag, .lab-labels .lab-lab { visibility: hidden; }
        .lab-labels { position: absolute; inset: 0; pointer-events: none; }
        .lab-lab {
          position: absolute; left: 0; top: 0;
          display: inline-grid; grid-template-columns: 3.6rem auto; align-items: center; column-gap: 0.7rem;
          white-space: nowrap;
          font-size: 15px; font-weight: 650; letter-spacing: -0.01em; color: var(--ink);
          opacity: 0;
        }
        .lab-lab .glyph { font-size: 30px; margin: 0; justify-self: start; }
        ${SITES.map((_, i) => `.lab-tags.is-site-${i} .lab-tag[data-site="${i}"], .lab-labels.is-site-${i} .lab-lab[data-site="${i}"] { visibility: visible; }`).join('\n')}

        /* The reading panel. */
        .lab-panels {
          position: absolute;
          left: var(--gutter); top: 50%;
          translate: 0 -50%;
          width: min(30rem, 34vw);
          display: grid;
          padding: clamp(1.2rem, 2vw, 1.8rem);
          border-radius: var(--r-l);
          background: color-mix(in srgb, var(--paper) 86%, transparent);
          backdrop-filter: blur(10px);
          pointer-events: none;
        }
        .lab-p {
          grid-area: 1 / 1;
          opacity: 0;
          translate: 0 26px;
          filter: blur(10px);
          transition: opacity 0.45s var(--ease-out), translate 0.7s var(--ease-out), filter 0.5s var(--ease-out);
        }
        .lab-p.is-on {
          opacity: 1; translate: 0 0; filter: blur(0);
          pointer-events: auto;
          transition-delay: 0.15s;
        }
        .lab-k { display: flex; align-items: center; gap: 0.6rem; color: var(--ink-2); font-weight: 600; font-size: var(--step--1); margin: 0 0 1rem; }
        .lab-k .num {
          display: grid; place-items: center;
          min-width: 2.2rem; height: 2.2rem; padding: 0 0.5rem;
          border-radius: var(--r-pill);
          background: var(--acc); color: var(--acc-ink);
        }
        .lab-t {
          font-size: clamp(2.2rem, 4.2vw, 4.2rem);
          line-height: 0.96; letter-spacing: -0.05em; font-weight: 750;
          margin: 0 0 1.1rem;
        }
        .lab-b { color: var(--ink-2); line-height: 1.55; margin: 0; }
        .lab-tech { display: flex; flex-wrap: wrap; gap: 0.35rem 0; margin: 1.1rem 0 0; font-size: var(--step--1); font-weight: 600; }
        .lab-tech span + span::before { content: "·"; margin: 0 0.55em; color: var(--acc); }
        .lab-row { display: flex; flex-wrap: wrap; align-items: center; gap: 1.1rem; margin-top: 1.6rem; }
        .lab-go {
          display: inline-flex; align-items: center; gap: 0.55em;
          padding: 0.75rem 1.1rem;
          border-radius: var(--r-pill);
          background: var(--ink); color: var(--paper);
          font-weight: 600; font-size: var(--step--1);
          transition: background 0.4s var(--ease-out), color 0.4s var(--ease-out);
        }
        .lab-go svg { width: 0.7rem; height: 0.7rem; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.45s var(--ease-out); }
        .lab-go:hover { background: var(--acc); color: var(--acc-ink); }
        .lab-go:hover svg { transform: translate(2px, -2px); }
        .lab-alt { color: var(--ink-2); font-weight: 600; font-size: var(--step--1); transition: color 0.3s; }
        .lab-alt:hover { color: var(--acc); }

        .lab-steps {
          position: absolute;
          left: 50%; bottom: clamp(1rem, 3.5vh, 2rem);
          translate: -50% 0;
          display: flex; gap: 0.35rem;
          list-style: none; margin: 0; padding: 0.45rem 0.6rem;
          border-radius: var(--r-pill);
          background: var(--paper-2);
        }
        .lab-step {
          display: grid; place-items: center;
          width: 1.6rem; height: 1.2rem;
          background: none; border: 0; cursor: pointer; padding: 0;
        }
        .lab-step i {
          width: 6px; height: 6px; border-radius: 99px;
          background: var(--ink-3);
          transition: width 0.5s var(--ease-out), background 0.4s;
        }
        .lab-step:hover i { background: var(--ink); }
        .lab-step.is-on i { width: 1.4rem; background: var(--acc); }

        @media (max-width: 860px) {
          .lab-panels {
            top: auto; bottom: clamp(3.6rem, 9vh, 5rem); translate: none;
            left: var(--gutter); right: var(--gutter); width: auto;
          }
          .lab-t { font-size: clamp(1.8rem, 8vw, 2.6rem); margin-bottom: 0.7rem; }
          .lab-b { font-size: var(--step--1); }
          .lab-row { margin-top: 1rem; }
          .lab-lab { font-size: 12px; grid-template-columns: 2.6rem auto; column-gap: 0.5rem; }
          .lab-lab .glyph { font-size: 21px; }
        }

        .lab.is-flat .lab-scene { height: auto; min-height: 100svh; padding-bottom: 4rem; }
        .lab.is-flat .lab-map { position: relative; height: 70svh; }
        .lab.is-flat .lab-panels { position: static; translate: none; width: auto; padding: 0 var(--gutter); gap: 3rem; }
        .lab.is-flat .lab-p { grid-area: auto; opacity: 1; translate: none; filter: none; pointer-events: auto; }
        .lab.is-flat .lab-steps { display: none; }
      `}</style>
    </div>
  );
};

export default Lab;
