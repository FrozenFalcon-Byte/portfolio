import { useCallback } from 'react';
import { usePrefs, setPrefs, resolveTheme, applyTheme } from './prefs';

/* The theme is one of the reader settings now (see prefs.js); this keeps
   the nav's toggle as a quick way to flip it. Light is the site's real
   design; dark is a courtesy, so a first-time visitor lands in light. */
export { applyTheme };

export const readTheme = () => resolveTheme();

export function useTheme() {
  const prefs = usePrefs();
  const theme = resolveTheme(prefs.theme);
  const toggle = useCallback(() => setPrefs({ theme: theme === 'dark' ? 'light' : 'dark' }), [theme]);
  return { theme, toggle };
}
