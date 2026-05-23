import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const textRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Wait for DOM to render completely
    const timer = setTimeout(() => {
      const chars = textRef.current.querySelectorAll('.about-char');
      
      gsap.to(chars, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%", // Start animation when section is 30% into view
          end: "bottom 80%",
          scrub: 0.5,
        },
        opacity: 1,
        stagger: 0.05,
        ease: "none"
      });
      ScrollTrigger.refresh();
    }, 500); // 500ms delay to ensure elements exist
    
    return () => clearTimeout(timer);
  }, []);

  const text = "I am an AIML Engineering student specializing in Generative AI, multi-agent frameworks, and full-stack development. Experienced in building scalable LLM applications and intelligent systems to automate complex analytical workflows.";
  
  return (
    <section id="about" ref={sectionRef} className="section" data-scroll-section style={{ paddingTop: '15vh', paddingBottom: '15vh', position: 'relative', zIndex: 5 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '5vh' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontSize: '0.8rem' }}>// PROFILE_DATA</div>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <p ref={textRef} style={{ 
          fontFamily: 'var(--font-heading)', 
          fontSize: 'clamp(2rem, 5vw, 4rem)', 
          lineHeight: 1.2, 
          fontWeight: 600, 
          maxWidth: '1200px',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          position: 'relative'
        }}>
          {text.split("").map((char, i) => {
            // Find GENERATIVE AI boundaries
            const keywordStart = text.indexOf("Generative AI");
            const keywordEnd = keywordStart + "Generative AI".length;
            const isHighlight = i >= keywordStart && i < keywordEnd;
            
            return (
              <span 
                key={i} 
                className="about-char" 
                style={{ 
                  color: isHighlight ? 'var(--accent-red)' : 'var(--text-primary)', 
                  opacity: 0.2 // Starts barely visible
                }}
              >
                {char}
              </span>
            );
          })}
        </p>
      </div>

    </section>
  );
};

export default About;
