'use client';

import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, ArrowRight } from 'lucide-react';
import { useHitSound } from '@/hooks/useHitSound';

const TOURNAMENTS = [
  {
    id: 1,
    title: 'Weekly 8-Ball Clash',
    date: 'Every Friday, 7 PM',
    prize: '₹5,000 + Trophy',
    players: '16/32',
    level: 'Open for All',
    type: 'Pool',
    color: 'from-blue-600 to-blue-900',
    iconColor: 'text-blue-400'
  },
  {
    id: 2,
    title: 'Monthly Snooker Masters',
    date: 'Last Sunday of Month',
    prize: '₹25,000 + Custom Cue',
    players: '28/64',
    level: 'Advanced',
    type: 'Snooker',
    color: 'from-snookerGreen to-[#022b15]',
    iconColor: 'text-snookerGreen'
  },
  {
    id: 3,
    title: 'Corporate Night Cup',
    date: 'Thursday, 6 PM',
    prize: 'Exclusive Membership',
    players: '8/16 Teams',
    level: 'Corporate Teams',
    type: 'Mixed',
    color: 'from-purple-600 to-purple-900',
    iconColor: 'text-purple-400'
  }
];

export function Tournaments() {
  const playHitSound = useHitSound();

  const handleParticipate = (tourneyName: string) => {
    playHitSound();
    const message = `Hello Cue King! 🏆\n\nI want to participate in the upcoming tournament:\n*Tournament*: ${tourneyName}\n\nPlease share the registration details and brackets.`;
    const waUrl = `https://api.whatsapp.com/send?phone=919717179040&text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <section className="py-24 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-radial-gradient from-snookerGreen/5 to-transparent pointer-events-none -z-10" />
      
      <div className="text-center md:text-left mb-16">
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/60 inline-flex items-center gap-3 mb-4">
          <Trophy className="text-goldAccent" size={36} /> Upcoming Tournaments
        </h2>
        <p className="text-white/60 max-w-2xl">
          Prove your skills. Compete in our professional tournaments and win huge prizes. 
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TOURNAMENTS.map((tourney, index) => (
          <motion.div 
            key={tourney.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group relative rounded-3xl overflow-hidden glass-panel border border-white/10 bg-[#0a0a0a] shadow-2xl flex flex-col"
          >
            {/* Header Banner */}
            <div className={`p-6 bg-linear-to-br ${tourney.color} relative overflow-hidden`}>
               <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <Trophy size={100} />
               </div>
               <span className="inline-block px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-white border border-white/20 mb-4 shadow-sm">
                 {tourney.type}
               </span>
               <h3 className="text-2xl font-black text-white drop-shadow-md leading-tight">
                 {tourney.title}
               </h3>
            </div>

            {/* Content Details */}
            <div className="p-6 flex flex-col grow gap-4 relative z-10">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3 text-white/70">
                    <Calendar size={18} className={tourney.iconColor} />
                    <span className="text-sm font-medium">{tourney.date}</span>
                  </div>
               </div>
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3 text-white/70">
                    <Users size={18} className={tourney.iconColor} />
                    <span className="text-sm font-medium">Spots: {tourney.players}</span>
                  </div>
                  <span className="text-xs text-white/40">{tourney.level}</span>
               </div>
               <div className="pt-2 mb-4">
                  <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">Prize Pool</p>
                  <p className="text-xl font-bold text-goldAccent">{tourney.prize}</p>
               </div>
               
               <div className="mt-auto pt-4">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     handleParticipate(tourney.title);
                   }}
                   className="w-full py-4 rounded-xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-goldAccent hover:text-goldAccent hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all flex items-center justify-center gap-2 group/btn"
                 >
                   Participate Now
                   <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                 </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
