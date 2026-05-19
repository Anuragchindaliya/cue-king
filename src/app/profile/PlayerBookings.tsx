'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';


interface Booking {
  id: string;
  club: { name: string };
  tableCategory: { name: string };
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED';
}

export default function PlayerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBookings();
  }, [token]);

  const handleWithdraw = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Booking withdrawn successfully');
        fetchBookings();
      } else {
        alert(data.message || 'Failed to withdraw booking');
      }
    } catch (error) {
      console.error('Error withdrawing booking:', error);
      alert('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">My Bookings</h2>
          <p className="text-zinc-400">View and manage your table reservations</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-black/20 rounded-2xl border border-zinc-800/50">
          <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-300">No bookings yet</h3>
          <p className="text-zinc-500 mt-2">When you book a table, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {bookings.map((booking) => (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-black/40 border border-zinc-800/50 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-black/60 transition-colors"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between md:justify-start gap-4">
                    <h3 className="text-xl font-bold text-white">{booking.club.name}</h3>
                    <StatusBadge status={booking.status} />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-zinc-400">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-zinc-900 rounded-lg">
                        <Calendar className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="font-medium">
                        {new Date(booking.startTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="hidden sm:block text-zinc-600">•</div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-zinc-900 rounded-lg">
                        <Clock className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="font-medium">
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="inline-block px-3 py-1 bg-zinc-800/50 rounded-lg text-sm text-zinc-300 border border-zinc-700/50 mt-2">
                    {booking.tableCategory.name}
                  </div>
                </div>

                {booking.status === 'PENDING' && (
                  <button
                    onClick={() => handleWithdraw(booking.id)}
                    className="w-full md:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20 font-medium whitespace-nowrap"
                  >
                    Withdraw
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'PENDING': return <Clock className="w-3.5 h-3.5" />;
      case 'CANCELLED': 
      case 'REJECTED': return <XCircle className="w-3.5 h-3.5" />;
      default: return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${getStyles()}`}>
      {getIcon()}
      {status}
    </div>
  );
}
