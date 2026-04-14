'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
      
      const target = e.target as HTMLElement;
      // Check if hovering over standard interactive elements or elements with cursor pointer
      const isPointer = 
        window.getComputedStyle(target).cursor === 'pointer' || 
        target.tagName.toLowerCase() === 'button' || 
        target.tagName.toLowerCase() === 'a' || 
        target.closest('button') !== null || 
        target.closest('a') !== null;
        
      setIsHovering(isPointer);
    };

    const handleMouseLeave = () => setIsVisible(false);
    
    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('mouseout', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [isVisible]);

  // Don't show cursor on touch devices or server
  if (typeof window === 'undefined' || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) {
    return null; 
  }

  return (
    <>
      <style>{`
        body, button, a, input, textarea, select, [role="button"] {
          cursor: none !important;
        }
      `}</style>
      
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-snookerGreen rounded-full pointer-events-none z-[10000] mix-blend-screen"
        animate={{
          x: position.x - 6,
          y: position.y - 6,
          scale: isHovering ? 0 : 1, // Inner dot disappears on hover
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 1000, damping: 40, mass: 0.1 }}
      />
      
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 border border-white/50 rounded-full pointer-events-none z-[9999] bg-white/5 backdrop-blur-xs flex items-center justify-center"
        animate={{
          x: position.x - 20,
          y: position.y - 20,
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(0, 77, 38, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          borderColor: isHovering ? 'rgba(0, 77, 38, 0.8)' : 'rgba(255, 255, 255, 0.5)',
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.4 }}
      >
        {isHovering && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-1.5 h-1.5 bg-snookerGreen rounded-full shadow-[0_0_10px_rgba(0,77,38,1)]"
          />
        )}
      </motion.div>
    </>
  );
}
