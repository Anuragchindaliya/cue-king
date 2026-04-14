'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const TIME_SLOTS = [
  { time: '14:00', status: 'occupied' },
  { time: '15:00', status: 'available' },
  { time: '16:00', status: 'available' },
  { time: '17:00', status: 'occupied' },
  { time: '18:00', status: 'available' },
  { time: '19:00', status: 'occupied' },
  { time: '20:00', status: 'available' },
  { time: '21:00', status: 'available' },
  { time: '22:00', status: 'available' },
];

export function BookingModal({ isOpen, onClose, initialTable = 'pool-1' }: { isOpen: boolean; onClose: () => void; initialTable?: string }) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [tableType, setTableType] = useState(initialTable);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Sync internal state with prop if it changes and opens
      setTableType(initialTable);
      setSelectedTime(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialTable]);

  if (!mounted) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTime) {
      showToast("Please select a time slot first.");
      return;
    }
    const form = e.currentTarget;
    const dateInput = form.querySelector('input[type="date"]') as HTMLInputElement;
    const playersSelect = form.querySelector('select') as HTMLSelectElement;

    const message = `Hello Cue King! 🎱\n\nI want to make a reservation:\n*Table*: ${tableType}\n*Date*: ${dateInput?.value}\n*Time*: ${selectedTime}\n*Players*: ${playersSelect?.value}\n\nPlease confirm if available.`;
    const waUrl = `https://api.whatsapp.com/send?phone=919717179040&text=${encodeURIComponent(message)}`;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onClose();
      window.open(waUrl, "_blank");
    }, 800);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[50000] flex items-center justify-center px-4 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl glass-panel bg-black/90 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Neon Gamified Background Highlight directly inside the card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-snookerGreen rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-10"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-snookerGreen to-goldAccent mb-2 relative z-10">
              Reserve Table
            </h2>
            <p className="text-white/60 mb-6 font-medium relative z-10">Select an available time block.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <div className="grid grid-cols-3 gap-3">
                  {['pool-1', 'pool-2', 'snooker'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTableType(type)}
                      className={`py-3 px-2 rounded-xl border text-sm font-bold transition-all relative overflow-hidden ${
                        tableType === type 
                          ? 'bg-snookerGreen/20 border-snookerGreen text-white shadow-[inset_0_0_15px_rgba(0,255,128,0.2)]' 
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
                    {/* Using hardcoded default value because `new Date().toISOString()` triggers hydration warnings sometimes */}
                    <input type="date" required defaultValue="2026-04-14" className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-snookerGreen transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Players</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <select required className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-snookerGreen appearance-none cursor-pointer">
                      {[1,2,3,4,5,6].map(num => <option key={num} value={num}>{num} Players</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <label className="block text-sm font-medium text-white/80 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>Interactive Timeline</span>
                  <div className="flex gap-4 text-xs font-normal">
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-snookerGreen shadow-[0_0_5px_rgba(0,255,128,0.8)]"></div> Available</span>
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div> Occupied</span>
                  </div>
                </label>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot, index) => {
                    const isAvailable = slot.status === 'available';
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`py-2 px-1 rounded-lg text-sm font-bold transition-all relative overflow-hidden ${
                          isSelected 
                            ? 'bg-snookerGreen text-white border border-snookerGreen shadow-[0_0_15px_rgba(0,77,38,0.8)] scale-105 z-10'
                            : isAvailable 
                              ? 'bg-white/5 border border-white/10 text-white hover:bg-snookerGreen/20 hover:border-snookerGreen/50 hover:shadow-[inset_0_0_10px_rgba(0,255,128,0.1)]'
                              : 'bg-red-500/5 border border-red-500/10 text-red-500/30 cursor-not-allowed'
                        }`}
                      >
                        {isSelected && <motion.div layoutId="highlight" className="absolute inset-0 bg-white/20 mix-blend-overlay rounded-lg"></motion.div>}
                        {slot.time}
                      </button>
                    )
                  })}
                </div>
                {!selectedTime && <p className="text-red-400/80 text-xs mt-3 block text-center animate-pulse">Please select a time block to proceed</p>}
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !selectedTime}
                className="w-full py-4 mt-8 bg-linear-to-r from-snookerGreen to-emerald-700 hover:from-snookerGreen hover:to-emerald-600 border border-emerald-500/30 rounded-xl font-bold text-white transition-all shadow-[0_5px_20px_rgba(0,77,38,0.4)] disabled:opacity-50 disabled:grayscale flex items-center justify-center text-lg tracking-wide relative overflow-hidden"
              >
                {isLoading ? (
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full z-10"
                  />
                ) : (
                  <>
                    <span className="relative z-10">Confirm Reservation</span>
                    {selectedTime && <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] px-10"></motion.div>}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
