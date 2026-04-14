'use client';
import { motion } from 'framer-motion';

export default function MembershipPage() {
  return (
    <div className="relative min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-md bg-white/5 border border-white/10 shadow-glass rounded-3xl p-8 md:p-16 w-full text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-br from-goldAccent/10 to-transparent opacity-50 z-0 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-goldAccent to-white mb-6">
            Cue King Membership
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-white/70 mb-10">
            Join the elite. Get exclusive access to the VIP lounge, priority table booking, and entry to seasonal tournaments.
          </p>
          <button className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-black transition-all duration-200 bg-goldAccent border border-white/20 rounded-full hover:bg-[#e6c95a] hover:shadow-[0_0_30px_rgba(212,175,55,0.8)] overflow-hidden">
            <span className="relative z-10">
              Apply Now
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
