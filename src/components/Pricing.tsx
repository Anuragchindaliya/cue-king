'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export function Pricing() {
  const { showToast } = useToast();

  const handlePurchase = (plan: string) => {
    showToast(`Online purchase for ${plan} is coming soon! Ask our staff to activate your membership in person.`);
  }

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-snookerGreen to-emerald-400 mb-4">
            Memberships & Hourly Rates
          </h2>
          <p className="text-lg text-white/60">Choose the right tier to elevate your experience. Join now to lock in our Golden Offer pricing before spots fill up.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
          {/* Regular */}
          <div className="glass-panel bg-white/5 border border-white/10 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-2">Casual Player</h3>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">₹150</span>
              <span className="text-white/50">/ hr</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex text-white/70"><Check className="text-snookerGreen mr-3" size={20} /> Standard cue sticks</li>
              <li className="flex text-white/70"><Check className="text-snookerGreen mr-3" size={20} /> Access to generic tables</li>
              <li className="flex text-white/70 opacity-30"><Check className="text-white mr-3" size={20} /> Priority Booking</li>
            </ul>
            <button onClick={() => handlePurchase('Casual')} className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors font-semibold">Play Now</button>
          </div>

          {/* Golden Offer */}
          <div className="glass-panel bg-gradient-to-b from-[#111] to-black border border-goldAccent p-8 rounded-3xl transform md:-translate-y-4 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-goldAccent"></div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-goldAccent rounded-full mix-blend-screen filter blur-[40px] opacity-50"></div>
            
            <div className="inline-block px-3 py-1 bg-goldAccent/20 text-goldAccent text-xs font-bold rounded-full mb-4 ring-1 ring-goldAccent/50">UNIQUE OFFER</div>
            <h3 className="text-2xl font-bold text-white mb-2">Cue King Pro</h3>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">₹490</span>
              <span className="text-white/50">/ month</span>
            </div>
            <ul className="space-y-4 mb-8 relative z-10">
              <li className="flex text-white"><Check className="text-goldAccent mr-3" size={20} /> Premium carbon fiber cues</li>
              <li className="flex text-white"><Check className="text-goldAccent mr-3" size={20} /> Unlimited access off-peak</li>
              <li className="flex text-white"><Check className="text-goldAccent mr-3" size={20} /> VIP Lounge Entry</li>
              <li className="flex text-white"><Check className="text-goldAccent mr-3" size={20} /> 50% Off Table Bookings</li>
            </ul>
            <button onClick={() => handlePurchase('Pro Membership')} className="w-full py-4 rounded-xl bg-goldAccent text-black hover:bg-[#e6c95a] transition-all font-bold shadow-[0_0_20px_rgba(212,175,55,0.5)]">Claim Offer</button>
          </div>

          {/* VIP */}
          <div className="glass-panel bg-white/5 border border-white/10 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-2">Elite Group</h3>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">₹2990</span>
              <span className="text-white/50">/ month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex text-white/70"><Check className="text-snookerGreen mr-3" size={20} /> Private Snooker Room</li>
              <li className="flex text-white/70"><Check className="text-snookerGreen mr-3" size={20} /> Priority Booking 24/7</li>
              <li className="flex text-white/70"><Check className="text-snookerGreen mr-3" size={20} /> Personal Locker</li>
            </ul>
            <button onClick={() => handlePurchase('Elite')} className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors font-semibold">Contact VIP Services</button>
          </div>
        </div>
      </div>
    </section>
  );
}
