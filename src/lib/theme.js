import { useCallback, useEffect, useState } from 'react';

const KEY = 'ac-theme';

/* Light is the site's real design; dark is a courtesy. So a first-time
   visitor always lands in light, and only a stored choice moves them. */
export const readTheme = () => {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* private mode, blocked storage — light is a fine answer */ }
  return 'light';
};

export const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0C0C10' : '#F4F1E8');
};

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(KEY, theme); } catch { /* nothing to do */ }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, toggle };
}
