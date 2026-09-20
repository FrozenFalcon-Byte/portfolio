import React from 'react';

/* Fractal noise as a repeating background — one SVG filter, no JS loop
   and no per-frame cost. It keeps the large flat areas of ink from
   reading as dead pixels; the texture the warm palette sits on. */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")";

const Grain = () => (
  <div className="grain" aria-hidden="true">
    <style>{`
      .grain {
        position: fixed;
        inset: 0;
        z-index: 9996;
        pointer-events: none;
        opacity: 0.038;
        mix-blend-mode: overlay;
        background-image: ${NOISE};
        background-repeat: repeat;
        animation: grainDrift 8s steps(6) infinite;
      }
      @keyframes grainDrift {
        0%   { background-position: 0 0; }
        16%  { background-position: -30px 10px; }
        33%  { background-position: 20px -25px; }
        50%  { background-position: -15px 30px; }
        66%  { background-position: 25px 15px; }
        83%  { background-position: -25px -15px; }
        100% { background-position: 0 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .grain { animation: none; }
      }
    `}</style>
  </div>
);

export default Grain;
