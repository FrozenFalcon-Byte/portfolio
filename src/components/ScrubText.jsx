import React, { useEffect, useRef } from 'react';
import { gsap, reduced } from '../lib/motion';
import Glyph from './Glyph';

/* ------------------------------------------------------------------
   ScrubText — a paragraph read by the scrollbar.

   Tokens are strings (split into words here, not by SplitText, so the
   glyphs between them are never walked into) or glyph objects. One
   scrubbed timeline lights the words in order and opens each glyph at
   the moment the reading line reaches it — the graphic arrives with its
   sentence instead of sitting there waiting.

   Strings starting with "*" are marked: they get the accent highlight
   swept under them as they light.
   ------------------------------------------------------------------ */
const ScrubText = ({ tokens, className = '', start = 'top 78%', end = 'bottom 58%', as: Tag = 'p' }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const items = Array.from(el.querySelectorAll('.sw, .glyph'));
    if (reduced()) {
      gsap.set(items, { opacity: 1, '--open': 1, '--hl': 1 });
      return undefined;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start, end, scrub: 0.6 },
    });
    items.forEach((it, i) => {
      const at = i * 0.35;
      if (it.classList.contains('glyph')) {
        // The glyph's room is kept from the start and it scales up into
        // it: animating its width would re-wrap the whole paragraph on
        // every frame of the scroll, which is what made it judder.
        tl.fromTo(it, { '--open': 1, scale: 0.2, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: 0, duration: 1.2, ease: 'back.out(1.6)' }, at);
      } else {
        tl.fromTo(it, { opacity: 0.14, y: '0.1em' }, { opacity: 1, y: 0, duration: 0.6, ease: 'none' }, at);
        if (it.classList.contains('hl')) {
          tl.fromTo(it, { '--hl': 0 }, { '--hl': 1, duration: 0.9, ease: 'power2.out' }, at + 0.2);
        }
      }
    });

    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, [start, end]);

  return (
    <Tag ref={ref} className={className}>
      {tokens.map((t, i) => {
        if (typeof t !== 'string') return <Glyph key={i} {...t} />;
        const marked = t.startsWith('*');
        const words = (marked ? t.slice(1) : t).split(/\s+/).filter(Boolean);
        return words.map((w, j) => (
          <React.Fragment key={`${i}-${j}`}>
            <span className={`sw${marked ? ' hl' : ''}`}>{w}</span>{' '}
          </React.Fragment>
        ));
      })}
    </Tag>
  );
};

export default ScrubText;
