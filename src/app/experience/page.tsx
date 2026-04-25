import { PoolScrollExperience } from '@/components/PoolScrollExperience';
import { ExperienceFeatures } from '@/components/ExperienceFeatures';
import { ExperienceCTA } from '@/components/ExperienceCTA';
import { Gallery } from '@/components/Gallery';

export const metadata = {
  title: 'Cinematic Experience | Cue Arena',
  description: 'A premium, fully immersive snooker experience.'
};

export default function ExperiencePage() {
  return (
    <div className="bg-black text-white relative w-full">
      {/* Hero Overlay (integrates natively with the top of scroll sequence) */}
      <div className="absolute top-0 left-0 w-full h-screen flex flex-col items-center justify-center z-10 pointer-events-none px-4">
         <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 tracking-tight text-center drop-shadow-2xl">
           Where Every Shot <br/> <span className="text-snookerGreen">Feels Legendary 🎯</span>
         </h1>
         <p className="mt-6 text-xl md:text-2xl text-white/50 max-w-2xl text-center drop-shadow-lg">
           Scroll down to immerse yourself in the premium snooker experience.
         </p>
         <div className="mt-16 w-1 h-32 bg-linear-to-b from-snookerGreen via-snookerGreen/50 to-transparent animate-[pulse_2s_ease-in-out_infinite]" />
      </div>

      <PoolScrollExperience />
      
      <ExperienceFeatures />
      
      <div className="bg-black relative z-20">
        <Gallery />
      </div>

      <ExperienceCTA />
    </div>
  );
}
