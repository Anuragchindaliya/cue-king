'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, PieChart, Calendar, RefreshCw, X, Info } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';

interface Club {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

interface FinancialAnalytics {
  metrics: {
    today: { revenue: number; expenses: number; net: number };
    month: { revenue: number; expenses: number; net: number };
    year: { revenue: number; expenses: number; net: number };
  };
  expenseBreakdown: { category: string; amount: number; percentage: number }[];
  monthlyPL: { month: string; revenue: number; expenses: number; net: number }[];
}

const CATEGORIES = [
  'Table Repair',
  'Cloth Maintenance',
  'AC Service',
  'Electricity Bills',
  'Staff Salary',
  'Snacks Inventory',
  'Other'
];

const CATEGORY_COLORS: any = {
  'Table Repair': '#ef4444',
  'Cloth Maintenance': '#f59e0b',
  'AC Service': '#3b82f6',
  'Electricity Bills': '#8b5cf6',
  'Staff Salary': '#ec4899',
  'Snacks Inventory': '#10b981',
  'Other': '#6b7280'
};

export default function FinancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, initialize, token, user } = useAuthStore();
  const { showToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  // Selected Club ID
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  // Log Expense form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && (!isAuthenticated || user?.role !== 'CLUB_OWNER')) {
      router.push('/login?returnUrl=/owner/finance');
    }
  }, [isMounted, isAuthenticated, user, router]);

  // Query clubs list
  const { data: clubs = [], isLoading: isLoadingClubs } = useQuery<Club[]>({
    queryKey: ['my-clubs-finance'],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/clubs/my-clubs`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data.data || [];
    },
    enabled: !!token,
  });

  // Select first club by default
  useEffect(() => {
    if (clubs.length > 0 && !selectedClubId) {
      setSelectedClubId(clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  // Query financial analytics metrics
  const { data: analytics = null, isLoading: isLoadingAnalytics, refetch: refetchAnalytics } = useQuery<FinancialAnalytics>({
    queryKey: ['finance-analytics', selectedClubId],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/finance/analytics?clubId=${selectedClubId}`, {
        headers: { Authorization: `Bearer ${tokenVal}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!selectedClubId && !!token
  });

  // Query expenses list
  const { data: expenses = [], isLoading: isLoadingExpenses, refetch: refetchExpenses } = useQuery<Expense[]>({
    queryKey: ['finance-expenses', selectedClubId],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/finance/expense?clubId=${selectedClubId}`, {
        headers: { Authorization: `Bearer ${tokenVal}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data || [];
    },
    enabled: !!selectedClubId && !!token
  });

  // Mutate Log Expense
  const logExpenseMutation = useMutation({
    mutationFn: async (payload: { clubId: string; amount: number; category: string; description: string; date: string }) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/finance/expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenVal}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      showToast('Expense logged successfully');
      setIsFormOpen(false);
      resetForm();
      refetchExpenses();
      refetchAnalytics();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to log expense');
    }
  });

  // Mutate Delete Expense
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/finance/expense/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenVal}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      showToast('Expense removed from records');
      refetchExpenses();
      refetchAnalytics();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete expense');
    }
  });

  const resetForm = () => {
    setAmount('');
    setCategory(CATEGORIES[0]);
    setDescription('');
    setDate('');
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      showToast('Amount is required');
      return;
    }
    logExpenseMutation.mutate({
      clubId: selectedClubId,
      amount: parseFloat(amount),
      category,
      description,
      date: date || new Date().toISOString()
    });
  };

  if (!isMounted || !isAuthenticated || user?.role !== 'CLUB_OWNER') return null;

  // Render SVG Pie Donut slices
  let accumulatedPercent = 0;
  const donutRadius = 50;
  const circumference = 2 * Math.PI * donutRadius;

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,185,100,0.01),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header toolbar */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">
              <Settings className="w-8 h-8 text-emerald-400" />
              Profit & Loss Ledger Desk
            </h1>
            <p className="text-zinc-400 text-sm">
              Track business analytics, log operational expenses, and audit monthly ledger profit margins without transaction fees.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-emerald-500 text-white font-bold flex-1 md:flex-initial"
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                refetchAnalytics();
                refetchExpenses();
              }}
              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center"
              title="Refresh ledger reports"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High-level Analytics Metrics */}
        {isLoadingAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-zinc-900/40 border border-zinc-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Today's Ledger Margin",
                revenue: analytics.metrics.today.revenue,
                expenses: analytics.metrics.today.expenses,
                net: analytics.metrics.today.net
              },
              {
                title: "Current Month's Margin",
                revenue: analytics.metrics.month.revenue,
                expenses: analytics.metrics.month.expenses,
                net: analytics.metrics.month.net
              },
              {
                title: "Overall Year Margin",
                revenue: analytics.metrics.year.revenue,
                expenses: analytics.metrics.year.expenses,
                net: analytics.metrics.year.net
              }
            ].map((stat, idx) => {
              const isProfit = stat.net >= 0;
              return (
                <div
                  key={idx}
                  className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl space-y-4 shadow-lg relative overflow-hidden"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 uppercase font-semibold">{stat.title}</span>
                    <span className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                      isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {isProfit ? 'Profit' : 'Loss'}
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Net Profit / Loss</span>
                      <h3 className="text-3xl font-extrabold text-white mt-1">
                        ₹{stat.net.toLocaleString()}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500">Revenue:</span>
                      <span className="text-emerald-400 font-bold ml-1 font-mono">₹{stat.revenue}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Expenses:</span>
                      <span className="text-red-400 font-bold ml-1 font-mono">₹{stat.expenses}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Ledger Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns: P&L Statement & Expense List */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tabular P&L Ledger Statement */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Monthly Profit & Loss Statement (Ledger)
              </h3>

              <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-semibold">
                      <th className="p-4 uppercase tracking-wider">Month</th>
                      <th className="p-4 uppercase tracking-wider">Gross Income</th>
                      <th className="p-4 uppercase tracking-wider">Total Expenses</th>
                      <th className="p-4 uppercase tracking-wider text-right">Net Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-black/40">
                    {analytics?.monthlyPL.map((row, idx) => {
                      const isProfit = row.net >= 0;
                      return (
                        <tr key={idx} className="hover:bg-white/2 transition-colors">
                          <td className="p-4 font-bold text-zinc-300">{row.month}</td>
                          <td className="p-4 font-mono text-zinc-400">₹{row.revenue}</td>
                          <td className="p-4 font-mono text-zinc-400">₹{row.expenses}</td>
                          <td className={`p-4 font-mono font-bold text-right ${
                            isProfit ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            ₹{row.net}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Granular Expense Log Ledger */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <Trash2 className="w-5 h-5 text-emerald-400" />
                  Operational Expense Logs
                </h3>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                >
                  <Plus className="w-4 h-4" /> Log Cost
                </button>
              </div>

              {isLoadingExpenses ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-16 bg-white/5 rounded-xl border border-white/5" />
                  ))}
                </div>
              ) : expenses.length === 0 ? (
                <p className="text-zinc-500 text-xs py-8 text-center italic">No expenses logged for this venue.</p>
              ) : (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-black/50 border border-zinc-850 p-4 rounded-xl flex justify-between items-center hover:border-zinc-800 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-xs text-white">{exp.category}</span>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(exp.date).toLocaleDateString()}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-[10px] text-zinc-400">{exp.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-extrabold font-mono text-xs text-red-400">
                          ₹{exp.amount}
                        </span>
                        <button
                          onClick={() => deleteExpenseMutation.mutate(exp.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete expense entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Visual breakdown donut chart */}
          <div className="lg:col-span-1">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-8 h-full flex flex-col justify-between">
              
              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-white/10 pb-4">
                  <PieChart className="w-5 h-5 text-emerald-400" />
                  Category Breakdown
                </h3>

                {analytics && analytics.expenseBreakdown.length > 0 ? (
                  <div className="space-y-6 flex flex-col items-center">
                    
                    {/* Premium interactive SVG Donut Ring Chart */}
                    <div className="relative w-44 h-44">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        {analytics.expenseBreakdown.map((slice, idx) => {
                          const strokeDashoffset = circumference - (slice.percentage / 100) * circumference;
                          const rotationOffset = (accumulatedPercent / 100) * circumference;
                          accumulatedPercent += slice.percentage;
                          const color = CATEGORY_COLORS[slice.category] || '#ffffff';

                          return (
                            <circle
                              key={idx}
                              cx="60"
                              cy="60"
                              r={donutRadius}
                              fill="transparent"
                              stroke={color}
                              strokeWidth="10"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              transform={`rotate(${(rotationOffset / circumference) * 360} 60 60)`}
                              className="transition-all duration-1000 ease-out"
                            />
                          );
                        })}
                        {/* Inner hole */}
                        <circle cx="60" cy="60" r="40" fill="#111111" />
                      </svg>

                      {/* Display total inside hole */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Total Expenses</span>
                        <span className="text-sm font-extrabold text-white mt-0.5">
                          ₹{analytics.expenseBreakdown.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Legends checklist */}
                    <div className="w-full space-y-2.5">
                      {analytics.expenseBreakdown.map((item, idx) => {
                        const color = CATEGORY_COLORS[item.category] || '#ffffff';
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                              <span className="text-zinc-300 font-medium">{item.category}</span>
                            </div>
                            <div className="space-x-1.5 font-mono text-zinc-400">
                              <span>₹{item.amount}</span>
                              <span className="text-[10px] text-zinc-600">({item.percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs py-20 text-center italic">No expense breakdown data available.</p>
                )}
              </div>

              <div className="mt-8 border-t border-white/5 pt-6 text-[11px] text-zinc-500 flex gap-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Revenues are logged automatically whenever a booking or timers walk-in session is marked paid. Log operations costs to calculate monthly P&L ledger margin accurately.</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. LOG NEW EXPENSE FORM MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Log Venue Expense Cost
              </h3>
              <p className="text-xs text-zinc-500 mb-6">
                Complete form below to record operational expenses inside the profit-ledger statement.
              </p>

              <form onSubmit={handleLogSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Splicing cloth on Table 2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Date (Optional)</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={logExpenseMutation.isPending}
                  className="w-full py-3.5 bg-emerald-500 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] text-xs flex items-center justify-center gap-2 mt-6"
                >
                  {logExpenseMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Save Expense Entry
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
