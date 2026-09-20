import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { gsap, maskLines, riseIn, reduced, cleanup } from '../lib/motion';

const GREETING =
  'Ask me about Ajinkya — what he is building at Emerson, how the RAG system decides to stay quiet, what he works in. I answer from this site and cite what I used.';

const SUGGESTED = [
  'What is he building at Emerson?',
  'How does the risk predictor avoid hallucinating?',
  'What does he actually work in?',
  'How do I get in touch?',
];

const HOW = [
  { n: '01', k: 'Retrieve', v: 'Your question is embedded and ranked against passages from this site.' },
  { n: '02', k: 'Ground',   v: 'Only the top matches reach the model, with instructions to use nothing else.' },
  { n: '03', k: 'Cite',     v: 'Every answer points at the passages behind it — or admits it has none.' },
];

const Assistant = () => {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const howRef = useRef(null);
  const phoneRef = useRef(null);
  const feedRef = useRef(null);
  const inputRef = useRef(null);

  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState([{ role: 'assistant', content: GREETING, sources: [] }]);

  useEffect(() => {
    const fns = [
      maskLines(headRef.current, { trigger: rootRef.current, start: 'top 72%', stagger: 0.09 }),
      riseIn(howRef.current?.children, { trigger: howRef.current, start: 'top 88%', stagger: 0.09, y: 24 }),
    ];
    return cleanup(fns);
  }, []);

  /* void's device move: the phone arrives turned away and straightens
     as you scroll into the section, then holds while the copy passes. */
  useEffect(() => {
    const phone = phoneRef.current;
    if (!phone || reduced()) return undefined;

    gsap.set(phone, { transformPerspective: 1400, transformOrigin: '50% 60%' });

    const tween = gsap.fromTo(
      phone,
      { rotateY: -26, rotateX: 16, rotateZ: -6, scale: 0.82, yPercent: 8 },
      {
        rotateY: 0, rotateX: 0, rotateZ: 0, scale: 1, yPercent: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 85%',
          end: 'top 18%',
          scrub: 0.8,
        },
      }
    );
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  /* Keep the newest turn in view without yanking the whole page. */
  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [thread, busy]);

  const ask = useCallback(async (question) => {
    if (!question.trim() || busy) return;

    const history = thread
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));

    setThread((t) => [...t, { role: 'user', content: question }]);
    setValue('');
    setBusy(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });

      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error || `Request failed (${res.status}).`);
      }

      setThread((t) => [...t, { role: 'assistant', content: '', sources: [] }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const patch = (fn) =>
        setThread((t) => {
          const next = t.slice();
          next[next.length - 1] = fn(next[next.length - 1]);
          return next;
        });

      for (;;) {
        const { done, value: chunk } = await reader.read();
        if (done) break;

        buffer += decoder.decode(chunk, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          const line = frame.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          const event = JSON.parse(line.slice(5).trim());

          if (event.type === 'delta') patch((m) => ({ ...m, content: m.content + event.text }));
          else if (event.type === 'sources') patch((m) => ({ ...m, sources: event.sources }));
          else if (event.type === 'error') patch((m) => ({ ...m, error: event.error }));
        }
      }
    } catch (err) {
      setThread((t) => [...t, { role: 'assistant', content: '', error: err.message, sources: [] }]);
    } finally {
      setBusy(false);
    }
  }, [busy, thread]);

  const onSubmit = (e) => {
    e.preventDefault();
    ask(value);
  };

  return (
    <section ref={rootRef} id="assistant" className="block assistant" data-tone="ink">
      <div className="shell assistant-grid">
        <div className="assistant-copy">
          <div className="sec-head">
            <span className="eyebrow">04 — Ask my portfolio</span>
          </div>

          <h2 ref={headRef} className="assistant-head display display--l">
            Don&rsquo;t read it.<br />Interrogate it.
          </h2>

          <p className="body assistant-blurb">
            I built the thing you are about to use. It is a small retrieval pipeline
            over this site: your question gets embedded, ranked against the passages
            behind these sections, and answered from the top matches only — with
            citations, and with a refusal when the corpus does not cover you.
          </p>

          <form className="assistant-form" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="assistant-input">Ask a question about Ajinkya</label>
            <input
              id="assistant-input"
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask anything about my work…"
              autoComplete="off"
              maxLength={400}
            />
            <button type="submit" disabled={busy || !value.trim()}>
              {busy ? <Loader2 size={17} className="spin" /> : <ArrowUp size={17} strokeWidth={2.6} />}
              <span className="sr-only">Send</span>
            </button>
          </form>

          <div className="assistant-chips">
            {SUGGESTED.map((q) => (
              <button key={q} className="tag assistant-chip" onClick={() => ask(q)} disabled={busy}>
                {q}
              </button>
            ))}
          </div>

          <ol className="assistant-how" ref={howRef}>
            {HOW.map((h) => (
              <li key={h.n}>
                <span className="num assistant-how-n">{h.n}</span>
                <span className="assistant-how-k">{h.k}</span>
                <span className="assistant-how-v">{h.v}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="assistant-stage">
          <div className="phone" ref={phoneRef}>
            <span className="phone-glow" aria-hidden="true" />
            <div className="phone-body">
              <span className="phone-btn phone-btn--action" aria-hidden="true" />
              <span className="phone-btn phone-btn--vol-up" aria-hidden="true" />
              <span className="phone-btn phone-btn--vol-dn" aria-hidden="true" />
              <span className="phone-btn phone-btn--power" aria-hidden="true" />

              <div className="phone-screen" data-tone="paper">
                <div className="phone-island" aria-hidden="true" />

                <header className="screen-bar">
                  <span className="screen-avatar" aria-hidden="true"><Sparkles size={12} strokeWidth={2.6} /></span>
                  <span className="screen-name">Portfolio assistant</span>
                  <span className="screen-state mono">{busy ? 'thinking' : 'online'}</span>
                </header>

                <div
                  className="screen-feed"
                  ref={feedRef}
                  aria-live="polite"
                  data-lenis-prevent
                  tabIndex={0}
                  role="log"
                  aria-label="Conversation"
                >
                  {thread.map((m, i) => (
                    <div key={i} className={`bubble bubble--${m.role}`}>
                      {m.error ? (
                        <p className="bubble-error">{m.error}</p>
                      ) : (
                        <p>{m.content || (busy && i === thread.length - 1 ? '…' : '')}</p>
                      )}

                      {m.sources?.length > 0 && (
                        <ul className="bubble-sources">
                          {m.sources.map((s) => (
                            <li key={s.n} className="mono" title={s.title}>[{s.n}] {s.title}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  {busy && (
                    <div className="bubble bubble--assistant bubble--typing" aria-hidden="true">
                      <i /><i /><i />
                    </div>
                  )}
                </div>

                <footer className="screen-foot mono">
                  Grounded in {thread.length > 1 ? 'this site' : 'this site only'} · no training on you
                </footer>

                <span className="phone-home" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .assistant { overflow: hidden; }
        .assistant-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: clamp(2rem, 6vw, 5rem);
          align-items: center;
        }

        .assistant-head { margin: 0 0 1.2rem; letter-spacing: -0.04em; }
        .assistant-blurb { max-width: 48ch; }

        .assistant-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: clamp(1.5rem, 4vh, 2.25rem);
          padding: 0.4rem 0.4rem 0.4rem 1.2rem;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--paper-2);
          transition: border-color 0.35s var(--ease-out);
        }
        .assistant-form:focus-within { border-color: var(--mark); }
        .assistant-form input { flex: 1; min-width: 0; padding-block: 0.7rem; outline: none; }
        .assistant-form input::placeholder { color: var(--ink-3); }
        .assistant-form button {
          display: grid;
          place-items: center;
          width: 40px; height: 40px;
          flex: none;
          border-radius: 999px;
          background: var(--mark);
          color: #101403;
          cursor: pointer;
          transition: opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out);
        }
        .assistant-form button:disabled { opacity: 0.35; cursor: default; }
        .assistant-form button:not(:disabled):hover { transform: scale(1.06); }

        .assistant-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.85rem; }
        .assistant-chip {
          cursor: pointer;
          transition: border-color 0.3s var(--ease-out), color 0.3s var(--ease-out);
        }
        .assistant-chip:hover:not(:disabled) { color: var(--ink); border-color: var(--mark); }
        .assistant-chip:disabled { opacity: 0.45; cursor: default; }

        .assistant-how {
          display: grid;
          gap: 0.9rem;
          margin-top: clamp(2rem, 6vh, 3rem);
          padding-top: clamp(1.4rem, 4vh, 2rem);
          border-top: 1px solid var(--line);
        }
        .assistant-how li {
          display: grid;
          grid-template-columns: 2.2rem 6.5rem 1fr;
          gap: 0.9rem;
          align-items: baseline;
          font-size: var(--step--1);
        }
        .assistant-how-n { color: var(--mark); font-size: var(--step--2); }
        .assistant-how-k { font-weight: 600; }
        .assistant-how-v { color: var(--ink-2); line-height: 1.6; }

        /* ---- device ---- */
        .assistant-stage { display: grid; place-items: center; perspective: 1400px; }
        .phone { position: relative; width: min(324px, 80vw); will-change: transform; }
        .phone-glow {
          position: absolute;
          inset: -18% -22%;
          border-radius: 50%;
          background: radial-gradient(closest-side, color-mix(in srgb, var(--mark) 26%, transparent), transparent 72%);
          filter: blur(14px);
          pointer-events: none;
        }
        /* Proportioned off the real thing: 9:19.5 display, a band that
           reads as brushed metal, and the corner radius the hardware
           actually has — at 52px on this width it was reading as a box. */
        .phone-body {
          position: relative;
          padding: 11px;
          border-radius: 18.5%/8.8%;
          background:
            linear-gradient(105deg,
              #9A9AA4 0%, #FCFCFE 6%, #D2D2DA 14%,
              #B4B4BE 50%,
              #D8D8E0 86%, #FCFCFE 94%, #9A9AA4 100%);
          box-shadow:
            0 34px 80px rgba(0, 0, 0, 0.45),
            0 4px 14px rgba(0, 0, 0, 0.25),
            inset 0 0 0 1px rgba(255, 255, 255, 0.55);
        }
        [data-theme="dark"] .phone-body {
          background:
            linear-gradient(105deg,
              #26262E 0%, #6E6E7A 6%, #3A3A44 14%,
              #23232B 50%,
              #3E3E48 86%, #74747E 94%, #24242C 100%);
          box-shadow:
            0 34px 80px rgba(0, 0, 0, 0.65),
            0 4px 14px rgba(0, 0, 0, 0.4),
            inset 0 0 0 1px rgba(255, 255, 255, 0.16);
        }

        .phone-screen {
          position: relative;
          display: flex;
          flex-direction: column;
          aspect-ratio: 9 / 19.5;
          border-radius: 15.5%/7.2%;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.55);
        }

        .phone-island {
          position: absolute;
          top: 10px; left: 50%;
          translate: -50% 0;
          width: 27%; height: 26px;
          border-radius: 999px;
          background: #08080A;
          z-index: 3;
        }
        .phone-island::after {
          content: "";
          position: absolute;
          right: 18%; top: 50%;
          translate: 0 -50%;
          width: 8px; height: 8px;
          border-radius: 999px;
          background: radial-gradient(circle at 35% 35%, #2B3550 0%, #101018 60%, #08080A 100%);
        }

        .phone-home {
          position: absolute;
          bottom: 7px; left: 50%;
          translate: -50% 0;
          width: 36%; height: 4px;
          border-radius: 999px;
          background: var(--ink);
          opacity: 0.28;
          z-index: 3;
        }

        /* Side hardware. Small, but their absence is what makes a
           rounded rectangle stay a rounded rectangle. */
        .phone-btn {
          position: absolute;
          width: 3px;
          border-radius: 2px;
          background: linear-gradient(180deg, #C8C8D0, #8E8E98);
        }
        [data-theme="dark"] .phone-btn { background: linear-gradient(180deg, #43434D, #1E1E26); }
        .phone-btn--action { left: -2px; top: 16%; height: 4.2%; }
        .phone-btn--vol-up { left: -2px; top: 24%; height: 7%; }
        .phone-btn--vol-dn { left: -2px; top: 33%; height: 7%; }
        .phone-btn--power  { right: -2px; top: 26%; height: 11%; }

        .screen-bar {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 3.1rem 1.15rem 0.8rem;
          border-bottom: 1px solid var(--line-2);
          flex: none;
        }
        .screen-avatar {
          display: grid; place-items: center;
          width: 22px; height: 22px;
          border-radius: 999px;
          background: var(--mark);
          color: #101403;
          flex: none;
        }
        .screen-name { font-size: 0.88rem; font-weight: 600; flex: 1; }
        .screen-state { font-size: 0.62rem; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.1em; }

        .screen-feed {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 1rem 0.95rem 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
        }
        .screen-feed:focus-visible { outline-offset: -3px; }
        .screen-feed::-webkit-scrollbar { width: 4px; }
        .screen-feed::-webkit-scrollbar-thumb { background: var(--line); border-radius: 99px; }

        .bubble {
          max-width: 90%;
          padding: 0.7rem 0.9rem 0.76rem;
          border-radius: 18px;
          font-size: 0.86rem;
          line-height: 1.6;
        }
        .bubble--assistant { align-self: flex-start; background: var(--paper-2); border-bottom-left-radius: 6px; }
        .bubble--user {
          align-self: flex-end;
          background: var(--ink);
          color: var(--paper);
          border-bottom-right-radius: 6px;
        }
        .bubble-error { color: var(--coral); }
        .bubble-sources {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          margin-top: 0.55rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--line);
          font-size: 0.67rem;
          color: var(--ink-3);
          overflow: hidden;
        }
        .bubble-sources li { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .bubble--typing { display: flex; gap: 4px; padding-block: 0.85rem; }
        .bubble--typing i {
          width: 5px; height: 5px;
          border-radius: 999px;
          background: var(--ink-3);
          animation: blink 1.1s var(--ease-in-out) infinite;
        }
        .bubble--typing i:nth-child(2) { animation-delay: 0.16s; }
        .bubble--typing i:nth-child(3) { animation-delay: 0.32s; }
        @keyframes blink { 0%, 60%, 100% { opacity: 0.25; } 30% { opacity: 1; } }

        .screen-foot {
          flex: none;
          padding: 0.6rem 1rem 1.25rem;
          border-top: 1px solid var(--line-2);
          font-size: 0.62rem;
          color: var(--ink-3);
          text-align: center;
          letter-spacing: 0.06em;
        }

        @media (max-width: 960px) {
          .assistant-grid { grid-template-columns: 1fr; gap: clamp(2.5rem, 7vh, 4rem); }
          .assistant-how li { grid-template-columns: 1.8rem 5.5rem 1fr; }
          .phone { width: min(306px, 78vw); }
        }
        @media (max-width: 420px) {
          .assistant-how li { grid-template-columns: 1.6rem 1fr; }
          .assistant-how-v { grid-column: 2; }
        }
      `}</style>
    </section>
  );
};

export default Assistant;
