import React from 'react';
import { motion } from 'framer-motion';

const Extracurricular = () => {
  const activities = [
    { title: "Technical Lead", org: "AIMSS VIIT", desc: "Leading technical initiatives, organizing AI/ML workshops, and guiding students in building intelligent systems.", date: "2024 - 2026" },
    { title: "Class Representative", org: "VIIT", desc: "Acted as the primary liaison between students and faculty to ensure smooth academic operations.", date: "2023 - 2026" },
    
  ];

  return (
    <section id="extracurricular" className="section" data-scroll-section style={{ paddingTop: '15vh', paddingBottom: '15vh' }}>
      
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '10vh' }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontSize: '0.8rem' }}>// AUXILIARY_OPERATIONS</div>
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
          style={{ flex: 1, height: '1px', background: 'var(--border-muted)', transformOrigin: 'left' }}
        ></motion.div>
      </motion.div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {activities.map((act, i) => (
          <motion.div 
            key={i} 
            className="border-technical" 
            data-scroll 
            initial={{ opacity: 0, x: -100, rotateY: -15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4, delay: i * 0.15 }}
            style={{ 
              background: 'var(--bg-charcoal)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '3rem',
              flexWrap: 'wrap',
              gap: '2rem',
              transformPerspective: 1000
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {act.date}
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
                {act.title}
              </h3>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                @ {act.org}
              </div>
            </div>
            
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-data)', maxWidth: '500px', lineHeight: 1.6 }}>
              {act.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Extracurricular;
