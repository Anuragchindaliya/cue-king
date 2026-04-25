'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useHitSound } from '@/hooks/useHitSound';
import { useToast } from '@/components/ToastProvider';

const INITIAL_LEADERBOARD = [
  { id: 1, name: 'Vinay', wins: 204, skill: 'Pro Grandmaster' },
  { id: 2, name: 'Umesh', wins: 189, skill: 'Grandmaster' },
  { id: 3, name: 'Ankush', wins: 165, skill: 'Master' },
  { id: 4, name: 'Anurag', wins: 142, skill: 'Expert' },
  { id: 5, name: 'Akshay', wins: 121, skill: 'Expert' },
  { id: 6, name: 'Hunny', wins: 98, skill: 'Veteran' },
  { id: 7, name: 'Karan', wins: 76, skill: 'Challenger' },
  { id: 8, name: 'Kalu', wins: 45, skill: 'Contender' },
];

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState(INITIAL_LEADERBOARD);
  const [topPlayerId, setTopPlayerId] = useState(INITIAL_LEADERBOARD[0].id);
  const [newKingName, setNewKingName] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const { showToast } = useToast();
  const playHitSound = useHitSound();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const rotateX = useMotionTemplate`${mouseY.get() * -5}deg`;
  const rotateY = useMotionTemplate`${mouseX.get() * 5}deg`;

  // Live scoring simulation inside a separated effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard(prev => {
        const newData = [...prev];
        const numPlayersToUpdate = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < numPlayersToUpdate; i++) {
          const randomIndex = Math.floor(Math.random() * newData.length);
          const pointsGained = Math.floor(Math.random() * 5) + 1;
          newData[randomIndex] = { ...newData[randomIndex], wins: newData[randomIndex].wins + pointsGained };
        }

        newData.sort((a, b) => b.wins - a.wins);
        return newData;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Separate effect to handle the state-driven side effects without causing render loop conflicts 
  useEffect(() => {
    if (leaderboard[0].id !== topPlayerId) {
      setTopPlayerId(leaderboard[0].id);
      setNewKingName(leaderboard[0].name);
      setShowCelebration(true);
      playHitSound();
      showToast(`👑 ${leaderboard[0].name} has seized the #1 Rank!`);
      
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [leaderboard, topPlayerId, playHitSound, showToast]);

  return (
    <section className="py-20 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Corner UI Celebration Instead of Blocking Center View */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0, x: 100, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100, y: 20 }}
            className="fixed bottom-10 right-10 z-[100] pointer-events-none"
          >
            <div className="relative text-left p-6 bg-black/95 rounded-2xl border border-goldAccent shadow-[0_0_50px_rgba(212,175,55,0.4)] backdrop-blur-md flex flex-col gap-1 pr-12">
               <h1 className="text-xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-200 to-goldAccent drop-shadow-md animate-pulse">
                 👑 NEW KING CROWNED
               </h1>
               <p className="text-white/80 text-sm mt-1">
                 <strong className="text-white text-base">{newKingName}</strong> has seized #1!
               </p>
               
               <div className="absolute -top-4 -right-4 text-4xl animate-bounce">
                  🏆
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4 justify-center md:justify-start">
             <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-goldAccent to-yellow-200 inline-block">
               Hall of Kings
             </h2>
             <span className="flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-widest border border-red-500/30 animate-pulse">
               <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_red]" /> Live
             </span>
          </div>
          <p className="text-white/60 max-w-2xl">
            Live tournament standings updated in real-time. Rise through the ranks and claim your crown.
          </p>
        </div>
      </div>

      {/* Top Player Details Frame */}
      <motion.div 
        layoutId={`player-${leaderboard[0].id}`}
        className="mb-8 relative overflow-hidden bg-linear-to-r from-yellow-500/10 to-goldAccent/10 border border-goldAccent/30 rounded-3xl p-6 md:p-8 flex items-center md:items-start gap-6 shadow-[0_0_30px_rgba(212,175,55,0.1)] backdrop-blur-sm"
      >
        <div className="absolute right-0 bottom-0 text-white/[0.03] scale-150 transform translate-x-10 translate-y-10 pointer-events-none">
          <Trophy size={200} />
        </div>
        <div className="hidden sm:flex shrink-0 w-24 h-24 bg-linear-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-full items-center justify-center text-4xl shadow-[0_0_30px_rgba(212,175,55,0.4)] border-4 border-[#111]">
          👑
        </div>
        <div className="z-10 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
            <div>
              <h3 className="text-xs font-black text-goldAccent uppercase tracking-widest mb-1.5 opacity-80">Current Reigning King</h3>
              <p className="text-4xl md:text-5xl font-black text-white tracking-tight">{leaderboard[0].name}</p>
            </div>
            <div className="bg-black/50 border border-goldAccent/30 px-6 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
               <span className="text-xs text-white/50 uppercase tracking-widest font-bold">Total Wins</span>
               <span className="text-3xl font-black text-goldAccent">{leaderboard[0].wins}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-goldAccent/20 flex gap-4 text-sm font-semibold text-white/80 uppercase tracking-wider">
             <span className="bg-goldAccent/20 text-goldAccent px-3 py-1 rounded-full border border-goldAccent/20">
               {leaderboard[0].skill}
             </span>
             <span className="bg-white/10 text-white/60 px-3 py-1 rounded-full border border-white/5">
               Rank #1
             </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        style={{ perspective: 1200 }}
        // onMouseMove={onMouseMove}
        // onMouseLeave={onMouseLeave}
        className="w-full"
      >
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="w-full glass-panel border border-white/10 bg-black/30 backdrop-blur-xl rounded-3xl overflow-hidden shadow-glass"
        >
          <div className="overflow-x-auto">
            {/* Using a structural flex/grid layout to allow framer-motion layout animations gracefully */}
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 border-b border-white/10 bg-white/5 py-5 px-6 font-semibold text-white/50 text-sm uppercase tracking-wider">
                <div className="col-span-2">Rank</div>
                <div className="col-span-4">Player</div>
                <div className="col-span-3">Wins</div>
                <div className="col-span-3">Skill Level</div>
              </div>
              
              {/* Body */}
              <div className="flex flex-col relative pb-4">
                {leaderboard.map((player, index) => (
                  <motion.div 
                    layout="position"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                    key={player.id} 
                    className="grid grid-cols-12 gap-4 border-b border-white/5 hover:bg-white/5 transition-colors duration-200 py-5 px-6 items-center"
                  >
                    <div className="col-span-2">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-linear-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_15px_rgba(212,175,55,0.8)] scale-110' :
                        index === 1 ? 'bg-linear-to-br from-gray-300 to-gray-500 text-black' :
                        index === 2 ? 'bg-linear-to-br from-amber-600 to-amber-800 text-white' :
                        'bg-white/10 text-white/70'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="col-span-4 font-medium text-white text-lg flex items-center gap-2">
                      {player.name}
                      {index === 0 && <span className="text-xl drop-shadow-[0_0_5px_gold]">👑</span>}
                    </div>
                    <div className="col-span-3">
                      <motion.span 
                         key={player.wins}
                         initial={{ color: "#ffffff", scale: 1.2 }}
                         animate={{ color: index === 0 ? "#d4af37" : "#ffffff", scale: 1 }}
                         className={`font-black inline-block ${index === 0 ? 'text-goldAccent drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]' : ''}`}
                      >
                         {player.wins}
                      </motion.span>
                    </div>
                    <div className="col-span-3">
                      <span className={`inline-flex px-3 py-1 text-xs rounded-full uppercase tracking-wider font-semibold border ${
                        index === 0 ? 'bg-goldAccent/20 border-goldAccent/30 text-goldAccent' : 'bg-snookerGreen/20 border-snookerGreen/30 text-snookerGreen'
                      }`}>
                        {player.skill}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
