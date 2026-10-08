import React from 'react';
import { Moon, Sun } from 'lucide-react';

/* A pill that shows where you are going, not where you are — the icon
   is the destination, which is how every OS control of this shape reads. */
const ThemeToggle = ({ theme, onToggle }) => (
  <button
    className="theme-toggle"
    onClick={onToggle}
    aria-pressed={theme === 'dark'}
    title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
  >
    <span className="theme-toggle-track" aria-hidden="true">
      <span className="theme-toggle-knob">
        {theme === 'dark' ? <Sun size={13} strokeWidth={2.4} /> : <Moon size={13} strokeWidth={2.4} />}
      </span>
    </span>
    <span className="sr-only">
      {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    </span>

    <style>{`
      .theme-toggle {
        display: grid;
        place-items: center;
        padding: 0;
        cursor: pointer;
        flex: none;
      }
      .theme-toggle-track {
        display: flex;
        align-items: center;
        width: 52px;
        height: 30px;
        padding: 3px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: var(--paper-2);
        transition: background 0.4s var(--ease-out), border-color 0.4s var(--ease-out);
      }
      .theme-toggle-knob {
        display: grid;
        place-items: center;
        width: 22px; height: 22px;
        border-radius: 999px;
        background: var(--ink);
        color: var(--paper);
        transform: translateX(0);
        transition: transform 0.5s var(--ease-out), background 0.4s var(--ease-out);
      }
      [data-theme="dark"] .theme-toggle-knob {
        transform: translateX(22px);
        background: var(--yellow);
        color: #101403;
      }
      .theme-toggle:hover .theme-toggle-track { border-color: var(--ink-3); }
      @media (prefers-reduced-motion: reduce) {
        .theme-toggle-knob { transition: none; }
      }
    `}</style>
  </button>
);

export default ThemeToggle;
