'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, User as UserIcon } from 'lucide-react';


interface Booking {
  id: string;
  club: { name: string };
  user: { name: string; email: string };
  tableCategory: { name: string };
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED';
}

export default function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/owner-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching owner bookings:', error);
      alert('Failed to fetch booking requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBookings();
  }, [token]);

  const updateStatus = async (id: string, status: 'CONFIRMED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Booking ${status.toLowerCase()} successfully`);
        fetchBookings();
      } else {
        alert(data.message || `Failed to ${status.toLowerCase()} booking`);
      }
    } catch (error) {
      console.error(`Error updating booking status:`, error);
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
          <h2 className="text-2xl font-bold text-white">Booking Requests</h2>
          <p className="text-zinc-400">Manage incoming reservations for your clubs</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-black/20 rounded-2xl border border-zinc-800/50">
          <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-300">No requests yet</h3>
          <p className="text-zinc-500 mt-2">Incoming booking requests will appear here.</p>
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
                className="bg-black/40 border border-zinc-800/50 p-6 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:bg-black/60 transition-colors"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{booking.user.name || 'Player'}</h3>
                        <p className="text-xs text-zinc-500">{booking.user.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Club & Table</p>
                      <p className="font-medium text-zinc-300">{booking.club.name}</p>
                      <p className="text-sm text-green-400 mt-0.5">{booking.tableCategory.name}</p>
                    </div>

                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Date & Time</p>
                      <p className="font-medium text-zinc-300">{new Date(booking.startTime).toLocaleDateString()}</p>
                      <p className="text-sm text-zinc-400 mt-0.5">
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {booking.status === 'PENDING' && (
                  <div className="flex flex-col sm:flex-row gap-3 xl:flex-col xl:min-w-[140px]">
                    <button
                      onClick={() => updateStatus(booking.id, 'CONFIRMED')}
                      className="flex-1 px-4 py-3 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(booking.id, 'REJECTED')}
                      className="flex-1 px-4 py-3 bg-red-500/10 text-red-500 font-medium rounded-xl hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
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
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
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
