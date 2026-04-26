'use client';
import { useSoundContext } from '@/components/SoundProvider';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useState } from 'react';

export function VolumeControl() {
  const { volume, setVolume } = useSoundContext();
  const [isOpen, setIsOpen] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.6);

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.6);
    }
  };

  let Icon = Volume2;
  if (volume === 0) Icon = VolumeX;
  else if (volume < 0.5) Icon = Volume1;

  return (
    <div
      className="fixed bottom-24  z-50 flex items-center gap-3 transition-all duration-300 pointer-events-auto"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        className={`bg-black/80 backdrop-blur-md border border-white/10 rounded-full h-12 flex items-center px-4 overflow-hidden transition-all duration-300 ease-out origin-left ${isOpen ? 'w-32 opacity-100 shadow-[0_0_15px_rgba(0,255,156,0.3)]' : 'w-0 opacity-0 px-0 border-transparent shadow-none'
          }`}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full accent-snookerGreen h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer outline-none"
        />
      </div>

      <button
        onClick={toggleMute}
        className="w-12 h-12 bg-black/80 hover:bg-snookerGreen/20 border border-white/10 hover:border-snookerGreen text-white rounded-full flex items-center justify-center transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md z-10"
        title="Volume Control"
      >
        <Icon size={20} className={volume > 0 ? "text-white drop-shadow-[0_0_5px_#00ff9c]" : "text-white/40"} />
      </button>
    </div>
  );
}
