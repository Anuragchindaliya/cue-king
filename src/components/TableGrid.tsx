'use client';

import React, { useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { BookingModal } from '@/components/BookingModal';

const TABLES = [
  { id: 1, name: 'Table 1', status: 'available', type: 'Premium Snooker' },
  { id: 2, name: 'Table 2', status: 'occupied', type: 'Pro Pool' },
  { id: 3, name: 'Table 3', status: 'available', type: 'Classic Snooker' },
  { id: 4, name: 'Table 4', status: 'occupied', type: 'VIP Snooker' },
  { id: 5, name: 'Table 5', status: 'available', type: 'Standard Pool' },
  { id: 6, name: 'Table 6', status: 'available', type: 'Tournament Snooker' },
];

function TiltCard({ children, status }: { children: React.ReactNode; status: string }) {
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

  const rotateX = useMotionTemplate`${mouseY.get() * -20}deg`;
  const rotateY = useMotionTemplate`${mouseX.get() * 20}deg`;

  const glowColor = status === 'available' ? 'rgba(0, 255, 128, 0.15)' : 'rgba(255, 64, 64, 0.15)';

  return (
    <motion.div
      style={{ perspective: 1000 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative h-48 w-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full rounded-2xl glass-panel relative border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden transition-all duration-200"
      >
        <div
          className="absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)`
          }}
        />
        <div className="absolute inset-0 z-10 flex flex-col p-6 translate-z-12 shadow-glass">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function TableGrid() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('pool-1');

  const handleReserve = (tableType: string) => {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {TABLES.map((table) => (
          <TiltCard key={table.id} status={table.status}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{table.name}</h3>
              <span className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {table.status === 'available' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-snookerGreen opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </>
                  ) : (
                    <>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </>
                  )}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  {table.status}
                </span>
              </span>
            </div>
            
            <p className="text-sm text-white/50 mb-auto">{table.type}</p>
            
            <div className="mt-4">
              <button 
                disabled={table.status !== 'available'}
                onClick={() => handleReserve(table.type)}
                className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white/5 hover:bg-white/10 hover:border-snookerGreen hover:shadow-[inset_0_0_10px_rgba(0,40,0,0.5)] text-white"
              >
                {table.status === 'available' ? 'Reserve Block' : 'Occupied'}
              </button>
            </div>
          </TiltCard>
        ))}
      </div>

      <BookingModal isOpen={modalOpen} initialTable={selectedType} onClose={() => setModalOpen(false)} />
    </section>
  );
}
