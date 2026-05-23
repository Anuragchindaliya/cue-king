'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, XCircle, Calendar, ShieldAlert, Sparkles, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/providers/SocketProvider';

interface Notification {
  id: string;
  type: 'BOOKING_CREATED' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'BOOKING_CANCELLED' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, initialize, token } = useAuthStore();
  const { socket } = useSocket();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/login?returnUrl=/notifications');
    }
  }, [isMounted, isAuthenticated, router]);

  // Query notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token,
  });

  // Listen to socket event 'new-notification'
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif: Notification) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (prev) => {
        if (!prev) return [newNotif];
        // Avoid duplicate appends if we query again
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
    };

    socket.on('new-notification', handleNewNotification);
    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  // Mutation: mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (updatedNotif) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (prev) => {
        if (!prev) return [];
        return prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n));
      });
    },
  });

  // Mutation: mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(['notifications'], (prev) => {
        if (!prev) return [];
        return prev.map((n) => ({ ...n, isRead: true }));
      });
    },
  });

  if (!isMounted || !isAuthenticated) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotifStyles = (type: Notification['type']) => {
    switch (type) {
      case 'BOOKING_APPROVED':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
        };
      case 'BOOKING_REJECTED':
      case 'BOOKING_CANCELLED':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
          bgColor: 'bg-rose-500/10 border-rose-500/20',
        };
      case 'BOOKING_CREATED':
        return {
          icon: <Calendar className="w-5 h-5 text-sky-400" />,
          bgColor: 'bg-sky-500/10 border-sky-500/20',
        };
      case 'SYSTEM':
        return {
          icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
          bgColor: 'bg-amber-500/10 border-amber-500/20',
        };
      default:
        return {
          icon: <Bell className="w-5 h-5 text-gray-400" />,
          bgColor: 'bg-white/5 border-white/10',
        };
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-white/15 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-3">
              <Bell className="w-8 h-8 text-snookerGreen animate-pulse" />
              Notifications
            </h1>
            <p className="text-gray-400 mt-2">
              Stay updated with your real-time booking updates and announcements.
            </p>
          </div>

          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 hover:border-white/35 transition-all text-sm flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-goldAccent" />
              Mark all as read
            </motion.button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-24 bg-white/5 rounded-2xl border border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 border border-white/10 bg-white/5 rounded-3xl backdrop-blur-md"
          >
            <div className="w-16 h-16 rounded-full bg-snookerGreen/10 flex items-center justify-center text-snookerGreen mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-400 text-center max-w-sm">
              You do not have any notifications at the moment. Active bookings will post updates here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {notifications.map((notif) => {
                const styles = getNotifStyles(notif.type);
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0, margin: 0 }}
                    className={`flex items-start justify-between p-5 rounded-2xl border backdrop-blur-md transition-all ${styles.bgColor
                      } ${!notif.isRead ? 'shadow-[0_0_15px_rgba(34,197,94,0.05)] border-snookerGreen/20' : 'opacity-70'}`}
                  >
                    <div className="flex gap-4">
                      <div className="m-auto p-2 rounded-xl bg-black/40 border border-white/10 flex-shrink-0">
                        {styles.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-white flex items-center gap-2">
                          {notif.title}
                          {!notif.isRead && (
                            <span className="w-2.5 h-2.5 rounded-full bg-snookerGreen animate-pulse flex-shrink-0" />
                          )}
                        </h4>
                        <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
                          {notif.message}
                        </p>
                        <span className="text-xs text-gray-500 block pt-1">
                          {new Date(notif.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => markReadMutation.mutate(notif.id)}
                        disabled={markReadMutation.isPending}
                        className="p-1.5 rounded-full hover:bg-white/15 text-white/50 hover:text-white transition-colors"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4 text-snookerGreen" />
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
