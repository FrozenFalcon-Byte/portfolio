import React from 'react';

/* ------------------------------------------------------------------
   The mark — "a."

   A lowercase a, built from the two strokes it actually needs: one
   round bowl and one stem. The full stop after it is the accent, so
   the logo takes on the colour of whichever section it is in.

   Each part has its own way to arrive, which is what the loader plays:
   the bowl draws round from the stem (pathLength="1", so one unit of
   dash offset is the whole circle), the stem drops down beside it, and
   the dot bounces in last like the end of a sentence.
   ------------------------------------------------------------------ */
export const MARK = {
  bowl: 'M60 50 A22 22 0 0 0 16 50 A22 22 0 0 0 60 50',
  stem: { x1: 60, y1: 28, x2: 60, y2: 72 },
  dot: { cx: 84, cy: 72, r: 8.5 },
};

const Mark = React.forwardRef(({ className = '', title, dot = true, ...rest }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 100 100"
    className={`mark ${className}`}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : 'true'}
    {...rest}
  >
    <path className="mark-bowl" d={MARK.bowl} pathLength="1" />
    <line className="mark-stem" {...MARK.stem} pathLength="1" />
    {dot && <circle className="mark-dot" {...MARK.dot} />}

    <style>{`
      .mark { overflow: visible; }
      .mark-bowl, .mark-stem {
        fill: none;
        stroke: currentColor;
        stroke-width: 13;
        stroke-linecap: round;
      }
      .mark-dot { fill: var(--acc); transform-box: fill-box; transform-origin: 50% 100%; }
    `}</style>
  </svg>
));

export default Mark;
