'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Search, DollarSign, Calendar, Star, HelpCircle, Activity, ArrowLeft, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';

interface PlayerListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: 'REGISTERED' | 'WALK_IN';
}

interface PlayerMetrics {
  name: string;
  email: string;
  phone: string;
  metrics: {
    totalSpend: number;
    frequency: number;
    preferredTable: string;
  };
  history: {
    id: string;
    type: 'BOOKING' | 'WALK_IN_TIMER';
    date: string;
    tableName: string;
    clubName: string;
    amount: number;
    status: string;
  }[];
}

export default function CRMPage() {
  const router = useRouter();
  const { isAuthenticated, initialize, token, user } = useAuthStore();
  const { showToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  // Search input query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected customer for metrics details
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerType, setSelectedPlayerType] = useState<'REGISTERED' | 'WALK_IN' | null>(null);
  const [selectedPlayerEmail, setSelectedPlayerEmail] = useState<string | null>(null);
  const [selectedPlayerPhone, setSelectedPlayerPhone] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && (!isAuthenticated || user?.role !== 'CLUB_OWNER')) {
      router.push('/login?returnUrl=/owner/crm');
    }
  }, [isMounted, isAuthenticated, user, router]);

  // Query customers (calls backend filter: if no query, returns previously entered)
  const { data: players = [], isLoading: isLoadingPlayers, refetch: refetchPlayers } = useQuery<PlayerListItem[]>({
    queryKey: ['crm-players-list', searchQuery],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/crm/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${tokenVal}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data || [];
    },
    enabled: !!token
  });

  // Query single customer metrics
  const { data: playerDetail = null, isLoading: isLoadingDetail } = useQuery<PlayerMetrics>({
    queryKey: ['crm-player-metrics', selectedPlayerId, selectedPlayerType],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const params = new URLSearchParams({
        type: selectedPlayerType || '',
        email: selectedPlayerEmail || '',
        phone: selectedPlayerPhone || ''
      });
      const res = await fetch(`${API_BASE_URL}/api/crm/${selectedPlayerId}/metrics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${tokenVal}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!selectedPlayerId && !!token
  });

  if (!isMounted || !isAuthenticated || user?.role !== 'CLUB_OWNER') return null;

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,100,255,0.02),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
              <User className="w-8 h-8 text-sky-400" />
              CRM Customer Lookup
            </h1>
            <p className="text-zinc-400 text-sm">
              Search regular players, track lifetime spending, visit counts, and table preferences.
            </p>
          </div>
          <button
            onClick={() => refetchPlayers()}
            className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-2 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Customers List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-base text-white">Search Customers</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-850 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white outline-none focus:border-sky-400 transition-all"
                />
              </div>

              <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 px-1">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Showing players who previously booked or walked in at your clubs.</span>
              </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
              {isLoadingPlayers ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-white/5 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-20 px-4 text-zinc-500 text-sm">
                  No customers found. Previously entered players will appear here.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {players.map((player) => {
                    const isSelected = selectedPlayerId === player.id;
                    return (
                      <button
                        key={player.id}
                        onClick={() => {
                          setSelectedPlayerId(player.id);
                          setSelectedPlayerType(player.type);
                          setSelectedPlayerEmail(player.email);
                          setSelectedPlayerPhone(player.phone);
                        }}
                        className={`w-full text-left p-5 transition-all flex justify-between items-center ${
                          isSelected ? 'bg-sky-500/5 text-white' : 'hover:bg-white/2 text-zinc-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm truncate max-w-[180px]">{player.name}</h4>
                          <p className="text-[10px] text-zinc-500 truncate max-w-[180px]">
                            {player.phone || player.email || 'No contact details'}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                            player.type === 'REGISTERED' 
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {player.type === 'REGISTERED' ? 'App User' : 'Walk-in'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customer metrics details */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!selectedPlayerId ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#111] border border-white/10 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[400px]"
                >
                  <User className="w-12 h-12 text-zinc-700 mb-4" />
                  <h3 className="text-zinc-400 font-bold">No Customer Selected</h3>
                  <p className="text-zinc-600 text-xs mt-1">Select a customer from the left to view lifetime spend, history, and preferred tables.</p>
                </motion.div>
              ) : isLoadingDetail ? (
                <div className="bg-[#111] border border-white/10 rounded-2xl p-8 space-y-6 h-64 animate-pulse" />
              ) : playerDetail ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="space-y-6"
                >
                  {/* Customer Card */}
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full flex items-center justify-center">
                        <User className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-white">{playerDetail.name}</h2>
                        <div className="text-xs text-zinc-500 flex flex-wrap gap-x-3 gap-y-1 mt-1 font-mono">
                          <span>Email: {playerDetail.email}</span>
                          <span>•</span>
                          <span>Phone: {playerDetail.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* High-level Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        title: 'Lifetime spend',
                        value: `₹${playerDetail.metrics.totalSpend.toLocaleString()}`,
                        icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
                        bg: 'from-emerald-500/5 to-transparent border-emerald-500/10'
                      },
                      {
                        title: 'Visit frequency',
                        value: `${playerDetail.metrics.frequency} times`,
                        icon: <Calendar className="w-5 h-5 text-sky-400" />,
                        bg: 'from-sky-500/5 to-transparent border-sky-500/10'
                      },
                      {
                        title: 'Preferred Table',
                        value: playerDetail.metrics.preferredTable,
                        icon: <Star className="w-5 h-5 text-amber-400" />,
                        bg: 'from-amber-500/5 to-transparent border-amber-500/10'
                      }
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className={`bg-gradient-to-br ${stat.bg} bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-lg`}
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 uppercase font-semibold">{stat.title}</span>
                          <h4 className="text-lg font-extrabold text-white">{stat.value}</h4>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">{stat.icon}</div>
                      </div>
                    ))}
                  </div>

                  {/* Customer History Log */}
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                    <h3 className="text-base font-bold flex items-center gap-2 text-white">
                      <Activity className="w-5 h-5 text-sky-400" />
                      Session History Timeline
                    </h3>

                    {playerDetail.history.length === 0 ? (
                      <p className="text-zinc-500 text-xs py-8 text-center italic">No logs recorded for this customer.</p>
                    ) : (
                      <div className="relative border-l border-zinc-800 pl-4 space-y-6 ml-2 pt-2">
                        {playerDetail.history.map((item, idx) => (
                          <div key={idx} className="relative">
                            {/* Bullet dot */}
                            <span className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-900 z-10" />

                            <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-200">
                                    {item.type === 'BOOKING' ? 'Remote Advance Reservation' : 'Club Desk Walk-in'}
                                  </h4>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">
                                    {item.clubName} • {item.tableName}
                                  </p>
                                </div>
                                <span className="font-extrabold font-mono text-xs text-sky-400">
                                  ₹{item.amount}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-zinc-600 pt-1">
                                <span>{new Date(item.date).toLocaleString()}</span>
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                  item.status === 'COMPLETED' || item.status === 'PAID' || item.status === 'CONFIRMED'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.063 1.063l-.042.02a.75.75 0 0 1-1.063-1.063ZM12 20.25a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5Z" />
    </svg>
  );
}
