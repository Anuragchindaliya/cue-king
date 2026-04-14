'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import Image from 'next/image';

import img1 from '@/assets/gallery/2026-04-05.webp';
import img2 from '@/assets/gallery/unnamed.webp';
import img3 from '@/assets/gallery/2026-04-05 (1).webp';
import img4 from '@/assets/gallery/2026-04-05 (2).webp';

const products = [
  { name: 'Aramith Tournament Balls', price: '₹1490', type: 'Balls', image: img1 },
  { name: 'Predator Cue Stick', price: '₹8990', type: 'Cues', image: img2 },
  { name: 'Classic Triangle', price: '₹240', type: 'Accessories', image: img3 },
  { name: 'Chalk Box (12pcs)', price: '₹120', type: 'Accessories', image: img4 },
];

export function Shop() {
  const { showToast } = useToast();
  const [cart, setCart] = useState<string[]>([]);

  const toggleBuy = (item: string) => {
    if (cart.includes(item)) {
       setCart(cart.filter(i => i !== item));
       showToast(`Removed ${item} from waitlist.`);
    } else {
       setCart([...cart, item]);
       showToast(`Added ${item} to waitlist cart! Notification active.`);
    }
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
          <div className="flex items-center gap-4 mt-6 md:mt-0">
            {cart.length > 0 && (
              <span className="bg-snookerGreen/20 border border-snookerGreen/50 text-snookerGreen px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <Check size={14} /> {cart.length} Waitlisted
              </span>
            )}
            <button 
              onClick={() => showToast('Full catalog layout loading soon.')}
              className="group flex items-center gap-2 text-goldAccent font-medium hover:text-white transition-colors"
            >
              View All Equipment <ShoppingBag size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((item, idx) => {
            const inCart = cart.includes(item.name);
            
            return (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className={`bg-[#0a0a0a] border rounded-2xl p-6 group transition-colors relative overflow-hidden ${inCart ? 'border-snookerGreen' : 'border-white/10 hover:border-snookerGreen/50'}`}
              >
                {inCart && (
                  <div className="absolute top-0 right-0 bg-snookerGreen text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20 shadow-md flex items-center gap-1 uppercase tracking-widest">
                    <Check size={10} /> Active Waitlist
                  </div>
                )}
                
                <div className={`h-32 w-full rounded-xl mb-6 relative flex items-center justify-center transition-all overflow-hidden ${inCart ? 'scale-95' : 'group-hover:scale-105'}`}>
                  <Image 
                    src={item.image} 
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className={`object-cover ${inCart ? 'opacity-50' : 'opacity-80 group-hover:opacity-100'} transition-opacity`}
                    placeholder="blur"
                  />
                  {inCart && <div className="absolute inset-0 bg-snookerGreen/20 mix-blend-overlay"></div>}
                </div>
                
                <div className="text-xs text-goldAccent mb-2 font-bold tracking-wider uppercase">{item.type}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                
                <div className="flex items-center justify-between mt-6">
                  <span className="text-xl font-bold text-white/90">{item.price}</span>
                  <button 
                    onClick={() => toggleBuy(item.name)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md ${
                      inCart 
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                        : 'bg-white/10 text-white hover:bg-snookerGreen hover:shadow-[0_0_15px_rgba(0,77,38,0.5)] border border-transparent'
                    }`}
                  >
                    {inCart ? 'Remove Status' : 'Add to Cart'}
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
