'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/components/ToastProvider';

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

    socketInstance.on('new-notification', (notif: { title: string; message: string }) => {
      showToast(`${notif.title}: ${notif.message}`);
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
