import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { theme } = useTheme();
  
  return (
    <footer id="contact" className="section" data-scroll-section style={{ paddingTop: '10vh', paddingBottom: '5vh', overflow: 'hidden' }}>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '5rem', borderTop: '1px solid var(--border-muted)', paddingTop: '5rem' }}
      >
        
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>// END_OF_FILE</div>
            <div>SYSTEM_SHUTDOWN_INITIATED</div>
            <div style={{ color: 'var(--accent-red)' }}>STATUS: STANDBY</div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="mailto:frozenfalcon8494@gmail.com" className="interactive border-technical" data-cursor-shape="magnetic" style={{ padding: '1rem', background: 'var(--bg-charcoal)', color: 'var(--text-primary)', transition: 'background 0.2s', display: 'inline-block' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-charcoal)'}>
              <Mail size={24}/>
            </a>
            <a href="https://www.linkedin.com/in/ajinkyachavan4829/" target='blank' className="interactive border-technical" data-cursor-shape="magnetic" style={{ padding: '1rem', background: 'var(--bg-charcoal)', color: 'var(--text-primary)', transition: 'background 0.2s', display: 'inline-block' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-charcoal)'}>
              <Linkedin size={24}/>
            </a>
            <a href="https://github.com/FrozenFalcon-Byte" target='blank' className="interactive border-technical" data-cursor-shape="magnetic" style={{ padding: '1rem', background: 'var(--bg-charcoal)', color: 'var(--text-primary)', transition: 'background 0.2s', display: 'inline-block' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-red)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-charcoal)'}>
              <Github size={24}/>
            </a>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '18vw', 
              fontWeight: 700, 
              margin: 0, 
              lineHeight: 0.8, 
              color: theme === 'light' ? '#ffffff' : '#050505', 
              background: 'var(--accent-red)',
              textTransform: 'uppercase', 
              letterSpacing: '-0.02em', 
              width: '100%', 
              textAlign: 'center',
              transition: 'color 0.5s ease'
            }}
          >
            AJINKYA
          </motion.h1>
        </div>
        
      </motion.div>
    </footer>
  );
};

export default Footer;
