import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import ExperienceDetail from './pages/ExperienceDetail';
import Cursor from './components/Cursor';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import Background3D from './components/Background3D';
import MutatorTerminal from './components/MutatorTerminal';

gsap.registerPlugin(ScrollTrigger);

const App = () => {
  const scrollRef = useRef(null);
  const location = useLocation();
  const [isMutatorOpen, setIsMutatorOpen] = useState(false);

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
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
      <Navbar onOpenMutator={() => setIsMutatorOpen(true)} />

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

      {/* Floating AI Command Button */}
      <AnimatePresence>
        {!isMutatorOpen && (
          <motion.button
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            onClick={() => setIsMutatorOpen(true)}
            className="interactive"
            data-cursor-shape="magnetic"
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              background: 'var(--bg-charcoal)',
              color: 'var(--accent-red)',
              border: '1px solid var(--accent-red)',
              padding: '0.75rem 1.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              cursor: 'pointer',
              zIndex: 99998,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(229, 9, 20, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600
            }}
          >
            [ AI_COMMAND ]
          </motion.button>
        )}
      </AnimatePresence>

      <MutatorTerminal isOpen={isMutatorOpen} onClose={() => setIsMutatorOpen(false)} />
    </>
  );
};

export default App;
