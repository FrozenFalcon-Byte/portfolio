import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { gsap, maskLines, riseIn, drawRule, reduced, cleanup } from '../lib/motion';

const GREETING =
  'Ask me about Ajinkya — what he is building at Emerson, how Swarm keeps a human in the loop, why FinMCP is an MCP server first. I answer from this site and show you what I used.';

const SUGGESTED = [
  'What is he building at Emerson?',
  'Explain FinMCP in one paragraph.',
  'What does Swarm actually do?',
  'How do I get in touch?',
];

const HOW = [
  { n: '01', k: 'Retrieve', v: 'Your question is embedded and ranked against every passage behind this site.' },
  { n: '02', k: 'Ground', v: 'Only the top matches reach the model, with instructions to use nothing else.' },
  { n: '03', k: 'Cite', v: 'The passages it leaned on appear beside the answer — or it tells you it has none.' },
];

/* The retrieval panel is the point of the whole section: it is the only
   part of a RAG system a visitor can normally never see. */
const Retrieval = ({ sources, busy, asked }) => {
  const listRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !sources.length || reduced()) return undefined;

    const tl = gsap.timeline();
    tl.fromTo(list.children, { opacity: 0, x: 14 }, {
      opacity: 1, x: 0, duration: 0.5, stagger: 0.07, ease: 'swift',
    })
      .fromTo(list.querySelectorAll('.src-bar i'), { scaleX: 0 }, {
        scaleX: (i, el) => Number(el.dataset.score) || 0.05,
        duration: 0.9, stagger: 0.07, ease: 'glide',
      }, 0.1);

    return () => tl.kill();
  }, [sources]);

  return (
    <aside className="retrieval" aria-label="Retrieved passages">
      <header className="retrieval-head">
        <span className="mono retrieval-k">Retrieval</span>
        <span className={`retrieval-state mono${busy ? ' is-live' : ''}`}>
          {busy ? 'ranking' : sources.length ? `${sources.length} passages` : 'idle'}
        </span>
      </header>

      {sources.length > 0 ? (
        <ol className="retrieval-list" ref={listRef}>
          {sources.map((s) => (
            <li key={s.n} className="src">
              <span className="num src-n">[{s.n}]</span>
              <span className="src-main">
                <span className="src-title">{s.title}</span>
                <span className="mono src-section">{s.section}</span>
              </span>
              <span className="src-bar" aria-hidden="true">
                <i data-score={s.score ?? 0.5} />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="retrieval-empty body">
          {asked
            ? 'No passage cleared the threshold. The answer will say so rather than improvise.'
            : 'Nothing retrieved yet. Ask something and the passages it reads will land here, ranked.'}
        </p>
      )}

      <footer className="retrieval-foot mono">
        Embedded · cosine-ranked · top matches only
      </footer>
    </aside>
  );
};

const Assistant = () => {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const ruleRef = useRef(null);
  const howRef = useRef(null);
  const phoneRef = useRef(null);
  const feedRef = useRef(null);
  const consoleRef = useRef(null);

  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(false);
  const [sources, setSources] = useState([]);
  const [thread, setThread] = useState([{ role: 'assistant', content: GREETING, sources: [] }]);

  useEffect(() => {
    const fns = [
      maskLines(headRef.current, { trigger: rootRef.current, start: 'top 74%', stagger: 0.09 }),
      drawRule(ruleRef.current, { trigger: rootRef.current, start: 'top 82%' }),
      riseIn(howRef.current?.children, { trigger: howRef.current, start: 'top 90%', stagger: 0.1, y: 24 }),
      riseIn(consoleRef.current, { trigger: consoleRef.current, start: 'top 94%', y: 28 }),
    ];
    return cleanup(fns);
  }, []);

  /* The device arrives turned away and straightens as the section comes
     up, then holds while the copy passes it. */
  useEffect(() => {
    const phone = phoneRef.current;
    if (!phone || reduced()) return undefined;

    gsap.set(phone, { transformPerspective: 1500, transformOrigin: '50% 60%' });

    const tween = gsap.fromTo(
      phone,
      { rotateY: -22, rotateX: 14, rotateZ: -5, scale: 0.86, yPercent: 7 },
      {
        rotateY: 0, rotateX: 0, rotateZ: 0, scale: 1, yPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top 82%', end: 'top 14%', scrub: 0.8 },
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

    const history = thread.slice(1).map((m) => ({ role: m.role, content: m.content }));

    setThread((t) => [...t, { role: 'user', content: question }]);
    setValue('');
    setBusy(true);
    setAsked(true);
    setSources([]);

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
          else if (event.type === 'sources') {
            patch((m) => ({ ...m, sources: event.sources }));
            setSources(event.sources);
          } else if (event.type === 'error') patch((m) => ({ ...m, error: event.error }));
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
      <div className="shell">
        <div className="sec-head">
          <span className="eyebrow">04 — Ask my portfolio</span>
          <span className="rule" ref={ruleRef} />
          <span className="mono as-count">Grounded · cited · refuses</span>
        </div>

        <div className="as-masthead">
          <h2 ref={headRef} className="as-head display">
            Don&rsquo;t read it.<br />Interrogate it.
          </h2>
          <p className="body as-blurb">
            A small retrieval pipeline over this site. Your question is embedded,
            ranked against the passages behind these sections, and answered from
            the top matches only — with the passages shown beside the answer, and
            a refusal when the corpus does not cover you.
          </p>
        </div>

        <div className="as-console" ref={consoleRef}>
          <ol className="as-how" ref={howRef}>
            {HOW.map((h) => (
              <li key={h.n}>
                <span className="num as-how-n">{h.n}</span>
                <span className="as-how-k">{h.k}</span>
                <span className="as-how-v">{h.v}</span>
              </li>
            ))}
          </ol>

          <div className="as-stage">
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
                      </div>
                    ))}

                    {busy && (
                      <div className="bubble bubble--assistant bubble--typing" aria-hidden="true">
                        <i /><i /><i />
                      </div>
                    )}
                  </div>

                  <footer className="screen-foot mono">
                    Answers from this site only
                  </footer>

                  <span className="phone-home" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>

          <Retrieval sources={sources} busy={busy} asked={asked} />
        </div>

        <div className="as-input">
          <form className="as-form" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="assistant-input">Ask a question about Ajinkya</label>
            <input
              id="assistant-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask anything about my work…"
              autoComplete="off"
              maxLength={400}
            />
            <button type="submit" disabled={busy || !value.trim()}>
              {busy ? <Loader2 size={18} className="spin" /> : <ArrowUp size={18} strokeWidth={2.6} />}
              <span className="sr-only">Send</span>
            </button>
          </form>

          <div className="as-chips">
            {SUGGESTED.map((q) => (
              <button key={q} className="tag as-chip" onClick={() => ask(q)} disabled={busy}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .assistant { overflow: hidden; }
        .as-count { color: var(--ink-3); white-space: nowrap; }

        /* ---- masthead ---- */
        .as-masthead {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
          gap: clamp(1.5rem, 5vw, 4rem);
          align-items: end;
          margin-bottom: clamp(2.5rem, 7vh, 4rem);
        }
        .as-head {
          margin: 0;
          font-size: clamp(2.3rem, 7vw, 5.5rem);
          letter-spacing: -0.045em;
        }
        .as-blurb { max-width: 52ch; padding-bottom: 0.4rem; }

        /* ---- console ---- */
        .as-console {
          display: grid;
          grid-template-columns: minmax(0, 0.85fr) auto minmax(0, 0.85fr);
          gap: clamp(1.5rem, 3.5vw, 3rem);
          align-items: center;
        }

        /* how-rail */
        .as-how { display: flex; flex-direction: column; gap: 1.5rem; }
        .as-how li {
          position: relative;
          display: grid;
          grid-template-columns: 2.4rem 1fr;
          gap: 0.3rem 0.9rem;
          padding-bottom: 1.5rem;
        }
        .as-how li:not(:last-child)::after {
          content: "";
          position: absolute;
          left: 0.65rem;
          top: 1.6rem;
          bottom: 0;
          width: 1px;
          background: var(--line);
        }
        .as-how-n {
          grid-row: 1 / span 2;
          color: var(--mark);
          font-size: var(--step--2);
          font-weight: 600;
        }
        .as-how-k { font-weight: 600; font-size: var(--step-0); }
        .as-how-v { color: var(--ink-2); font-size: var(--step--1); line-height: 1.6; }

        /* retrieval panel */
        .retrieval {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          min-height: 260px;
          padding: clamp(1rem, 2vw, 1.4rem);
          border-radius: 20px;
          border: 1px solid var(--line);
          background: var(--paper-2);
        }
        .retrieval-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .retrieval-k { text-transform: uppercase; letter-spacing: 0.14em; font-size: var(--step--2); }
        .retrieval-state {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--ink-3);
          font-size: var(--step--2);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .retrieval-state.is-live::before {
          content: "";
          width: 6px; height: 6px;
          border-radius: 999px;
          background: var(--mark);
          animation: blink 1.1s var(--ease-in-out) infinite;
        }

        .retrieval-list { display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
        .src {
          display: grid;
          grid-template-columns: 2rem minmax(0, 1fr);
          gap: 0.2rem 0.6rem;
        }
        .src-n { color: var(--mark); font-size: var(--step--2); grid-row: 1 / span 2; }
        .src-main { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .src-title {
          font-size: var(--step--1);
          font-weight: 500;
          line-height: 1.35;
        }
        .src-section { color: var(--ink-3); font-size: var(--step--2); }
        .src-bar {
          grid-column: 2;
          display: block;
          height: 3px;
          margin-top: 0.4rem;
          border-radius: 3px;
          background: var(--line);
          overflow: hidden;
        }
        .src-bar i {
          display: block;
          height: 100%;
          background: var(--mark);
          transform-origin: left;
          transform: scaleX(0);
        }

        .retrieval-empty { flex: 1; font-size: var(--step--1); max-width: 34ch; }
        .retrieval-foot {
          padding-top: 0.75rem;
          border-top: 1px solid var(--line-2);
          color: var(--ink-3);
          font-size: var(--step--2);
          letter-spacing: 0.06em;
        }

        /* ---- input ---- */
        .as-input {
          max-width: 760px;
          margin: clamp(2.5rem, 7vh, 4rem) auto 0;
        }
        .as-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.45rem 0.45rem 1.4rem;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--paper-2);
          transition: border-color 0.35s var(--ease-out);
        }
        .as-form:focus-within { border-color: var(--mark); }
        .as-form input { flex: 1; min-width: 0; padding-block: 0.8rem; outline: none; font-size: var(--step-0); }
        .as-form input::placeholder { color: var(--ink-3); }
        .as-form button {
          display: grid;
          place-items: center;
          width: 44px; height: 44px;
          flex: none;
          border-radius: 999px;
          background: var(--mark);
          color: #101403;
          cursor: pointer;
          transition: opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out);
        }
        .as-form button:disabled { opacity: 0.35; cursor: default; }
        .as-form button:not(:disabled):hover { transform: scale(1.06); }

        .as-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; margin-top: 0.9rem; }
        .as-chip { cursor: pointer; transition: border-color 0.3s var(--ease-out), color 0.3s var(--ease-out); }
        .as-chip:hover:not(:disabled) { color: var(--ink); border-color: var(--mark); }
        .as-chip:disabled { opacity: 0.45; cursor: default; }

        /* ---- device ---- */
        .as-stage { display: grid; place-items: center; perspective: 1500px; }
        .phone { position: relative; width: min(312px, 78vw); will-change: transform; }
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
           actually has — at a fixed pixel radius it reads as a box. */
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

        /* ---- narrower ---- */
        @media (max-width: 1080px) {
          .as-masthead { grid-template-columns: 1fr; gap: 1.25rem; align-items: start; }
          .as-console {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            grid-template-areas: "phone phone" "how retrieval";
            gap: clamp(2rem, 5vh, 3rem) clamp(1.5rem, 4vw, 2.5rem);
          }
          .as-stage { grid-area: phone; }
          .as-how { grid-area: how; }
          .retrieval { grid-area: retrieval; }
        }
        @media (max-width: 700px) {
          .as-console { grid-template-columns: 1fr; grid-template-areas: "phone" "retrieval" "how"; }
          .as-how li { grid-template-columns: 2rem 1fr; }
        }
      `}</style>
    </section>
  );
};

export default Assistant;
