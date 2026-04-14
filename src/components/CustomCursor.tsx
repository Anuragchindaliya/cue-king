'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPointerDevice, setIsPointerDevice] = useState(true);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if device supports hover
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      setIsPointerDevice(false);
      return;
    }

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
      
      const target = e.target as HTMLElement;
      // Elements that should trigger the Cue Stick hover state
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

  if (!mounted || !isPointerDevice) return null;

  return (
    <>
      <style>{`
        body, button, a, input, textarea, select, [role="button"] {
          cursor: none !important;
        }
      `}</style>
      
      {/* Pool Ball (Default state) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[20000] flex items-center justify-center filter drop-shadow-xl"
        animate={{
          x: position.x - 12,
          y: position.y - 12,
          opacity: isVisible && !isHovering ? 1 : 0,
          scale: isVisible && !isHovering ? 1 : 0.5
        }}
        transition={{ type: 'spring', stiffness: 800, damping: 35, mass: 0.1 }}
      >
        <div className="w-6 h-6 bg-white rounded-full relative overflow-hidden flex items-center justify-center border border-gray-200">
          <div className="absolute inset-0 bg-linear-to-br from-white via-gray-100 to-gray-400"></div>
          {/* Cue ball red dot */}
          <div className="w-2h-2 bg-red-600 rounded-full relative z-10 shadow-inner"></div>
        </div>
      </motion.div>

      {/* Cue Stick (Hover state) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[20000] origin-top-left"
        animate={{
          x: position.x + 5, // Offset so the tip touches the element
          y: position.y + 5,
          opacity: isVisible && isHovering ? 1 : 0,
          scale: isVisible && isHovering ? 1 : 0.2,
          rotate: isHovering ? -45 : 0
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.4 }}
      >
        {/* Simple CSS Cue Stick */}
        <div className="flex flex-col items-center rotate-[5deg] origin-top">
          {/* Tip */}
          <div className="w-2 h-1.5 bg-blue-300 rounded-t-full shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
          {/* Ferrule */}
          <div className="w-2.5 h-2 bg-gray-200"></div>
          {/* Shaft */}
          <div className="w-3 h-16 bg-amber-100 border-x border-amber-200"></div>
          {/* Butt */}
          <div className="w-4 h-20 bg-linear-to-b from-snookerGreen to-black border-x border-snookerGreen shadow-xl overflow-hidden relative">
            <div className="absolute top-2 w-full h-[1px] bg-goldAccent"></div>
            <div className="absolute bottom-2 w-full h-1 bg-white"></div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
