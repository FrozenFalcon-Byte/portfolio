import React, { useEffect, useRef } from 'react';
import { maskLines, riseIn, magnetic, cleanup } from '../lib/motion';

const LINKS = [
  { label: 'Email', v: 'frozenfalcon8494@gmail.com', href: 'mailto:frozenfalcon8494@gmail.com' },
  { label: 'LinkedIn', v: 'ajinkyachavan4829', href: 'https://www.linkedin.com/in/ajinkyachavan4829/' },
  { label: 'GitHub', v: 'FrozenFalcon-Byte', href: 'https://github.com/FrozenFalcon-Byte' },
  { label: 'Résumé', v: 'Download PDF', href: '/resume.pdf', download: true },
];

const Contact = () => {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const listRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const fns = [
      maskLines(headRef.current, { trigger: rootRef.current, start: 'top 78%', stagger: 0.1 }),
      riseIn(listRef.current?.children, { trigger: listRef.current, start: 'top 88%', stagger: 0.08, y: 26 }),
      magnetic(ctaRef.current, 0.26),
    ];
    return cleanup(fns);
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer ref={rootRef} id="contact" className="block contact" data-tone="acid">
      <div className="shell">
        <span className="eyebrow">06 — Contact</span>

        <h2 ref={headRef} className="contact-head display display--xl">
          Let&rsquo;s build<br />something that ships.
        </h2>

        <a ref={ctaRef} href="mailto:frozenfalcon8494@gmail.com" className="btn contact-cta">
          Start a conversation
          <span className="arrow" aria-hidden="true">→</span>
        </a>

        <ul className="contact-list" ref={listRef}>
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
                download={l.download || undefined}
                className="contact-row"
              >
                <span className="mono contact-row-k">{l.label}</span>
                <span className="contact-row-v">{l.v}</span>
                <span className="contact-row-arrow" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="contact-foot mono">
          <span>© {year} Ajinkya Chavan</span>
          <span>AI / ML engineering · Pune, India</span>
        </div>
      </div>

      <style>{`
        .contact { padding-bottom: clamp(2.5rem, 7vh, 4rem); }
        .contact-head {
          margin: clamp(1.5rem, 4vh, 2.5rem) 0 0;
          font-size: clamp(2.5rem, 9.5vw, 8rem);
          letter-spacing: -0.045em;
          max-width: 16ch;
        }
        .contact-cta { margin-top: clamp(2rem, 5vh, 3rem); }

        .contact-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          margin-top: clamp(3.5rem, 10vh, 6rem);
          border-top: 1px solid var(--line);
        }
        .contact-row {
          display: flex;
          align-items: baseline;
          gap: 0.9rem;
          padding: 1.15rem 1.25rem 1.2rem 0.25rem;
          border-bottom: 1px solid var(--line);
          transition: color 0.35s var(--ease-out), padding-left 0.4s var(--ease-out);
        }
        .contact-row:hover { color: var(--mark); padding-left: 0.9rem; }
        .contact-row-k { flex: none; width: 5.5rem; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.1em; font-size: var(--step--2); }
        .contact-row-v { flex: 1; min-width: 0; font-size: var(--step-0); font-weight: 500; overflow-wrap: anywhere; }
        .contact-row-arrow {
          flex: none;
          opacity: 0;
          translate: -6px 4px;
          transition: opacity 0.35s var(--ease-out), translate 0.35s var(--ease-out);
        }
        .contact-row:hover .contact-row-arrow { opacity: 1; translate: 0 0; }

        .contact-foot {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: clamp(2.5rem, 7vh, 4rem);
          color: var(--ink-2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: var(--step--2);
        }
      `}</style>
    </footer>
  );
};

export default Contact;
