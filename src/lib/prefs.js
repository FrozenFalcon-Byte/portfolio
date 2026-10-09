import { useSyncExternalStore } from 'react';
import { DEFAULTS, KEYS, normalize } from '../../api/_prefs.js';

/* ------------------------------------------------------------------
   Reader settings.

   One small store outside React, so anything can read it: components
   through usePrefs(), and plain modules (motion, the cursor's ticker)
   through getPrefs() at the moment they need a value. Every change is
   validated by the same schema the API uses, written to localStorage,
   reflected onto <html> as data attributes for CSS to pick up, and
   announced as a `prefschange` event for anything holding state that
   was built from the old value.
   ------------------------------------------------------------------ */

const KEY = 'ac-prefs';
const ALL = [...KEYS, 'tag'];

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
    // Visitors from before settings existed only had a theme.
    return normalize({ theme: localStorage.getItem('ac-theme') });
  } catch {
    return { ...DEFAULTS };
  }
};

let state = typeof window === 'undefined' ? { ...DEFAULTS } : load();
const subs = new Set();

export const getPrefs = () => state;

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');
export const resolveTheme = (t = state.theme) => (t === 'system' ? (darkQuery().matches ? 'dark' : 'light') : t);

export const applyTheme = (theme) => {
  if (document.documentElement.dataset.theme === theme) return;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0B0B0C' : '#FFFFFF');
  // Anything that read a token into a tween is now holding a colour from
  // the old theme. Give it a chance to rebuild.
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
};

const apply = () => {
  const html = document.documentElement;
  applyTheme(resolveTheme());
  html.dataset.motion = state.motion;
  html.dataset.text = state.text;
  html.dataset.cursor = state.cursor;
  if (window.lenis) window.lenis.options.smoothWheel = state.smooth === 'on';
};

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    // The pre-paint script in index.html reads this, so a dark (or
    // system-dark) visitor never sees light flash past.
    localStorage.setItem('ac-theme', resolveTheme());
  } catch { /* private mode: settings last for this visit */ }
};

export function setPrefs(patch) {
  const next = normalize({ ...state, ...patch });
  const changed = ALL.filter((k) => next[k] !== state[k]);
  if (!changed.length) return [];
  const prev = state;
  state = next;
  save();
  apply();
  subs.forEach((fn) => fn());
  window.dispatchEvent(new CustomEvent('prefschange', { detail: { prefs: state, prev, changed } }));
  return changed;
}

export const resetPrefs = () => setPrefs(DEFAULTS);

const subscribe = (fn) => {
  subs.add(fn);
  return () => subs.delete(fn);
};
export const usePrefs = () => useSyncExternalStore(subscribe, getPrefs, getPrefs);

if (typeof window !== 'undefined') {
  apply();
  // "System" follows the OS live, not just at load.
  darkQuery().addEventListener?.('change', () => {
    if (state.theme !== 'system') return;
    apply();
    save();
    subs.forEach((fn) => fn());
  });
  // Another tab changed them: follow along.
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    const prev = state;
    state = load();
    apply();
    subs.forEach((fn) => fn());
    const changed = ALL.filter((k) => state[k] !== prev[k]);
    if (changed.length) window.dispatchEvent(new CustomEvent('prefschange', { detail: { prefs: state, prev, changed } }));
  });
}
