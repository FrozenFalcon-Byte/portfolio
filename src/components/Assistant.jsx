import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { gsap, heading, reduced, cleanup, fx, fx0 } from '../lib/motion';
import Glyph from './Glyph';
import Mark from './Mark';

const GREETING =
  'Ask me about Ajinkya — what he is building at Emerson, how Swarm keeps a human in the loop, why FinMCP is an MCP server first. I answer from this site and show you what I used.';

const SUGGESTED = [
  { q: 'What is he building at Emerson?', acc: 'blue' },
  { q: 'Explain FinMCP in one paragraph.', acc: 'pink' },
  { q: 'What does Swarm actually do?', acc: 'lime' },
  { q: 'How do I get in touch?', acc: 'yellow' },
];

const HOW = [
  { n: '01', k: 'Retrieve', v: 'Your question is embedded and ranked against every passage behind this site.', acc: 'violet' },
  { n: '02', k: 'Ground', v: 'Only the top matches reach the model, told to use nothing else.', acc: 'yellow' },
  { n: '03', k: 'Cite', v: 'The passages it leaned on land under the answer — or it says it has none.', acc: 'pink' },
];

/* The retrieved passages, with their scores drawn as bars. This is the
   part of a RAG system a visitor normally never gets to see. */
const Sources = ({ sources, busy, asked }) => {
  const listRef = useRef(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list || !sources.length || reduced()) return undefined;
    const tl = gsap.timeline()
      .fromTo(list.children, { opacity: 0, y: 10, ...fx(6) }, { opacity: 1, y: 0, ...fx0(), duration: 0.5, stagger: 0.07, ease: 'swift' })
      .fromTo(list.querySelectorAll('.src-bar i'), { scaleX: 0 }, {
        scaleX: (i, el) => Number(el.dataset.score) || 0.05, duration: 0.9, stagger: 0.07, ease: 'glide',
      }, 0.1);
    return () => tl.kill();
  }, [sources]);

  return (
    <div className="srcs" aria-label="Retrieved passages">
      <div className="srcs-head">
        <span className="mono">Retrieved</span>
        <span className={`mono srcs-state${busy ? ' is-live' : ''}`}>
          {busy ? 'ranking…' : sources.length ? `${sources.length} passages` : 'idle'}
        </span>
      </div>
      {sources.length > 0 ? (
        <ol className="srcs-list" ref={listRef}>
          {sources.map((s) => (
            <li key={s.n} className="src">
              <span className="num src-n">{s.n}</span>
              <span className="src-t">{s.title}<em className="mono">{s.section}</em></span>
              <span className="src-bar" aria-hidden="true"><i data-score={s.score ?? 0.5} /></span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="srcs-empty">
          {asked
            ? 'No passage cleared the threshold — the answer will say so rather than improvise.'
            : 'Nothing yet. Ask something and the passages it reads will land here, ranked.'}
        </p>
      )}
    </div>
  );
};

const Assistant = () => {
  const rootRef = useRef(null);
  const boxRef = useRef(null);
  const headRef = useRef(null);
  const howRef = useRef(null);
  const feedRef = useRef(null);

  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(false);
  const [sources, setSources] = useState([]);
  const [thread, setThread] = useState([{ role: 'assistant', content: GREETING, sources: [] }]);

  useEffect(() => cleanup([heading(headRef.current)]), []);

  /* The dark block opens like a window as it arrives: it starts inset
     from the page with big corners and widens to the full shell. The
     three steps light one after another on the same scroll. */
  useEffect(() => {
    if (reduced()) return undefined;
    const box = boxRef.current;
    const steps = howRef.current?.children || [];
    const t1 = gsap.fromTo(box,
      { clipPath: 'inset(6% 7% 0% 7% round 72px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 40px)',
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top 95%', end: 'top 20%', scrub: 0.6 },
      });
    const t2 = gsap.fromTo(steps,
      { opacity: 0.25, y: 20, ...fx(6) },
      {
        opacity: 1, y: 0, ...fx0(), stagger: 0.4, ease: 'none',
        scrollTrigger: { trigger: howRef.current, start: 'top 88%', end: 'bottom 60%', scrub: 0.6 },
      });
    return () => [t1, t2].forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
  }, []);

  /* The log scrolls itself only while it has somewhere to go; at
     either end the wheel goes back to the page, so the smooth page
     scroll never hands over to a native one halfway down the section
     and a short log never swallows the wheel. */
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return undefined;
    const onWheel = (e) => {
      const room = feed.scrollHeight - feed.clientHeight;
      if (room <= 1) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const down = dy > 0 && feed.scrollTop < room - 1;
      const up = dy < 0 && feed.scrollTop > 0;
      if (!down && !up) return;
      e.preventDefault();
      e.stopPropagation();
      feed.scrollTop += dy;
    };
    feed.addEventListener('wheel', onWheel, { passive: false });
    return () => feed.removeEventListener('wheel', onWheel);
  }, []);

  /* Keep the newest turn in view without yanking the whole page, and
     let it arrive out of focus, rising into place. */
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.scrollTop = feed.scrollHeight;
    const last = feed.lastElementChild;
    if (last && thread.length > 1 && !reduced()) {
      gsap.fromTo(last, { y: 14, opacity: 0, ...fx(8) }, { y: 0, opacity: 1, ...fx0(), duration: 0.5, ease: 'swift' });
    }
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
    <section ref={rootRef} id="assistant" className="block assistant" data-acc="violet">
      <div className="as-box" ref={boxRef} data-surface="ink">
        <div className="as-grid">
          <div className="as-intro">
            <span className="eyebrow"><b>04</b>Ask my portfolio</span>
            <h2 ref={headRef} className="display as-head">
              <span className="ln"><span className="ln-in">Don&rsquo;t read it.</span></span>
              <span className="ln"><span className="ln-in">Ask it<Glyph kind="chat" acc="violet" /></span></span>
            </h2>
            <p className="as-blurb">
              A small retrieval pipeline over this site. Questions are answered
              from the passages behind these sections only — cited, and with a
              refusal when the site doesn&rsquo;t cover it.
            </p>
            <ol className="as-how" ref={howRef}>
              {HOW.map((h) => (
                <li key={h.n} data-acc={h.acc}>
                  <span className="num as-how-n">{h.n}</span>
                  <span className="as-how-k">{h.k}</span>
                  <span className="as-how-v">{h.v}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="as-app">
            <header className="as-app-bar">
              <span className="as-app-av"><Mark /></span>
              <span className="as-app-name">Portfolio assistant</span>
              <span className={`mono as-app-state${busy ? ' is-busy' : ''}`}><i />{busy ? 'thinking' : 'online'}</span>
            </header>

            <div className="as-feed" ref={feedRef} aria-live="polite" tabIndex={0} role="log" aria-label="Conversation">
              {thread.map((m, i) => (
                <div key={i} className={`msg msg--${m.role}`}>
                  {m.error
                    ? <p className="msg-error">{m.error}</p>
                    : <p>{m.content || (busy && i === thread.length - 1 ? '…' : '')}</p>}
                </div>
              ))}
              {busy && <div className="msg msg--assistant msg--typing" aria-hidden="true"><i /><i /><i /></div>}
            </div>

            <div className="as-chips">
              {SUGGESTED.map((s) => (
                <button key={s.q} className="as-chip" data-acc={s.acc} onClick={() => ask(s.q)} disabled={busy}>
                  {s.q}
                </button>
              ))}
            </div>

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
              <button type="submit" disabled={busy || !value.trim()} data-cursor-label="Send">
                {busy ? <Loader2 size={18} className="spin" /> : <ArrowUp size={18} strokeWidth={2.6} />}
                <span className="sr-only">Send</span>
              </button>
            </form>

            <Sources sources={sources} busy={busy} asked={asked} />
          </div>
        </div>
      </div>

      <style>{`
        .assistant { padding-inline: clamp(0.5rem, 1.6vw, 1.5rem); }
        .as-box {
          max-width: calc(var(--shell) + 4rem);
          margin-inline: auto;
          border-radius: 40px;
          padding: clamp(2rem, 5vw, 4.5rem) clamp(1.25rem, 4vw, 4rem);
          will-change: clip-path;
        }
        .as-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
          gap: clamp(2rem, 5vw, 5rem);
          align-items: start;
        }
        .as-intro .eyebrow { background: transparent; }
        .as-head { margin: 1.5rem 0 1.25rem; font-size: clamp(2.6rem, 6vw, 5.4rem); letter-spacing: -0.05em; }
        .as-blurb { color: var(--ink-2); font-size: var(--step-1); line-height: 1.45; max-width: 40ch; }

        .as-how { display: grid; gap: 0.6rem; margin-top: clamp(1.75rem, 5vh, 2.75rem); }
        .as-how li {
          display: grid;
          grid-template-columns: 3rem minmax(0, 1fr);
          grid-template-rows: auto auto;
          column-gap: 1rem;
          padding: 1rem 1.1rem;
          border-radius: var(--r-m);
          background: var(--paper-2);
        }
        .as-how-n {
          grid-row: span 2;
          display: grid; place-items: center;
          width: 3rem; height: 3rem;
          border-radius: 99px;
          background: var(--acc); color: var(--acc-ink);
          font-weight: 600; font-size: 0.85rem;
        }
        .as-how-k { font-family: var(--font-display); font-weight: 700; font-size: var(--step-1); letter-spacing: -0.03em; }
        .as-how-v { color: var(--ink-2); font-size: var(--step--1); line-height: 1.5; }

        /* ---- the app ---- */
        .as-app {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          padding: clamp(0.9rem, 1.6vw, 1.25rem);
          border-radius: var(--r-l);
          background: var(--paper-2);
          border: 1px solid var(--line-2);
        }
        .as-app-bar { display: flex; align-items: center; gap: 0.7rem; padding: 0.2rem 0.3rem; }
        .as-app-av {
          display: grid; place-items: center;
          width: 2.4rem; height: 2.4rem;
          border-radius: 99px;
          background: var(--ink); color: var(--paper);
        }
        .as-app-av .mark { width: 60%; height: 60%; }
        .as-app-name { font-family: var(--font-display); font-weight: 650; }
        .as-app-state { margin-left: auto; display: inline-flex; align-items: center; gap: 0.45em; color: var(--ink-3); font-size: var(--step--2); }
        .as-app-state i { width: 7px; height: 7px; border-radius: 99px; background: var(--lime); }
        .as-app-state.is-busy i { background: var(--acc); animation: ex-blink 0.8s steps(1) infinite; }

        .as-feed {
          display: flex; flex-direction: column; gap: 0.6rem;
          height: clamp(15rem, 34vh, 22rem);
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 0.3rem;
          scrollbar-width: thin;
        }
        .msg { max-width: 88%; padding: 0.8rem 1rem; border-radius: 20px; line-height: 1.5; font-size: var(--step--1); white-space: pre-wrap; }
        .msg--assistant { background: var(--paper-3); color: var(--ink); border-bottom-left-radius: 6px; }
        .msg--user { align-self: flex-end; background: var(--acc); color: var(--acc-ink); border-bottom-right-radius: 6px; font-weight: 500; }
        .msg-error { color: var(--pink); }
        .msg--typing { display: inline-flex; gap: 5px; }
        .msg--typing i { width: 7px; height: 7px; border-radius: 99px; background: var(--ink-2); animation: gl-bounce 1s var(--ease-in-out) infinite; }
        .msg--typing i:nth-child(2) { animation-delay: 0.15s; }
        .msg--typing i:nth-child(3) { animation-delay: 0.3s; }

        .as-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .as-chip {
          padding: 0.5em 0.95em 0.55em;
          border-radius: var(--r-pill);
          border: 1px solid var(--acc);
          color: var(--ink);
          font-size: var(--step--1);
          cursor: pointer;
          transition: background 0.35s var(--ease-out), color 0.35s var(--ease-out);
        }
        .as-chip:hover:not(:disabled) { background: var(--acc); color: var(--acc-ink); }
        .as-chip:disabled { opacity: 0.4; cursor: default; }

        .as-form {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.35rem 0.35rem 0.35rem 1.2rem;
          border-radius: var(--r-pill);
          background: var(--paper);
          border: 1px solid var(--line);
          transition: border-color 0.3s;
        }
        .as-form:focus-within { border-color: var(--acc); }
        .as-form input { flex: 1; min-width: 0; height: 2.8rem; outline: none; font-size: var(--step-0); }
        .as-form input::placeholder { color: var(--ink-3); }
        .as-form button {
          display: grid; place-items: center;
          width: 2.8rem; height: 2.8rem; flex: none;
          border-radius: 99px;
          background: var(--acc); color: var(--acc-ink);
          cursor: pointer;
          transition: transform 0.4s var(--ease-out), opacity 0.3s;
        }
        .as-form button:hover:not(:disabled) { transform: rotate(-45deg); }
        .as-form button:disabled { opacity: 0.35; cursor: default; }

        .srcs { padding: 0.9rem 0.4rem 0.2rem; border-top: 1px solid var(--line); }
        .srcs-head { display: flex; justify-content: space-between; color: var(--ink-3); font-size: var(--step--2); letter-spacing: -0.01em; }
        .srcs-state.is-live { color: var(--acc); }
        .srcs-empty { margin-top: 0.6rem; color: var(--ink-3); font-size: var(--step--1); }
        .srcs-list { display: grid; gap: 0.5rem; margin-top: 0.7rem; }
        .src { display: grid; grid-template-columns: 1.6rem minmax(0, 1fr) 5rem; gap: 0.6rem; align-items: center; font-size: var(--step--1); }
        .src-n { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 99px; background: var(--paper-3); font-size: 0.7rem; }
        .src-t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .src-t em { font-style: normal; margin-left: 0.6em; color: var(--ink-3); font-size: 0.85em; }
        .src-bar { height: 5px; border-radius: 5px; background: var(--paper-3); overflow: hidden; }
        .src-bar i { display: block; height: 100%; background: var(--acc); transform-origin: left; border-radius: inherit; }

        @media (max-width: 960px) {
          .as-grid { grid-template-columns: minmax(0, 1fr); }
          .as-box { border-radius: var(--r-l); }
        }
      `}</style>
    </section>
  );
};

export default Assistant;
