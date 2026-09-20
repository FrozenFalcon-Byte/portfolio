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
      magnetic(ctaRef.current, 0.28),
    ];
    return cleanup(fns);
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer ref={rootRef} id="contact" className="section contact">
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">Contact</span>
          <span className="rule" />
        </div>

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
                <span className="eyebrow eyebrow--plain contact-row-k">{l.label}</span>
                <span className="contact-row-v">{l.v}</span>
                <span className="contact-row-arrow" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="contact-foot">
          <span className="mono">© {year} Ajinkya Chavan</span>
          <span className="mono">AI / ML Engineering · Pune, India</span>
        </div>
      </div>

      <style>{`
        .contact {
          border-radius: clamp(20px, 3vw, 40px) clamp(20px, 3vw, 40px) 0 0;
          background:
            radial-gradient(ellipse 120% 80% at 50% 100%, rgba(255, 92, 0, 0.12), transparent 65%),
            var(--ink);
          border-top: 1px solid var(--line);
        }
        .contact-head {
          margin: 0;
          font-size: clamp(2.4rem, 9vw, 7.5rem);
          font-stretch: 70%;
          color: var(--fg);
          max-width: 16ch;
        }
        .contact-cta { margin-top: clamp(2rem, 5vh, 3.25rem); }

        .contact-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 0;
          margin-top: clamp(3.5rem, 10vh, 6rem);
          border-top: 1px solid var(--line);
        }
        .contact-row {
          display: flex;
          align-items: baseline;
          gap: 0.9rem;
          padding: 1.15rem 1.5rem 1.15rem 0.25rem;
          border-bottom: 1px solid var(--line);
          transition: color 0.35s var(--ease-out), padding-left 0.4s var(--ease-out);
        }
        .contact-row:hover { color: var(--amber); padding-left: 0.9rem; }
        .contact-row-k { flex: none; width: 5.5rem; }
        .contact-row-v {
          flex: 1;
          min-width: 0;
          font-size: var(--step-0);
          overflow-wrap: anywhere;
        }
        .contact-row-arrow {
          flex: none;
          opacity: 0;
          transform: translate(-6px, 4px);
          transition: opacity 0.35s var(--ease-out), transform 0.35s var(--ease-out);
        }
        .contact-row:hover .contact-row-arrow { opacity: 1; transform: none; }

        .contact-foot {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: clamp(3rem, 8vh, 5rem);
          color: var(--fg-faint);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
      `}</style>
    </footer>
  );
};

export default Contact;
