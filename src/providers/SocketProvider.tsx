'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/components/ToastProvider';
import { useSSE } from '@/hooks/useSSE';
import { useSoundContext } from '@/components/SoundProvider';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinClubRoom: (clubId: string) => void;
  leaveClubRoom: (clubId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { showToast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const { volume } = useSoundContext();
  const queryClient = useQueryClient();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.load();
      audioRef.current = audio;

      const unlock = () => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              audioRef.current?.pause();
              if (audioRef.current) audioRef.current.currentTime = 0;
            })
            .catch(() => {});
        }
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };

      window.addEventListener('click', unlock);
      window.addEventListener('touchstart', unlock);
      window.addEventListener('keydown', unlock);

      return () => {
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
    }
  }, []);

  // Listen to Server-Sent Events (SSE) for notifications globally
  useSSE({
    url: isAuthenticated && token ? `${API_BASE_URL}/api/notifications/events` : '',
    token: token,
    events: {
      'new-notification': (notif: { title: string; message: string }) => {
        const displayMessage = notif.message.replace(/ \[\s*Room ID:\s*[a-f0-9\-]+\s*\]/gi, '');
        showToast(`${notif.title}: ${displayMessage}`);
        // Play notification sound
        try {
          if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => console.log('Audio play failed:', err));
          }
        } catch (e) {
          console.error(e);
        }
        // Invalidate notifications query to refresh counts/badges
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      }
    }
  });

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const socketInstance = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected successfully');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, isAuthenticated, showToast]);

  const joinClubRoom = (clubId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-club', clubId);
    }
  };

  const leaveClubRoom = (clubId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-club', clubId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinClubRoom, leaveClubRoom }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
