import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, EASE, reduced, fx, fx0 } from '../lib/motion';
import { usePrefs, setPrefs, resetPrefs, resolveTheme } from '../lib/prefs';
import { validate, ACCENTS, TAG_MAX, DEFAULTS } from '../../api/_prefs.js';
import Glyph from '../components/Glyph';

/* ------------------------------------------------------------------
   Settings.

   Everything on this page is live. A choice goes through the same
   schema the API validates against, is saved on this device, lands on
   <html> as a data attribute, and every part of the site that cares
   (the motion helpers, the cursor, Lenis, the loader, the assistant)
   picks it up without a reload.

   The right-hand column shows the machinery instead of a mock preview:
   the attributes on <html> right now, what is stored and how big it
   is, and a log of each change with what it actually did. Settings can
   travel as a short code the server signs, so a typo or a forged code
   is refused rather than half applied.
   ------------------------------------------------------------------ */

const EFFECT = {
  theme: (v) => (v === 'system' ? `Follows your OS, now ${resolveTheme('system')}` : `Palette swapped to ${v}, tokens re-read`),
  text: (v) => (v === 'large' ? 'Every rem on the site scaled to 112.5%' : 'Type back to its designed size'),
  motion: (v) => ({
    full: 'Blur, cursor lean and click bursts back on',
    calm: 'Blur off, cursor lean and click bursts off',
    still: 'Animations jump to their end states',
  }[v]),
  smooth: (v) => (v === 'on' ? 'Lenis smooths the wheel again' : 'Native wheel scrolling, no smoothing'),
  loader: (v) => ({
    always: 'Next reload plays the loader',
    once: 'Loader plays on the first page of a visit only',
    never: 'Next reload skips straight to the page',
  }[v]),
  cursor: (v) => (v === 'drawn' ? 'Drawn cursor mounted' : 'Drawn cursor unmounted, your OS pointer is back'),
  tag: (v) => `Your cursor now reads "${v}"`,
  tagAcc: (v) => (v === 'section' ? 'Tag colour follows each section' : `Tag is ${v} everywhere`),
  answer: (v) => (v === 'brief' ? 'Answers: two to four sentences' : 'Answers: up to about 150 words'),
  sources: (v) => (v === 'show' ? 'Answers cite their passages' : 'Answers drop the citation numbers'),
};

const LABEL = {
  theme: 'Theme', text: 'Text', motion: 'Motion', smooth: 'Smooth scroll', loader: 'Loader',
  cursor: 'Cursor', tag: 'Name', tagAcc: 'Tag colour', answer: 'Answers', sources: 'Citations',
};

/* ---------- controls ---------- */

/* A row of choices with an ink thumb that slides to the one picked. */
const Seg = ({ k, options, value }) => {
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  useLayoutEffect(() => {
    const place = () => {
      const on = trackRef.current?.querySelector('[aria-checked="true"]');
      if (!on || !thumbRef.current) return;
      thumbRef.current.style.width = `${on.offsetWidth}px`;
      thumbRef.current.style.transform = `translateX(${on.offsetLeft}px)`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [value]);
  return (
    <div className="st-seg" role="radiogroup" aria-label={LABEL[k]} ref={trackRef}>
      <span className="st-seg-thumb" ref={thumbRef} aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          className="st-seg-o"
          onClick={() => setPrefs({ [k]: o.v })}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

const Switch = ({ k, on, labels = ['on', 'off'] }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={LABEL[k]}
    className={`st-switch${on ? ' is-on' : ''}`}
    onClick={() => setPrefs({ [k]: on ? labels[1] : labels[0] })}
  >
    <span className="st-switch-k" />
  </button>
);

const Row = ({ title, note, children }) => (
  <div className="st-row">
    <div className="st-row-t">
      <b>{title}</b>
      {note && <span>{note}</span>}
    </div>
    <div className="st-row-c">{children}</div>
  </div>
);

const Group = ({ n, acc, glyph, title, children }) => (
  <section className="st-group" data-acc={acc}>
    <header className="st-group-h">
      <span className="eyebrow"><b>{n}</b>{title}</span>
      <span className="st-group-g"><Glyph kind={glyph} acc={acc} /></span>
    </header>
    {children}
  </section>
);

/* ---------- the cursor name ---------- */

const TagField = ({ tag }) => {
  const [draft, setDraft] = useState(tag);
  const [err, setErr] = useState('');
  useEffect(() => { setDraft(tag); }, [tag]);
  const change = (e) => {
    const v = e.target.value;
    setDraft(v);
    const r = validate({ tag: v });
    if (r.ok) { setErr(''); setPrefs({ tag: r.value.tag }); } else setErr(r.errors.tag);
  };
  return (
    <div className="st-tag">
      <div className="st-tag-field">
        <input
          value={draft}
          onChange={change}
          onBlur={() => { if (err) { setDraft(tag); setErr(''); } }}
          maxLength={TAG_MAX + 4}
          spellCheck="false"
          aria-label="Name on your cursor"
          aria-invalid={!!err}
        />
        <span className="st-tag-n num">{[...draft].length}/{TAG_MAX}</span>
      </div>
      <p className={`st-tag-msg${err ? ' is-err' : ''}`}>{err || 'Checked by the same rules the server uses.'}</p>
    </div>
  );
};

/* ---------- try the assistant with these settings ---------- */

const TRY_Q = 'What is he building at Emerson?';
const TryAssistant = ({ answer, sources }) => {
  const [state, setState] = useState({ busy: false, text: '', err: '', ms: 0 });
  const ask = async () => {
    setState({ busy: true, text: '', err: '', ms: 0 });
    const t0 = performance.now();
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: TRY_Q, history: [], style: { answer, sources } }),
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status}).`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const frames = buf.split('\n\n');
        buf = frames.pop() ?? '';
        for (const f of frames) {
          const line = f.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          const ev = JSON.parse(line.slice(5).trim());
          if (ev.type === 'delta') setState((s) => ({ ...s, text: s.text + ev.text }));
          else if (ev.type === 'error') throw new Error(ev.error);
        }
      }
      setState((s) => ({ ...s, busy: false, ms: Math.round(performance.now() - t0) }));
    } catch (e) {
      setState((s) => ({ ...s, busy: false, err: e.message }));
    }
  };
  const words = state.text.trim() ? state.text.trim().split(/\s+/).length : 0;
  return (
    <div className="st-try">
      <div className="st-try-q">
        <span>{TRY_Q}</span>
        <button type="button" className="st-btn st-btn--ink" onClick={ask} disabled={state.busy}>
          {state.busy ? 'Asking' : 'Ask with these settings'}
        </button>
      </div>
      {(state.text || state.err) && (
        <div className="st-try-a">
          {state.err ? <p className="st-err">{state.err}</p> : <p>{state.text}</p>}
          {!state.err && !state.busy && (
            <span className="st-meta">{words} words · {answer} · citations {sources === 'show' ? 'on' : 'off'} · {state.ms} ms</span>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- sync codes ---------- */

const Carry = ({ prefs }) => {
  const { search } = useLocation();
  const [code, setCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [input, setInput] = useState('');
  const [inbound, setInbound] = useState(null);
  const [copied, setCopied] = useState('');

  // Settings changed since the code was made: it no longer matches.
  const stamp = JSON.stringify(prefs);
  useEffect(() => { setCode((c) => (c && c.stamp !== stamp ? null : c)); }, [stamp]);

  const make = async () => {
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/prefs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prefs }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setCode({ code: d.code, bytes: d.bytes, stamp });
    } catch (e) {
      setMsg(e.message || 'Could not make a code.');
    } finally { setBusy(false); }
  };

  const read = useCallback(async (raw, preview = false) => {
    setBusy(true); setMsg('');
    try {
      const res = await fetch(`/api/prefs?code=${encodeURIComponent(raw)}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      if (preview) setInbound({ code: raw, prefs: d.prefs });
      else { setPrefs(d.prefs); setInput(''); setMsg('Applied. Everything above updated.'); }
    } catch (e) {
      setMsg(e.message || 'Could not read that code.');
    } finally { setBusy(false); }
  }, []);

  // Opened from a shared link: show what it holds before applying it.
  useEffect(() => {
    const c = new URLSearchParams(search).get('code');
    if (c) read(c, true);
  }, [search, read]);

  const copy = async (what, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1600); } catch { /* blocked */ }
  };
  const link = code ? `${window.location.origin}/settings?code=${code.code}` : '';
  const diff = inbound ? Object.keys(LABEL).filter((k) => inbound.prefs[k] !== prefs[k]) : [];

  return (
    <>
      {inbound && (
        <div className="st-inbound">
          <b>Someone sent you their settings.</b>
          <span>
            {diff.length
              ? diff.map((k) => `${LABEL[k]}: ${inbound.prefs[k]}`).join(' · ')
              : 'They match yours already.'}
          </span>
          <div className="st-acts">
            <button type="button" className="st-btn st-btn--ink" onClick={() => { setPrefs(inbound.prefs); setInbound(null); setMsg('Applied.'); }}>Apply them</button>
            <button type="button" className="st-btn" onClick={() => setInbound(null)}>Keep mine</button>
          </div>
        </div>
      )}

      <Row title="Take it with you" note="Your whole setup packed into a few bytes and signed by the server. Nothing is stored anywhere.">
        {code ? (
          <div className="st-code">
            <span className="st-code-v">{code.code}</span>
            <span className="st-meta">{code.bytes} bytes, signed</span>
            <div className="st-acts">
              <button type="button" className="st-btn" onClick={() => copy('code', code.code)}>{copied === 'code' ? 'Copied' : 'Copy code'}</button>
              <button type="button" className="st-btn" onClick={() => copy('link', link)}>{copied === 'link' ? 'Copied' : 'Copy link'}</button>
            </div>
          </div>
        ) : (
          <button type="button" className="st-btn st-btn--ink" onClick={make} disabled={busy}>{busy ? 'Packing' : 'Get a code'}</button>
        )}
      </Row>

      <Row title="Have a code?" note="Lookalike letters are fixed for you: O reads as 0, I and L as 1.">
        <form className="st-redeem" onSubmit={(e) => { e.preventDefault(); if (input.trim()) read(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="XXXX-XXXX-XXXX" spellCheck="false" aria-label="Settings code" />
          <button type="submit" className="st-btn st-btn--ink" disabled={busy || !input.trim()}>Apply</button>
        </form>
      </Row>
      {msg && <p className="st-msg" role="status">{msg}</p>}
    </>
  );
};

/* ---------- under the hood ---------- */

const ATTRS = ['theme', 'motion', 'text', 'cursor'];
const Hood = ({ prefs }) => {
  const [log, setLog] = useState([]);
  const [flash, setFlash] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const { prefs: p, prev, changed } = e.detail;
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLog((l) => [
        ...changed.map((k) => ({ id: `${Date.now()}-${k}`, t, k, from: prev[k], to: p[k], what: EFFECT[k](p[k]) })),
        ...l,
      ].slice(0, 7));
      setFlash(changed);
    };
    window.addEventListener('prefschange', on);
    return () => window.removeEventListener('prefschange', on);
  }, []);
  const html = document.documentElement.dataset;
  const json = JSON.stringify(prefs);
  const changedFromDefault = Object.keys(LABEL).filter((k) => prefs[k] !== DEFAULTS[k]).length;

  return (
    <aside className="st-hood" data-surface="ink" data-acc="violet">
      <p className="st-hood-h">Under the hood</p>

      <pre className="st-html" aria-label="Attributes on the html element">
        <span className="st-c">{'<html'}</span>
        {ATTRS.map((a) => (
          <span key={`${a}-${html[a]}`} className={`st-attr${flash.includes(a) ? ' is-new' : ''}`}>
            {'\n  '}data-{a}=<i>"{html[a]}"</i>
          </span>
        ))}
        <span className="st-c">{'\n>'}</span>
      </pre>

      <div className="st-stats">
        <div><b className="num">{new Blob([json]).size}</b><span>bytes in localStorage</span></div>
        <div><b className="num">{changedFromDefault}</b><span>changed from default</span></div>
      </div>

      <p className="st-hood-h">Changes</p>
      <ol className="st-log">
        {log.length === 0 && <li className="st-log-empty">Change anything on the left and it shows up here, with what it did.</li>}
        {log.map((r) => (
          <li key={r.id}>
            <span className="st-log-k">{LABEL[r.k]} <i>{r.from}</i> → <b>{r.to}</b></span>
            <span className="st-log-w">{r.what}</span>
            <span className="st-log-t num">{r.t}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
};

/* ---------- the page ---------- */

const Settings = () => {
  const prefs = usePrefs();
  const rootRef = useRef(null);

  useEffect(() => {
    if (reduced()) return undefined;
    const root = rootRef.current;
    const tl = gsap.timeline({ delay: window.loaderIsDone ? 0.1 : 0.9 });
    tl.fromTo(root.querySelectorAll('.st-title .ln-in'), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.08, ease: EASE.swift })
      .fromTo(root.querySelectorAll('.st-lede, .st-group, .st-hood'), { y: 40, opacity: 0, ...fx(8) }, {
        y: 0, opacity: 1, ...fx0(), duration: 0.9, stagger: 0.07, ease: EASE.swift, clearProps: 'transform,opacity,filter',
      }, 0.25);
    return () => tl.kill();
  }, []);

  const swatch = (a) => (
    <button
      key={a}
      type="button"
      role="radio"
      aria-checked={prefs.tagAcc === a}
      aria-label={a === 'section' ? 'Follow each section' : a}
      className={`st-sw st-sw--${a}`}
      style={a === 'section' ? undefined : { '--sw': `var(--${a})` }}
      onClick={() => setPrefs({ tagAcc: a })}
    >
      {a === 'section' && <span>Auto</span>}
    </button>
  );

  return (
    <div className="st" ref={rootRef} data-acc="violet">
      <div className="shell">
        <header className="st-top">
          <h1 className="display st-title">
            <span className="ln"><span className="ln-in">Make it</span></span>
            <span className="ln"><span className="ln-in"><Glyph kind="dial" acc="violet" /> yours.</span></span>
          </h1>
          <p className="st-lede">
            Every choice here is checked against the same schema the server uses, saved on this
            device and applied the moment you pick it. No reloads. Take the whole setup to another
            device with a code.
          </p>
        </header>

        <div className="st-body">
          <div className="st-groups">
            <Group n="01" acc="yellow" glyph="spark" title="Look">
              <Row title="Theme" note={prefs.theme === 'system' ? `Following your OS, ${resolveTheme('system')} right now.` : 'Light is how the site was designed.'}>
                <Seg k="theme" value={prefs.theme} options={[{ v: 'light', label: 'Light' }, { v: 'dark', label: 'Dark' }, { v: 'system', label: 'System' }]} />
              </Row>
              <Row title="Text size" note="Scales every type size on the site together.">
                <Seg k="text" value={prefs.text} options={[{ v: 'regular', label: 'Regular' }, { v: 'large', label: 'Large' }]} />
              </Row>
            </Group>

            <Group n="02" acc="blue" glyph="wave" title="Motion">
              <Row title="How much" note={EFFECT.motion(prefs.motion)}>
                <Seg k="motion" value={prefs.motion} options={[{ v: 'full', label: 'Full' }, { v: 'calm', label: 'Calm' }, { v: 'still', label: 'Still' }]} />
              </Row>
              <Row title="Smooth scroll" note="Eased wheel scrolling. Off gives you your mouse's own feel.">
                <Switch k="smooth" on={prefs.smooth === 'on'} />
              </Row>
              <Row title="Loader" note="Applies from your next reload.">
                <Seg k="loader" value={prefs.loader} options={[{ v: 'always', label: 'Every time' }, { v: 'once', label: 'Once a visit' }, { v: 'never', label: 'Never' }]} />
              </Row>
            </Group>

            <Group n="03" acc="pink" glyph="click" title="Your cursor">
              <Row title="Pointer" note="The drawn one, or your system's own.">
                <Seg k="cursor" value={prefs.cursor} options={[{ v: 'drawn', label: 'Drawn' }, { v: 'system', label: 'System' }]} />
              </Row>
              <Row title="Name on it" note="What your tag says, here and in the Pair section.">
                <TagField tag={prefs.tag} />
              </Row>
              <Row title="Tag colour" note={prefs.tagAcc === 'section' ? 'Changes with each section, like the rest of the site.' : `Always ${prefs.tagAcc}.`}>
                <div className="st-sws" role="radiogroup" aria-label="Tag colour">{ACCENTS.map(swatch)}</div>
              </Row>
            </Group>

            <Group n="04" acc="violet" glyph="bot" title="Assistant">
              <Row title="Answers" note={prefs.answer === 'brief' ? 'Two to four sentences.' : 'Up to about 150 words.'}>
                <Seg k="answer" value={prefs.answer} options={[{ v: 'brief', label: 'Brief' }, { v: 'detailed', label: 'Detailed' }]} />
              </Row>
              <Row title="Citations" note="Numbered references to the passages it used.">
                <Switch k="sources" on={prefs.sources === 'show'} labels={['show', 'hide']} />
              </Row>
              <TryAssistant answer={prefs.answer} sources={prefs.sources} />
            </Group>

            <Group n="05" acc="teal" glyph="lock" title="Carry it">
              <Carry prefs={prefs} />
              <Row title="Start over" note="Every setting back to how the site ships.">
                <button type="button" className="st-btn" onClick={resetPrefs}>Reset all</button>
              </Row>
            </Group>
          </div>

          <Hood prefs={prefs} />
        </div>
      </div>

      <style>{`
        .st { padding: clamp(7rem, 16vh, 10rem) 0 clamp(4rem, 10vh, 7rem); }
        .st-top {
          display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          gap: 1.5rem clamp(2rem, 6vw, 6rem); align-items: end;
          margin-bottom: clamp(2.5rem, 7vh, 4.5rem);
        }
        .st-title { margin: 0; font-size: var(--step-4); line-height: 0.92; letter-spacing: -0.055em; font-weight: 800; }
        .st-title .ln { display: block; overflow: hidden; padding-bottom: 0.04em; }
        .st-title .ln-in { display: inline-block; }
        .st-lede { color: var(--ink-2); max-width: 36ch; margin: 0; }

        .st-body { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: clamp(1.5rem, 3vw, 3rem); align-items: start; }
        .st-groups { display: grid; gap: clamp(1rem, 2vw, 1.4rem); }

        .st-group {
          padding: clamp(1.2rem, 2.4vw, 2rem);
          border-radius: var(--r-l);
          background: var(--paper-2);
        }
        .st-group-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
        .st-group-h .eyebrow { font-size: var(--step-1); font-weight: 700; letter-spacing: -0.02em; color: var(--ink); }
        .st-group-g { font-size: 2.2rem; line-height: 0; }

        .st-row {
          display: grid; grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.8rem 2rem; align-items: center;
          padding: 1.05rem 0;
          border-top: 1px solid var(--line-2);
        }
        .st-row:first-of-type { border-top: 0; }
        .st-row-t { display: grid; gap: 0.2rem; }
        .st-row-t b { font-weight: 650; }
        .st-row-t span { color: var(--ink-3); font-size: var(--step--1); max-width: 40ch; }
        .st-row-c { justify-self: end; }

        .st-seg {
          position: relative; display: inline-flex; padding: 4px;
          border-radius: 99px; background: var(--paper);
          box-shadow: inset 0 0 0 1px var(--line-2);
        }
        .st-seg-thumb {
          position: absolute; left: 0; top: 4px; bottom: 4px;
          border-radius: 99px; background: var(--ink);
          transition: transform 0.5s var(--ease-out), width 0.5s var(--ease-out);
        }
        .st-seg-o {
          position: relative; z-index: 1;
          height: 2.3rem; padding: 0 1rem;
          border: 0; border-radius: 99px; background: none; cursor: pointer;
          font: inherit; font-size: var(--step--1); font-weight: 600; white-space: nowrap;
          color: var(--ink-2);
          transition: color 0.4s var(--ease-out);
        }
        .st-seg-o[aria-checked="true"] { color: var(--paper); }
        .st-seg-o:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }

        .st-switch {
          width: 58px; height: 34px; padding: 4px; flex: none;
          border: 0; border-radius: 99px; cursor: pointer;
          background: var(--paper); box-shadow: inset 0 0 0 1px var(--line);
          transition: background 0.4s var(--ease-out);
        }
        .st-switch-k {
          display: block; width: 26px; height: 26px; border-radius: 99px;
          background: var(--ink-3);
          transition: transform 0.5s var(--ease-out), background 0.4s;
        }
        .st-switch.is-on { background: var(--acc); box-shadow: none; }
        .st-switch.is-on .st-switch-k { transform: translateX(24px); background: var(--acc-ink); }

        .st-tag { display: grid; gap: 0.35rem; justify-items: end; }
        .st-tag-field {
          display: flex; align-items: center; gap: 0.6rem;
          height: 2.6rem; padding: 0 0.9rem 0 1rem;
          border-radius: 6px 16px 16px 16px;
          background: var(--ink); color: var(--paper);
        }
        .st-tag-field input {
          width: 9.5rem; border: 0; outline: 0; background: none; color: inherit;
          font: inherit; font-weight: 600;
        }
        .st-tag-n { font-size: var(--step--2); color: color-mix(in srgb, var(--paper) 55%, transparent); }
        .st-tag-msg { margin: 0; font-size: var(--step--2); color: var(--ink-3); }
        .st-tag-msg.is-err { color: #E61A66; }

        .st-sws { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: flex-end; }
        .st-sw {
          width: 2.3rem; height: 2.3rem; border: 0; border-radius: 99px; cursor: pointer;
          background: var(--sw);
          box-shadow: 0 0 0 2px var(--paper-2), 0 0 0 2px transparent;
          transition: box-shadow 0.3s var(--ease-out), transform 0.4s var(--ease-out);
        }
        .st-sw:hover { transform: scale(1.08); }
        .st-sw[aria-checked="true"] { box-shadow: 0 0 0 3px var(--paper-2), 0 0 0 5px var(--ink); }
        .st-sw--section {
          width: auto; padding: 0 0.8rem;
          background: var(--paper); color: var(--ink);
          font: inherit; font-size: var(--step--2); font-weight: 650;
        }

        .st-btn {
          display: inline-flex; align-items: center; justify-content: center;
          height: 2.5rem; padding: 0 1.1rem;
          border: 0; border-radius: 99px; cursor: pointer;
          background: var(--paper); color: var(--ink);
          box-shadow: inset 0 0 0 1px var(--line);
          font: inherit; font-size: var(--step--1); font-weight: 650; white-space: nowrap;
          transition: background 0.3s, color 0.3s, transform 0.3s var(--ease-out);
        }
        .st-btn:hover { background: var(--acc); color: var(--acc-ink); box-shadow: none; }
        .st-btn:active { transform: scale(0.96); }
        .st-btn:disabled { opacity: 0.5; cursor: default; }
        .st-btn--ink { background: var(--ink); color: var(--paper); box-shadow: none; }
        .st-acts { display: flex; flex-wrap: wrap; gap: 0.4rem; }

        .st-try { margin-top: 0.4rem; padding: 1rem; border-radius: calc(var(--r-l) - 10px); background: var(--paper); }
        .st-try-q { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .st-try-q span { font-family: var(--font-display); font-weight: 700; font-size: var(--step-1); letter-spacing: -0.02em; }
        .st-try-a { margin-top: 0.9rem; padding-top: 0.9rem; border-top: 1px solid var(--line-2); display: grid; gap: 0.5rem; }
        .st-try-a p { margin: 0; }
        .st-meta { color: var(--ink-3); font-size: var(--step--2); font-weight: 600; }
        .st-err { color: #E61A66; }

        .st-code { display: grid; gap: 0.5rem; justify-items: end; }
        .st-code-v { font-family: var(--font-mono); font-size: var(--step-1); font-weight: 600; letter-spacing: 0.06em; }
        .st-redeem { display: flex; gap: 0.4rem; }
        .st-redeem input {
          width: 12rem; height: 2.5rem; padding: 0 1rem;
          border: 0; border-radius: 99px; outline: 0;
          background: var(--paper); color: var(--ink);
          box-shadow: inset 0 0 0 1px var(--line);
          font-family: var(--font-mono); font-size: var(--step--1); letter-spacing: 0.04em; text-transform: uppercase;
        }
        .st-redeem input:focus { box-shadow: inset 0 0 0 2px var(--acc); }
        .st-msg { margin: 0.2rem 0 0.6rem; font-size: var(--step--1); color: var(--ink-2); }
        .st-inbound {
          display: grid; gap: 0.5rem; margin: 0.4rem 0 0.8rem; padding: 1rem;
          border-radius: calc(var(--r-l) - 10px);
          background: var(--acc); color: var(--acc-ink);
        }
        .st-inbound span { font-size: var(--step--1); }
        .st-inbound .st-btn { box-shadow: none; }

        .st-hood {
          position: sticky; top: 6rem;
          padding: clamp(1.2rem, 2.2vw, 1.8rem);
          border-radius: var(--r-l);
        }
        .st-hood-h { margin: 0 0 0.8rem; color: var(--ink-3); font-size: var(--step--1); font-weight: 650; }
        .st-html {
          margin: 0 0 1.2rem; padding: 1rem 1.1rem;
          border-radius: 14px; background: var(--paper-2);
          font-family: var(--font-mono); font-size: 0.82rem; line-height: 1.6;
          white-space: pre; overflow-x: auto;
        }
        .st-c { color: var(--ink-3); }
        .st-attr i { font-style: normal; color: var(--acc); }
        .st-attr.is-new { animation: st-flash 1.2s var(--ease-out); }
        @keyframes st-flash { 0% { background: color-mix(in srgb, var(--acc) 35%, transparent); } 100% { background: transparent; } }
        .st-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1.4rem; }
        .st-stats div { display: grid; gap: 0.1rem; padding: 0.8rem 0.9rem; border-radius: 14px; background: var(--paper-2); }
        .st-stats b { font-family: var(--font-display); font-size: var(--step-2); font-weight: 750; line-height: 1; }
        .st-stats span { color: var(--ink-3); font-size: var(--step--2); }
        .st-log { list-style: none; margin: 0; padding: 0; display: grid; }
        .st-log li {
          display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.15rem 1rem;
          padding: 0.7rem 0; border-top: 1px solid var(--line-2);
          animation: st-in 0.5s var(--ease-out) both;
        }
        .st-log-k { font-size: var(--step--1); font-weight: 600; }
        .st-log-k i { font-style: normal; color: var(--ink-3); text-decoration: line-through; }
        .st-log-k b { color: var(--acc); font-weight: 650; }
        .st-log-w { grid-column: 1; color: var(--ink-2); font-size: var(--step--2); }
        .st-log-t { grid-column: 2; grid-row: 1; color: var(--ink-3); font-size: var(--step--2); }
        .st-log-empty { color: var(--ink-3); font-size: var(--step--1); display: block !important; animation: none !important; }
        @keyframes st-in { from { opacity: 0; transform: translateY(-6px); } }

        @media (max-width: 1000px) {
          .st-top, .st-body { grid-template-columns: 1fr; }
          .st-hood { position: static; }
        }
        @media (max-width: 640px) {
          .st-row { grid-template-columns: 1fr; }
          .st-row-c { justify-self: start; }
          .st-tag, .st-code { justify-items: start; }
          .st-sws { justify-content: flex-start; }
          .st-seg-o { padding: 0 0.75rem; }
          .st-redeem input { width: 100%; min-width: 0; flex: 1; }
          .st-redeem { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Settings;
