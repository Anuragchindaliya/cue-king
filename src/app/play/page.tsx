import { GameCanvas } from '@/components/poolGame/GameCanvas';

export const metadata = {
  title: 'Play | Cue King Snooker',
  description: 'Play our 60FPS physics-based 8-Ball pool directly in your browser.'
};

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20 relative overflow-hidden flex flex-col items-center">
      {/* Background Decorators */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-snookerGreen/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-blue-900/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none -z-10" />

      <div className="w-full px-4 sm:px-6 lg:px-8 z-10 flex-1 flex flex-col justify-center">
         <GameCanvas />
         
         <div className="mt-16 max-w-3xl mx-auto text-center space-y-4 text-white/60 text-sm glass-panel p-8 rounded-3xl border border-white/5">
             <h3 className="text-white font-bold text-lg mb-2">Controls & Physics</h3>
             <p>Our simulation applies real-world vector mathematics, including elastic collisions, angular momentum redirection mapping, and mass-based inertia damping.</p>
             <p><strong>Mobile Friendly:</strong> Supports full touch interactions. Just swipe backward horizontally or vertically from the white cue ball. Maximize distance dragged to maximize velocity.</p>
         </div>
      </div>
    </div>
  );
}
