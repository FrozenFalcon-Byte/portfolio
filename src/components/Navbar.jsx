import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().split('T')[1].slice(0, 8) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNav = (e, id) => {
    e.preventDefault();
    setIsOpen(false);
    
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        if (window.lenis) window.lenis.scrollTo(id, { duration: 1.2 });
      }, 300);
    } else {
      setTimeout(() => {
        if (window.lenis) window.lenis.scrollTo(id, { duration: 1.2 });
      }, 300); 
    }
  };

  const navItems = ['Experience', 'About', 'Skills', 'Projects', 'Extracurricular', 'Contact'];

  const menuVariants = {
    closed: { x: '100%', transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] } },
    open: { x: '0%', transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] } }
  };

  return (
    <>
      <nav className="border-technical" style={{ 
        zIndex: 10000, position: 'fixed', top: 0, left: 0, width: '100%', 
        padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        background: 'var(--bg-charcoal)', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        fontFamily: 'var(--font-mono)'
      }}>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)', cursor: 'pointer', pointerEvents: 'auto', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }} onClick={() => navigate('/')}>
            AJINKYA.CHAVAN
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }} className="hidden lg:flex">
            <span>SYS_STATUS: <span style={{ color: 'var(--accent-red)' }}>ONLINE</span></span>
            <span>UPTIME: {time}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)' }} className="hidden lg:block">
            v1.0.5_BETA
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={toggleTheme}
              className="interactive border-technical"
              data-cursor-shape="magnetic"
              style={{ 
                background: 'transparent', 
                color: 'var(--text-primary)',
                padding: '0.5rem 1rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', 
                cursor: 'pointer', pointerEvents: 'auto', fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              [ {theme === 'dark' ? 'LIGHT' : 'DARK'} ]
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="interactive border-technical"
              data-cursor-shape="magnetic"
              style={{ 
                background: isOpen ? 'var(--accent-red)' : 'transparent', 
                color: isOpen ? 'var(--text-primary)' : 'var(--accent-red)',
                padding: '0.5rem 1rem',
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', 
                cursor: 'pointer', pointerEvents: 'auto', fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {isOpen ? '[ CLOSE ]' : '[ MENU ]'}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            style={{
              position: 'fixed', top: '4rem', right: 0, bottom: 0, width: '100%', maxWidth: '400px',
              background: 'var(--bg-charcoal)', borderLeft: '1px solid var(--border-muted)',
              zIndex: 9999, display: 'flex', flexDirection: 'column', padding: '3rem 2rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '2rem' }}>
              // DIRECTORY_INDEX
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {navItems.map((item, i) => (
                <div key={item} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                  <a 
                    href={`#${item.toLowerCase()}`} 
                    onClick={(e) => handleNav(e, `#${item.toLowerCase()}`)}
                    className="interactive"
                    data-cursor-shape="magnetic"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '2rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      display: 'block',
                      padding: '1.5rem 0',
                      transition: 'color 0.2s, padding-left 0.2s',
                      textTransform: 'uppercase'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--accent-red)';
                      e.target.style.paddingLeft = '1rem';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-primary)';
                      e.target.style.paddingLeft = '0';
                    }}
                  >
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginRight: '1rem' }}>0{i+1}</span>
                    {item}
                  </a>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 'auto', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="https://www.linkedin.com/in/ajinkyachavan4829/" target="_blank" className="interactive" data-cursor-shape="magnetic" style={{ color: 'inherit', textDecoration: 'none', width: 'max-content' }}>{'>'} INITIATE_LINKEDIN</a>
              <a href="https://github.com/FrozenFalcon-Byte" target="_blank" className="interactive" data-cursor-shape="magnetic" style={{ color: 'inherit', textDecoration: 'none', width: 'max-content' }}>{'>'} INITIATE_GITHUB</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
