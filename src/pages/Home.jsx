import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '../components/Hero';
import About from '../components/About';
import Experience from '../components/Experience';
import Skills from '../components/Skills';
import Projects from '../components/Projects';
import Extracurricular from '../components/Extracurricular';
import Footer from '../components/Footer';

const Home = () => {
  useEffect(() => {
    // Instantly reset scroll to top to prevent jumping/teleporting
    window.scrollTo(0, 0);
    
    const overlay = document.getElementById('global-overlay');
    if (overlay) {
      gsap.killTweensOf(overlay);
      gsap.fromTo(overlay, 
        { clipPath: 'circle(150% at 50% 50%)' },
        { clipPath: 'circle(0% at 50% 50%)', duration: 1.2, ease: 'power3.inOut' }
      );
    }
    
    setTimeout(() => {
      if (window.locoScroll) {
        window.locoScroll.scrollTo(0, { duration: 0, disableLerp: true });
        window.locoScroll.update();
      }
      ScrollTrigger.refresh();
    }, 100);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      onAnimationStart={(variant) => {
        if (variant === "exit") {
          const overlay = document.getElementById('global-overlay');
          if (overlay) {
            gsap.killTweensOf(overlay);
            gsap.fromTo(overlay, 
              { clipPath: 'circle(0% at 50% 50%)' },
              { clipPath: 'circle(150% at 50% 50%)', duration: 1.2, ease: 'power3.inOut' }
            );
          }
        }
      }}
      transition={{ duration: 1.2 }}
    >
      <Hero />
      <Experience />
      <About />
      <Skills />
      <Projects />
      <Extracurricular />
      <Footer />
    </motion.div>
  );
};

export default Home;
