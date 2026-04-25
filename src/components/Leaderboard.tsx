'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, AnimatePresence } from 'framer-motion';
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

  // Live scoring simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard(prev => {
        const newData = [...prev];
        // Randomly pick 1-2 players to gain points
        const numPlayersToUpdate = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numPlayersToUpdate; i++) {
          const randomIndex = Math.floor(Math.random() * newData.length);
          // Favorable odds for lower ranked to climb fast for demonstration
          const pointsGained = Math.floor(Math.random() * 5) + 1;
          newData[randomIndex] = { ...newData[randomIndex], wins: newData[randomIndex].wins + pointsGained };
        }

        // Sort dynamically
        newData.sort((a, b) => b.wins - a.wins);

        // Check overtakes
        if (newData[0].id !== topPlayerId) {
          setTopPlayerId(newData[0].id);
          setShowCelebration(true);
          playHitSound();
          showToast(`🏆 ${newData[0].name} has seized the #1 Rank!`);
          
          setTimeout(() => {
            setShowCelebration(false);
          }, 4000);
        }

        return newData;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [topPlayerId, playHitSound, showToast]);

  return (
    <section className="py-20 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
            <div className="relative text-center p-12 bg-black/80 rounded-3xl border border-goldAccent shadow-[0_0_100px_rgba(212,175,55,0.6)]">
               <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-yellow-200 to-goldAccent drop-shadow-2xl animate-pulse">
                 NEW KING CROWNED
               </h1>
               <p className="mt-4 text-2xl text-white">The leaderboard has shifted!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
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

      <motion.div
        style={{ perspective: 1200 }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
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
              <div className="flex flex-col">
                {leaderboard.map((player, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                      {index === 0 && <span className="text-xl">👑</span>}
                    </div>
                    <div className="col-span-3">
                      <motion.span 
                         key={player.wins}
                         initial={{ color: "#ffffff", scale: 1.2 }}
                         animate={{ color: "#d4af37", scale: 1 }}
                         className="font-bold inline-block"
                      >
                         {player.wins}
                      </motion.span>
                    </div>
                    <div className="col-span-3">
                      <span className="inline-flex px-3 py-1 bg-snookerGreen/20 border border-snookerGreen/30 text-snookerGreen text-xs rounded-full uppercase tracking-wider font-semibold">
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
