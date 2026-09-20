import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, reduced } from './lib/motion';
import Home from './pages/Home';
import ExperienceDetail from './pages/ExperienceDetail';
import Nav from './components/Nav';
import Cursor from './components/Cursor';
import Loader from './components/Loader';

/* Lenis drives scroll and ScrollTrigger reads from it — one clock, so
   pinned sections and scrubbed timelines never drift apart. */
const useSmoothScroll = () => {
  useEffect(() => {
    if (reduced()) {
      ScrollTrigger.refresh();
      return undefined;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      syncTouch: false,          // native momentum on touch stays native
      touchMultiplier: 1.6,
    });

    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    // Pinning inserts spacers, which changes the document height. Lenis
    // caches that height, so without this the last pinned section can
    // refuse to scroll past itself.
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener('refresh', onRefresh);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop: (value) =>
        value !== undefined ? lenis.scrollTo(value, { immediate: true }) : lenis.scroll,
    });

    // Anything landing after first paint changes measured heights, and a
    // scrubbed trigger measured against the old layout stays stuck
    // part-way through its tween. Re-measure on each of them.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    window.addEventListener('loader-complete', onLoad);

    const pending = Array.from(document.images).filter((img) => !img.complete);
    let settled = pending.length;
    const onImage = () => {
      settled -= 1;
      if (settled <= 0) ScrollTrigger.refresh();
    };
    pending.forEach((img) => {
      img.addEventListener('load', onImage, { once: true });
      img.addEventListener('error', onImage, { once: true });
    });

    return () => {
      window.removeEventListener('load', onLoad);
      window.removeEventListener('loader-complete', onLoad);
      pending.forEach((img) => {
        img.removeEventListener('load', onImage);
        img.removeEventListener('error', onImage);
      });
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.lenis;
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
};

/* A route change replaces every measured element on the page, so the
   triggers that survived it are measuring a layout that no longer
   exists. Land at the top (or the requested section) and re-measure. */
const RouteEffects = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const target = hash ? document.querySelector(hash) : null;

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (target) {
        if (window.lenis) window.lenis.scrollTo(target, { offset: -20, immediate: true });
        else target.scrollIntoView();
      } else if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    });
  }, [pathname, hash]);

  return null;
};

const Shell = () => {
  useSmoothScroll();

  return (
    <>
      <Cursor />
      <Loader />
      <Nav />
      <RouteEffects />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/experience/pmo" element={<ExperienceDetail />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <Shell />
  </BrowserRouter>
);

export default App;
