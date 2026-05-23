import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Rolling Digit Column ──────────────────────────────────── */
const DigitColumn = React.forwardRef(({ style }, ref) => (
  <div style={{
    overflow: 'hidden',
    height: '1em',
    lineHeight: 1,
    position: 'relative',
    ...style
  }}>
    <div
      ref={ref}
      style={{
        transition: 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)',
        willChange: 'transform'
      }}
    >
      {[0,1,2,3,4,5,6,7,8,9].map(n => (
        <div key={n} style={{ height: '1em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {n}
        </div>
      ))}
    </div>
  </div>
));

/* ── Loader Component ──────────────────────────────────────── */
const Loader = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);

  // Stroke digit refs (wireframe)
  const sH = useRef(null); // hundreds
  const sT = useRef(null); // tens
  const sU = useRef(null); // units

  // Other HUD refs
  const matrixRef = useRef(null);
  const barsRef = useRef([]);

  // Animation state — kept outside React
  const progressRef = useRef(0);
  const displayRef = useRef(0);
  const prevDigitsRef = useRef([0, 0, 0]);
  const rafRef = useRef(null);
  const completedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setLoading(false);
    setTimeout(() => {
      document.body.style.overflow = '';
      if (onCompleteRef.current) onCompleteRef.current();
    }, 1500);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Matrix text
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>{}[]';
    const matrixInterval = setInterval(() => {
      if (!matrixRef.current) return;
      let str = '';
      for (let i = 0; i < 24; i++) str += chars[Math.floor(Math.random() * chars.length)];
      matrixRef.current.textContent = str;
    }, 50);

    // Progress target simulation
    const progressInterval = setInterval(() => {
      progressRef.current += Math.random() * 6 + 2;
      if (progressRef.current >= 100) {
        progressRef.current = 100;
        clearInterval(progressInterval);
      }
    }, 120);

    // RAF loop
    let lastTime = performance.now();

    const setDigit = (ref, digit) => {
      if (ref.current) {
        ref.current.style.transform = `translateY(-${digit * 10}%)`;
      }
    };

    const tick = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const target = progressRef.current;
      displayRef.current += (target - displayRef.current) * 8 * dt;
      if (displayRef.current > 99.9 && target >= 100) displayRef.current = 100;

      const val = displayRef.current;
      const displayInt = Math.min(Math.floor(val), 100);

      // Extract individual digits
      const h = Math.floor(displayInt / 100);       // 0 or 1
      const t = Math.floor((displayInt % 100) / 10); // 0-9
      const u = displayInt % 10;                      // 0-9
      const digits = [h, t, u];

      // Only update DOM when a digit actually changes
      if (digits[0] !== prevDigitsRef.current[0]) { setDigit(sH, digits[0]); }
      if (digits[1] !== prevDigitsRef.current[1]) { setDigit(sT, digits[1]); }
      if (digits[2] !== prevDigitsRef.current[2]) { setDigit(sU, digits[2]); }
      prevDigitsRef.current = digits;

      // Progress bars
      const litCount = Math.floor(val / 5);
      barsRef.current.forEach((bar, i) => {
        if (bar) bar.style.backgroundColor = i < litCount ? 'var(--accent-red)' : 'rgba(255,51,51,0.15)';
      });

      // Completion
      if (val >= 100 && !completedRef.current) {
        clearInterval(matrixInterval);
        setTimeout(finish, 400);
      }

      if (!completedRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearInterval(matrixInterval);
      clearInterval(progressInterval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [finish]);

  /* shared font style for the counter */
  const counterFont = {
    fontSize: 'clamp(7rem, 18vw, 14rem)',
    fontWeight: 900,
    lineHeight: 1,
    fontFamily: 'var(--font-heading)',
    fontVariantNumeric: 'tabular-nums',
    display: 'flex',
    alignItems: 'center',
    letterSpacing: '-0.05em',
    WebkitTextStroke: '2px var(--accent-red)'
  };

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loader"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)'
          }}
        >
          {/* ── Staggered Background Blinds ── */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 1 }}>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 1 }}
                exit={{ scaleY: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.76, 0, 0.24, 1] }}
                style={{
                  width: '20%', height: '100%', background: '#050505',
                  transformOrigin: 'top',
                  borderRight: i < 4 ? '1px solid rgba(255,255,255,0.02)' : 'none'
                }}
              />
            ))}
          </div>

          {/* ── Central Rolling Counter ── */}
          <motion.div
            exit={{ y: -100, opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            style={{ position: 'relative', zIndex: 2, mixBlendMode: 'difference' }}
          >
            {/* Solid rolling digits */}
            <div style={{ ...counterFont, color: 'var(--accent-red)' }}>
              <DigitColumn ref={sH} />
              <DigitColumn ref={sT} />
              <DigitColumn ref={sU} />
              <div style={{ height: '1em', display: 'flex', alignItems: 'center' }}>%</div>
            </div>
          </motion.div>

          {/* ── Bottom-left HUD ── */}
          <motion.div
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', bottom: '10vh', left: '5vw', zIndex: 2, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-red)' }}
          >
            <div>SYSTEM_INITIALIZATION</div>
            <div ref={matrixRef} style={{ marginTop: '0.5rem', opacity: 0.7, letterSpacing: '0.1em' }}>
              ........................
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.2rem' }}>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  ref={el => barsRef.current[i] = el}
                  style={{ width: '4px', height: '15px', backgroundColor: 'rgba(255,51,51,0.15)', transition: 'background-color 0.3s ease' }}
                />
              ))}
            </div>
          </motion.div>

          {/* ── Top-right branding ── */}
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', top: '5vh', right: '5vw', zIndex: 2, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}
          >
            <div>AJINKYA.CHAVAN // 2026</div>
            <div>SECURE_CONNECTION_ESTABLISHED</div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;
