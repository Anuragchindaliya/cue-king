'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Settings, Trash2, ArrowLeft, Plus, CheckCircle, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';

interface Table {
  id: string;
  name: string;
  type: 'SNOOKER' | 'EIGHT_BALL_POOL';
  pricePerHour: number;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'UNAVAILABLE';
  clubId: string;
}

export default function ManageTablesPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;
  const queryClient = useQueryClient();
  const { isAuthenticated, initialize, token } = useAuthStore();
  const { showToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  // Form state for creating a new table
  const [tableName, setTableName] = useState('');
  const [tableType, setTableType] = useState<'SNOOKER' | 'EIGHT_BALL_POOL'>('SNOOKER');
  const [pricePerHour, setPricePerHour] = useState(250);

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push(`/login?returnUrl=/owner/club/${clubId}/tables`);
    }
  }, [isMounted, isAuthenticated, router, clubId]);

  // Query tables for the club
  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ['club-tables', clubId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/tables/club/${clubId}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tables');
      }
      return data.data;
    },
    enabled: !!clubId && !!token,
  });

  // Mutation: create table
  const addTableMutation = useMutation({
    mutationFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenVal}`,
        },
        body: JSON.stringify({
          name: tableName,
          type: tableType,
          pricePerHour: Number(pricePerHour),
          clubId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to add table');
      }
      return data.data;
    },
    onSuccess: (newTable) => {
      queryClient.setQueryData<Table[]>(['club-tables', clubId], (prev) => {
        if (!prev) return [newTable];
        return [...prev, newTable];
      });
      setTableName('');
      showToast(`Table "${newTable.name}" created successfully`);
    },
    onError: (err: any) => {
      showToast(`Error creating table: ${err.message}`);
    },
  });

  // Mutation: update table status or details
  const updateTableMutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Partial<Table> }) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/tables/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenVal}`,
        },
        body: JSON.stringify(fields),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update table');
      }
      return data.data;
    },
    onSuccess: (updatedTable) => {
      queryClient.setQueryData<Table[]>(['club-tables', clubId], (prev) => {
        if (!prev) return [];
        return prev.map((t) => (t.id === updatedTable.id ? updatedTable : t));
      });
      showToast(`Table "${updatedTable.name}" status updated to ${updatedTable.status}`);
    },
    onError: (err: any) => {
      showToast(`Update failed: ${err.message}`);
    },
  });

  // Mutation: delete table
  const deleteTableMutation = useMutation({
    mutationFn: async (id: string) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/tables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenVal}` },
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete table');
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Table[]>(['club-tables', clubId], (prev) => {
        if (!prev) return [];
        return prev.filter((t) => t.id !== id);
      });
      showToast('Table deleted successfully');
    },
    onError: (err: any) => {
      showToast(`Delete failed: ${err.message}`);
    },
  });

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return;
    addTableMutation.mutate();
  };

  if (!isMounted || !isAuthenticated) return null;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
      case 'MAINTENANCE':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      case 'UNAVAILABLE':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 border-b border-white/15 pb-6">
          <div>
            <Link
              href="/owner/dashboard"
              className="text-sm text-gray-400 hover:text-white flex items-center gap-2 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-3">
              <Settings className="w-8 h-8 text-snookerGreen" />
              Manage Physical Tables
            </h1>
            <p className="text-gray-400 mt-1">Configure physical tables and toggle their real-time playing statuses.</p>
          </div>
          <Link
            href="/owner/dashboard"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm"
          >
            Finish Configuration
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Table Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-2xl backdrop-blur-md space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white border-b border-white/10 pb-4">
                <Plus className="w-5 h-5 text-snookerGreen" />
                Add Physical Table
              </h2>
              <form onSubmit={handleAddTable} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Table Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Table 1, VIP Table A"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen transition-colors"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Game Type</label>
                  <select
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen"
                    value={tableType}
                    onChange={(e) => setTableType(e.target.value as any)}
                  >
                    <option value="SNOOKER">Snooker Table</option>
                    <option value="EIGHT_BALL_POOL">8-Ball Pool Table</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Price Per Hour (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(Number(e.target.value))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={addTableMutation.isPending}
                  className="w-full bg-snookerGreen hover:bg-snookerGreen/90 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] mt-2 text-sm"
                >
                  {addTableMutation.isPending ? 'Adding Table...' : 'Add Table'}
                </button>
              </form>
            </div>
          </div>

          {/* Current Tables List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-snookerGreen" />
              Active Tables Grid
            </h2>

            {tables.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-12 rounded-2xl text-center text-gray-400 backdrop-blur-md">
                No physical tables registered yet. Register a table on the left.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {tables.map((table) => (
                    <motion.div
                      key={table.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#111] border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:border-white/15 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-white text-md">{table.name}</h4>
                            <span className="text-xs text-snookerGreen font-bold block mt-0.5">
                              {table.type === 'SNOOKER' ? 'Snooker' : '8-Ball Pool'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this table?')) {
                                deleteTableMutation.mutate(table.id);
                              }
                            }}
                            className="p-2 text-gray-500 hover:text-rose-500 rounded-lg hover:bg-white/5 transition-colors"
                            title="Delete table"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Hourly Rate:</span>
                          <span className="text-goldAccent font-extrabold">₹{table.pricePerHour}/hr</span>
                        </div>

                        <div className="border-t border-white/5 pt-3">
                          <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                            Status Control
                          </label>
                          <div className="grid grid-cols-3 gap-1 bg-black/40 border border-white/5 p-1 rounded-xl">
                            {(['AVAILABLE', 'MAINTENANCE', 'UNAVAILABLE'] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  updateTableMutation.mutate({ id: table.id, fields: { status } })
                                }
                                className={`py-1.5 rounded-lg text-[10px] font-extrabold transition-all ${
                                  table.status === status
                                    ? status === 'AVAILABLE'
                                      ? 'bg-emerald-500 text-black font-extrabold'
                                      : status === 'MAINTENANCE'
                                      ? 'bg-amber-500 text-black font-extrabold'
                                      : 'bg-rose-500 text-black font-extrabold'
                                    : 'text-gray-500 hover:text-white'
                                }`}
                              >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
