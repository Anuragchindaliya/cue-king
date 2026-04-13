'use client';

import React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

const LEADERBOARD_DATA = [
  { id: 1, name: 'Alex "The Viper" Chen', wins: 142, skill: 'Pro Grandmaster' },
  { id: 2, name: 'Marcus Reynolds', wins: 128, skill: 'Grandmaster' },
  { id: 3, name: 'Sarah Jenkins', wins: 115, skill: 'Master' },
  { id: 4, name: 'David Kim', wins: 98, skill: 'Expert' },
  { id: 5, name: 'Elena Rostova', wins: 87, skill: 'Expert' },
];

export function Leaderboard() {
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

  return (
    <section className="py-20 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-goldAccent to-yellow-200 inline-block mb-4">
          Hall of Kings
        </h2>
        <p className="text-white/60 max-w-2xl">
          The ultimate snooker leaderboard. Rise through the ranks and claim your crown.
        </p>
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="py-5 px-6 font-semibold text-white/50 text-sm uppercase tracking-wider">Rank</th>
                  <th className="py-5 px-6 font-semibold text-white/50 text-sm uppercase tracking-wider">Player</th>
                  <th className="py-5 px-6 font-semibold text-white/50 text-sm uppercase tracking-wider">Wins</th>
                  <th className="py-5 px-6 font-semibold text-white/50 text-sm uppercase tracking-wider">Skill Level</th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD_DATA.map((player, index) => (
                  <tr 
                    key={player.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-linear-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(212,175,55,0.8)]' :
                        index === 1 ? 'bg-linear-to-br from-gray-300 to-gray-500 text-black' :
                        index === 2 ? 'bg-linear-to-br from-amber-600 to-amber-800 text-white' :
                        'bg-white/10 text-white/70'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-5 px-6 font-medium text-white text-lg">
                      {player.name}
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-goldAccent font-bold">{player.wins}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex px-3 py-1 bg-snookerGreen/20 border border-snookerGreen/30 text-snookerGreen text-xs rounded-full uppercase tracking-wider font-semibold">
                        {player.skill}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
