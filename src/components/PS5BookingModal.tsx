'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Gamepad2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const TIME_SLOTS = [
  { time: '14:00', status: 'available' },
  { time: '15:00', status: 'occupied' },
  { time: '16:00', status: 'available' },
  { time: '17:00', status: 'available' },
  { time: '18:00', status: 'occupied' },
  { time: '19:00', status: 'available' },
  { time: '20:00', status: 'available' },
  { time: '21:00', status: 'occupied' },
  { time: '22:00', status: 'available' },
];

export function PS5BookingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [station, setStation] = useState('station-1');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedTime(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!mounted) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTime) return showToast("Please select a session time.");
    
    const form = e.currentTarget;
    const dateInput = form.querySelector('input[type="date"]') as HTMLInputElement;
    const controllersSelect = form.querySelector('select') as HTMLSelectElement;

    const message = `Hello Cue King! 🎮\n\nI want to deploy a PS5 Station:\n*Station*: ${station}\n*Date*: ${dateInput?.value}\n*Time*: ${selectedTime}\n*Controllers*: ${controllersSelect?.value}\n\nPlease confirm availability.`;
    const waUrl = `https://api.whatsapp.com/send?phone=919717179040&text=${encodeURIComponent(message)}`;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onClose();
      window.open(waUrl, "_blank");
    }, 800);
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[50000] flex items-center justify-center px-4 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-lg"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl glass-panel bg-zinc-950 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>

            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-10"><X size={24} /></button>
            
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-400 to-purple-400 mb-2 relative z-10">Deploy PS5 Lounge</h2>
            <p className="text-white/60 mb-6 font-medium relative z-10">Reserve your private ultra-wide cinematic gaming station.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <label className="block text-sm font-medium text-indigo-200/80 mb-3">Select Station</label>
                <div className="grid grid-cols-4 gap-2">
                  {['station-1', 'station-2', 'station-3', 'station-4'].map((type, idx) => (
                    <button key={type} type="button" onClick={() => setStation(type)} className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all relative overflow-hidden ${station === type ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-[inset_0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}>
                      Station {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-200/80 mb-2">Deploy Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input type="date" required defaultValue="2026-04-14" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-200/80 mb-2">Controllers Needed</label>
                  <div className="relative">
                    <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <select required className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                      {[1,2,3,4].map(num => <option key={num} value={num}>{num} {num === 1 ? 'Controller' : 'Controllers'}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-indigo-500/10 rounded-2xl p-4">
                <label className="block text-sm font-medium text-indigo-200/80 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>Server Uptime Slots</span>
                  <div className="flex gap-4 text-xs font-normal text-white/80">
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.8)]"></div> Available</span>
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div> Occupied</span>
                  </div>
                </label>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot, index) => {
                    const isAvailable = slot.status === 'available';
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button key={index} type="button" disabled={!isAvailable} onClick={() => setSelectedTime(slot.time)} className={`py-2 px-1 rounded-lg text-sm font-bold transition-all relative overflow-hidden ${isSelected ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.8)] scale-105 z-10' : isAvailable ? 'bg-white/5 border border-white/10 text-white hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]' : 'bg-red-500/5 border border-red-500/10 text-red-500/30 cursor-not-allowed'}`}>
                        {isSelected && <motion.div layoutId="ps5-highlight" className="absolute inset-0 bg-white/20 mix-blend-overlay rounded-lg"></motion.div>}
                        {slot.time}
                      </button>
                    )
                  })}
                </div>
                {!selectedTime && <p className="text-red-400/80 text-xs mt-3 block text-center animate-pulse">Select a time block to proceed</p>}
              </div>
              
              <button type="submit" disabled={isLoading || !selectedTime} className="w-full py-4 mt-8 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/30 rounded-xl font-bold text-white transition-all shadow-[0_5px_20px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:grayscale flex items-center justify-center text-lg tracking-wide relative overflow-hidden">
                {isLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full z-10" /> : <><span className="relative z-10">Confirm Deployment</span>{selectedTime && <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] px-10"></motion.div>}</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
