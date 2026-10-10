import { lazy } from 'react';

/* Every page but home ships as its own chunk, so a first visit only
   downloads the page it opened. A chunk is fetched the moment anything
   points at it: the route transition starts the fetch as its morph
   begins (and waits for it before swapping, which is almost never), a
   reload starts it before React mounts, and once the first page has
   settled the rest are fetched while the browser is idle, so later
   clicks never wait at all. */

const LOAD = {
  '/story': () => import('../pages/Story'),
  '/lab': () => import('../pages/Lab'),
  '/experience/pmo': () => import('../pages/ExperienceDetail'),
  '/settings': () => import('../pages/Settings'),
};

const cache = new Map();
export const preloadRoute = (path) => {
  const key = path.split(/[?#]/)[0];
  const load = LOAD[key];
  if (!load) return Promise.resolve();
  if (!cache.has(key)) cache.set(key, load().catch((err) => { cache.delete(key); throw err; }));
  return cache.get(key);
};

const page = (path) => lazy(() => preloadRoute(path));
export const Story = page('/story');
export const Lab = page('/lab');
export const ExperienceDetail = page('/experience/pmo');
export const Settings = page('/settings');

export const prefetchRoutes = () => {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => Object.keys(LOAD).forEach((p) => preloadRoute(p).catch(() => {})), { timeout: 4000 });
};
