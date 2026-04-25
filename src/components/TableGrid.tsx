'use client';

import React, { useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { BookingModal } from '@/components/BookingModal';
import { useHitSound } from '@/hooks/useHitSound';

const TABLES = [
  { id: 1, name: 'Table 1', status: 'available', type: 'Premium Snooker' },
  { id: 2, name: 'Table 2', status: 'occupied', type: 'Pro Pool' },
  { id: 3, name: 'Table 3', status: 'available', type: 'Classic Snooker' },
  { id: 4, name: 'Table 4', status: 'occupied', type: 'VIP Snooker' },
  { id: 5, name: 'Table 5', status: 'available', type: 'Standard Pool' },
  { id: 6, name: 'Table 6', status: 'available', type: 'Tournament Snooker' },
];

function PoolTableCard({ children, status }: { children: React.ReactNode; status: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const rotateX = useMotionTemplate`${mouseY.get() * -15}deg`;
  const rotateY = useMotionTemplate`${mouseX.get() * 15}deg`;

  const glowColor = status === 'available' ? 'rgba(0, 255, 128, 0.4)' : 'rgba(255, 64, 64, 0.4)';

  return (
    <motion.div
      style={{ perspective: 1200 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative h-64 w-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full relative transition-all duration-200"
      >
        {/* Outer Wooden/Black Rim */}
        <div className="absolute inset-0 bg-[#2b1810] rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.8)] border-[6px] border-[#1f100a] overflow-hidden">
            {/* Inner Green Felt */}
            <div className="absolute inset-2 bg-linear-to-br from-[#0c592e] via-[#084523] to-[#042e16] shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] border-[2px] border-[#4a8a61]/30">
               {/* 6 Pockets */}
               <div className="absolute -top-[14px] -left-[14px] w-8 h-8 bg-black rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,1)] border-2 border-[#1f100a]"></div>
               <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 w-8 h-8 bg-black rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,1)] border-2 border-[#1f100a]"></div>
               <div className="absolute -top-[14px] -right-[14px] w-8 h-8 bg-black rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,1)] border-2 border-[#1f100a]"></div>
               <div className="absolute -bottom-[14px] -left-[14px] w-8 h-8 bg-black rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,1)] border-2 border-[#1f100a]"></div>
               <div className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 w-8 h-8 bg-black rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,1)] border-2 border-[#1f100a]"></div>
               <div className="absolute -bottom-[14px] -right-[14px] w-8 h-8 bg-black rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,1)] border-2 border-[#1f100a]"></div>
               
               {/* Pool lines mark (the baulk line / D) */}
               <div className="absolute left-1/4 top-0 bottom-0 w-[1px] bg-white/20"></div>
               <div className="absolute left-1/4 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-20 border-r border-t border-b border-white/20 rounded-r-full"></div>

               <div
                className="absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none opacity-50"
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)`
                }}
               />
               <div className="absolute inset-0 z-10 flex flex-col p-4 items-center justify-center text-center">
                   {children}
               </div>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function TableGrid() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('pool-1');
  const playHitSound = useHitSound();

  const handleReserve = (tableType: string) => {
    playHitSound();
    // Basic mapping: If it involves snooker, default to snooker.
    setSelectedType(tableType.toLowerCase().includes('snooker') ? 'snooker' : 'pool-1');
    setModalOpen(true);
  };

  return (
    <section className="py-20 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/60 inline-block mb-4">
          Live Table Status
        </h2>
        <p className="text-white/60 max-w-2xl">
          Check real-time availability of our premium tables before making a booking.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {TABLES.map((table) => (
          <PoolTableCard key={table.id} status={table.status}>
            <div className="flex flex-col items-center mb-3">
              <h3 className="text-3xl font-black text-white/90 drop-shadow-md mb-2">{table.name}</h3>
              <span className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-white/10 shadow-lg">
                <span className="relative flex h-3 w-3">
                  {table.status === 'available' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-snookerGreen opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ff80] shadow-[0_0_8px_#00ff80]"></span>
                    </>
                  ) : (
                    <>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_rgb(239,68,68)]"></span>
                    </>
                  )}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#e0e0e0]">
                  {table.status}
                </span>
              </span>
            </div>
            
            <p className="text-sm font-semibold text-white/50 mb-auto uppercase tracking-wide">{table.type}</p>
            
            <div className="mt-4 relative w-full px-4" style={{ transform: 'translateZ(20px)' }}>
              <button 
                disabled={table.status !== 'available'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReserve(table.type);
                }}
                className="w-full relative z-50 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xl bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-snookerGreen hover:shadow-[0_0_20px_rgba(0,255,128,0.4)] text-white backdrop-blur-md"
              >
                {table.status === 'available' ? 'Reserve Block' : 'Occupied'}
              </button>
            </div>
          </PoolTableCard>
        ))}
      </div>

      <BookingModal isOpen={modalOpen} initialTable={selectedType} onClose={() => setModalOpen(false)} />
    </section>
  );
}
