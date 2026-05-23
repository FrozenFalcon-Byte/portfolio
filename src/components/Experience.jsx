import React from 'react';
import { useNavigate } from 'react-router-dom';

const Experience = () => {
  const navigate = useNavigate();
  return (
    <section id="experience" className="section" data-scroll-section style={{ paddingTop: '10vh', paddingBottom: '10vh' }}>
      
      {/* 
        This wrapper pushes the content to the right side of the screen 
        so the 3D keyboard can occupy the left side.
      */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <div style={{ width: '50%', minWidth: '500px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '5vh' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }}></div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontSize: '0.8rem' }}>// OPERATION_LOG</div>
          </div>
          
          <div 
            className="interactive border-technical" 
            data-cursor-shape="magnetic" 
            data-scroll 
            onClick={() => navigate('/experience/pmo')} 
            style={{ 
              cursor: 'pointer',
              width: '100%', 
              background: 'var(--bg-charcoal)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: 'var(--bg-primary)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ID: EXP_01</span>
              <span style={{ color: 'var(--accent-red)' }}>STATUS: ACTIVE_DUTY</span>
            </div>

            <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Metadata */}
              <div style={{ display: 'flex', gap: '3rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div>
                  <span style={{ color: 'var(--text-primary)' }}>ORG:</span><br/>
                  EMERSON
                </div>
                <div>
                  <span style={{ color: 'var(--text-primary)' }}>TIMEFRAME:</span><br/>
                  DEC_2025 - PRESENT
                </div>
                <div>
                  <span style={{ color: 'var(--text-primary)' }}>ROLE_CLASS:</span><br/>
                  PMO_AI/ML_INTERN
                </div>
              </div>

              {/* Details Column */}
              <div>
                <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontFamily: 'var(--font-heading)', fontWeight: 600, margin: '0 0 1.5rem 0', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Architected Multi-Agent System Framework
                </h3>
                <p style={{ color: 'var(--text-data)', fontSize: '1rem', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                  {'>'} INITIALIZING LOG...<br/>
                  {'>'} Designed multi-agent AI framework via LangGraph.<br/>
                  {'>'} Deployed SQL & Extraction autonomous agents.<br/>
                  {'>'} Integrated self-correcting retry loop algorithm.<br/>
                  {'>'} Result: Complex PMO data workflows successfully automated.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Experience;
