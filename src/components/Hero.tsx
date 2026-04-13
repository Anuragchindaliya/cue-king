'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-snookerGreen rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
      <div className="absolute top-1/2 right-1/4 translate-x-1/2 translate-y-1/4 w-80 h-80 bg-goldAccent rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>

      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center"
      >
        <div className="backdrop-blur-md bg-white/5 border border-white/10 shadow-glass rounded-3xl p-8 md:p-16 w-full relative overflow-hidden">
          {/* Inner subtle glow */}
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-50"></div>
          
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-white">Experience </span>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-snookerGreen to-goldAccent">
              Queue King Snooker
            </span>
          </motion.h1>
          
          <motion.p 
            className="mt-4 max-w-2xl mx-auto text-xl text-white/70 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            A premium physical club fused with digital precision. Join our leaderboard, check table status in real-time, and play like a king.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <button className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-snookerGreen/80 border border-white/20 rounded-full hover:bg-snookerGreen hover:shadow-[0_0_30px_rgba(0,77,38,0.8)] overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Book a Table <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 h-full w-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
