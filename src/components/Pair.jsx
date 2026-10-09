import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, reduced } from '../lib/motion';
import Glyph from './Glyph';
import { ARROW, HAND, CREASES } from './Cursor';
import { usePrefs } from '../lib/prefs';

/* ------------------------------------------------------------------
   Pair — two cursors, one pipeline.

   Four steps of a retrieval agent sit on a rack in the wrong order.
   My cursor comes in, runs them as they are, and the output shows what
   that order really does: it answers from memory and ships it. Then it
   sorts the rack by hand, one drag at a time, explaining each move, and
   runs it again. This time the answer comes back with sources.

   Then the rack is yours. Drag any step up or down and the pipeline
   re-runs on drop. The output is not canned per layout; it is worked
   out from the order, so every arrangement fails (or survives) for its
   own reason, and my cursor tells you which.

   One ticker writes the cursor and the tiles straight to the DOM; React
   only renders when the order, the log or the conversation changes.
   ------------------------------------------------------------------ */

const STEPS = [
  { k: 'Prompt', s: 'Reads the question', glyph: 'chat' },
  { k: 'Retrieve', s: 'Finds the passages', glyph: 'search' },
  { k: 'Reason', s: 'Writes the answer', glyph: 'bot' },
  { k: 'Check', s: 'Cites, or refuses', glyph: 'check' },
];
const START = [3, 0, 2, 1];
const SORTED = [0, 1, 2, 3];
const QUESTION = 'What is he building at Emerson?';

/* Walk the order like the agent would and say what each step did. */
const simulate = (order) => {
  let q = false; let ctx = false; let ans = null; let checkedAt = -1; let reasonAt = -1;
  const steps = order.map((id, p) => {
    if (id === 0) { q = true; return { id, tone: 'ok', text: 'Read the question.' }; }
    if (id === 1) {
      if (!q) return { id, tone: 'bad', text: 'Searched with no question. Came back empty.' };
      ctx = true; return { id, tone: 'ok', text: 'Found 3 passages on the Emerson work.' };
    }
    if (id === 2) {
      reasonAt = p;
      if (!q) return { id, tone: 'bad', text: 'No question yet. Wrote nothing useful.' };
      if (!ctx) { ans = 'memory'; return { id, tone: 'warn', text: 'Nothing retrieved, so it wrote from memory.' }; }
      ans = 'good'; return { id, tone: 'ok', text: 'Wrote the answer from those passages.' };
    }
    checkedAt = p;
    if (!ans) return { id, tone: 'bad', text: 'Nothing to check yet. Waved it through.' };
    if (ans === 'memory') return { id, tone: 'warn', text: 'No sources behind it. Blocked.' };
    return { id, tone: 'ok', text: 'Every claim has a source. Cleared.' };
  });
  const after = checkedAt > reasonAt;
  let verdict;
  if (!ans) verdict = { tone: 'bad', t: 'Nothing worth saying', b: 'Reason ran before there was a question to answer.' };
  else if (ans === 'good' && after) verdict = { tone: 'ok', t: 'Answered, with 3 sources', b: 'The PMO Command Centre: two agent systems in production at Emerson.' };
  else if (ans === 'good') verdict = { tone: 'bad', t: 'Shipped without a check', b: 'Right this time, by luck. Nothing made sure of it.' };
  else if (after) verdict = { tone: 'warn', t: 'Refused, nothing to cite', b: 'Check caught an answer written from memory.' };
  else verdict = { tone: 'bad', t: 'Made it up, and shipped it', b: 'Reasoned from memory with nothing checking it.' };
  return { steps, verdict };
};

const REMARK = {
  ok: ['Clean run. Still right.', 'Same answer, sources and all.', 'That is the one.'],
  warn: ['Check saved you there.', 'Close. Retrieve goes before Reason.', 'Caught, not shipped. Good.'],
  bad: ['Oof. That one shipped wrong.', 'Try Prompt, Retrieve, Reason, Check.', 'Bold. Wrong, but bold.'],
};

const same = (a, b) => a.every((v, i) => v === b[i]);

const Pair = () => {
  const { tag } = usePrefs();
  const stageRef = useRef(null);
  const rackRef = useRef(null);
  const runRef = useRef(null);
  const ghostRef = useRef(null);
  const tileRefs = useRef([]);
  const S = useRef(null);
  const [order, setOrder] = useState(START);
  const [say, setSay] = useState({ t: '', n: 0 });
  const [log, setLog] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [hot, setHot] = useState(-1);
  const [runs, setRuns] = useState(0);

  const talk = useCallback((t) => setSay((p) => ({ t, n: p.n + 1 })), []);

  const measure = useCallback(() => {
    const sb = stageRef.current.getBoundingClientRect();
    const rb = rackRef.current.getBoundingClientRect();
    const tile = tileRefs.current[0];
    return {
      W: sb.width, H: sb.height,
      small: sb.width < 600,
      rx: rb.left - sb.left, ry: rb.top - sb.top, rw: rb.width,
      row: tile ? tile.offsetHeight : 100,
      gap: parseFloat(getComputedStyle(rackRef.current).getPropertyValue('--gap')) || 10,
    };
  }, []);

  /* ---- a run: light each step in order, write what it did ---- */
  const run = useCallback(async (ord, onDone) => {
    const st = S.current;
    const token = (st.runToken || 0) + 1;
    st.runToken = token;
    const { steps, verdict: v } = simulate(ord);
    setLog([]); setVerdict(null);
    for (let p = 0; p < steps.length; p += 1) {
      setHot(steps[p].id);
      await new Promise((r) => setTimeout(r, reduced() ? 0 : 480));
      if (st.runToken !== token) return;
      setLog(steps.slice(0, p + 1));
    }
    await new Promise((r) => setTimeout(r, reduced() ? 0 : 300));
    if (st.runToken !== token) return;
    setHot(-1);
    setVerdict(v);
    setRuns((n) => n + 1);
    onDone?.(v);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const ghost = ghostRef.current;
    const st = {
      L: measure(),
      order: [...START],
      y: [],
      lift: STEPS.map(() => 0),
      g: { x: 0, y: 0 },
      drag: -1,
      dragY: 0,
      phase: 'idle',
      ptr: null,
      vis: false,
    };
    const pitch = () => st.L.row + st.L.gap;
    st.y = STEPS.map((_, id) => st.order.indexOf(id) * pitch());
    st.g.x = st.L.W + 40; st.g.y = st.L.H * 0.3;
    S.current = st;
    setOrder([...START]); setLog([]); setVerdict(null); setHot(-1);

    st.rest = () => (st.L.small
      ? [st.L.W * 0.5, st.L.ry - 20]
      : [st.L.rx + st.L.rw - 40, st.L.ry - 26]);

    st.setOrderFromDrag = () => {
      const id = st.drag;
      const slot = Math.max(0, Math.min(3, Math.round(st.dragY / pitch())));
      const cur = st.order.indexOf(id);
      if (slot !== cur) {
        st.order.splice(cur, 1);
        st.order.splice(slot, 0, id);
        setOrder([...st.order]);
      }
    };

    const tick = () => {
      if (!st.vis) return;
      if (st.phase === 'free' && st.drag < 0) {
        const [rx, ry] = st.rest();
        let tx = rx; let ty = ry;
        if (st.ptr) {
          tx = Math.min(st.L.W - 40, Math.max(30, st.ptr[0] + (st.ptr[0] > st.L.W * 0.55 ? -120 : 100)));
          ty = Math.min(st.L.H - 40, Math.max(30, st.ptr[1] + 60));
        }
        st.g.x += (tx - st.g.x) * 0.04;
        st.g.y += (ty - st.g.y) * 0.04;
      }
      if (st.carry) {
        st.dragY = st.g.y - st.L.ry - st.carry.off;
        st.setOrderFromDrag();
      }
      ghost.style.transform = `translate3d(${st.g.x.toFixed(1)}px, ${st.g.y.toFixed(1)}px, 0)`;
      // Keep the tag and the bubble inside the stage: the tag swings left
      // near the right edge, the bubble slides back and rises near the bottom.
      const fx = st.g.x > st.L.W - 110 ? '1' : '';
      const fy = st.g.y > st.L.H - 130 ? '1' : '';
      if (ghost.dataset.fx !== fx) ghost.dataset.fx = fx;
      if (ghost.dataset.fy !== fy) ghost.dataset.fy = fy;
      const bub = ghost.querySelector('.pr-say');
      const sx = bub ? Math.min(0, st.L.W - 10 - (st.g.x + 15) - bub.offsetWidth) : 0;
      ghost.style.setProperty('--sx', `${sx.toFixed(0)}px`);

      const P = pitch();
      STEPS.forEach((_, id) => {
        const el = tileRefs.current[id];
        if (!el) return;
        if (id === st.drag) st.y[id] = st.dragY;
        else st.y[id] += (st.order.indexOf(id) * P - st.y[id]) * 0.22;
        const l = st.lift[id];
        el.style.transform = `translate3d(0, ${st.y[id].toFixed(1)}px, 0) rotate(${(l * -1.2).toFixed(2)}deg) scale(${(1 + l * 0.025).toFixed(3)})`;
        el.style.zIndex = id === st.drag ? '5' : '1';
      });
    };
    gsap.ticker.add(tick);

    const seen = ScrollTrigger.create({
      trigger: stage, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { st.vis = self.isActive; },
    });
    const go = ScrollTrigger.create({
      trigger: stage, start: 'top 70%',
      onEnter: () => { if (st.phase === 'idle') st.start?.(); },
    });

    const ro = new ResizeObserver(() => {
      st.L = measure();
      st.y = STEPS.map((_, id) => st.order.indexOf(id) * pitch());
      if (st.phase === 'free') [st.g.x, st.g.y] = st.rest();
    });
    ro.observe(stage);

    return () => {
      gsap.ticker.remove(tick);
      seen.kill(); go.kill();
      ro.disconnect();
      st.token = -1; st.runToken = -1;
      gsap.killTweensOf(st.g);
    };
  }, [measure]);

  /* ---- the demo, as a script with a cancel token ---- */
  const start = useCallback(async () => {
    const st = S.current;
    if (!st) return;
    const token = (st.token || 0) + 1;
    st.token = token;
    const live = () => st.token === token;
    st.L = measure();
    const L = st.L;
    const P = L.row + L.gap;
    const ghost = ghostRef.current;
    const state = (s) => { ghost.dataset.state = s; };
    const pause = (s) => new Promise((r) => setTimeout(r, s * 1000));
    const move = (x, y, d = 0.85) => gsap.to(st.g, { x, y, duration: d, ease: 'power2.inOut', overwrite: true });

    gsap.killTweensOf(st.g);
    st.phase = 'demo';
    st.order = [...START]; setOrder([...START]);
    st.y = STEPS.map((_, id) => st.order.indexOf(id) * P);
    st.carry = null; st.drag = -1;

    if (reduced()) {
      st.order = [...SORTED]; setOrder([...SORTED]);
      st.y = STEPS.map((_, id) => id * P);
      [st.g.x, st.g.y] = st.rest();
      st.phase = 'free';
      talk('Drag any step. It re-runs on drop.');
      run(SORTED);
      return;
    }

    const runAt = () => {
      const rb = runRef.current.getBoundingClientRect(); const sb = stageRef.current.getBoundingClientRect();
      return [rb.left - sb.left + rb.width * 0.4, rb.top - sb.top + rb.height * 0.6];
    };
    const press = async () => {
      const [x, y] = runAt();
      await move(x, y, 0.8);
      if (!live()) return false;
      state('press'); await pause(0.16); state('hand');
      return true;
    };

    st.g.x = L.W + 40; st.g.y = L.ry + P;
    state('arrow');
    talk('Hey. This agent has a problem.');
    await move(L.rx + L.rw * 0.62, L.ry + P * 1.5, 1.1);
    if (!live()) return;
    await pause(0.9);
    talk('Watch what it does in this order.');
    if (!(await press())) return;
    await run([...st.order]);
    if (!live()) return;
    talk('It made something up, and nothing stopped it.');
    await pause(1.6);
    if (!live()) return;
    talk('Let me fix the order.');
    await pause(0.6);

    const LINES = ['Question goes first.', 'Then pull what the site actually says.', 'Reason only once it has something to read.'];
    for (let k = 0; k < 3; k += 1) {
      if (st.order[k] === k) continue;
      const y0 = st.y[k];
      const gx = L.rx + L.rw * (L.small ? 0.5 : 0.36);
      await move(gx, L.ry + y0 + L.row * 0.55, 0.7);
      if (!live()) return;
      state('press');
      st.carry = { off: st.g.y - L.ry - y0 };
      st.drag = k;
      st.dragY = y0;
      gsap.to(st.lift, { [k]: 1, duration: 0.2 });
      talk(LINES[k]);
      await move(gx, L.ry + k * P + st.carry.off, 0.9);
      if (!live()) return;
      // Settle the order here too, in case a frame never ran mid-drag.
      st.carry = null;
      st.dragY = k * P;
      st.setOrderFromDrag();
      st.drag = -1;
      gsap.to(st.lift, { [k]: 0, duration: 0.45, ease: 'back.out(3)' });
      state('hand');
      await pause(0.35);
    }
    talk('Check stays last. Again.');
    if (!(await press())) return;
    await run([...st.order]);
    if (!live()) return;
    state('arrow');
    talk('Your turn. Drag any step, it re-runs on drop.');
    st.phase = 'free';
  }, [measure, run, talk]);

  useEffect(() => { if (S.current) S.current.start = start; }, [start]);

  /* ---- the visitor's hands ---- */
  const takeOver = (msg = 'Ha, all yours then.') => {
    const st = S.current;
    if (st.phase === 'free') return;
    st.token = (st.token || 0) + 1;
    gsap.killTweensOf(st.g);
    if (st.drag >= 0) gsap.to(st.lift, { [st.drag]: 0, duration: 0.3 });
    st.carry = null; st.drag = -1;
    st.phase = 'free';
    ghostRef.current.dataset.state = 'arrow';
    talk(msg);
  };

  const local = (e) => {
    const sb = stageRef.current.getBoundingClientRect();
    return [e.clientX - sb.left, e.clientY - sb.top];
  };
  const onDown = (id) => (e) => {
    const st = S.current;
    if (!st) return;
    takeOver();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const [, py] = local(e);
    st.drag = id;
    st.dragOff = py - st.L.ry - st.y[id];
    st.dragY = st.y[id];
    st.before = [...st.order];
    gsap.to(st.lift, { [id]: 1, duration: 0.2 });
  };
  const onMove = (e) => {
    const st = S.current;
    if (!st) return;
    const [px, py] = local(e);
    st.ptr = [px, py];
    if (st.drag >= 0 && !st.carry) {
      const P = st.L.row + st.L.gap;
      st.dragY = Math.max(-st.L.row * 0.4, Math.min(3 * P + st.L.row * 0.4, py - st.L.ry - st.dragOff));
      st.setOrderFromDrag();
    }
  };
  const onUp = () => {
    const st = S.current;
    if (!st || st.drag < 0 || st.carry) return;
    const id = st.drag;
    st.drag = -1;
    gsap.to(st.lift, { [id]: 0, duration: 0.45, ease: 'back.out(3)' });
    if (same(st.before, st.order)) return;
    talk('Running it.');
    run([...st.order], (v) => {
      const list = REMARK[v.tone];
      talk(list[Math.floor(Math.random() * list.length)]);
    });
  };

  const onRun = () => {
    const st = S.current;
    if (st.phase !== 'free') takeOver('Go ahead, run it.');
    run([...st.order], (v) => { if (v.tone !== 'ok') talk(REMARK[v.tone][1]); });
  };
  const onReplay = () => { S.current.phase = 'idle'; start(); };

  const tone = verdict?.tone;

  return (
    <section id="pair" className="block pair" data-acc="teal">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow"><b>04</b>Pair with me</span>
          <span className="rule" />
        </div>

        <div className="pr-intro">
          <h2 className="display pr-head">
            <span>Order is</span>
            <span>the whole trick.</span>
          </h2>
          <p className="pr-blurb">
            Four steps of the kind of agent I ship. My cursor runs them wrong,
            shows you why, then fixes it. After that the rack is yours: move any
            step and see exactly what breaks.
          </p>
        </div>

        <div
          className="pr-stage"
          ref={stageRef}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={() => { if (S.current) S.current.ptr = null; }}
        >
          <div className="pr-bar">
            <div className="pr-here">
              <span className="pr-av pr-av--you">{tag}</span>
              <span className="pr-av pr-av--me">Ajinkya</span>
            </div>
            <div className="pr-acts">
              <button type="button" className="pr-btn" onClick={onReplay} data-cursor-label="Replay">Replay</button>
              <button type="button" className="pr-btn pr-btn--run" ref={runRef} onClick={onRun} data-cursor-label="Run">
                <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1.5 L8.5 5 L2.5 8.5 Z" /></svg>
                Run
              </button>
            </div>
          </div>

          <div className="pr-body">
            <div className="pr-rack" ref={rackRef}>
              {order.map((_, p) => (
                <span key={`n${p}`} className="pr-n num" style={{ top: `calc(${p} * (var(--row) + var(--gap)))` }}>
                  {String(p + 1).padStart(2, '0')}
                </span>
              ))}
              {STEPS.map((s, id) => (
                <div
                  key={s.k}
                  ref={(el) => { tileRefs.current[id] = el; }}
                  className={`pr-tile${hot === id ? ' is-hot' : ''}`}
                  onPointerDown={onDown(id)}
                  data-cursor="hot"
                  data-cursor-label="Drag"
                >
                  <span className="pr-tile-g"><Glyph kind={s.glyph} acc="teal" /></span>
                  <span className="pr-tile-w display">{s.k}</span>
                  <span className="pr-tile-s">{s.s}</span>
                </div>
              ))}
            </div>

            <div className="pr-out" data-surface="ink" aria-live="polite">
              <div className="pr-out-top">
                <span>Output</span>
                <span className="num">{runs ? `Run ${String(runs).padStart(2, '0')}` : 'Not run yet'}</span>
              </div>
              <p className="pr-q display">{QUESTION}</p>
              <ol className="pr-log">
                {STEPS.map((_, p) => {
                  const r = log[p];
                  return (
                    <li key={p} className={r ? `is-in t-${r.tone}` : ''}>
                      <b>{r ? STEPS[r.id].k : ''}</b>
                      <span>{r ? r.text : ''}</span>
                    </li>
                  );
                })}
              </ol>
              <div className={`pr-verdict${verdict ? ` is-in t-${tone}` : ''}`} key={runs}>
                {verdict && (
                  <>
                    <b>{verdict.t}</b>
                    <span>{verdict.b}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pr-ghost" ref={ghostRef} data-state="arrow" aria-hidden="true">
            <svg className="pr-shape pr-arrow" width="26" height="28" viewBox="0 0 26 28">
              <g className="pr-l1"><path d={ARROW} /></g><g className="pr-l2"><path d={ARROW} /></g><g className="pr-l3"><path d={ARROW} /></g>
            </svg>
            <svg className="pr-shape pr-hand" width="32" height="34" viewBox="0 0 32 34">
              <g className="pr-l1"><path d={HAND} /></g><g className="pr-l2"><path d={HAND} /></g><g className="pr-l3"><path d={HAND} /></g>
              <path className="pr-crease" d={CREASES} />
            </svg>
            <svg className="pr-shape pr-press" width="32" height="34" viewBox="0 0 32 34">
              <g transform="translate(16 18) scale(0.88) translate(-16 -18)">
                <g className="pr-l1"><path d={HAND} /></g><g className="pr-l2"><path d={HAND} /></g><g className="pr-l3"><path d={HAND} /></g>
                <path className="pr-crease" d={CREASES} />
              </g>
            </svg>
            <span className="pr-tag">Ajinkya</span>
            {say.t && <span className="pr-say" key={say.n}>{say.t}</span>}
          </div>
        </div>
      </div>

      <style>{`
        .pr-intro {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
          gap: 1.2rem 3rem; align-items: end;
          margin-bottom: clamp(1.6rem, 4vh, 2.6rem);
        }
        .pr-head {
          display: grid; margin: 0;
          font-size: var(--step-3); line-height: 0.95; letter-spacing: -0.05em; font-weight: 780;
        }
        .pr-head span:last-child { color: var(--acc); }
        .pr-blurb { margin: 0; color: var(--ink-2); }

        /* The stage is the section's accent, flat. Tiles are paper on it. */
        .pr-stage {
          position: relative;
          padding: clamp(14px, 2vw, 24px);
          border-radius: var(--r-l);
          background: var(--acc);
          color: var(--acc-ink);
          overflow: hidden;
          user-select: none;
          -webkit-user-select: none;
        }
        .pr-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: clamp(14px, 2vw, 22px); }
        .pr-here { display: flex; gap: 0.35rem; }
        .pr-av {
          display: inline-flex; align-items: center; height: 2.1rem; padding: 0 0.85rem;
          border-radius: 6px 15px 15px 15px;
          font-size: var(--step--1); font-weight: 600;
        }
        .pr-av--you { background: var(--ink); color: var(--paper); }
        .pr-av--me { background: #FFFFFF; color: #0E0E0D; }
        .pr-acts { display: flex; gap: 0.4rem; }
        .pr-btn {
          display: inline-flex; align-items: center; gap: 0.5em;
          height: 2.6rem; padding: 0 1.15rem;
          border: 0; border-radius: 99px; cursor: pointer;
          background: color-mix(in srgb, var(--acc-ink) 16%, transparent); color: var(--acc-ink);
          font: inherit; font-size: var(--step--1); font-weight: 650;
          transition: background 0.3s, color 0.3s, transform 0.3s var(--ease-out);
        }
        .pr-btn svg { width: 0.7rem; height: 0.7rem; fill: currentColor; }
        .pr-btn--run { background: var(--ink); color: var(--paper); }
        .pr-btn:hover { background: var(--paper); color: var(--ink); }
        .pr-btn:active { transform: scale(0.95); }

        .pr-body { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: clamp(14px, 2vw, 24px); align-items: stretch; }

        .pr-rack {
          --row: clamp(84px, 8vw, 108px); --gap: 10px;
          position: relative;
          height: calc(4 * var(--row) + 3 * var(--gap));
        }
        .pr-n {
          position: absolute; left: 0; height: var(--row);
          display: grid; place-items: center start;
          font-size: var(--step--1); font-weight: 650;
          color: color-mix(in srgb, var(--acc-ink) 72%, transparent);
        }
        .pr-tile {
          position: absolute; left: 3rem; right: 0; top: 0;
          height: var(--row);
          display: flex; align-items: center; gap: clamp(0.8rem, 1.6vw, 1.4rem);
          padding: 0 clamp(1.2rem, 2vw, 2rem) 0 10px;
          border-radius: 999px;
          background: var(--paper); color: var(--ink);
          cursor: grab; touch-action: none;
          will-change: transform;
          transition: background 0.35s, color 0.35s;
        }
        .pr-tile:active { cursor: grabbing; }
        .pr-tile-g {
          display: grid; place-items: center; flex: none;
          width: calc(var(--row) - 20px); height: calc(var(--row) - 20px);
          border-radius: 999px;
          background: var(--paper-2);
          font-size: clamp(1.5rem, 2.4vw, 2.2rem); line-height: 0;
          transition: background 0.35s;
        }
        .pr-tile-w { font-size: clamp(1.7rem, 3.4vw, 3.2rem); font-weight: 780; letter-spacing: -0.05em; line-height: 1; }
        .pr-tile-s { margin-left: auto; color: var(--ink-3); font-size: var(--step--1); font-weight: 550; white-space: nowrap; }
        .pr-tile.is-hot { background: var(--ink); color: var(--paper); }
        .pr-tile.is-hot .pr-tile-g { background: var(--acc); }
        .pr-tile.is-hot .pr-tile-s { color: color-mix(in srgb, var(--paper) 60%, transparent); }

        .pr-out {
          display: flex; flex-direction: column;
          padding: clamp(16px, 2vw, 26px);
          border-radius: calc(var(--r-l) - 10px);
        }
        .pr-out-top { display: flex; justify-content: space-between; color: var(--ink-3); font-size: var(--step--1); font-weight: 600; }
        .pr-q { margin: 0.8rem 0 1rem; font-size: var(--step-1); font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
        .pr-log { list-style: none; margin: 0; padding: 0; display: grid; }
        .pr-log li {
          display: grid; grid-template-columns: 5.8rem minmax(0, 1fr); gap: 0.8rem;
          padding: 0.5rem 0; min-height: 2.5rem;
          border-top: 1px solid var(--line-2);
          font-size: var(--step--1); line-height: 1.35;
        }
        .pr-log li b { font-weight: 650; display: flex; align-items: baseline; gap: 0.5rem; }
        .pr-log li.is-in { animation: pr-in 0.45s var(--ease-out) both; }
        .pr-log li.is-in b::before { content: ''; flex: none; width: 0.5rem; height: 0.5rem; border-radius: 99px; translate: 0 -0.05em; }
        .pr-log li span { color: var(--ink-2); }
        .t-ok b::before { background: var(--acc); }
        .t-warn b::before { background: #F4C531; }
        .t-bad b::before { background: #FF4D6D; }
        .pr-verdict {
          margin-top: auto; padding-top: 1rem;
          display: grid; gap: 0.3rem; min-height: 5.4rem; align-content: end;
        }
        .pr-verdict b { font-family: var(--font-display); font-size: var(--step-1); font-weight: 750; letter-spacing: -0.03em; line-height: 1.05; }
        .pr-verdict span { color: var(--ink-2); font-size: var(--step--1); }
        .pr-verdict.t-ok b { color: var(--acc); }
        .pr-verdict.t-warn b { color: #F4C531; }
        .pr-verdict.t-bad b { color: #FF4D6D; }
        .pr-verdict.is-in { animation: pr-in 0.6s var(--ease-out) both; }
        @keyframes pr-in { from { opacity: 0; transform: translateY(8px); } }

        /* My cursor: the site's own drawn pointer, white on the accent. */
        .pr-ghost {
          --cur-acc: #FFFFFF; --cur-ink: #0E0E0D; --cur-paper: #0E0E0D;
          --sx: 0px;
          position: absolute; left: 0; top: 0; z-index: 8;
          pointer-events: none; will-change: transform;
        }
        .pr-shape { position: absolute; left: -4px; top: -4px; display: none; overflow: visible; max-width: none; }
        .pr-hand, .pr-press { left: -12px; top: -1px; }
        .pr-ghost[data-state="arrow"] .pr-arrow,
        .pr-ghost[data-state="hand"] .pr-hand,
        .pr-ghost[data-state="press"] .pr-press { display: block; }
        .pr-l1 > * { fill: var(--cur-ink); stroke: var(--cur-ink); stroke-width: 7.5; stroke-linejoin: round; }
        .pr-l2 > * { fill: var(--cur-paper); stroke: var(--cur-paper); stroke-width: 4; stroke-linejoin: round; }
        .pr-l3 > * { fill: var(--cur-acc); }
        .pr-crease { fill: none; stroke: var(--cur-ink); stroke-width: 1.3; stroke-linecap: round; opacity: 0.55; }
        .pr-tag, .pr-say { position: absolute; left: 0; top: 0; white-space: nowrap; }
        .pr-tag {
          translate: 15px 24px;
          display: inline-flex; align-items: center; height: 28px; padding: 0 12px;
          border-radius: 6px 15px 15px 15px;
          background: #FFFFFF; color: #0E0E0D;
          box-shadow: 0 0 0 1.5px #0E0E0D;
          font-size: 0.86rem; font-weight: 600;
        }
        .pr-say {
          translate: calc(15px + var(--sx)) 58px;
          max-width: 16rem; width: max-content; white-space: normal;
          padding: 0.6rem 0.9rem;
          border-radius: 6px 16px 16px 16px;
          background: #0E0E0D; color: #FAFAF7;
          box-shadow: 0 14px 30px -14px rgba(0, 0, 0, 0.5);
          font-size: 0.92rem; font-weight: 550; line-height: 1.3;
          /* Each line has its moment, then gets out of the way. */
          animation: pr-say 0.45s var(--ease-out) both, pr-hush 0.5s ease 4.5s forwards;
        }
        .pr-ghost[data-state="hand"] .pr-tag, .pr-ghost[data-state="press"] .pr-tag { translate: 16px 36px; }
        .pr-ghost[data-state="hand"] .pr-say, .pr-ghost[data-state="press"] .pr-say { translate: calc(16px + var(--sx)) 70px; }
        .pr-ghost[data-fx="1"] .pr-tag { left: auto; right: 0; translate: -8px 24px; border-radius: 15px 6px 15px 15px; }
        .pr-ghost[data-fy="1"] .pr-say { top: auto; bottom: 0; translate: calc(15px + var(--sx)) -16px; border-radius: 16px 16px 16px 6px; }
        @keyframes pr-hush { to { opacity: 0; } }
        @keyframes pr-say { from { opacity: 0; transform: translateY(-6px) scale(0.96); } }

        @media (max-width: 900px) {
          .pr-intro { grid-template-columns: 1fr; }
          .pr-body { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .pr-rack { --row: 64px; --gap: 8px; }
          .pr-tile { left: 2.2rem; padding-right: 1.1rem; }
          .pr-tile-g { width: 48px; height: 48px; font-size: 1.4rem; }
          .pr-tile-s { display: none; }
          .pr-tile-w { font-size: 1.6rem; }
          .pr-av { padding: 0 0.65rem; }
          .pr-btn { padding: 0 0.9rem; }
          .pr-log li { grid-template-columns: 4.8rem minmax(0, 1fr); }
          .pr-say { max-width: 12.5rem; }
        }
      `}</style>
    </section>
  );
};

export default Pair;
