import React, { useState } from 'react';
import AnimatedModal from './AnimatedModal';
import { motion } from 'framer-motion';

const Skills = () => {
  const [selectedSkill, setSelectedSkill] = useState(null);

  const skills = [
    { title: "Languages", desc: "Java, C++, Python, JavaScript, SQL", code: "01", category: "SYS.LANG" },
    { title: "GenAI & ML", desc: "LangGraph, LangChain, NumPy, Pandas", code: "02", category: "SYS.AI" },
    { title: "Web Dev", desc: "React, FastAPI, HTML, CSS", code: "03", category: "SYS.WEB" },
    { title: "Cloud", desc: "AWS S3, EC2, Azure, Azure AI", code: "04", category: "SYS.CLOUD" },
    { title: "Tools", desc: "Git, GitHub, Docker", code: "05", category: "SYS.TOOLS" },
  ];

  return (
    <section id="skills" className="section" data-scroll-section style={{ paddingTop: '15vh', paddingBottom: '15vh' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '10vh' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontSize: '0.8rem' }}>// SYSTEM_CAPABILITIES</div>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }}></div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        {skills.map((skill, i) => (
          <motion.div 
            key={i} 
            className="interactive border-technical" 
            data-cursor-shape="magnetic" 
            data-scroll 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            onClick={() => setSelectedSkill(skill)} 
            style={{ 
              cursor: 'pointer',
              background: 'var(--bg-charcoal)',
              display: 'flex',
              flexDirection: 'column',
              padding: '2rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-red)';
              e.currentTarget.style.color = 'var(--bg-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-charcoal)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            {/* Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '2rem' }}>
              <span>0{i + 1}</span>
              <span>{skill.category}</span>
            </div>
            
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 600, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              {skill.title}
            </h3>
            
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.8 }}>
              {skill.desc}
            </p>
          </motion.div>
        ))}
      </div>
      
      <AnimatedModal 
        isOpen={!!selectedSkill} 
        onClose={() => setSelectedSkill(null)} 
        title={selectedSkill?.title} 
        type="skill"
        content={
          <div style={{ fontFamily: 'var(--font-body)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '2rem' }}>
              // EXECUTION_LOG: {selectedSkill?.category}
            </div>
            <p style={{ fontSize: '1rem', color: 'var(--text-data)', marginBottom: '2rem', lineHeight: 1.6 }}>
              <strong>Dependencies:</strong> {selectedSkill?.desc}
            </p>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              I have extensively used these technologies across various projects, maintaining strict protocols and optimizing for execution speed and stability.
            </p>
          </div>
        } 
      />
    </section>
  );
};

export default Skills;
