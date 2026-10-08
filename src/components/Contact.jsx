import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowUp, Copy, Check } from 'lucide-react';
import { gsap, heading, magnetic, reduced, cleanup } from '../lib/motion';
import Glyph from './Glyph';
import Mark from './Mark';

const EMAIL = 'frozenfalcon8494@gmail.com';
const LINKS = [
  { label: 'LinkedIn', v: 'in/ajinkyachavan4829', href: 'https://www.linkedin.com/in/ajinkyachavan4829/' },
  { label: 'GitHub', v: 'FrozenFalcon-Byte', href: 'https://github.com/FrozenFalcon-Byte' },
  { label: 'Résumé', v: 'Download the PDF', href: '/resume.pdf', download: true },
];

const Contact = () => {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const mailRef = useRef(null);
  const wordRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => cleanup([heading(headRef.current), magnetic(mailRef.current, 0.12)]), []);

  /* The page signs off the way it opened: "ajinkya." builds itself
     letter by letter across the full width as the footer arrives, and
     the full stop drops in last. */
  useEffect(() => {
    const word = wordRef.current;
    if (!word || reduced()) return undefined;
    const chars = word.querySelectorAll('.ct-ch');
    const dot = word.querySelector('.ct-dot');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: word, start: 'top bottom', end: 'bottom bottom', scrub: 0.8 },
    });
    tl.fromTo(chars, { yPercent: 105, rotate: 8 }, { yPercent: 0, rotate: 0, stagger: 0.08, ease: 'power3.out' })
      .fromTo(dot, { y: '-2.4em', scale: 0 }, { y: 0, scale: 1, ease: 'bounce.out', duration: 0.6 }, '-=0.2');
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { window.location.href = `mailto:${EMAIL}`; }
  };

  const top = (e) => {
    e.preventDefault();
    if (window.lenis) window.lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer ref={rootRef} id="contact" className="contact" data-surface="ink" data-acc="yellow">
      <div className="shell ct-in">
        <span className="eyebrow"><b>07</b>Contact</span>

        <h2 ref={headRef} className="display ct-head">
          <span className="ln"><span className="ln-in">Say hello<Glyph kind="hand" acc="yellow" /></span></span>
          <span className="ln"><span className="ln-in">let’s ship something.</span></span>
        </h2>

        <div className="ct-mail">
          <a ref={mailRef} href={`mailto:${EMAIL}`} className="ct-mail-a display" data-cursor-label="Write">
            {EMAIL}
          </a>
          <button className={`ct-copy${copied ? ' is-done' : ''}`} onClick={copy} aria-label="Copy email address" data-cursor-label={copied ? 'Copied' : 'Copy'}>
            {copied ? <Check size={18} strokeWidth={2.6} /> : <Copy size={18} strokeWidth={2.2} />}
            <span>{copied ? 'Copied.' : 'Copy'}</span>
          </button>
        </div>

        <ul className="ct-links">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
                download={l.download || undefined}
                className="ct-row"
              >
                <span className="display ct-row-k">{l.label}</span>
                <span className="ct-row-v">{l.v}</span>
                <span className="ct-row-go" aria-hidden="true"><ArrowUpRight size={20} strokeWidth={2.4} /></span>
              </a>
            </li>
          ))}
        </ul>

        <div className="ct-word display" ref={wordRef} aria-hidden="true">
          {'ajinkya'.split('').map((c, i) => <span className="ct-ch-box" key={i}><span className="ct-ch">{c}</span></span>)}
          <span className="ct-dot" />
        </div>

        <div className="ct-foot">
          <span className="ct-foot-who"><Mark className="ct-mark" />© {new Date().getFullYear()} Ajinkya Chavan</span>
          <span>AI / ML engineering · Pune</span>
          <a href="#top" onClick={top} className="ct-top" data-cursor-label="Top">
            Back to top <ArrowUp size={16} strokeWidth={2.4} />
          </a>
        </div>
      </div>

      <style>{`
        .contact {
          position: relative;
          margin-top: var(--bay);
          border-radius: var(--r-xl) var(--r-xl) 0 0;
          background: var(--paper);
          color: var(--ink);
          overflow: hidden;
        }
        .ct-in { padding-top: clamp(4rem, 12vh, 8rem); }
        .ct-head {
          margin-top: 1.5rem;
          font-size: clamp(2.8rem, 8.6vw, 8.5rem);
          line-height: 0.95;
          letter-spacing: -0.055em;
        }

        .ct-mail { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.25rem; margin-top: clamp(2rem, 6vh, 3.5rem); }
        .ct-mail-a {
          font-size: clamp(1.4rem, 3.6vw, 3.2rem);
          font-weight: 650;
          letter-spacing: -0.045em;
          box-shadow: inset 0 -0.14em 0 var(--acc);
          transition: box-shadow 0.5s var(--ease-out), color 0.4s;
          overflow-wrap: anywhere;
        }
        .ct-mail-a:hover { box-shadow: inset 0 -1.2em 0 var(--acc); color: var(--acc-ink); }
        .ct-copy {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.7rem 1.1rem;
          border-radius: var(--r-pill);
          background: var(--paper-3);
          color: var(--ink);
          font-weight: 600;
          cursor: pointer;
          transition: background 0.35s, color 0.35s;
        }
        .ct-copy:hover, .ct-copy.is-done { background: var(--acc); color: var(--acc-ink); }

        .ct-links { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; margin-top: clamp(3rem, 9vh, 5rem); }
        .ct-row {
          position: relative;
          display: grid;
          gap: 0.35rem;
          padding: 1.4rem 1.5rem 1.5rem;
          border-radius: var(--r-l);
          background: var(--paper-2);
          overflow: hidden;
          isolation: isolate;
        }
        .ct-row::before {
          content: ""; position: absolute; inset: 0; z-index: -1;
          background: var(--acc);
          border-radius: inherit;
          transform: translateY(101%);
          transition: transform 0.55s var(--ease-out);
        }
        .ct-row:hover::before { transform: translateY(0); }
        .ct-row:hover { color: var(--acc-ink); }
        .ct-row-k { font-size: var(--step-2); font-weight: 700; letter-spacing: -0.045em; }
        .ct-row-v { color: var(--ink-2); transition: color 0.35s; }
        .ct-row:hover .ct-row-v { color: inherit; }
        .ct-row-go {
          position: absolute; top: 1.25rem; right: 1.25rem;
          display: grid; place-items: center;
          width: 2.6rem; height: 2.6rem; border-radius: 99px;
          background: var(--paper-3);
          transition: transform 0.5s var(--ease-out), background 0.35s;
        }
        .ct-row:hover .ct-row-go { transform: rotate(45deg); background: var(--acc-ink); color: var(--acc); }

        .ct-word {
          display: flex;
          align-items: flex-end;
          margin-top: clamp(4rem, 12vh, 8rem);
          font-size: clamp(5rem, 22.5vw, 22rem);
          font-weight: 800;
          line-height: 0.78;
          letter-spacing: -0.065em;
        }
        .ct-ch-box { display: inline-block; overflow: hidden; padding: 0 0.02em 0.16em; margin-bottom: -0.16em; }
        .ct-ch { display: inline-block; transform-origin: 0 100%; }
        .ct-dot {
          flex: none;
          width: 0.17em; height: 0.17em;
          margin: 0 0 0.02em 0.08em;
          border-radius: 99px;
          background: var(--acc);
        }

        .ct-foot {
          display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
          gap: 1rem;
          padding-block: 1.75rem 2rem;
          margin-top: 1.5rem;
          border-top: 1px solid var(--line);
          color: var(--ink-2);
          font-size: var(--step--1);
        }
        .ct-foot-who { display: inline-flex; align-items: center; gap: 0.6rem; color: var(--ink); font-weight: 600; }
        .ct-mark { width: 1.4rem; height: 1.4rem; max-width: none; }
        .ct-top { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--ink); font-weight: 600; }
        .ct-top svg { transition: transform 0.45s var(--ease-out); }
        .ct-top:hover svg { transform: translateY(-4px); }

        @media (max-width: 860px) {
          .ct-links { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </footer>
  );
};

export default Contact;
