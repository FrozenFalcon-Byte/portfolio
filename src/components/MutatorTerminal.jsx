import React, { useState, useEffect, useRef } from 'react';
import { Send, X, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { gsap, EASE, reduced } from '../lib/motion';
import { SYSTEM_PROMPT } from '../utils/systemPrompt';

const GREETING =
  'Restyler online. Describe a look and I will rewrite this page\'s CSS live — "make it brutalist", "go arctic blue", "turn everything into a terminal".';

const MutatorTerminal = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([{ role: 'model', content: GREETING }]);
  const [mounted, setMounted] = useState(false);

  const panelRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  /* Mount/unmount animation, hand-rolled so the whole page doesn't ship
     an animation library for one panel. */
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }
    if (!panelRef.current) {
      setMounted(false);
      return;
    }
    if (reduced()) { setMounted(false); return; }
    gsap.to(panelRef.current, {
      opacity: 0,
      y: 24,
      scale: 0.97,
      duration: 0.28,
      ease: EASE.glide,
      onComplete: () => setMounted(false),
    });
  }, [isOpen]);

  useEffect(() => {
    if (!mounted || !panelRef.current) return;
    if (reduced()) {
      gsap.set(panelRef.current, { opacity: 1, y: 0, scale: 1 });
    } else {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 44, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: EASE.swift }
      );
    }
    inputRef.current?.focus();
  }, [mounted]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const extractCSS = (text) => {
    const match = text.match(/```css\n([\s\S]*?)```/);
    return match ? match[1] : null;
  };

  const injectCSS = (cssCode) => {
    let tag = document.getElementById('ai-mutator-styles');
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'ai-mutator-styles';
      document.head.appendChild(tag);
    }
    tag.innerHTML += `\n/* restyle */\n${cssCode}`;
  };

  const resetMutations = () => {
    const tag = document.getElementById('ai-mutator-styles');
    if (tag) tag.innerHTML = '';
    setError('');
    setMessages([{ role: 'model', content: 'Reset. The page is back to its own styles.' }]);
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!API_KEY) {
      setError('No API key. Add VITE_GEMINI_API_KEY to .env and restart the dev server.');
      return;
    }

    const command = input.trim();
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: command }]);
    setIsLoading(true);

    try {
      const recent = messages.slice(-10).map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      recent.push({ role: 'user', parts: [{ text: command }] });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: recent,
          }),
        }
      );

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const css = extractCSS(raw);

      if (css) {
        injectCSS(css);
        setMessages((prev) => [...prev, { role: 'model', content: 'Applied. Scroll around and see.' }]);
      } else {
        setMessages((prev) => [...prev, { role: 'model', content: raw || 'No styles came back. Try describing the look differently.' }]);
      }
    } catch (err) {
      setError(`Could not reach the model: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      ref={panelRef}
      className="term"
      role="dialog"
      aria-modal="false"
      aria-label="Restyle this site"
    >
      <header className="term-bar">
        <span className="mono term-title">
          <span className="term-dot" aria-hidden="true" />
          Restyle
        </span>
        <div className="term-acts">
          <button onClick={resetMutations} aria-label="Reset all styles" className="term-icon">
            <RotateCcw size={14} />
          </button>
          <button onClick={onClose} aria-label="Close" className="term-icon">
            <X size={15} />
          </button>
        </div>
      </header>

      <div className="term-feed">
        {messages.map((m, i) => (
          <div key={i} className={`term-msg term-msg--${m.role}`}>
            {m.role === 'user' && <span className="term-caret" aria-hidden="true">›</span>}
            <p>{m.content}</p>
          </div>
        ))}

        {isLoading && (
          <div className="term-msg term-msg--model term-loading">
            <Loader2 size={13} className="animate-spin" />
            <p>Writing styles…</p>
          </div>
        )}

        {error && (
          <div className="term-msg term-error">
            <AlertCircle size={13} />
            <p>{error}</p>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form onSubmit={handleCommand} className="term-input">
        <input
          ref={inputRef}
          id="restyle-command"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe a look…"
          className="mono"
          autoComplete="off"
        />
        <button type="submit" disabled={isLoading || !input.trim()} aria-label="Send">
          <Send size={14} />
        </button>
      </form>

      <style>{`
        .term {
          position: fixed;
          right: clamp(0.75rem, 3vw, 2rem);
          bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(0.75rem, 3vh, 2rem));
          z-index: 9500;
          width: min(390px, calc(100vw - 1.5rem));
          height: min(500px, calc(100svh - 6rem));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: rgba(16, 14, 13, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
        }

        .term-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.8rem 0.9rem 0.8rem 1.1rem;
          border-bottom: 1px solid var(--line);
          flex: none;
        }
        .term-title {
          display: inline-flex;
          align-items: center;
          gap: 0.6em;
          color: var(--fg);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.7rem;
          font-weight: 500;
        }
        .term-dot {
          width: 6px; height: 6px;
          border-radius: 999px;
          background: var(--amber);
          box-shadow: 0 0 10px var(--amber);
        }
        .term-acts { display: flex; gap: 0.25rem; }
        .term-icon {
          display: grid;
          place-items: center;
          width: 30px; height: 30px;
          border-radius: 999px;
          color: var(--fg-dim);
          cursor: pointer;
          transition: color 0.25s var(--ease-out), background 0.25s var(--ease-out);
        }
        .term-icon:hover { color: var(--fg); background: var(--ink-high); }

        .term-feed {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 1rem 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          scrollbar-width: thin;
        }
        .term-feed::-webkit-scrollbar { width: 6px; }
        .term-feed::-webkit-scrollbar-thumb { background: var(--line); border-radius: 99px; }

        .term-msg {
          display: flex;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          line-height: 1.65;
        }
        .term-msg p { margin: 0; overflow-wrap: anywhere; }
        .term-msg--model p { color: var(--fg-dim); }
        .term-msg--user p { color: var(--fg); }
        .term-caret { color: var(--amber); flex: none; }
        .term-loading { color: var(--amber); align-items: center; }
        .term-loading p { color: var(--amber); }
        .term-error { color: var(--ember); align-items: flex-start; }
        .term-error p { color: var(--ember); }
        .term-error svg, .term-loading svg { flex: none; margin-top: 0.25em; }

        .term-input {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.6rem 0.6rem 1.1rem;
          border-top: 1px solid var(--line);
          flex: none;
        }
        .term-input input {
          flex: 1;
          min-width: 0;
          font-size: 0.8rem;
          color: var(--fg);
          outline: none;
        }
        .term-input input::placeholder { color: var(--fg-faint); }
        .term-input button {
          display: grid;
          place-items: center;
          width: 34px; height: 34px;
          flex: none;
          border-radius: 999px;
          background: var(--amber);
          color: var(--on-accent);
          cursor: pointer;
          transition: opacity 0.25s var(--ease-out);
        }
        .term-input button:disabled { opacity: 0.32; cursor: default; }
      `}</style>
    </div>
  );
};

export default MutatorTerminal;
