'use client';

import { Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export function CallToAction() {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <motion.a
        href="tel:+919717179040"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-full font-medium transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-snookerGreen hover:shadow-[0_0_15px_rgba(0,77,38,0.5)] group"
      >
        <div className="bg-snookerGreen p-2 rounded-full group-hover:animate-pulse">
          <Phone size={18} className="text-white" />
        </div>
        <span className="hidden sm:inline-block pr-2">Call Now</span>
      </motion.a>
    </div>
  );
}
