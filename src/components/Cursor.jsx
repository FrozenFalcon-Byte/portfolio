import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { Github, Linkedin, Mail, Sun, Moon } from 'lucide-react';

const Cursor = () => {
  const cursorRef = useRef(null);
  const location = useLocation();

  const snapElRef = useRef(null);

  useEffect(() => {
    if (cursorRef.current) {
      gsap.set(cursorRef.current, { xPercent: -50, yPercent: -50 });
    }
    // Reset cursor state on route change
    if (cursorRef.current) {
      cursorRef.current.classList.remove('active');
      cursorRef.current.classList.remove('tooltip-active');
      cursorRef.current.style.width = '';
      cursorRef.current.style.height = '';
      cursorRef.current.style.borderRadius = '';
      cursorRef.current.style.backgroundColor = '';
      cursorRef.current.style.border = 'none';
      cursorRef.current.style.transform = 'scale(1)';
    }
    snapElRef.current = null;
  }, [location.pathname]);

  useEffect(() => {
    const cursor = cursorRef.current;
    
    const moveCursor = (e) => {
      if (snapElRef.current) {
        // If the element is removed from the DOM, release the lock
        if (!document.body.contains(snapElRef.current)) {
          snapElRef.current = null;
          if (cursor) {
            cursor.classList.remove('active', 'tooltip-active');
            cursor.style.width = '';
            cursor.style.height = '';
            cursor.style.borderRadius = '';
            cursor.style.backgroundColor = '';
            cursor.style.border = 'none';
          }
          return;
        }

        const shape = snapElRef.current.getAttribute('data-cursor-shape');
        const rect = snapElRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (shape === 'magnetic') {
          const distanceX = e.clientX - centerX;
          const distanceY = e.clientY - centerY;
          
          gsap.to(cursor, {
            x: centerX + distanceX * 0.2,
            y: centerY + distanceY * 0.2,
            xPercent: -50,
            yPercent: -50,
            duration: 0.15,
            ease: 'power2.out'
          });
          
          gsap.to(snapElRef.current, {
            x: distanceX * 0.2,
            y: distanceY * 0.2,
            duration: 0.3,
            ease: 'power2.out'
          });
        } else {
          gsap.to(cursor, {
            x: centerX,
            y: centerY,
            xPercent: -50,
            yPercent: -50,
            duration: 0.15,
            ease: 'power2.out'
          });
        }
      } else {
        gsap.to(cursor, {
          x: e.clientX,
          y: e.clientY,
          xPercent: -50,
          yPercent: -50,
          duration: 0.15,
          ease: 'power2.out'
        });
      }
    };

    const handleHover = (e) => {
      // Find the closest interactive element
      const el = e.target.closest('.interactive');
      if (el) {
        const infoText = el.getAttribute('data-cursor-info');
        const infoIcon = el.getAttribute('data-cursor-icon');
        const infoColor = el.getAttribute('data-cursor-color');
        const infoShape = el.getAttribute('data-cursor-shape');
        
        if (infoColor) {
          cursor.style.backgroundColor = infoColor;
        } else {
          cursor.style.backgroundColor = '';
        }

        if (infoShape === 'pill') {
          snapElRef.current = el; // Lock onto the element
          const rect = el.getBoundingClientRect();
          cursor.style.width = `${rect.width + 10}px`;
          cursor.style.height = `${rect.height + 10}px`;
          cursor.style.borderRadius = '50px';
          cursor.classList.remove('tooltip-active');
        } else if (infoShape === 'magnetic') {
          snapElRef.current = el;
          const rect = el.getBoundingClientRect();
          cursor.style.width = `${rect.width + 10}px`;
          cursor.style.height = `${rect.height + 10}px`;
          cursor.style.borderRadius = '0px';
          cursor.style.backgroundColor = 'transparent';
          cursor.style.border = '2px solid var(--accent-red)';
          cursor.classList.remove('tooltip-active');
        } else if (infoShape === 'tooltip') {
          snapElRef.current = null;
          cursor.style.width = '';
          cursor.style.height = '';
          cursor.style.borderRadius = '';
          cursor.classList.add('tooltip-active');
        } else {
          snapElRef.current = null;
          cursor.style.width = '';
          cursor.style.height = '';
          cursor.style.borderRadius = '';
          cursor.classList.remove('tooltip-active');
        }
        
        cursor.classList.add('active');
      }
    };
    
    const handleLeave = () => {
      if (snapElRef.current && snapElRef.current.getAttribute('data-cursor-shape') === 'magnetic') {
        gsap.to(snapElRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      }
      snapElRef.current = null; // Release lock
      cursor.classList.remove('active');
      cursor.classList.remove('tooltip-active');
      cursor.style.width = '';
      cursor.style.height = '';
      cursor.style.borderRadius = '';
      cursor.style.backgroundColor = '';
      cursor.style.border = 'none';
    };

    const handleMouseDown = () => {
      if (cursor) gsap.to(cursor, { scale: 0.8, duration: 0.1 });
    };

    const handleMouseUp = () => {
      if (cursor) gsap.to(cursor, { scale: 1, duration: 0.15, ease: 'back.out(2)' });
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    const attachListeners = () => {
      document.querySelectorAll('.interactive').forEach(el => {
        el.addEventListener('mouseenter', handleHover);
        el.addEventListener('mouseleave', handleLeave);
      });
    };
    
    attachListeners();
    const interval = setInterval(attachListeners, 1000);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      clearInterval(interval);
      document.querySelectorAll('.interactive').forEach(el => {
        el.removeEventListener('mouseenter', handleHover);
        el.removeEventListener('mouseleave', handleLeave);
      });
    };
  }, []);

  return (
    <div ref={cursorRef} className="cursor">
    </div>
  );
};

export default Cursor;
