import React from 'react';

/* ------------------------------------------------------------------
   Glyph — a motion graphic that sits inside a line of display type.

   Superplay swaps single words of its headlines for little looping
   animations; this is ours. Each one is a tiny scene that says
   something about the sentence it lives in — an agent graph, a
   retrieval scan, a retry loop — drawn in the accent's ink on an
   accent pill, so colour enters the page through the type itself.

   The pill's width is `--gw` em times `--open`, and glyphsOpen() runs
   `--open` 0 → 1 on the scrollbar, so the words around it are pushed
   apart as the glyph opens. The drawing inside is a fixed width and
   centred, which means it is uncovered rather than squashed.

   Every loop is CSS or SMIL: they cost nothing on the main thread and
   pick up theme changes on their own because every colour is a token.
   ------------------------------------------------------------------ */

const H = 78;

const SCENES = {
  /* The logo, "a.", its full stop bouncing on repeat. */
  mark: (w) => (
    <g transform={`translate(${w / 2 - 50 * 0.62} ${H / 2 - 50 * 0.62}) scale(0.62)`}>
      <path d="M60 50 A22 22 0 0 0 16 50 A22 22 0 0 0 60 50" className="gl-stroke gl-mark" />
      <line x1="60" y1="28" x2="60" y2="72" className="gl-stroke gl-mark" />
      <circle cx="84" cy="72" r="8.5" className="gl-fill-ink gl-mark-dot" />
    </g>
  ),

  /* An agent graph with a charge walking its edges. */
  graph: (w) => {
    const pts = [[w * 0.18, 52], [w * 0.4, 22], [w * 0.62, 50], [w * 0.84, 24]];
    const d = `M${pts.map((p) => p.join(' ')).join(' L')}`;
    return (
      <g>
        <path d={d} className="gl-stroke" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="7.5" className="gl-node" style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
        <circle r="5" className="gl-fill-paper">
          <animateMotion dur="1.4s" repeatCount="indefinite" path={d} calcMode="spline"
            keyTimes="0;1" keySplines="0.6 0 0.4 1" />
        </circle>
      </g>
    );
  },

  /* Bars climbing out of order — data, forecasting. */
  bars: (w) => (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} className="gl-bar" x={w / 2 - 50 + i * 21} y="16" width="14" height="46" rx="5"
          style={{ animationDelay: `${i * 0.13}s` }} />
      ))}
    </g>
  ),

  /* Lines of output writing themselves, caret blinking at the end. */
  type: (w) => (
    <g transform={`translate(${w / 2 - 54} 0)`}>
      {[0, 1, 2].map((i) => (
        <rect key={i} className="gl-line" x="0" y={18 + i * 16} width={[96, 74, 52][i]} height="8" rx="4"
          style={{ animationDelay: `${i * 0.45}s` }} />
      ))}
      <rect className="gl-caret" x="60" y="48" width="5" height="14" rx="2" />
    </g>
  ),

  /* A shipment leaving: an arrow launched off the edge, on repeat. */
  ship: (w) => (
    <g>
      {[0, 1, 2].map((i) => (
        <rect key={i} className="gl-speed" x={w / 2 - 60} y={26 + i * 12} width="40" height="5" rx="2.5"
          style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
      <g className="gl-launch">
        <path d={`M${w / 2 - 8} 22 L${w / 2 + 22} 39 L${w / 2 - 8} 56 L${w / 2 - 1} 39 Z`} className="gl-fill-ink" />
      </g>
    </g>
  ),

  /* A speech bubble with the dots of someone typing. */
  chat: (w) => (
    <g transform={`translate(${w / 2} ${H / 2})`}>
      <path d="M-34 -20 h68 a12 12 0 0 1 12 12 v16 a12 12 0 0 1 -12 12 h-46 l-14 10 v-10 h-8 a12 12 0 0 1 -12 -12 v-16 a12 12 0 0 1 12 -12 z"
        className="gl-fill-paper" />
      {[-16, 0, 16].map((x, i) => (
        <circle key={x} cx={x} cy="0" r="5" className="gl-dot" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </g>
  ),

  /* Retrieval: a lens sweeps a page and lights the line it reads. */
  search: (w) => (
    <g transform={`translate(${w / 2 - 52} 0)`}>
      {[0, 1, 2].map((i) => (
        <rect key={i} className="gl-line gl-line--still" x="0" y={18 + i * 17} width={[104, 84, 96][i]} height="8" rx="4" />
      ))}
      <rect className="gl-hit" x="0" y="35" width="84" height="8" rx="4" />
      <g className="gl-lens">
        <circle cx="0" cy="34" r="15" className="gl-ring" />
        <line x1="11" y1="45" x2="22" y2="56" className="gl-stroke gl-stroke--fat" />
      </g>
    </g>
  ),

  /* Slabs dropping onto a stack — layers, the stack section. */
  stack: (w) => (
    <g transform={`translate(${w / 2 - 34} 0)`}>
      {[0, 1, 2].map((i) => (
        <rect key={i} className="gl-slab" x="0" y={50 - i * 16} width="68" height="12" rx="6"
          style={{ animationDelay: `${i * 0.28}s` }} />
      ))}
    </g>
  ),

  /* A signal running left to right. */
  wave: (w) => {
    let d = `M-80 ${H / 2}`;
    for (let x = -80; x < w + 80; x += 40) d += ` q10 -20 20 0 t20 0`;
    return (
      <g>
        <path d={d} className="gl-stroke gl-wave" />
      </g>
    );
  },

  /* A check drawing itself inside a ring — verified, validated. */
  check: (w) => (
    <g transform={`translate(${w / 2} ${H / 2})`}>
      <circle r="24" className="gl-ring" />
      <path d="M-11 0 L-3 9 L13 -9" pathLength="1" className="gl-stroke gl-tick" />
    </g>
  ),

  /* Two arrows chasing round — the self-correcting retry loop. */
  loop: (w) => (
    <g transform={`translate(${w / 2} ${H / 2})`}>
      <g className="gl-spin gl-spin--fast">
        <path d="M-22 -4 A22 22 0 0 1 14 -17" className="gl-stroke gl-stroke--fat" />
        <path d="M22 4 A22 22 0 0 1 -14 17" className="gl-stroke gl-stroke--fat" />
        <path d="M10 -25 L18 -16 L6 -11 Z" className="gl-fill-ink" />
        <path d="M-10 25 L-18 16 L-6 11 Z" className="gl-fill-ink" />
      </g>
    </g>
  ),

  /* A four-point spark, twinkling. */
  spark: (w) => (
    <g transform={`translate(${w / 2} ${H / 2})`}>
      <path className="gl-spark gl-fill-ink" d="M0 -26 C3 -6 6 -3 26 0 C6 3 3 6 0 26 C-3 6 -6 3 -26 0 C-6 -3 -3 -6 0 -26 Z" />
      <g transform="translate(24 -16) scale(0.32)">
        <path className="gl-spark gl-spark--b gl-fill-paper"
          d="M0 -26 C3 -6 6 -3 26 0 C6 3 3 6 0 26 C-3 6 -6 3 -26 0 C-6 -3 -3 -6 0 -26 Z" />
      </g>
    </g>
  ),

  /* A page turning — the paper. */
  doc: (w) => (
    <g transform={`translate(${w / 2 - 20} 12)`}>
      <rect width="40" height="54" rx="7" className="gl-fill-paper" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="8" y={11 + i * 9} width={[24, 18, 24, 12][i]} height="4" rx="2" className="gl-line gl-line--ink"
          style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
      <rect width="40" height="54" rx="7" className="gl-flip" />
    </g>
  ),

  /* A cloud with a build rising into it — deploying. */
  cloud: (w) => (
    <g transform={`translate(${w / 2} ${H / 2 + 2})`}>
      <g className="gl-fill-paper">
        <circle cx="-17" cy="4" r="14" />
        <circle cx="3" cy="-7" r="19" />
        <circle cx="22" cy="5" r="13" />
        <rect x="-31" y="4" width="66" height="14" rx="7" />
      </g>
      <g className="gl-up">
        <path d="M2 12 V-8 M-6 0 L2 -8 L10 0" className="gl-stroke gl-stroke--acc" />
      </g>
    </g>
  ),

  /* A git graph: a branch leaves main, takes two commits and merges
     back, with a charge riding the branch. */
  git: (w) => {
    const x = (o) => w / 2 + o;
    const branch = `M${x(-38)} 52 C${x(-24)} 52 ${x(-26)} 26 ${x(-10)} 26 L${x(20)} 26 C${x(36)} 26 ${x(32)} 52 ${x(46)} 52`;
    return (
      <g>
        <path d={`M${x(-62)} 52 H${x(62)}`} className="gl-stroke" />
        <path d={branch} className="gl-stroke" />
        {[[-58, 52], [-38, 52], [-6, 26], [16, 26], [46, 52], [62, 52]].map(([o, y], i) => (
          <circle key={i} cx={x(o)} cy={y} r="7" className="gl-node" style={{ animationDelay: `${i * 0.22}s` }} />
        ))}
        <circle r="5" className="gl-rider">
          <animateMotion dur="1.8s" repeatCount="indefinite" path={branch} calcMode="spline" keyTimes="0;1" keySplines="0.6 0 0.4 1" />
        </circle>
      </g>
    );
  },

  /* A wave hello, for the contact line. */
  hand: (w) => (
    <g transform={`translate(${w / 2 - 30} 9)`}>
      <g className="gl-hand">
        <rect x="3" y="31" width="9" height="24" rx="4.5" transform="rotate(-38 12 52)" className="gl-finger" />
        <rect x="14" y="10" width="9" height="34" rx="4.5" className="gl-finger" />
        <rect x="23.5" y="3" width="9" height="40" rx="4.5" className="gl-finger" />
        <rect x="33" y="6" width="9" height="38" rx="4.5" className="gl-finger" />
        <rect x="42.5" y="14" width="8.5" height="30" rx="4.25" className="gl-finger" />
        <rect x="13" y="30" width="38" height="30" rx="13" className="gl-finger" />
      </g>
      <path d="M57 6 Q63 12 62 20 M-2 40 Q-5 48 0 55" className="gl-stroke gl-swish" />
    </g>
  ),

  /* A cursor clicking — "get in touch", "ask". */
  click: (w) => (
    <g transform={`translate(${w / 2 - 6} 16)`}>
      <circle cx="4" cy="4" r="10" className="gl-ripple" />
      <path className="gl-press gl-fill-paper"
        d="M4.6 20.2 L3.9 6.5 C3.8 4.7 5.8 3.5 7.3 4.5 L18.8 11.9 C20.7 13.2 19.8 16.1 17.6 16.0 L13.0 15.9 C12.2 15.9 11.4 16.3 11.0 17.1 L8.8 21.1 C7.8 23.1 4.8 22.4 4.6 20.2 Z"
        transform="scale(2)" />
    </g>
  ),

  /* A database: a cylinder with a scan band sweeping down it. */
  db: (w) => (
    <g transform={`translate(${w / 2 - 22} 10)`}>
      <path d="M0 9 V49 A22 8 0 0 0 44 49 V9" className="gl-fill-ink" />
      <ellipse cx="22" cy="9" rx="22" ry="8" className="gl-fill-ink" />
      <ellipse cx="22" cy="9" rx="15" ry="4.2" className="gl-dbtop" />
      <path d="M0 22 A22 8 0 0 0 44 22" className="gl-stroke gl-stroke--acc gl-dbband" />
    </g>
  ),

  /* A plug sliding home into its socket — a connection, a protocol. */
  plug: (w) => (
    <g transform={`translate(${w / 2} ${H / 2})`}>
      <g className="gl-plug">
        <rect x="-46" y="-14" width="26" height="28" rx="8" className="gl-fill-ink" />
        <rect x="-22" y="-9" width="14" height="5" rx="2.5" className="gl-fill-ink" />
        <rect x="-22" y="4" width="14" height="5" rx="2.5" className="gl-fill-ink" />
      </g>
      <path d="M8 -18 H26 A12 12 0 0 1 38 -6 V6 A12 12 0 0 1 26 18 H8 Z" className="gl-fill-ink" />
      <rect x="10" y="-9" width="8" height="5" rx="2" className="gl-fill-acc" />
      <rect x="10" y="4" width="8" height="5" rx="2" className="gl-fill-acc" />
      <circle cx="-2" cy="0" r="3.5" className="gl-spark-hit" />
    </g>
  ),

  /* An agent: a head that looks around and blinks. */
  bot: (w) => (
    <g transform={`translate(${w / 2} ${H / 2 + 4})`}>
      <line x1="0" y1="-24" x2="0" y2="-32" className="gl-stroke" />
      <circle cx="0" cy="-34" r="5" className="gl-fill-ink gl-antenna" />
      <rect x="-26" y="-22" width="52" height="40" rx="14" className="gl-fill-ink" />
      <g className="gl-look">
        <rect x="-15" y="-9" width="9" height="13" rx="4.5" className="gl-fill-acc gl-eye" />
        <rect x="6" y="-9" width="9" height="13" rx="4.5" className="gl-fill-acc gl-eye" />
      </g>
    </g>
  ),

  /* Code: brackets breathing apart round a blinking caret. */
  code: (w) => (
    <g transform={`translate(${w / 2} ${H / 2})`}>
      <path d="M-26 -16 L-42 0 L-26 16" className="gl-stroke gl-stroke--fat gl-brk-l" />
      <path d="M26 -16 L42 0 L26 16" className="gl-stroke gl-stroke--fat gl-brk-r" />
      <path d="M8 -20 L-8 20" className="gl-stroke gl-stroke--fat" />
    </g>
  ),

  /* A padlock whose shackle lifts and snaps shut — security, access. */
  lock: (w) => (
    <g transform={`translate(${w / 2} ${H / 2 + 6})`}>
      <path d="M-13 -6 V-16 A13 13 0 0 1 13 -16 V-6" className="gl-stroke gl-stroke--fat gl-shackle" />
      <rect x="-22" y="-8" width="44" height="32" rx="9" className="gl-fill-ink" />
      <circle cx="0" cy="5" r="5" className="gl-fill-acc" />
      <rect x="-2.2" y="6" width="4.4" height="10" rx="2.2" className="gl-fill-acc" />
    </g>
  ),
};

const WIDTH = {
  mark: 1.35, graph: 1.9, bars: 1.5, type: 1.65, ship: 1.7, chat: 1.45,
  search: 1.7, stack: 1.3, wave: 1.8, check: 1.15, loop: 1.15, spark: 1.2,
  doc: 1.05, hand: 1.15, click: 1.15, cloud: 1.25, git: 1.6,
  db: 1.1, plug: 1.6, bot: 1.2, code: 1.45, lock: 1.05,
};

const Glyph = ({ kind = 'mark', acc = 'pink', label }) => {
  const gw = WIDTH[kind] ?? 1.4;
  const w = Math.round(gw * 100);
  return (
    <span
      className={`glyph glyph--${kind}`}
      data-acc={acc}
      style={{ '--gw': gw }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      <svg viewBox={`0 0 ${w} ${H}`} preserveAspectRatio="xMidYMid meet">
        {SCENES[kind]?.(w)}
      </svg>
    </span>
  );
};

export default Glyph;
