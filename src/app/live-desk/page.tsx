'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Square, QrCode, CheckCircle, Plus, Trash2, Edit3, X, Info, HelpCircle, Smartphone, Award, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface Table {
  id: string;
  name: string;
  pricePerHour: number;
  upiId: string; // specific table UPI
}

interface LocalTimer {
  id: string;
  tableId: string;
  startTime: string;
  endTime: string | null;
  targetMinutes: number | null;
  playerName: string | null;
  status: 'RUNNING' | 'STOPPED';
  finalAmount: number | null;
}

interface HistoryLog {
  id: string;
  tableName: string;
  playerName: string;
  startTime: string;
  endTime: string;
  amount: number;
}

export default function PublicLiveDesk() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Core offline states
  const [globalUpi, setGlobalUpi] = useState<string>('cueking@upi');
  const [tables, setTables] = useState<Table[]>([]);
  const [timers, setTimers] = useState<LocalTimer[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);

  // Ticker for ticking time
  const [tickerTime, setTickerTime] = useState<number>(Date.now());

  // Edit default UPI state
  const [isEditingGlobalUpi, setIsEditingGlobalUpi] = useState(false);
  const [tempGlobalUpi, setTempGlobalUpi] = useState('');

  // Add Table Modal
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableRate, setNewTableRate] = useState('200');
  const [newTableUpi, setNewTableUpi] = useState('');

  // Start Timer Modal
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [selectedTableForStart, setSelectedTableForStart] = useState<Table | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('');

  // Settle Bill Modal
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedTimerForSettle, setSelectedTimerForSettle] = useState<LocalTimer | null>(null);
  const [finalAmount, setFinalAmount] = useState<number>(0);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedUpi = localStorage.getItem('cue-king-public-upi');
      if (savedUpi) {
        setGlobalUpi(savedUpi);
        setTempGlobalUpi(savedUpi);
      } else {
        setTempGlobalUpi('cueking@upi');
      }

      const savedTables = localStorage.getItem('cue-king-public-tables');
      if (savedTables) {
        setTables(JSON.parse(savedTables));
      } else {
        // Seed default tables
        const defaultTables: Table[] = [
          { id: 'table-1', name: 'Snooker Table', pricePerHour: 200, upiId: '' },
          { id: 'table-2', name: '8 Ball Pool 1', pricePerHour: 150, upiId: '' },
          { id: 'table-3', name: '8 Ball Pool 2', pricePerHour: 150, upiId: '' }
        ];
        setTables(defaultTables);
        localStorage.setItem('cue-king-public-tables', JSON.stringify(defaultTables));
      }

      const savedTimers = localStorage.getItem('cue-king-public-timers');
      if (savedTimers) {
        setTimers(JSON.parse(savedTimers));
      }

      const savedHistory = localStorage.getItem('cue-king-public-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  // Sync to local storage
  const saveTablesToLocal = (newTables: Table[]) => {
    setTables(newTables);
    localStorage.setItem('cue-king-public-tables', JSON.stringify(newTables));
  };

  const saveTimersToLocal = (newTimers: LocalTimer[]) => {
    setTimers(newTimers);
    localStorage.setItem('cue-king-public-timers', JSON.stringify(newTimers));
  };

  const saveHistoryToLocal = (newHistory: HistoryLog[]) => {
    setHistory(newHistory);
    localStorage.setItem('cue-king-public-history', JSON.stringify(newHistory));
  };

  // Run ticking time
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Add Table logic
  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName) {
      showToast('Table name is required');
      return;
    }

    let finalTableUpi = newTableUpi.trim();
    if (!finalTableUpi) {
      // Find the most recent table in the array that has a non-empty upiId
      for (let i = tables.length - 1; i >= 0; i--) {
        if (tables[i].upiId) {
          finalTableUpi = tables[i].upiId;
          break;
        }
      }
    }

    const tableId = `table-${Date.now()}`;
    const newTable: Table = {
      id: tableId,
      name: newTableName,
      pricePerHour: parseFloat(newTableRate) || 200,
      upiId: finalTableUpi
    };

    const updated = [...tables, newTable];
    saveTablesToLocal(updated);
    showToast(`Added ${newTableName} successfully!`);
    setIsAddTableOpen(false);
    setNewTableName('');
    setNewTableRate('200');
    setNewTableUpi('');
  };

  // Delete Table
  const handleDeleteTable = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? All active sessions on this table will close.`)) {
      const updatedTables = tables.filter(t => t.id !== id);
      const updatedTimers = timers.filter(t => t.tableId !== id);
      saveTablesToLocal(updatedTables);
      saveTimersToLocal(updatedTimers);
      showToast(`${name} removed.`);
    }
  };

  // 2. Start Session Logic
  const handleStartSession = () => {
    if (!selectedTableForStart) return;
    if (!playerName) {
      showToast('Player name is required');
      return;
    }

    const newSession: LocalTimer = {
      id: `session-${Date.now()}`,
      tableId: selectedTableForStart.id,
      startTime: new Date().toISOString(),
      endTime: null,
      targetMinutes: targetMinutes ? parseInt(targetMinutes) : null,
      playerName,
      status: 'RUNNING',
      finalAmount: null
    };

    const updated = [...timers, newSession];
    saveTimersToLocal(updated);
    showToast(`Timer started for ${playerName}`);
    setIsStartModalOpen(false);
    setPlayerName('');
    setTargetMinutes('');
    setSelectedTableForStart(null);
  };

  // 3. Stop Session Logic
  const handleStopSession = (sessionId: string) => {
    const sessionIndex = timers.findIndex(t => t.id === sessionId);
    if (sessionIndex === -1) return;

    const session = timers[sessionIndex];
    const table = tables.find(t => t.id === session.tableId);
    if (!table) return;

    const endTime = new Date();
    const elapsedMs = endTime.getTime() - new Date(session.startTime).getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const calculatedAmount = Math.max(0, elapsedHours * table.pricePerHour);

    const updatedSession: LocalTimer = {
      ...session,
      endTime: endTime.toISOString(),
      status: 'STOPPED',
      finalAmount: Math.round((calculatedAmount + Number.EPSILON) * 100) / 100
    };

    const updatedTimers = timers.map(t => t.id === sessionId ? updatedSession : t);
    saveTimersToLocal(updatedTimers);
    showToast('Session stopped. Preparing checkout...');

    // Open settle modal
    setSelectedTimerForSettle(updatedSession);
    setFinalAmount(updatedSession.finalAmount || 0);
    setIsSettleModalOpen(true);
  };

  // 4. Settle Session Logic
  const handleSettleSession = () => {
    if (!selectedTimerForSettle) return;
    const table = tables.find(t => t.id === selectedTimerForSettle.tableId);
    if (!table) return;

    // Log in local history ledger
    const log: HistoryLog = {
      id: `log-${Date.now()}`,
      tableName: table.name,
      playerName: selectedTimerForSettle.playerName || 'Walk-in',
      startTime: selectedTimerForSettle.startTime,
      endTime: selectedTimerForSettle.endTime || new Date().toISOString(),
      amount: finalAmount
    };

    const updatedHistory = [log, ...history];
    saveHistoryToLocal(updatedHistory);

    // Delete active timer session (table is now available)
    const updatedTimers = timers.filter(t => t.id !== selectedTimerForSettle.id);
    saveTimersToLocal(updatedTimers);

    showToast('Session settled and recorded locally!');
    setIsSettleModalOpen(false);
    setSelectedTimerForSettle(null);
  };

  // Save global UPI VPA ID
  const handleSaveGlobalUpi = () => {
    if (!tempGlobalUpi) {
      showToast('UPI VPA cannot be empty');
      return;
    }
    setGlobalUpi(tempGlobalUpi);
    localStorage.setItem('cue-king-public-upi', tempGlobalUpi);
    setIsEditingGlobalUpi(false);
    showToast('Default UPI ID updated');
  };

  // Helper: Format elapsed milliseconds to HH:MM:SS
  const formatDuration = (start: string) => {
    const elapsedMs = tickerTime - new Date(start).getTime();
    if (elapsedMs < 0) return '00:00:00';
    const totalSecs = Math.floor(elapsedMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper: Live estimated cost
  const estimateLiveCost = (start: string, hourlyRate: number) => {
    const elapsedMs = tickerTime - new Date(start).getTime();
    if (elapsedMs < 0) return 0;
    const hours = elapsedMs / (1000 * 60 * 60);
    return Math.round((hours * hourlyRate + Number.EPSILON) * 100) / 100;
  };

  if (!mounted) return null;

  // Settle UPI mapping: use specific table UPI if provided, else global fallback
  const currentTableForSettle = selectedTimerForSettle
    ? tables.find(t => t.id === selectedTimerForSettle.tableId)
    : null;
  const activeUpiForCheckout = currentTableForSettle?.upiId || globalUpi;

  const upiLink = selectedTimerForSettle
    ? `upi://pay?pa=${activeUpiForCheckout}&pn=CueKingTimer&am=${finalAmount}&cu=INR&tn=TimerSettle-${selectedTimerForSettle.id}`
    : '';
  const qrCodeUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&color=000000&bgcolor=ffffff`
    : '';

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8 relative overflow-hidden bg-[url('/noise.png')]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,185,100,0.02),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              <Clock className="w-8 h-8 text-green-400 animate-pulse" />
              Free Live Timer Desk
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm">
              Free offline billing portal for snooker clubs. Stored locally in your browser. No login required.
            </p>
          </div>

          {/* Global Fallback UPI settings */}
          <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800/80 p-3.5 rounded-2xl w-full lg:w-auto">
            <div className="space-y-0.5 flex-1 lg:flex-none">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Global Fallback UPI</span>
              {isEditingGlobalUpi ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={tempGlobalUpi}
                    onChange={(e) => setTempGlobalUpi(e.target.value)}
                    className="bg-black border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-green-500 font-mono w-40"
                  />
                  <button
                    onClick={handleSaveGlobalUpi}
                    className="px-3 py-1 bg-green-500 text-black text-xs font-bold rounded-lg hover:bg-green-400"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-zinc-200 font-mono">{globalUpi}</span>
                  <button
                    onClick={() => {
                      setTempGlobalUpi(globalUpi);
                      setIsEditingGlobalUpi(true);
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

          {/* Left Grid: Tables list & Add Card */}
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {tables.map((table) => {
                const timer = timers.find(t => t.tableId === table.id && (t.status === 'RUNNING' || t.status === 'STOPPED'));
                const isLive = timer && timer.status === 'RUNNING';
                const isPendingSettle = timer && timer.status === 'STOPPED';

                // Target Alarm alert calculations
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
                    className={`bg-zinc-900/40 border rounded-3xl p-6 flex flex-col justify-between relative shadow-lg overflow-hidden transition-all ${isLive
                      ? targetLimitReached
                        ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                        : 'border-green-500/30'
                      : isPendingSettle
                        ? 'border-amber-500/40'
                        : 'border-zinc-800/80 hover:border-zinc-700'
                      }`}
                  >
                    {/* Status top bar indicators */}
                    {isLive && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-green-500" />
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
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-base text-white">{table.name}</h4>
                            <button
                              onClick={() => handleDeleteTable(table.id, table.name)}
                              className="p-1 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete table config"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            ₹{table.pricePerHour}/hr
                            {table.upiId && ` • Specific VPA: ${table.upiId}`}
                          </p>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${isLive
                          ? targetLimitReached
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : isPendingSettle
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                          {isLive
                            ? targetLimitReached
                              ? 'Target Reached'
                              : 'Live Running'
                            : isPendingSettle
                              ? 'Awaiting Settle'
                              : 'Available'}
                        </span>
                      </div>

                      {/* Active running display */}
                      {isLive && (
                        <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-zinc-850">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Player:</span>
                            <span className="font-bold text-zinc-200">{timer.playerName}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-zinc-850 pt-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Elapsed Time</span>
                            <span className="font-mono font-extrabold text-green-400 text-base">
                              {formatDuration(timer.startTime)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-zinc-850 pt-2 text-[11px]">
                            <span className="text-zinc-500">Live Billing:</span>
                            <span className="text-white font-extrabold font-mono">
                              ₹{estimateLiveCost(timer.startTime, table.pricePerHour)}
                            </span>
                          </div>

                          {timer.targetMinutes && (
                            <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-1">
                              <span>Target: {timer.targetMinutes} Mins</span>
                              {targetLimitReached && (
                                <span className="text-red-500 font-bold animate-pulse">ALARM!</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pending Settle Display */}
                      {isPendingSettle && (
                        <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Player:</span>
                            <span className="font-bold text-zinc-200">{timer.playerName || 'Walk-in'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-amber-500/10 pt-2">
                            <span className="text-zinc-400 font-medium">Final Settle:</span>
                            <span className="text-amber-500 font-extrabold font-mono">
                              ₹{timer.finalAmount}
                            </span>
                          </div>
                        </div>
                      )}

                      {!timer && (
                        <p className="text-xs text-zinc-500 italic py-2">
                          Table is available. Click play to start walkthrough session.
                        </p>
                      )}
                    </div>

                    <div className="mt-6 border-t border-zinc-850 pt-4 flex gap-2">
                      {isLive && (
                        <button
                          onClick={() => handleStopSession(timer.id)}
                          className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold transition-all text-xs flex items-center justify-center gap-1.5"
                        >
                          <Square className="w-3.5 h-3.5 fill-red-500" />
                          Stop Timer
                        </button>
                      )}

                      {isPendingSettle && (
                        <button
                          onClick={() => {
                            setSelectedTimerForSettle(timer);
                            setFinalAmount(timer.finalAmount || 0);
                            setIsSettleModalOpen(true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Settle Bill & QR
                        </button>
                      )}

                      {!timer && (
                        <button
                          onClick={() => {
                            setSelectedTableForStart(table);
                            setIsStartModalOpen(true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 font-semibold transition-all text-xs flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 text-green-400 fill-green-400" />
                          Start Session
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Special Clean Add New Table Card */}
              <button
                onClick={() => setIsAddTableOpen(true)}
                className="bg-zinc-950/20 border-2 border-dashed border-zinc-800/80 hover:border-green-500/50 hover:bg-zinc-900/10 transition-all rounded-3xl p-8 flex flex-col items-center justify-center text-center group min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-full border border-zinc-800 group-hover:border-green-500/30 group-hover:bg-green-500/5 flex items-center justify-center text-zinc-500 group-hover:text-green-400 transition-all mb-3.5">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-zinc-400 group-hover:text-white transition-colors">
                  Add New Table
                </h4>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-[150px]">
                  Configure table name, custom hourly rate, and optional custom UPI.
                </p>
              </button>

            </div>
          </div>

          {/* Right Column: Local ledger history */}
          <div className="xl:col-span-1">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 h-full flex flex-col justify-between">

              <div className="space-y-6">
                <h3 className="text-base font-bold flex items-center justify-between text-white border-b border-white/10 pb-4">
                  <span className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-400" />
                    Offline Ledger Logs
                  </span>
                  {history.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Clear entire local session logs history?')) {
                          saveHistoryToLocal([]);
                        }
                      }}
                      className="text-[10px] text-red-400 hover:underline"
                    >
                      Clear Logs
                    </button>
                  )}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-2xl">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Total Revenue</span>
                    <span className="text-xl font-extrabold text-green-400 font-mono mt-1 block">
                      ₹{history.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-zinc-900/50 p-4 border border-zinc-850 rounded-2xl">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Total Sessions</span>
                    <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                      {history.length} games
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {history.length === 0 ? (
                    <p className="text-zinc-500 text-xs py-10 text-center italic">No records yet. Settle sessions to log.</p>
                  ) : (
                    history.map((log) => (
                      <div
                        key={log.id}
                        className="bg-black/40 border border-zinc-850 p-3.5 rounded-xl space-y-1.5 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{log.playerName}</span>
                          <span className="font-bold text-green-400 font-mono">₹{log.amount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                          <span>{log.tableName}</span>
                          <span>{new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-8 border-t border-white/5 pt-6 text-[10px] text-zinc-500 flex gap-2">
                <Info className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>
                  Everything is saved in local browser storage, protecting vendor privacy and ensuring zero platform transaction fees.
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 1. ADD TABLE CONFIG MODAL */}
      <AnimatePresence>
        {isAddTableOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-1">Add New Table</h3>
              <p className="text-xs text-zinc-500 mb-6">Configure a new walk-in table for tracking.</p>

              <form onSubmit={handleAddTable} className="space-y-4">
                <div>
                  <label htmlFor="tableName" className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                    Table Name
                  </label>
                  <input
                    id="tableName"
                    type="text"
                    placeholder="e.g. Table 3, Snooker 1"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tableRate" className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                      Hourly Rate (INR)
                    </label>
                    <input
                      id="tableRate"
                      type="number"
                      placeholder="e.g. 200"
                      value={newTableRate}
                      onChange={(e) => setNewTableRate(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="tableUpi" className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                      Specific UPI VPA (Optional)
                    </label>
                    <input
                      id="tableUpi"
                      type="text"
                      placeholder="e.g. table3@upi"
                      value={newTableUpi}
                      onChange={(e) => setNewTableUpi(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-green-500 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] text-xs flex items-center justify-center gap-1.5 mt-6 hover:bg-green-400"
                >
                  <Plus className="w-4 h-4" />
                  Add Table Configuration
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. START SESSION MODAL */}
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
                  setPlayerName('');
                  setTargetMinutes('');
                }}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-2">
                Start Play: {selectedTableForStart.name}
              </h3>
              <p className="text-xs text-zinc-500 mb-6">Assign walk-in player details and optional smart alarm targets.</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="pName" className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                    Player Name
                  </label>
                  <input
                    id="pName"
                    type="text"
                    placeholder="e.g. Anurag"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="tMins" className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                    Target Alarm Duration (Optional)
                  </label>
                  <select
                    id="tMins"
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-green-500"
                  >
                    <option value="">No Alarm (Continuous)</option>
                    <option value="30">30 Minutes Alarm</option>
                    <option value="60">1 Hour Alarm</option>
                    <option value="120">2 Hours Alarm</option>
                    <option value="180">3 Hours Alarm</option>
                  </select>
                </div>

                <button
                  onClick={handleStartSession}
                  className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] text-xs flex items-center justify-center gap-1.5 mt-6"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  Start Timer Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. SETTLE PAYMENT & QR MODAL */}
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
                Settle Billing: {currentTableForSettle?.name}
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                Customer: <strong>{selectedTimerForSettle.playerName}</strong>
              </p>

              <div className="space-y-6">

                {/* Editable bill amount */}
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

                {/* Instant QR Code generated */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-3 rounded-2xl border border-zinc-850 shadow-lg">
                    <img
                      src={qrCodeUrl}
                      alt="UPI Settle QR"
                      className="w-40 h-40 block"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] text-zinc-500">Scan pre-filled QR directly with any UPI app</p>
                    <p className="text-[9px] text-zinc-600 font-mono">VPA Address: {activeUpiForCheckout}</p>
                  </div>
                </div>

                {/* Mobile Intent link */}
                <a
                  href={upiLink}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4.5 h-4.5 text-green-400" />
                  Open in Mobile UPI App
                </a>

                <button
                  onClick={handleSettleSession}
                  className="w-full py-3.5 bg-green-500 text-black hover:bg-green-400 font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 fill-black" />
                  Mark Payment as Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
