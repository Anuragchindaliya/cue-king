'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type SoundContextType = {
  volume: number;
  setVolume: (v: number) => void;
};

const SoundContext = createContext<SoundContextType>({ volume: 0.6, setVolume: () => {} });

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolumeState] = useState(0.6);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cue-king-volume');
      if (saved !== null) {
        setVolumeState(parseFloat(saved));
      }
    } catch(e) {}
  }, []);

  const setVolume = (v: number) => {
    setVolumeState(v);
    try {
      localStorage.setItem('cue-king-volume', v.toString());
    } catch(e) {}
  };

  return (
    <SoundContext.Provider value={{ volume, setVolume }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSoundContext = () => useContext(SoundContext);
