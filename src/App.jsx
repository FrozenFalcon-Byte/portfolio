import React, { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import ExperienceDetail from './pages/ExperienceDetail';
import Cursor from './components/Cursor';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import Background3D from './components/Background3D';

gsap.registerPlugin(ScrollTrigger);

const App = () => {
  const scrollRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    window.lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger on resize or load
    const resizeObserver = new ResizeObserver(() => {
      ScrollTrigger.refresh();
    });
    
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }
    
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
      resizeObserver.disconnect();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <>
      <Background3D />
      <Cursor />
      <Navbar />

      <Loader />
      <div id="global-overlay" className="global-overlay"></div>
      
      <div className="main-container" ref={scrollRef}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/experience/pmo" element={<ExperienceDetail />} />
          </Routes>
        </AnimatePresence>
      </div>
    </>
  );
};

export default App;
