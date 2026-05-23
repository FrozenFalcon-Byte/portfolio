import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, X, Code, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { SYSTEM_PROMPT } from '../utils/systemPrompt';

const MutatorTerminal = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    { role: 'model', content: "SYS.MUTATOR ONLINE.\nI can dynamically alter the CSS of this website.\nExample: 'Make everything neon green' or 'Turn the background into a cyberpunk grid.'" }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Read API Key from .env
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const extractCSS = (text) => {
    const match = text.match(/```css\n([\s\S]*?)```/);
    return match ? match[1] : null;
  };

  const injectCSS = (cssCode) => {
    let styleTag = document.getElementById('ai-mutator-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'ai-mutator-styles';
      document.head.appendChild(styleTag);
    }
    // Append the new CSS to existing mutations for cumulative effect
    styleTag.innerHTML += `\n/* AI MUTATION */\n${cssCode}`;
  };

  const resetMutations = () => {
    const styleTag = document.getElementById('ai-mutator-styles');
    if (styleTag) styleTag.innerHTML = '';
    setMessages([{ role: 'model', content: 'SYSTEM RESET. ALL MUTATIONS CLEARED.' }]);
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!API_KEY) {
      setError('API_KEY_MISSING: Cannot mutate without VITE_GEMINI_API_KEY in .env');
      return;
    }

    const command = input.trim();
    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: `> ${command}` }]);
    setIsLoading(true);

    try {
      // Build conversation history (only keeping last 10 for context window efficiency)
      const recentHistory = messages.slice(-10).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      recentHistory.push({ role: 'user', parts: [{ text: command }] });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: recentHistory
          })
        }
      );

      if (!response.ok) throw new Error('API Request Failed.');

      const data = await response.json();
      const botResponseRaw = data.candidates[0].content.parts[0].text;
      const parsedCSS = extractCSS(botResponseRaw);

      if (parsedCSS) {
        injectCSS(parsedCSS);
        setMessages(prev => [...prev, { role: 'model', content: "MUTATION_APPLIED. CSS INJECTED SUCCESSFULLY." }]);
      } else {
        // If it didn't output CSS, it might be refusing or apologizing
        setMessages(prev => [...prev, { role: 'model', content: botResponseRaw }]);
      }

    } catch (err) {
      console.error(err);
      setError('ERR: COMMUNICATION LINK SEVERED.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '400px',
          maxWidth: 'calc(100vw - 4rem)',
          height: '500px',
          maxHeight: 'calc(100vh - 4rem)',
          background: 'var(--bg-charcoal)',
          border: '1px solid var(--accent-red)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(229, 9, 20, 0.1)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        className="ai-mutator-terminal"
      >
        {/* Terminal Header */}
        <div style={{ padding: '0.75rem 1rem', background: '#050505', borderBottom: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Code size={16} color="var(--accent-red)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', color: 'var(--text-primary)', letterSpacing: '1px' }}>SYS.MUTATOR_TERMINAL</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={resetMutations} 
              className="interactive"
              data-cursor-shape="magnetic"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
            >
              [ RESET ]
            </button>
            <button 
              onClick={onClose} 
              className="interactive"
              data-cursor-shape="magnetic"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chat Log */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-mono)' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontSize: '0.6rem', color: msg.role === 'user' ? 'var(--text-secondary)' : 'var(--accent-red)', marginBottom: '0.25rem' }}>
                {msg.role === 'user' ? 'USER_PROMPT' : 'SYS.RESPONSE'}
              </span>
              <div style={{
                background: msg.role === 'user' ? 'transparent' : '#0a0a0a',
                color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--text-data)',
                padding: msg.role === 'user' ? '0' : '0.75rem',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-muted)',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                maxWidth: '90%'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
               <span style={{ fontSize: '0.6rem', color: 'var(--accent-red)', marginBottom: '0.25rem' }}>SYS.RESPONSE</span>
               <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#0a0a0a', color: 'var(--text-data)', padding: '0.75rem', border: '1px solid var(--border-muted)', fontSize: '0.85rem' }}>
                 <Loader2 size={14} className="animate-spin" /> <span>COMPILING_MUTATION...</span>
               </div>
             </div>
          )}
          {error && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--accent-red)', fontSize: '0.8rem', padding: '0.5rem', border: '1px solid var(--accent-red)', background: 'rgba(229, 9, 20, 0.1)' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleCommand} style={{ display: 'flex', borderTop: '1px solid var(--border-muted)', background: '#050505', padding: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', color: 'var(--accent-red)' }}>
            <Terminal size={16} />
          </div>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Enter mutation command..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.5rem', outline: 'none' }}
          />
          <button type="submit" disabled={isLoading || !input.trim()} style={{ background: 'var(--accent-red)', color: '#fff', border: 'none', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', opacity: input.trim() ? 1 : 0.5 }} className="interactive" data-cursor-shape="magnetic">
            <Sparkles size={16} />
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default MutatorTerminal;
