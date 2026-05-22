'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Store, ClipboardList, TrendingUp, Check, X, ShieldAlert, BookOpen, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';
type ApiResponse = {
  data: Club[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface Club {
  coverImage: string | null;
  description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  id: string;
  name: string;
  rating: number;
  interiorImages: string[];
  amenities: string[];
  fullAddress: string;
  cancellationPolicy: null;
  reschedulingPolicy: null;
  lat: null;
  lng: null;
  openingTime: string;
  closingTime: string;
  ownerId: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
  location: {
    id: string;
    city: string;
    area: string;
    createdAt: string;
    updatedAt: string;
  };
  tables: {
    id: string;
    name: string;
    type: string;
    pricePerHour: number;
    status: string;
    clubId: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED';
  totalPrice: number;
  user: {
    name: string | null;
    email: string;
  };
  club: {
    name: string;
  };
  table: {
    name: string;
  };
}

export default function OwnerDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, initialize, token, user } = useAuthStore();
  const { showToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && (!isAuthenticated || user?.role !== 'CLUB_OWNER')) {
      router.push('/login?returnUrl=/owner/dashboard');
    }
  }, [isMounted, isAuthenticated, user, router]);

  // Query owner clubs
  const { data: clubs = { data: [] }, isLoading: isLoadingClubs } = useQuery<ApiResponse>({
    queryKey: ['my-clubs'],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/clubs/my-clubs`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token,
  });

  // Query owner bookings
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<Booking[]>({
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
    enabled: !!token,
  });

  // Update status mutation (quick actions on dashboard)
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
      showToast(`Booking marked as ${updatedBooking.status}`);
    },
    onError: (err: any) => {
      showToast(`Error: ${err.message}`);
    },
  });

  if (!isMounted || !isAuthenticated || user?.role !== 'CLUB_OWNER') return null;

  const clubsList = clubs;

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');

  const totalEarnings = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // SVG Chart data
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mockUtilization = [45, 60, 55, 70, 85, 95, 90]; // Percentages

  console.log("🚀 ~ OwnerDashboard ~ clubsList:", clubsList)
  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header Widget */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-snookerGreen" />
              Club Partner Portal
            </h1>
            <p className="text-gray-400 mt-1">Welcome back, manage your clubs and reservations live.</p>
          </div>
          <Link
            href="/owner/club/new"
            className="px-5 py-3 rounded-xl bg-snookerGreen hover:bg-snookerGreen/90 text-white font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] text-sm flex items-center gap-2 self-start sm:self-auto"
          >
            + Register New Club
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Registered Venues',
              value: clubsList.data.length,
              icon: <Store className="w-6 h-6 text-sky-400" />,
              bg: 'from-sky-500/10 to-transparent border-sky-500/10',
            },
            {
              title: 'Pending Approvals',
              value: pendingBookings.length,
              icon: <ClipboardList className="w-6 h-6 text-amber-400 animate-bounce" />,
              bg: 'from-amber-500/10 to-transparent border-amber-500/10',
              link: '/owner/bookings',
            },
            {
              title: 'Successful Games',
              value: completedBookings.length + confirmedBookings.length,
              icon: <Check className="w-6 h-6 text-emerald-400" />,
              bg: 'from-emerald-500/10 to-transparent border-emerald-500/10',
            },
            {
              title: 'Est. Earnings',
              value: `₹${totalEarnings.toLocaleString()}`,
              icon: <TrendingUp className="w-6 h-6 text-goldAccent" />,
              bg: 'from-yellow-500/10 to-transparent border-yellow-500/10',
            },
          ].map((stat, idx) => {
            const ContentWrapper = stat.link ? Link : 'div';
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className={`bg-gradient-to-br ${stat.bg} bg-zinc-900/40 border rounded-2xl p-6 flex items-center justify-between shadow-lg backdrop-blur-md cursor-pointer`}
              >
                {/* @ts-ignore */}
                <ContentWrapper href={stat.link || null} className="w-full flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase font-semibold">{stat.title}</span>
                    <h3 className="text-3xl font-extrabold text-white">{stat.value}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">{stat.icon}</div>
                </ContentWrapper>
              </motion.div>
            );
          })}
        </div>

        {/* Dashboard Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Clubs List & Utilization */}
          <div className="lg:col-span-2 space-y-8">
            {/* Clubs list */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Store className="w-5 h-5 text-snookerGreen" />
                My Snooker Clubs
              </h3>

              {isLoadingClubs ? (
                <div className="h-40 bg-white/5 animate-pulse rounded-xl" />
              ) : clubsList.data.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  You have not registered any clubs yet. Click "Register New Club" to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clubsList.data.map((club) => (
                    <div key={club.id} className="bg-black/50 border border-white/5 rounded-xl p-5 hover:border-snookerGreen/20 transition-all flex flex-col justify-between">
                      <div>
                        {club.coverImage ? (
                          <div className="h-28 w-full bg-cover bg-center rounded-lg mb-4" style={{ backgroundImage: `url('${club.coverImage}')` }} />
                        ) : (
                          <div className="h-28 w-full rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-600 font-bold mb-4">No Image</div>
                        )}
                        <h4 className="font-bold text-white text-lg line-clamp-1">{club.name}</h4>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{club.description || 'No description provided'}</p>

                        <div className="mt-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${club.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            club.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                            {club.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6 border-t border-white/5 pt-4 text-xs font-bold">
                        <Link href={`/owner/club/${club.id}/edit`} className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-center text-gray-300 hover:text-white transition-all">
                          Edit Club
                        </Link>
                        <Link href={`/owner/club/${club.id}/tables`} className="flex-1 py-2 rounded-lg bg-snookerGreen hover:bg-snookerGreen/90 text-center text-white transition-all shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                          Manage Tables
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Utilization Chart */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-snookerGreen" />
                Weekly Club Utilization Rate (%)
              </h3>

              <div className="pt-4 flex flex-col items-center">
                <div className="flex items-end justify-between w-full h-44 gap-4 px-2">
                  {mockUtilization.map((rate, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="text-xs text-gray-400 font-bold">{rate}%</div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${rate}%` }}
                        className="w-full bg-gradient-to-t from-snookerGreen to-emerald-400 rounded-t-lg shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                      />
                      <div className="text-xs text-gray-500 font-bold">{weekDays[idx]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Booking Requests */}
          <div className="lg:col-span-1">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center justify-between text-white border-b border-white/10 pb-4">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-snookerGreen" />
                    Booking Requests
                  </span>
                  <Link href="/owner/bookings" className="text-xs text-snookerGreen hover:underline font-bold">
                    View All &rarr;
                  </Link>
                </h3>

                {isLoadingBookings ? (
                  <div className="space-y-4 mt-6">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-20 bg-white/5 rounded-xl border border-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : pendingBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <BookOpen className="w-10 h-10 text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm font-semibold">No pending requests</p>
                    <p className="text-gray-500 text-xs mt-1">All reservation requests have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4 mt-6">
                    {pendingBookings.slice(0, 4).map((booking) => (
                      <div key={booking.id} className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-sm line-clamp-1">{booking.user.name || booking.user.email}</h4>
                            <p className="text-xs text-snookerGreen font-semibold mt-0.5">{booking.table.name}</p>
                          </div>
                          <span className="text-goldAccent font-extrabold text-xs">₹{booking.totalPrice}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                          • {new Date(booking.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>

                        <div className="flex gap-2.5 pt-1">
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'CONFIRMED' })}
                            disabled={updateStatusMutation.isPending}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs transition-colors flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'REJECTED' })}
                            disabled={updateStatusMutation.isPending}
                            className="flex-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-extrabold text-xs transition-colors flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-white/5 pt-6">
                <Link
                  href="/owner/bookings"
                  className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4 text-goldAccent" />
                  Configure Active Bookings
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
