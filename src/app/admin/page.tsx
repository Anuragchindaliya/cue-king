'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Store, Calendar, TrendingUp, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';

interface MetricData {
  totalUsers: number;
  totalClubs: number;
  totalBookings: number;
  totalRevenue: number;
  pendingClubs: number;
  recentBookings: Array<{
    id: string;
    totalPrice: number;
    createdAt: string;
    user: { name: string | null; email: string };
    club: { name: string };
  }>;
}

interface AdminClub {
  id: string;
  name: string;
  coverImage: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  owner: { id: string; name: string | null; email: string };
  _count: { tables: number };
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: 'PLAYER' | 'CLUB_OWNER' | 'ADMIN';
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, initialize, token, user } = useAuthStore();
  const { showToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'clubs' | 'users'>('metrics');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login?returnUrl=/admin');
    }
  }, [isMounted, isAuthenticated, user, router]);

  // Query platform metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<MetricData>({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token && user?.role === 'ADMIN',
  });

  // Query admin clubs
  const { data: clubs = [], isLoading: isLoadingClubs } = useQuery<AdminClub[]>({
    queryKey: ['admin-clubs'],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/clubs`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token && user?.role === 'ADMIN' && activeTab === 'clubs',
  });

  // Query admin users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<AdminUser[]>({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const url = searchQuery
        ? `${API_BASE_URL}/api/admin/users?search=${encodeURIComponent(searchQuery)}`
        : `${API_BASE_URL}/api/admin/users`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token && user?.role === 'ADMIN' && activeTab === 'users',
  });

  // Mutation: Approve/Reject club status
  const updateClubStatusMutation = useMutation({
    mutationFn: async ({ clubId, status }: { clubId: string; status: 'APPROVED' | 'REJECTED' }) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/clubs/${clubId}/status`, {
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
    onSuccess: (updatedClub) => {
      // Update clubs list
      queryClient.setQueryData<AdminClub[]>(['admin-clubs'], (prev) => {
        if (!prev) return [];
        return prev.map((c) => (c.id === updatedClub.id ? { ...c, status: updatedClub.status } : c));
      });
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      showToast(`Club status updated to ${updatedClub.status}`);
    },
    onError: (err: any) => {
      showToast(`Action failed: ${err.message}`);
    },
  });

  if (!isMounted || !isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Widget */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-3">
              <Shield className="w-8 h-8 text-snookerGreen" />
              Platform Administrator
            </h1>
            <p className="text-gray-400 mt-1">Manage partner club approvals, track overall statistics and audit user accounts.</p>
          </div>
          
          <div className="flex bg-[#111] p-1 border border-white/15 rounded-xl text-xs font-bold shrink-0">
            {[
              { id: 'metrics' as const, label: 'Overview' },
              { id: 'clubs' as const, label: 'Clubs Approval' },
              { id: 'users' as const, label: 'User Directory' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4.5 py-2.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-snookerGreen text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'metrics' && (
          <div className="space-y-8">
            {isLoadingMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-28 bg-white/5 border border-white/10 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total Registered Players', value: metrics?.totalUsers, icon: <Users className="text-sky-400" /> },
                  { title: 'Active Partner Clubs', value: metrics?.totalClubs, icon: <Store className="text-snookerGreen" /> },
                  { title: 'Completed Sessions', value: metrics?.totalBookings, icon: <Calendar className="text-indigo-400" /> },
                  { title: 'Cumulative Platform Revenue', value: `₹${metrics?.totalRevenue.toLocaleString()}`, icon: <TrendingUp className="text-goldAccent" /> },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between backdrop-blur-md">
                    <div>
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">{stat.title}</span>
                      <h3 className="text-3xl font-extrabold text-white">{stat.value}</h3>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl">{stat.icon}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Bookings Feed */}
              <div className="lg:col-span-2 bg-[#111] border border-white/10 p-6 md:p-8 rounded-2xl space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 border-b border-white/10 pb-4">
                  <Calendar className="w-5 h-5 text-snookerGreen" />
                  Recent Booking Feed
                </h3>
                {isLoadingMetrics ? (
                  <div className="h-48 bg-white/5 animate-pulse rounded-xl" />
                ) : metrics?.recentBookings.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-10">No recent reservations recorded.</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {metrics?.recentBookings.map((b) => (
                      <div key={b.id} className="py-4 flex justify-between items-center text-sm first:pt-0 last:pb-0">
                        <div className="space-y-1">
                          <h4 className="font-bold text-white">{b.user.name || b.user.email}</h4>
                          <p className="text-xs text-gray-400">
                            Booked slot at <span className="text-snookerGreen font-semibold">{b.club.name}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-goldAccent font-extrabold block">₹{b.totalPrice}</span>
                          <span className="text-[10px] text-gray-500 block">
                            {new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Approvals quick look */}
              <div className="lg:col-span-1 bg-[#111] border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col justify-between">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2 border-b border-white/10 pb-4">
                    <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                    Approval Pipeline
                  </h3>
                  <div className="text-center py-6">
                    <h4 className="text-4xl font-extrabold text-white">{metrics?.pendingClubs || 0}</h4>
                    <p className="text-xs text-gray-400 mt-2">Partner clubs awaiting dashboard approval</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('clubs')}
                  className="w-full mt-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-sm transition-all text-center"
                >
                  Manage Approvals &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clubs' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold border-b border-white/10 pb-4">Club Partner Applications</h3>

            {isLoadingClubs ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="h-24 bg-white/5 rounded-xl border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : clubs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-10">No clubs registered on the platform.</p>
            ) : (
              <div className="space-y-4">
                {clubs.map((club) => (
                  <div key={club.id} className="bg-black/50 border border-white/5 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-extrabold text-white text-md flex items-center gap-2">
                        {club.name}
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          club.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          club.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {club.status}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Owner: <span className="text-snookerGreen">{club.owner.name || club.owner.email}</span> • {club._count.tables} Tables
                      </p>
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        Registered {new Date(club.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {club.status === 'PENDING' && (
                      <div className="flex gap-2 text-xs font-bold">
                        <button
                          onClick={() => updateClubStatusMutation.mutate({ clubId: club.id, status: 'APPROVED' })}
                          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => updateClubStatusMutation.mutate({ clubId: club.id, status: 'REJECTED' })}
                          className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold">User Directory Audit</h3>
              
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-snookerGreen"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoadingUsers ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-white/5 rounded-xl border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-10">No users match your query search.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {users.map((item) => (
                  <div key={item.id} className="py-4 flex justify-between items-center text-sm first:pt-0 last:pb-0">
                    <div>
                      <h4 className="font-bold text-white">{item.name || 'Anonymous User'}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{item.email}</p>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        item.role === 'CLUB_OWNER' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {item.role === 'CLUB_OWNER' ? 'Owner' : item.role}
                      </span>
                      <span className="text-[10px] text-gray-500 block mt-1">
                        Joined {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
