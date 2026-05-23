import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedModal = ({ isOpen, onClose, title, content, type }) => {
  
  useEffect(() => {
    if (isOpen) {
      if (window.lenis) window.lenis.stop();
      document.body.style.overflow = 'hidden';
    } else {
      if (window.lenis) window.lenis.start();
      document.body.style.overflow = '';
    }
    return () => {
      if (window.lenis) window.lenis.start();
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className={`modal-content glass-modal ${type === 'skill' ? 'skill-modal' : 'project-modal'}`}
            initial={{ scale: 0.8, y: 50, opacity: 0, rotateX: 20 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.8, y: 50, opacity: 0, rotateX: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ perspective: 1000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-glow-inner"></div>
            <div className="modal-inner">
              <button className="modal-close interactive" data-cursor-shape="magnetic" onClick={onClose}>&times;</button>
              <h2 className="modal-title">{title}</h2>
              <div className="modal-body modal-desc">{content}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default AnimatedModal;
