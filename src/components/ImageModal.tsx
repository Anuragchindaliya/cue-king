'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import Image, { StaticImageData } from 'next/image';
import { useState, useCallback } from 'react';

interface ImageModalProps {
  image: StaticImageData;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ image, alt, isOpen, onClose }: ImageModalProps) {
  const [scale, setScale] = useState(1);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.5, 1));
  };

  // Close modal when clicking escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60000] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-zoom-out"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
             <div className="flex gap-2 bg-black/50 backdrop-blur-sm p-1 rounded-lg border border-white/10" onClick={e => e.stopPropagation()}>
               <button onClick={handleZoomOut} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors" disabled={scale <= 1}>
                 <ZoomOut size={20} />
               </button>
               <button onClick={handleZoomIn} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors" disabled={scale >= 3}>
                 <ZoomIn size={20} />
               </button>
             </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="text-white/50 hover:text-white transition-colors p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10"
            >
              <X size={24} />
            </button>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-[90vw] h-[80vh] flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
           <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <motion.div
                animate={{ scale }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full h-full relative"
              >
                <Image
                  src={image}
                  alt={alt}
                  fill
                  className="object-contain"
                  placeholder="blur"
                  sizes="90vw"
                  quality={100}
                />
              </motion.div>
           </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
