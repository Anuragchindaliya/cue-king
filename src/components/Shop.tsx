'use client';
import { motion } from 'framer-motion';
import { ShoppingBag, Box, Activity } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const products = [
  { name: 'Aramith Tournament Balls', price: '₹1490', type: 'Balls', icon: Box },
  { name: 'Predator Cue Stick', price: '₹8990', type: 'Cues', icon: Activity },
  { name: 'Classic Triangle', price: '₹240', type: 'Accessories', icon: Box },
  { name: 'Chalk Box (12pcs)', price: '₹120', type: 'Accessories', icon: Box },
];

export function Shop() {
  const { showToast } = useToast();

  const handleBuy = (item: string) => {
    showToast(`The Cue King Shop is launching next week! Added ${item} to your waitlist.`);
  };

  return (
    <section className="py-24 relative overflow-hidden backdrop-blur-md bg-white/5 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-snookerGreen to-goldAccent mb-4">
              Pro Shop
            </h2>
            <p className="text-lg text-white/60 max-w-xl">Purchase the same elite equipment we use. Balls, cues, and fully sized tables delivered to your door.</p>
          </div>
          <button 
            onClick={() => showToast('Full catalog coming soon.')}
            className="group flex items-center gap-2 text-goldAccent font-medium hover:text-white transition-colors mt-6 md:mt-0"
          >
            View All Equipment <ShoppingBag size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 group transition-colors hover:border-snookerGreen/50"
              >
                <div className="h-32 w-full bg-white/5 rounded-xl mb-6 flex items-center justify-center text-white/20 group-hover:bg-snookerGreen/10 group-hover:text-snookerGreen transition-all">
                  <Icon size={48} strokeWidth={1} />
                </div>
                <div className="text-xs text-goldAccent mb-2 font-bold tracking-wider uppercase">{item.type}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-xl font-bold text-white/90">{item.price}</span>
                  <button 
                    onClick={() => handleBuy(item.name)}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-snookerGreen transition-colors"
                  >
                    Buy
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  );
}
