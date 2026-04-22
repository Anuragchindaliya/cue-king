'use client';
import { useEffect, useRef, useState } from 'react';
import { useScroll, motion, useTransform } from 'framer-motion';

const TOTAL_FRAMES = 192;

export function PoolScrollExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    // We only load images on the client side to avoid SSR bundle size issues
    const loadedImages: HTMLImageElement[] = [];
    let count = 0;
    
    // Lazy block to let page load first
    setTimeout(() => {
       for (let i = 1; i <= TOTAL_FRAMES; i++) {
         const img = new Image();
         const padded = String(i).padStart(3, '0');
         
         // Using standard Next.js image URL string resolution via require
         try {
           const module = require(`@/assets/cue-table-images/ezgif-frame-${padded}.jpg`);
           img.src = module.default ? module.default.src : module.src ? module.src : module;
         } catch (e) {
           console.error("Missing frame:", padded);
         }
         
         img.onload = () => {
            count++;
            setLoadedCount(count);
         };
         loadedImages.push(img);
       }
       setImages(loadedImages);
    }, 100);
  }, []);

  // Sync canvas with scroll
  useEffect(() => {
    if (images.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let lastRenderedFrame = -1;

    const render = () => {
      const progress = scrollYProgress.get();
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.floor(progress * TOTAL_FRAMES))
      );
      
      if (frameIndex !== lastRenderedFrame) {
        const img = images[frameIndex];
        
        if (img && img.complete) {
          // Fill canvas (cover logic)
          const canvasRatio = canvas.width / canvas.height;
          const imgRatio = img.width / img.height;
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;

          if (canvasRatio > imgRatio) {
             drawHeight = drawWidth / imgRatio;
             offsetY = (canvas.height - drawHeight) / 2;
          } else {
             drawWidth = drawHeight * imgRatio;
             offsetX = (canvas.width - drawWidth) / 2;
          }

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          lastRenderedFrame = frameIndex;
        }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
       canvas.width = window.innerWidth;
       canvas.height = window.innerHeight;
       lastRenderedFrame = -1; // force re-render
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    render();
    
    return () => {
       cancelAnimationFrame(animationFrameId);
       window.removeEventListener('resize', handleResize);
    };
  }, [images, scrollYProgress]);

  const opacity = useTransform(scrollYProgress, [0.8, 1], [1, 0.2]);

  return (
    <div ref={containerRef} className="relative h-[600vh] bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {loadedCount < TOTAL_FRAMES * 0.1 && (
            <div className="absolute z-20 text-snookerGreen font-bold tracking-widest uppercase animate-pulse">
                Loading Arena... {Math.floor((loadedCount / TOTAL_FRAMES) * 100)}%
            </div>
        )}
        <motion.canvas 
          ref={canvasRef} 
          style={{ opacity }}
          className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none" 
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-black/80 pointer-events-none" />
        
        <ExperienceText scrollProgress={scrollYProgress} />
      </div>
    </div>
  );
}

// ExperienceText component perfectly synced to scroll progress inside the sticky container
function ExperienceText({ scrollProgress }: { scrollProgress: any }) {
  const getOp = (start: number, peak: number, end: number) => {
    return useTransform(scrollProgress, [start - 0.05, start, peak, end, end + 0.05], [0, 1, 1, 1, 0]);
  };
  const getY = (start: number, end: number) => {
    return useTransform(scrollProgress, [start, end], [50, -50]);
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
      <motion.div 
        style={{ opacity: getOp(0.1, 0.2, 0.3), y: getY(0.1, 0.3) }} 
        className="absolute w-full"
      >
        <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          Precision. <span className="text-snookerGreen  stroke-amber-100 stroke-3">Power.</span> Control.
        </h2>
      </motion.div>

      <motion.div 
        style={{ opacity: getOp(0.4, 0.5, 0.6), y: getY(0.4, 0.6) }} 
        className="absolute w-full"
      >
        <h2 className="text-5xl md:text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          Premium Tables. <br/><span className="text-goldAccent">Perfect Lighting.</span>
        </h2>
      </motion.div>

      <motion.div 
        style={{ opacity: getOp(0.7, 0.8, 0.9), y: getY(0.7, 0.9) }} 
        className="absolute w-full flex flex-col items-center gap-6"
      >
         <div className="w-16 h-1 bg-snookerGreen rounded-full shadow-[0_0_10px_#00ff9c]" />
         <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/70 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
           Feel the Game, Not Just Play It.
         </h2>
      </motion.div>
    </div>
  );
}
