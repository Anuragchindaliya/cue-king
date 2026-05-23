'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Square, Search, Mic, MicOff, Info, QrCode, CreditCard, ChevronRight, CheckCircle, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';
import { useSSE } from '@/hooks/useSSE';

interface Table {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'UNAVAILABLE';
}

interface TableTimer {
  id: string;
  tableId: string;
  startTime: string;
  endTime: string | null;
  targetMinutes: number | null;
  hourlyRate: number;
  finalAmount: number | null;
  playerName: string | null;
  playerPhone: string | null;
  playerEmail: string | null;
  status: 'RUNNING' | 'STOPPED' | 'PAID';
  table: Table;
}

interface Club {
  id: string;
  name: string;
  upiId: string | null;
  tables: Table[];
}

export default function LiveDeskPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, initialize, token, user } = useAuthStore();
  const { showToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  // Active Club Selection
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  // Local Timers Tick
  const [tickerTime, setTickerTime] = useState<number>(Date.now());

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Start Timer Modal State
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [selectedTableForStart, setSelectedTableForStart] = useState<Table | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [targetMinutes, setTargetMinutes] = useState<string>('');
  
  // CRM Lookup Search State
  const [crmSearch, setCrmSearch] = useState('');
  const [crmResults, setCrmResults] = useState<any[]>([]);

  // Settle Bill Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedTimerForSettle, setSelectedTimerForSettle] = useState<TableTimer | null>(null);
  const [finalAmount, setFinalAmount] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && (!isAuthenticated || user?.role !== 'CLUB_OWNER')) {
      router.push('/login?returnUrl=/owner/live-desk');
    }
  }, [isMounted, isAuthenticated, user, router]);

  // Query clubs owned
  const { data: clubs = [], isLoading: isLoadingClubs } = useQuery<Club[]>({
    queryKey: ['my-clubs-list'],
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

  // Query active timers for selected club
  const { data: activeTimers = [], isLoading: isLoadingTimers, refetch: refetchTimers } = useQuery<TableTimer[]>({
    queryKey: ['active-timers', selectedClubId],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/timers/active?clubId=${selectedClubId}`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data || [];
    },
    enabled: !!selectedClubId && !!token,
  });

  // Listen to SSE updates on timers in real-time
  useSSE({
    url: user && token ? `${API_BASE_URL}/api/notifications/events` : '',
    token: token || '',
    events: {
      'timer-status-changed': (eventData: any) => {
        refetchTimers();
        queryClient.invalidateQueries({ queryKey: ['my-clubs-list'] });
      }
    }
  });

  // Local ticker to redraw seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Speech API Voice Controller Integration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-IN';

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript.toLowerCase();
          showToast(`Voice heard: "${text}"`);
          handleVoiceCommand(text);
          setIsListening(false);
        };

        rec.onerror = (err: any) => {
          console.error("Speech Recognition Error:", err);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [clubs, activeTimers, selectedClubId]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('Speech recognition not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Voice commands parser
  const handleVoiceCommand = (command: string) => {
    const currentClub = clubs.find(c => c.id === selectedClubId);
    if (!currentClub) return;

    // Pattern examples:
    // "start table one for anurag"
    // "stop table 2"
    const startMatch = command.match(/start\s+table\s+(\d+|one|two|three|four|five)\s+for\s+(.+)/i);
    const stopMatch = command.match(/stop\s+table\s+(\d+|one|two|three|four|five)/i);

    const convertWordToNumber = (word: string) => {
      const mapping: any = { 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5' };
      return mapping[word] || word;
    };

    if (startMatch) {
      const tableNum = convertWordToNumber(startMatch[1]);
      const nameVal = startMatch[2];
      const targetTable = currentClub.tables.find(t => t.name.toLowerCase().includes(tableNum));

      if (targetTable) {
        if (targetTable.status === 'AVAILABLE') {
          startTimerMutation.mutate({
            tableId: targetTable.id,
            playerName: nameVal,
            playerPhone: '',
            playerEmail: '',
            targetMinutes: null
          });
        } else {
          showToast(`Table ${tableNum} is already occupied!`);
        }
      } else {
        showToast(`Could not find Table matching "${tableNum}"`);
      }
    } else if (stopMatch) {
      const tableNum = convertWordToNumber(stopMatch[1]);
      const targetTable = currentClub.tables.find(t => t.name.toLowerCase().includes(tableNum));
      
      if (targetTable) {
        const runningTimer = activeTimers.find(t => t.tableId === targetTable.id && t.status === 'RUNNING');
        if (runningTimer) {
          stopTimerMutation.mutate(runningTimer.id);
        } else {
          showToast(`No running timer on Table ${tableNum}`);
        }
      } else {
        showToast(`Could not find Table matching "${tableNum}"`);
      }
    } else {
      showToast('Command not recognized. Try: "start table 1 for Anurag"');
    }
  };

  // Mutate Start Timer
  const startTimerMutation = useMutation({
    mutationFn: async (payload: { tableId: string; playerName: string; playerPhone: string; playerEmail: string; targetMinutes: number | null }) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/timers/start`, {
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
      showToast('Walk-in timer started successfully');
      setIsStartModalOpen(false);
      resetStartModalForm();
      refetchTimers();
      queryClient.invalidateQueries({ queryKey: ['my-clubs-list'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to start timer');
    }
  });

  // Mutate Stop Timer
  const stopTimerMutation = useMutation({
    mutationFn: async (timerId: string) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/timers/${timerId}/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenVal}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (stoppedTimer) => {
      showToast('Timer stopped. Processing checkout bill...');
      setSelectedTimerForSettle(stoppedTimer);
      setFinalAmount(stoppedTimer.finalAmount || 0);
      setIsSettleModalOpen(true);
      refetchTimers();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to stop timer');
    }
  });

  // Mutate Finalize Settle Payment
  const finalizeBillMutation = useMutation({
    mutationFn: async ({ timerId, amount }: { timerId: string; amount: number }) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/timers/${timerId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenVal}`
        },
        body: JSON.stringify({ finalAmount: amount })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      showToast('Payment marked complete and ledger recorded!');
      setIsSettleModalOpen(false);
      setSelectedTimerForSettle(null);
      refetchTimers();
      queryClient.invalidateQueries({ queryKey: ['my-clubs-list'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to finalize bill');
    }
  });

  // CRM Search Auto-complete Lookup
  const handleCrmLookup = async (q: string) => {
    setCrmSearch(q);
    if (!q.trim()) {
      setCrmResults([]);
      return;
    }

    try {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/crm/search?query=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${tokenVal}` }
      });
      const data = await res.json();
      if (data.success) {
        setCrmResults(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectCrmUser = (user: any) => {
    setPlayerName(user.name);
    setPlayerPhone(user.phone || '');
    setPlayerEmail(user.email || '');
    setCrmResults([]);
    setCrmSearch('');
  };

  const resetStartModalForm = () => {
    setPlayerName('');
    setPlayerPhone('');
    setPlayerEmail('');
    setTargetMinutes('');
    setCrmSearch('');
    setCrmResults([]);
  };

  // Helper: Format elapsed milliseconds to human readable
  const formatDuration = (start: string) => {
    const elapsedMs = tickerTime - new Date(start).getTime();
    if (elapsedMs < 0) return '00:00:00';
    const totalSecs = Math.floor(elapsedMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper: Live estimate of current cost
  const estimateLiveCost = (start: string, hourlyRate: number) => {
    const elapsedMs = tickerTime - new Date(start).getTime();
    if (elapsedMs < 0) return 0;
    const hours = elapsedMs / (1000 * 60 * 60);
    return Math.round((hours * hourlyRate + Number.EPSILON) * 100) / 100;
  };

  if (!isMounted || !isAuthenticated || user?.role !== 'CLUB_OWNER') return null;

  const currentClub = clubs.find((c) => c.id === selectedClubId);
  const clubUpi = currentClub?.upiId || 'cueking@upi';

  // Construct standard UPI deep link for current checkout
  const upiLinkForSettle = selectedTimerForSettle
    ? `upi://pay?pa=${clubUpi}&pn=${encodeURIComponent(currentClub?.name || 'CueKing')}&am=${finalAmount}&cu=INR&tn=TableTimer-${selectedTimerForSettle.id}`
    : '';
  const qrCodeUrlForSettle = upiLinkForSettle
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLinkForSettle)}&color=000000&bgcolor=ffffff`
    : '';

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.02),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-emerald-400">
              <Clock className="w-8 h-8 text-snookerGreen animate-pulse" />
              Automated Live Desk
            </h1>
            <p className="text-zinc-400 text-sm">
              Offline walk-in table timers, smart targets, speech activation, and frictionless QR checkout.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Club Selector */}
            <div className="relative flex-1 md:flex-initial">
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-snookerGreen text-white font-bold"
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mic voice controller button */}
            <button
              onClick={toggleListening}
              className={`p-3 rounded-xl border transition-all flex items-center justify-center relative ${
                isListening
                  ? 'bg-red-500/10 text-red-500 border-red-500 animate-pulse'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
              title="Click to Speak Walk-in Commands"
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              {isListening && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 flex gap-3 text-xs text-zinc-400">
          <Info className="w-5 h-5 text-snookerGreen shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-zinc-300">Voice Command Feature Active (Optional):</p>
            <p className="mt-1">
              Tap the mic icon and speak: <code className="text-green-400 font-mono">"start table 1 for Anurag"</code> to automatically log walk-in players, or <code className="text-green-400 font-mono">"stop table 1"</code> to calculate their elapsed bill.
            </p>
          </div>
        </div>

        {/* Visual Table Grid */}
        {isLoadingClubs || isLoadingTimers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-56 bg-zinc-900/40 border border-zinc-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : !currentClub ? (
          <div className="text-center py-20 bg-zinc-950/40 rounded-2xl border border-zinc-800">
            <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-400">No Club Registered</h3>
            <p className="text-zinc-600 text-xs mt-1">Please create a club in the partner portal first.</p>
          </div>
        ) : currentClub.tables.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950/40 rounded-2xl border border-zinc-800">
            <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-400">No Tables Registered</h3>
            <p className="text-zinc-600 text-xs mt-1">Please add tables to this club to use the Live Desk.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentClub.tables.map((table) => {
              // Find if this table has an active timer (RUNNING or STOPPED)
              const timer = activeTimers.find(
                (t) => t.tableId === table.id && (t.status === 'RUNNING' || t.status === 'STOPPED')
              );

              const isLive = timer && timer.status === 'RUNNING';
              const isPendingSettle = timer && timer.status === 'STOPPED';

              // Smart alarm alert calculations
              let targetLimitReached = false;
              let targetProgress = 0;
              if (isLive && timer.targetMinutes) {
                const elapsedMs = tickerTime - new Date(timer.startTime).getTime();
                const elapsedMins = elapsedMs / (1000 * 60);
                targetProgress = Math.min(100, (elapsedMins / timer.targetMinutes) * 100);
                if (elapsedMins >= timer.targetMinutes) {
                  targetLimitReached = true;
                }
              }

              return (
                <motion.div
                  key={table.id}
                  layout
                  className={`bg-zinc-900/40 border rounded-2xl p-6 flex flex-col justify-between relative shadow-lg overflow-hidden transition-all ${
                    isLive
                      ? targetLimitReached
                        ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                        : 'border-snookerGreen/40'
                      : isPendingSettle
                      ? 'border-amber-500/40'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  {isLive && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-snookerGreen" />
                  )}
                  {isLive && timer.targetMinutes && (
                    <div 
                      className="absolute top-0 left-0 h-1 bg-red-500 transition-all duration-1000" 
                      style={{ width: `${targetProgress}%` }}
                    />
                  )}
                  {isPendingSettle && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 animate-pulse" />
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-lg text-white">{table.name}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {table.type === 'SNOOKER' ? 'Snooker' : 'Pool'} • ₹{table.pricePerHour}/hr
                        </span>
                      </div>
                      
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isLive
                          ? targetLimitReached
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-snookerGreen/10 text-snookerGreen border border-snookerGreen/20'
                          : isPendingSettle
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {isLive 
                          ? targetLimitReached 
                            ? 'Alarm Limit Reached' 
                            : 'Live Running'
                          : isPendingSettle
                          ? 'Awaiting Payment'
                          : 'Available'}
                      </span>
                    </div>

                    {/* Active Timer Display */}
                    {isLive && (
                      <div className="space-y-2.5 bg-black/40 p-4 rounded-xl border border-zinc-800/50">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Elapsed Time</span>
                          <span className="font-mono font-extrabold text-snookerGreen text-lg">
                            {formatDuration(timer.startTime)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-zinc-800/50 pt-2 text-[11px]">
                          <span className="text-zinc-500">Live Estimated Cost:</span>
                          <span className="text-white font-extrabold font-mono">
                            ₹{estimateLiveCost(timer.startTime, timer.hourlyRate)}
                          </span>
                        </div>
                        
                        {/* Target Alert details */}
                        {timer.targetMinutes && (
                          <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1">
                            <span>Target: {timer.targetMinutes} Mins Alarm</span>
                            {targetLimitReached && (
                              <span className="text-red-500 font-bold animate-pulse">
                                TIME IS UP!
                              </span>
                            )}
                          </div>
                        )}

                        {timer.playerName && (
                          <div className="border-t border-zinc-800/50 pt-2 text-[10px] text-zinc-400">
                            Player: <strong className="text-zinc-200">{timer.playerName}</strong> 
                            {timer.playerPhone && ` (${timer.playerPhone})`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pending Settle Display */}
                    {isPendingSettle && (
                      <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500">Player:</span>
                          <span className="font-bold text-zinc-200">{timer.playerName || 'Walk-in'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t border-amber-500/10 pt-2">
                          <span className="text-zinc-400 font-medium">Final Settle Bill:</span>
                          <span className="text-amber-500 font-extrabold font-mono">
                            ₹{timer.finalAmount}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Available State message */}
                    {!timer && (
                      <p className="text-xs text-zinc-500 italic py-3">
                        Table is currently empty. Click Start to assign walk-in session.
                      </p>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-6 border-t border-zinc-800/50 pt-4 flex gap-2">
                    {isLive && (
                      <button
                        onClick={() => stopTimerMutation.mutate(timer.id)}
                        disabled={stopTimerMutation.isPending}
                        className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold transition-all text-xs flex items-center justify-center gap-2"
                      >
                        <Square className="w-4 h-4 fill-red-500" />
                        Stop Session
                      </button>
                    )}

                    {isPendingSettle && (
                      <button
                        onClick={() => {
                          setSelectedTimerForSettle(timer);
                          setFinalAmount(timer.finalAmount || 0);
                          setIsSettleModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-extrabold transition-all text-xs flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      >
                        <QrCode className="w-4 h-4" />
                        Settle Bill & QR
                      </button>
                    )}

                    {!timer && (
                      <button
                        onClick={() => {
                          setSelectedTableForStart(table);
                          setIsStartModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 font-bold transition-all text-xs flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 text-snookerGreen fill-snookerGreen" />
                        Start Session
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* 1. START WALK-IN TIMER DIALOGUE */}
      <AnimatePresence>
        {isStartModalOpen && selectedTableForStart && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setIsStartModalOpen(false);
                  resetStartModalForm();
                }}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-2">
                Start walk-in: {selectedTableForStart.name}
              </h3>
              <p className="text-xs text-zinc-500 mb-6">
                Fill details or lookup returning regular customer to track spending.
              </p>

              {/* CRM Autocomplete search */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    placeholder="Quick Lookup (Regular player name/email/phone)"
                    value={crmSearch}
                    onChange={(e) => handleCrmLookup(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-850 rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:border-snookerGreen text-white"
                  />
                  
                  {/* Results box */}
                  {crmResults.length > 0 && (
                    <div className="absolute inset-x-0 top-12 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-20 max-h-40 overflow-y-auto">
                      {crmResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectCrmUser(p)}
                          className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-850 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold">{p.name}</p>
                            <p className="text-[10px] text-zinc-500">{p.email || p.phone}</p>
                          </div>
                          <span className="text-[8px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">
                            {p.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800/80 pt-4 space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Player Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Anurag"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-snookerGreen"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Phone (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={playerPhone}
                        onChange={(e) => setPlayerPhone(e.target.value)}
                        className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-snookerGreen"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="e.g. player@test.com"
                        value={playerEmail}
                        onChange={(e) => setPlayerEmail(e.target.value)}
                        className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-snookerGreen"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Target duration alarm (Optional)</label>
                    <select
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-snookerGreen"
                    >
                      <option value="">No Alarm (Continuous play)</option>
                      <option value="30">30 Minutes Alarm</option>
                      <option value="60">1 Hour Alarm</option>
                      <option value="120">2 Hours Alarm</option>
                      <option value="180">3 Hours Alarm</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!playerName) {
                      showToast('Player name is required');
                      return;
                    }
                    startTimerMutation.mutate({
                      tableId: selectedTableForStart.id,
                      playerName,
                      playerPhone,
                      playerEmail,
                      targetMinutes: targetMinutes ? parseInt(targetMinutes) : null
                    });
                  }}
                  disabled={startTimerMutation.isPending}
                  className="w-full py-3.5 bg-snookerGreen hover:bg-snookerGreen/90 text-white font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] text-xs flex items-center justify-center gap-2 mt-6"
                >
                  {startTimerMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Start Play Timer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SETTLE BILL & GENERATED UPI QR MODAL */}
      <AnimatePresence>
        {isSettleModalOpen && selectedTimerForSettle && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setIsSettleModalOpen(false);
                  setSelectedTimerForSettle(null);
                }}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-1">
                Checkout Settle: Table Session
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                Customer: <strong>{selectedTimerForSettle.playerName || 'Walk-in Player'}</strong>
              </p>

              <div className="space-y-6">
                {/* Total Billing Settle */}
                <div className="bg-white/5 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Predefined elapsed bill</span>
                    <span className="text-xs text-zinc-400 font-mono">₹{selectedTimerForSettle.finalAmount} default</span>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 text-right uppercase mb-1">Adjust Final Bill</label>
                    <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-2 w-24">
                      <span className="text-zinc-500 text-xs">₹</span>
                      <input
                        type="number"
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(parseFloat(e.target.value) || 0)}
                        className="bg-transparent border-none text-right outline-none w-full text-xs font-bold text-white py-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Instant UPI QR code generated */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border border-zinc-850">
                    <img
                      src={qrCodeUrlForSettle}
                      alt="UPI Checkout QR"
                      className="w-40 h-40 block"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] text-zinc-500">Scan QR directly to pay pre-filled bill</p>
                    <p className="text-[9px] text-zinc-600 font-mono">VPA Address: {clubUpi}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-[11px] text-zinc-400 flex gap-2">
                  <Info className="w-4 h-4 text-snookerGreen shrink-0 mt-0.5" />
                  <span>
                    Show this pre-filled QR to the player. Settle transaction immediately, verify credit in your bank app, then click the button below to close the timer.
                  </span>
                </div>

                <button
                  onClick={() => {
                    finalizeBillMutation.mutate({
                      timerId: selectedTimerForSettle.id,
                      amount: finalAmount
                    });
                  }}
                  disabled={finalizeBillMutation.isPending}
                  className="w-full py-3.5 bg-snookerGreen text-white hover:bg-snookerGreen/90 font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] text-xs flex items-center justify-center gap-2"
                >
                  {finalizeBillMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Mark Payment as Complete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
