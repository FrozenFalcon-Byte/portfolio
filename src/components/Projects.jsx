import React, { useState } from 'react';
import AnimatedModal from './AnimatedModal';
import { motion } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const { theme } = useTheme();
  
  const projects = [
    { 
      id: "PRJ_01", 
      title: "Business Billing", 
      tech: ["React", "Supabase", "PostgreSQL"], 
      desc: "Full-stack system for invoice creation, receipts, role-based access, and analytics.", 
      details: [
        "Architected a comprehensive role-based access control (RBAC) system for secure tenant isolation.",
        "Implemented real-time dashboard analytics using complex PostgreSQL aggregations.",
        "Integrated automated PDF invoice generation and dynamic email delivery pipelines."
      ],
      img: "/image.png", 
      category: "SYS.FULLSTACK" 
    },
    { 
      id: "PRJ_02", 
      title: "Image Processor", 
      tech: ["Python", "Streamlit", "AI"], 
      desc: "App offering OCR, background removal, and AI-powered image summarization.", 
      details: [
        "Engineered an automated background removal pipeline using advanced computer vision techniques.",
        "Integrated Tesseract OCR for high-accuracy text extraction from complex document images.",
        "Connected multimodal LLM APIs to automatically summarize visual data into structured reports."
      ],
      img: "/img.png", 
      category: "SYS.AI_VISION" 
    },
    { 
      id: "PRJ_03", 
      title: "Nature Scene Classifier", 
      tech: ["TensorFlow", "Keras", "CNN"], 
      desc: "CNN trained on augmented datasets to classify various scenes. Deployed via Streamlit.", 
      details: [
        "Designed and trained a deep Convolutional Neural Network achieving 94% validation accuracy.",
        "Applied extensive data augmentation to prevent overfitting on natural landscape datasets.",
        "Packaged and deployed the model inference engine via a highly interactive Streamlit web application."
      ],
      img: "/nature.jpeg", 
      category: "SYS.ML_MODEL" 
    },
  ];

  return (
    <section id="projects" className="section" data-scroll-section style={{ paddingTop: '15vh', paddingBottom: '15vh' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '10vh' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontSize: '0.8rem' }}>// MODULE_DATA_ARCHIVE</div>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }}></div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {projects.map((proj, i) => (
          <motion.div 
            key={proj.id} 
            className="interactive border-technical project-card" 
            data-cursor-shape="magnetic" 
            data-scroll 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            onClick={() => setSelectedProject(proj)} 
            style={{ 
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              <span>{proj.id}</span>
              <span>{proj.category}</span>
            </div>

            {/* Image Box */}
            <div style={{ height: '200px', width: '100%', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border-muted)' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${proj.img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.9 }}></div>
              <div style={{ position: 'absolute', inset: 0, background: theme === 'light' ? 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)' : 'linear-gradient(to bottom, rgba(17,17,17,0) 0%, rgba(17,17,17,1) 100%)' }}></div>
            </div>
            
            {/* Content Box */}
            <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 600, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                {proj.title}
              </h3>
              
              <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {proj.tech.map(t => (
                  <span key={t} className="border-technical" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <AnimatedModal 
        isOpen={!!selectedProject} 
        onClose={() => setSelectedProject(null)} 
        title={selectedProject?.title} 
        type="project"
        content={
          <div style={{ fontFamily: 'var(--font-body)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '2rem' }}>
              // EXECUTION_LOG: {selectedProject?.id}
            </div>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{selectedProject?.desc}</p>
            
            <p style={{ color: 'var(--text-data)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: 1.6, opacity: 0.8 }}>
              {selectedProject?.details?.join(' ')}
            </p>
            
            <div style={{ border: '1px solid var(--border-muted)', padding: '1rem', background: 'var(--bg-charcoal)' }}>
              <h3 style={{ fontSize: '0.8rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{'>'} DEPENDENCIES_LOADED:</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedProject?.tech.map(t => (
                  <span key={t} style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>[{t}]</span>
                ))}
              </div>
            </div>
          </div>
        } 
      />
    </section>
  );
};

export default Projects;
