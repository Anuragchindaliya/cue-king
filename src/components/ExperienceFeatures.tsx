'use client';
import { motion } from 'framer-motion';

const features = [
  { icon: '🎱', title: 'Professional Tables', desc: 'Tournament standard Star tables perfectly leveled.' },
  { icon: '🎵', title: 'Music & Projector', desc: 'Immersive sound system and live sports streaming.' },
  { icon: '🛋️', title: 'Lounge Seating', desc: 'Relax in sheer luxury between critical frames.' },
  { icon: '🔐', title: 'Secure Environment', desc: 'Safe, premium access for members and guests.' }
];

export function ExperienceFeatures() {
  return (
    <section className="py-32 relative bg-black z-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Your Arena <span className="text-snookerGreen">Awaits</span>
          </motion.h2>
          <div className="w-24 h-1 bg-goldAccent mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               whileHover={{ y: -10, scale: 1.02 }}
               className="group relative p-8 rounded-3xl bg-[#0a0a0a] border border-white/5 shadow-2xl glass-panel hover:border-snookerGreen/50 transition-colors duration-500 overflow-hidden text-center"
             >
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(0,255,156,0.3)]">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-snookerGreen/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
             </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
