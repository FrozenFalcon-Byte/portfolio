import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, Network, Cpu, RefreshCw, LineChart, CheckCircle2, Building2, Calendar } from 'lucide-react';

const ExperienceDetail = () => {
  const navigate = useNavigate();

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const techStack = ["LangGraph", "Python", "LLMs", "SQL", "Prompt Engineering", "Agentic AI", "Data Analytics"];

  return (
    <motion.div 
      className="exp-detail-page" 
      data-scroll-section
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
      {/* Background glow effects */}
      <div className="glow-sphere top-glow"></div>
      <div className="glow-sphere bottom-glow"></div>

      <motion.div 
        className="exp-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.button 
          className="back-btn interactive" 
          data-cursor-shape="magnetic" 
          onClick={() => navigate(-1)}
          variants={itemVariants}
        >
          <ArrowLeft size={20} /> Back to Portfolio
        </motion.button>
        
        <motion.div className="exp-hero" variants={itemVariants} style={{ border: '1px solid var(--border-muted)', padding: '2rem', background: 'var(--bg-charcoal)', marginTop: '2rem' }}>
          <div className="role-badge" style={{ marginBottom: '2rem', border: '1px solid var(--accent-red)', background: 'transparent' }}>
            // FILE_ID: EXP_01
          </div>
          <h1 className="exp-page-title" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Intelligent PMO Analytics
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div><span style={{ color: 'var(--accent-red)' }}>STATUS:</span> ACTIVE</div>
            <div><span style={{ color: 'var(--accent-red)' }}>ORG:</span> EMERSON</div>
            <div><span style={{ color: 'var(--accent-red)' }}>TIMEFRAME:</span> DEC_2025 - PRESENT</div>
            <div><span style={{ color: 'var(--accent-red)' }}>ROLE:</span> PMO_AI/ML_INTERN</div>
          </div>
        </motion.div>

        <motion.div className="tech-stack-row" variants={itemVariants} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
          {techStack.map(tech => (
            <span key={tech} className="tech-tag interactive" data-cursor-shape="pill" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid var(--border-muted)', color: 'var(--text-primary)' }}>
              [{tech}]
            </span>
          ))}
        </motion.div>

        <motion.div className="exp-overview" variants={itemVariants} style={{ border: '1px solid var(--border-muted)', padding: '2rem', background: 'var(--bg-charcoal)', marginTop: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--accent-red)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>{'>'} PROJECT_OVERVIEW</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.2rem', lineHeight: 1.6, color: 'var(--text-data)' }}>
            Designed and engineered a dynamic, multi-agent AI system to automate and scale complex analytics for the Project Management Office (PMO). Moving beyond traditional rigid prompt chains, this framework utilizes autonomous AI agents that reason, route, and self-correct to generate high-level project insights, resource forecasts, and financial S-Curve analyses in real-time.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginTop: '2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <motion.div className="exp-architecture" variants={itemVariants}>
              <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--accent-red)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{'>'} SYSTEM_ARCHITECTURE</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { icon: <Network size={20} />, title: 'Dynamic Query Orchestrator', desc: 'Intelligent multi-agent routing system built on Azure OpenAI. Evaluates complex incoming enterprise PMO requests and autonomously routes them to specialized sub-agents.' },
                  { icon: <Cpu size={20} />, title: 'Specialized Execution Agents', desc: 'Dual-agent structure featuring an Azure SQL Database Agent for secure schema querying and a Document Processing Agent for unstructured data parsing and text summarization.' },
                  { icon: <RefreshCw size={20} />, title: 'Self-Healing Interactions', desc: 'Autonomous exception handling. The system securely captures execution failures, analyzes traceback errors via LLM, and automatically corrects query logic before re-running.' }
                ].map((feature, i) => (
                  <div key={i} className="interactive" data-cursor-shape="magnetic" style={{ borderLeft: '2px solid var(--accent-red)', padding: '1.5rem', background: 'var(--bg-charcoal)', display: 'flex', gap: '1.5rem', transition: 'background 0.2s', alignItems: 'flex-start' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 51, 51, 0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-charcoal)'}>
                    <div style={{ color: 'var(--accent-red)', padding: '0.5rem', background: 'rgba(255,51,51,0.1)', borderRadius: '4px' }}>{feature.icon}</div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{feature.title}</h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-data)', margin: 0 }}>{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="exp-impact" variants={itemVariants} style={{ border: '1px dashed var(--border-muted)', padding: '2rem', background: 'transparent' }}>
              <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>// EXECUTION_RESULTS</h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  "Automated manual PMO tracking processes, replacing static dashboards with an adaptive, conversational analytics assistant.",
                  "Optimized query accuracy and semantic search capabilities across massive, unstructured project databases.",
                  "Delivered a secure, high-availability architecture empowering project leadership with real-time, data-driven forecasting."
                ].map((impact, i) => (
                  <li key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>[0{i+1}]</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{impact}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <motion.div variants={itemVariants} style={{ border: '1px solid var(--border-muted)', padding: '1.5rem', background: '#0a0a0a' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>METRICS.DAT</span>
                <LineChart size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '2rem', lineHeight: 1 }}>99.99%</div>
                  <div style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>AZURE SERVICE AVAILABILITY</div>
                </div>
                <div style={{ width: '100%', height: '1px', background: 'var(--border-muted)' }}></div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '2rem', lineHeight: 1 }}>{'<'}200ms</div>
                  <div style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>AZURE OPENAI INFERENCE LATENCY</div>
                </div>
                <div style={{ width: '100%', height: '1px', background: 'var(--border-muted)' }}></div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '2rem', lineHeight: 1 }}>1.2M+</div>
                  <div style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>MONTHLY PIPELINE EXECUTIONS</div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{ border: '1px solid var(--border-muted)', background: '#050505' }}>
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent-red)' }}>●</span><span>agent_loop.py</span>
              </div>
              <div style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-data)', lineHeight: 1.6, overflowX: 'hidden' }}>
                <span style={{ color: '#c678dd' }}>def</span> <span style={{ color: '#61afef' }}>execute_agent_task</span>(prompt, context):<br/>
                &nbsp;&nbsp;<span style={{ color: '#c678dd' }}>try</span>:<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;response = azure_openai.Completion.create(<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;engine=<span style={{ color: '#98c379' }}>"gpt-4-turbo"</span>,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;prompt=build_query(prompt, context)<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;)<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>return</span> response.choices[<span style={{ color: '#d19a66' }}>0</span>].text<br/>
                &nbsp;&nbsp;<span style={{ color: '#c678dd' }}>except</span> APIError <span style={{ color: '#c678dd' }}>as</span> e:<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;corrected_prompt = self_correct_logic(e, prompt)<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>return</span> execute_agent_task(corrected_prompt, context)
              </div>
            </motion.div>
          </div>
          
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExperienceDetail;
