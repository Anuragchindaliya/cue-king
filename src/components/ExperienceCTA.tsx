'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ExperienceCTA() {
  return (
    <section className="relative py-40 overflow-hidden border-t border-white/10 z-20 bg-black">
      <div className="absolute inset-0 bg-linear-to-b from-[#001a0d] to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-snookerGreen/20 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-r from-white via-white/90 to-white/50 mb-10"
        >
          READY TO BREAK?
        </motion.h2>
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }}
        >
          <Link href="/tables">
            <button className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 text-xl font-bold text-black bg-snookerGreen rounded-full shadow-[0_0_40px_rgba(0,255,156,0.4)] hover:shadow-[0_0_60px_rgba(0,255,156,0.6)] hover:bg-[#00e68a] transition-all transform hover:scale-105 active:scale-95 overflow-hidden">
               <span className="relative z-10">Book Your Table Now</span>
               <ArrowRight className="relative z-10 w-6 h-6 group-hover:translate-x-2 transition-transform" />
               <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
