'use client';
import { useCallback } from 'react';

export function useHitSound() {
  const playSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/ball-hit.mp3');
      audio.volume = 0.6;
      audio.play().catch(e => {
        // Autoplay might be blocked if user hasn't interacted yet
        console.log('Audio playback blocked pending user interaction');
      });
    } catch (e) {
      // Ignore
    }
  }, []);

  return playSound;
}
