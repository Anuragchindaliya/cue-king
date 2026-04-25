'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import heroImg from '@/assets/gallery/unnamed.webp';
import { BookingModal } from '@/components/BookingModal';
import bg from '@/assets/landing-bg/landing-img.webp';

export function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-10 overflow-hidden">
      {/* add image path */}
      <img src={bg.src} alt="bg" className="fixed inset-0 w-full h-screen object-cover   opacity-15" />
      <div className='absolute inset-0 bg-[radial-gradient(circle,_transparent_0%,_snookerGreen_100%)] from-snookerGreen/20 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none'></div>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side: Text */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
             duration: 6,
             repeat: Infinity,
             ease: "easeInOut"
          }}
          className="relative z-10 flex flex-col items-start text-left"
        >
          <div className="backdrop-blur-md bg-white/5 border border-white/10 shadow-glass rounded-3xl p-8 md:p-12 w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-white">Experience </span>
              <span className="text-transparent bg-clip-text bg-linear-to-r from-snookerGreen to-goldAccent block mt-2">
                Cue King Snooker
              </span>
            </motion.h1>
            
            <motion.p 
              className="mt-4 text-lg md:text-xl text-white/70 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              A premium physical club fused with digital precision. Join our leaderboard, reserve your tables seamlessly, and play like a king.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <button 
                onClick={() => setIsModalOpen(true)}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-snookerGreen/80 border border-white/20 rounded-full hover:bg-snookerGreen hover:shadow-[0_0_30px_rgba(0,77,38,0.8)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Reserve Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 h-full w-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side: Floating Snooker Polaroids */}
        <motion.div 
          className="relative z-10 hidden md:block"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, type: "spring" }}
        >
          <div className="relative w-full aspect-[4/3] max-w-lg mx-auto mt-10 md:mt-0">
            {/* Main Polaroid */}
            <motion.div 
              animate={{ y: [0, 15, 0], rotate: [-2, 0, -2] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-white/5 p-3 rounded-3xl border border-white/20 backdrop-blur-md shadow-2xl z-20"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
                <Image 
                  src={heroImg} 
                  alt="Premium Pool Setup" 
                  fill 
                  className="object-cover"
                  placeholder="blur"
                />
              </div>
            </motion.div>
            
            {/* Decorative background cards */}
            <div className="absolute inset-0 bg-snookerGreen/20 rounded-3xl border border-snookerGreen/30 transform rotate-6 scale-95 z-10 blur-[2px]"></div>
            <div className="absolute inset-0 bg-goldAccent/20 rounded-3xl border border-goldAccent/30 transform -rotate-3 scale-105 z-0 blur-[4px] translate-x-6 translate-y-6"></div>
          </div>
        </motion.div>
      </div>

      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
