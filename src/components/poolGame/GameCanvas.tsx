'use client';
import { useRef } from 'react';
import { useHitSound } from '@/hooks/useHitSound';
import { useGameLoop } from './hooks/useGameLoop';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playHitSound = useHitSound();
  
  const { 
    handlePointerDown, 
    handlePointerMove, 
    handlePointerUp, 
    handlePointerOut,
    resetGame 
  } = useGameLoop(canvasRef, playHitSound);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-4">
      <div className="w-full flex justify-between items-end mb-2 px-2">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-snookerGreen to-white drop-shadow-md">
             8-Ball Classic
          </h2>
          <p className="text-white/50 text-sm font-medium mt-1">Physics-based simulation</p>
        </div>
        <button 
           onClick={() => { playHitSound(); resetGame(); }}
           className="px-6 py-2 bg-white/10 hover:bg-snookerGreen/40 border border-white/20 hover:border-snookerGreen text-white rounded-full font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.1)] active:scale-95"
        >
          Rack Balls
        </button>
      </div>
      
      <div className="w-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-4 border-[#1f100a] rounded-xl overflow-hidden relative bg-[#2b1810]">
        <canvas 
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOut={handlePointerOut}
          className="w-full h-auto aspect-[2/1] block cursor-crosshair touch-none"
        />
        
        {/* Helper text overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <p className="inline-block px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white/70 text-xs font-semibold tracking-widest uppercase border border-white/10 shadow-md">
            Click & Drag backwards from the Cue Ball to shoot
          </p>
        </div>
      </div>
    </div>
  );
}
