import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useTheme } from '../context/ThemeContext';

const ScrambleText = ({ text }) => {
  const [displayText, setDisplayText] = useState(text);
  
  useEffect(() => {
    let iteration = 0;
    let interval = null;
    let loopTimeout = null;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    const startScramble = () => {
      iteration = 0;
      
      interval = setInterval(() => {
        setDisplayText(prev => {
          return text.split('').map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('');
        });
        
        if (iteration >= text.length) {
          clearInterval(interval);
          // After it finishes decrypting, wait 8 seconds and do it again (loop)
          loopTimeout = setTimeout(startScramble, 8000); 
        }
        
        iteration += 1 / 3; 
      }, 40);
    };

    if (window.loaderIsDone) {
      startScramble();
    } else {
      const handleLoaderDone = () => startScramble();
      window.addEventListener('loader-complete', handleLoaderDone);
      return () => {
        window.removeEventListener('loader-complete', handleLoaderDone);
        clearTimeout(loopTimeout);
        clearInterval(interval);
      };
    }
    
    return () => {
      clearTimeout(loopTimeout);
      clearInterval(interval);
    };
  }, [text]);

  return <>{displayText}</>;
};

const Hero = () => {
  const containerRef = useRef(null);
  const [bootText, setBootText] = useState('');
  const { theme } = useTheme();
  
  useEffect(() => {
    const sequence = [
      "INIT_SYSTEM...",
      "LOADING_MODULES [OK]",
      "MOUNTING_DRIVES [OK]",
      "ESTABLISHING_UPLINK...",
      "UPLINK_ESTABLISHED.",
      "ACCESS_GRANTED."
    ];
    
    setBootText(sequence.join('\n') + '\n');
  }, []);

  return (
    <section ref={containerRef} className="hero" data-scroll-section style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', padding: '0 5vw' }}>
      
      <div style={{ zIndex: 10, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', maxWidth: '1000px' }}>
        
        {/* Soft, feathered blur blob strictly behind the text block */}
        <div style={{
          position: 'absolute',
          top: '-5%',
          left: '-5%',
          width: '110%',
          height: '110%',
          background: theme === 'light' 
            ? 'linear-gradient(to right, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0) 100%)'
            : 'linear-gradient(to right, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.4) 60%, rgba(5,5,5,0) 100%)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          maskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
          zIndex: -1,
          pointerEvents: 'none'
        }} />

        {/* Terminal Boot sequence */}
        <div style={{ 
          fontFamily: 'var(--font-mono)', 
          color: 'var(--text-secondary)', 
          fontSize: '0.8rem', 
          whiteSpace: 'pre-line', 
          opacity: 0.7,
          minHeight: '90px', /* Fixes height so it doesn't push elements down as it types */
          marginBottom: '1rem'
        }}>
          {bootText}
          <span style={{ animation: 'blink 1s step-end infinite', color: 'var(--accent-red)' }}>_</span>
        </div>

        <div style={{ display: 'inline-block', border: '1px solid var(--border-muted)', padding: '0.5rem 1rem', marginBottom: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-charcoal)' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--accent-red)', borderRadius: '0', marginRight: '0.5rem' }}></span>
          SYS.OP.ENGINEER // AI.ML
        </div>
        
        <h1 data-scroll data-scroll-speed="2" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(3rem, 15vw, 8rem)', fontWeight: 700, lineHeight: 0.9, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '-0.03em', margin: 0, wordBreak: 'break-word', width: '100%' }}>
          <ScrambleText text="AJINKYA" /><br/>
          <span style={{ color: 'var(--text-secondary)' }}><ScrambleText text="CHAVAN_" /></span>
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap' }}>
          <div style={{ width: '50px', height: '1px', background: 'var(--border-muted)', marginTop: '0.7rem' }}></div>
          <p data-scroll data-scroll-speed="1" style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
            AIML Engineering Student & Developer. Specializing in Generative AI, multi-agent frameworks, and full-stack system architectures.
          </p>
        </div>
      </div>

      <div className="mobile-hide" style={{ position: 'absolute', bottom: '5vh', right: '5vw', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <div>SCROLL_TO_INITIALIZE</div>
        <div style={{ width: '1px', height: '100px', background: 'var(--accent-red)', opacity: 0.5, animation: 'pulseHeight 2s ease-in-out infinite' }}></div>
      </div>
      
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulseHeight {
          0%, 100% { transform: scaleY(1); transform-origin: top; }
          50% { transform: scaleY(0.2); transform-origin: top; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
