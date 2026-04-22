'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BookingModal } from '@/components/BookingModal';

export function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-black/60 backdrop-blur-md border-white/10 shadow-glass"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="shrink-0">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-snookerGreen to-goldAccent">
              Cue King
            </span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-white hover:text-goldAccent transition-colors px-3 py-2 rounded-md text-sm font-medium">Home</Link>
              <Link href="/tables" className="text-white/70 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium">Tables</Link>
              <Link href="/experience" className="text-white/70 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium">Experience</Link>
              <Link href="/leaderboard" className="text-white/70 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium">Leaderboard</Link>
              <Link href="/membership" className="text-white/70 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium">Membership</Link>
              <Link href="/shop" className="text-white/70 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium">Shop</Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-snookerGreen/80 hover:bg-snookerGreen border border-white/20 text-white px-5 py-2 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(0,77,38,0.5)]"
            >
              Book Table
            </button>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden glass-panel"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/80 backdrop-blur-xl border-b border-white/10">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-white block px-3 py-2 rounded-md text-base font-medium">Home</Link>
              <Link href="/tables" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Tables</Link>
              <Link href="/experience" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Experience</Link>
              <Link href="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Leaderboard</Link>
              <Link href="/membership" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Membership</Link>
              <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Shop</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
}
