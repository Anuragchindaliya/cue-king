'use client';
import { useCallback } from 'react';
import { useSoundContext } from '@/components/SoundProvider';

export function useHitSound() {
  const { volume } = useSoundContext();

  const playSound = useCallback(() => {
    if (volume <= 0) return;
    try {
      const audio = new Audio('/sounds/ball-hit.mp3');
      audio.volume = volume;
      audio.play().catch(e => {
        // Autoplay might be blocked if user hasn't interacted yet
      });
    } catch (e) {
      // Ignore
    }
  }, [volume]);

  return playSound;
}
