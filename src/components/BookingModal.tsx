'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Users } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export function BookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const [tableType, setTableType] = useState('pool-1');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate processing request
    setTimeout(() => {
      setIsLoading(false);
      onClose();
      showToast("Online reservations are coming soon! Please call our front desk to book right now.");
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[40000] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass-panel bg-black/90 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-snookerGreen to-goldAccent mb-2">
              Reserve a Table
            </h2>
            <p className="text-white/60 mb-6 font-medium">Select your preferred table and time to play.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">Table Selection</label>
                <div className="grid grid-cols-3 gap-3">
                  {['pool-1', 'pool-2', 'snooker'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTableType(type)}
                      className={`py-3 px-2 rounded-xl border text-sm font-bold transition-all ${
                        tableType === type 
                          ? 'bg-snookerGreen border-snookerGreen text-white shadow-[0_0_15px_rgba(0,77,38,0.5)]' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {type === 'snooker' ? 'Snooker (1)' : `Pool (${type.split('-')[1]})`}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input type="date" required className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-snookerGreen transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input type="time" required className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-snookerGreen transition-colors" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Party Size</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <select required className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-snookerGreen appearance-none cursor-pointer">
                    {[1,2,3,4,5,6].map(num => <option key={num} value={num}>{num} {num === 1 ? 'Player' : 'Players'}</option>)}
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-8 bg-linear-to-r from-snookerGreen to-emerald-700 hover:from-snookerGreen hover:to-emerald-600 border border-emerald-500/30 rounded-xl font-bold text-white transition-all shadow-[0_5px_20px_rgba(0,77,38,0.4)] disabled:opacity-70 flex items-center justify-center text-lg tracking-wide"
              >
                {isLoading ? (
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  "Confirm Details"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
