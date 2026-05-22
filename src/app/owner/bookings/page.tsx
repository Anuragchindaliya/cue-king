'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, User, Clock, CheckCircle, XCircle, Ban, RefreshCw, Filter, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/providers/SocketProvider';
import { useToast } from '@/components/ToastProvider';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED';
  totalPrice: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  club: {
    id: string;
    name: string;
  };
  table: {
    id: string;
    name: string;
    type: 'SNOOKER' | 'EIGHT_BALL_POOL';
  };
}

export default function OwnerBookingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, initialize, token, user } = useAuthStore();
  const { socket } = useSocket();
  const { showToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'>('ALL');

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && (!isAuthenticated || user?.role !== 'CLUB_OWNER')) {
      router.push('/login?returnUrl=/owner/bookings');
    }
  }, [isMounted, isAuthenticated, user, router]);

  // Query owner bookings
  const { data: bookings = [], isLoading, refetch } = useQuery<Booking[]>({
    queryKey: ['owner-bookings'],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/bookings/owner-bookings`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token && user?.role === 'CLUB_OWNER',
  });

  // Socket listener for real-time booking updates
  useEffect(() => {
    if (!socket) return;

    const handleBookingUpdated = (updatedBooking: Booking) => {
      queryClient.setQueryData<Booking[]>(['owner-bookings'], (prev) => {
        if (!prev) return [updatedBooking];
        // If it's already in list, update it. Otherwise, prepend it if it belongs to one of owner's clubs
        if (prev.some((b) => b.id === updatedBooking.id)) {
          return prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
        }
        return [updatedBooking, ...prev];
      });
      showToast(`Booking for ${updatedBooking.user.name || updatedBooking.user.email} updated to ${updatedBooking.status}`);
    };

    const handleBookingCancelled = (cancelledBooking: Booking) => {
      queryClient.setQueryData<Booking[]>(['owner-bookings'], (prev) => {
        if (!prev) return [];
        return prev.map((b) => (b.id === cancelledBooking.id ? cancelledBooking : b));
      });
      showToast(`Alert: Player cancelled booking at ${cancelledBooking.club.name}`);
    };

    socket.on('booking-updated', handleBookingUpdated);
    socket.on('booking-cancelled', handleBookingCancelled);

    return () => {
      socket.off('booking-updated', handleBookingUpdated);
      socket.off('booking-cancelled', handleBookingCancelled);
    };
  }, [socket, queryClient, showToast]);

  // Mutation: update status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Booking['status'] }) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenVal}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData<Booking[]>(['owner-bookings'], (prev) => {
        if (!prev) return [];
        return prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
      });
      showToast(`Booking successfully marked as ${updatedBooking.status}`);
    },
    onError: (err: any) => {
      showToast(`Action failed: ${err.message}`);
    },
  });

  if (!isMounted || !isAuthenticated || user?.role !== 'CLUB_OWNER') return null;

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'CONFIRMED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'COMPLETED':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'REJECTED':
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/15 pb-6">
          <div>
            <Link href="/owner/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors mb-2 inline-block">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-3">
              <Calendar className="w-8 h-8 text-snookerGreen" />
              Manage Bookings
            </h1>
            <p className="text-gray-400 mt-1">
              Approve pending slot reservations and manage live table allocations.
            </p>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={() => refetch()}
              className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 mb-8 bg-[#111] p-2 rounded-2xl border border-white/5 w-fit">
          {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === status
                  ? 'bg-snookerGreen text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-32 bg-white/5 rounded-2xl border border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">No Bookings Found</h3>
            <p className="text-gray-400 max-w-sm mx-auto mt-2 text-sm">
              No reservation entries match the status tab: <span className="text-snookerGreen font-bold">{filter}</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {filteredBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-snookerGreen/20 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
                    {/* Club & Table Details */}
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">
                        Venue & Allocation
                      </span>
                      <h4 className="font-bold text-white text-lg">{booking.club.name}</h4>
                      <p className="text-snookerGreen text-sm font-semibold mt-1">
                        {booking.table.name} ({booking.table.type === 'SNOOKER' ? 'Snooker' : 'Pool'})
                      </p>
                    </div>

                    {/* Schedule Details */}
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">
                        Reserved Hours
                      </span>
                      <div className="flex items-center gap-2 text-gray-300 font-medium text-sm">
                        <Clock className="w-4 h-4 text-goldAccent shrink-0" />
                        <span>
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 block mt-1">
                        {new Date(booking.startTime).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    </div>

                    {/* Customer & Earnings */}
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">
                        Player & Total
                      </span>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <User className="w-4 h-4 text-snookerGreen" />
                        <span className="font-semibold line-clamp-1">
                          {booking.user.name || booking.user.email}
                        </span>
                      </div>
                      <span className="text-goldAccent font-extrabold text-sm block mt-1">
                        ₹{booking.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5">
                    {/* Status Badge */}
                    <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </div>

                    {/* Quick Action Controls */}
                    {booking.status === 'PENDING' && (
                      <div className="flex items-center gap-2 mt-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            updateStatusMutation.mutate({ id: booking.id, status: 'CONFIRMED' })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            updateStatusMutation.mutate({ id: booking.id, status: 'REJECTED' })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-extrabold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </motion.button>
                      </div>
                    )}

                    {booking.status === 'CONFIRMED' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          updateStatusMutation.mutate({ id: booking.id, status: 'COMPLETED' })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Mark Complete
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
