import { Hero } from '@/components/Hero';
import { TableGrid } from '@/components/TableGrid';
import { Leaderboard } from '@/components/Leaderboard';
import { Gallery } from '@/components/Gallery';
import { Pricing } from '@/components/Pricing';
import { Shop } from '@/components/Shop';
import { GamingFacility } from '@/components/GamingFacility';
import { Location } from '@/components/Location';
import { Tournaments } from '@/components/Tournaments';

// This is fully server rendered. 
// Animations and interactivities are isolated in the Client Components correctly.
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <Gallery />
      
      <div className="relative z-10 bg-black/40 backdrop-blur-sm border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <Pricing />
        <TableGrid />
        <Leaderboard />
        <Tournaments />
      </div>
      
      <Shop />
      <GamingFacility />
      <Location />

      {/* Footer minimal representation */}
      <footer className="py-8 text-center text-white/40 text-sm border-t border-white/10 mt-auto bg-black/80 flex flex-col items-center gap-2">
        <p>&copy; {new Date().getFullYear()} Cue King Snooker. All rights reserved. Created by <a href="https://www.linkedin.com/in/anurag-chindaliya/" target="_blank" rel="noopener noreferrer" className="text-snookerGreen hover:text-goldAccent transition-colors font-medium">Anurag Chindaliya</a></p>
      </footer>
    </div>
  );
}
