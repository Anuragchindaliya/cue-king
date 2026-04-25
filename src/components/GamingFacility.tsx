'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Gamepad2, Projector, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useState } from 'react';
import { PS5BookingModal } from '@/components/PS5BookingModal';

import ps5Img from '@/assets/gaming/ps5.png';
import projectorImg from '@/assets/gaming/projector.png';

export function GamingFacility() {
  const { showToast } = useToast();
  const [ps5ModalOpen, setPs5ModalOpen] = useState(false);

  return (
    <section className="py-24 relative overflow-hidden backdrop-blur-sm border-t border-white/5">
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/50 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-snookerGreen to-goldAccent mb-4">
            Beyond the Tables
          </h2>
          <p className="text-xl text-white/70 mb-6">Unwind in our upcoming luxury digital entertainment rooms.</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <span className="bg-white/10 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md shadow-lg flex items-center gap-2">
              <span className="text-blue-400">❄️</span> Fully Air Conditioned Chill Space
            </span>
            <span className="bg-white/10 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md shadow-lg flex items-center gap-2">
              <span className="text-red-500 animate-pulse">🛡️</span> 24/7 CCTV Secure
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* PS5 */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] aspect-4/3"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all duration-500 z-10 pointer-events-none" />
            <Image 
              src={ps5Img} 
              alt="Luxury PS5 Setup" 
              fill 
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
            />
            <div className="absolute bottom-0 inset-x-0 p-8 z-20 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end h-2/3">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-snookerGreen/20 p-2 rounded-xl text-snookerGreen"><Gamepad2 size={24} /></div>
                <h3 className="text-3xl font-bold text-white">Private PS5 Lounges</h3>
              </div>
              <p className="text-white/70 mb-6 font-medium max-w-md">The absolute best controllers, ultra-wide curved screens, and luxury seating.</p>
              <button onClick={() => setPs5ModalOpen(true)} className="flex items-center gap-2 text-snookerGreen hover:text-white transition-colors font-bold w-fit">
                Reserve Station <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>

          {/* Projector */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] aspect-4/3"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all duration-500 z-10 pointer-events-none" />
            <Image 
              src={projectorImg} 
              alt="Cinematic Projector Room" 
              fill 
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
            />
            <div className="absolute bottom-0 inset-x-0 p-8 z-20 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end h-2/3">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-goldAccent/20 p-2 rounded-xl text-goldAccent"><Projector size={24} /></div>
                <h3 className="text-3xl font-bold text-white">Cinematic Projector</h3>
              </div>
              <p className="text-white/70 mb-6 font-medium max-w-md">Epic 150-inch screens for watching major tournaments from plush recliners.</p>
              <button onClick={() => showToast('Cinematic Projector room booking starts soon.')} className="flex items-center gap-2 text-goldAccent hover:text-white transition-colors font-bold w-fit">
                Explore Theaters <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      <PS5BookingModal isOpen={ps5ModalOpen} onClose={() => setPs5ModalOpen(false)} />
    </section>
  );
}
