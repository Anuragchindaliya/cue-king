'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { useSocket } from '@/providers/SocketProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, RefreshCw, AlertCircle, Users, Lock, Unlock, X } from 'lucide-react';

export default function BookingFlow({ club }: { club: any }) {
  const router = useRouter();
  const { socket, joinClubRoom, leaveClubRoom } = useSocket();
  const [step, setStep] = useState(1);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupData, setGroupData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    allowVoting: true,
  });

  const createLobbyMutation = useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('UNAUTHORIZED');
      }

      const res = await fetch(`${API_BASE_URL}/api/lobby/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clubId: club.id,
          tentativeDate: groupData.date,
          tentativeTime: groupData.time,
          allowVoting: groupData.allowVoting
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to create group lobby');
      }
      return data.data; // contains lobbyId
    },
    onSuccess: (data) => {
      localStorage.removeItem('pendingGroupLobby');
      router.push(`/lobby/${data.lobbyId}`);
    },
    onError: (err: any) => {
      if (err.message === 'UNAUTHORIZED') {
        localStorage.setItem('pendingGroupLobby', JSON.stringify({ clubId: club.id }));
        router.push('/login?returnUrl=' + encodeURIComponent(`/club/${club.id}`));
      } else {
        alert(err.message || 'Failed to create group booking lobby');
      }
    }
  });

  const handleStartGroupBooking = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      localStorage.setItem('pendingGroupLobby', JSON.stringify({ clubId: club.id }));
      router.push('/login?returnUrl=' + encodeURIComponent(`/club/${club.id}`));
      return;
    }
    setIsGroupModalOpen(true);
  };

  // States
  const [tables, setTables] = useState<any[]>(club.tables || []);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  const [formData, setFormData] = useState({
    tableId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    durationHours: 1,
  });

  // Fetch tables
  const fetchTables = useCallback(async () => {
    setIsLoadingTables(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tables/club/${club.id}`);
      const data = await res.json();
      if (data.success) {
        setTables(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tables', err);
    } finally {
      setIsLoadingTables(false);
    }
  }, [club.id]);

  // Fetch booked slots for the selected date
  const fetchBookedSlots = useCallback(async () => {
    if (!formData.date) return;
    setIsLoadingBookings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/club/${club.id}/slots?date=${formData.date}`);
      const data = await res.json();
      if (data.success) {
        setBookedSlots(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch booked slots', err);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [club.id, formData.date]);

  // Fetch initial tables and set default table selection
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (tables.length > 0 && !formData.tableId) {
      const availableTable = tables.find(t => t.status === 'AVAILABLE');
      if (availableTable) {
        setFormData(prev => ({ ...prev, tableId: availableTable.id }));
      }
    }
  }, [tables, formData.tableId]);

  // Fetch bookings on date change
  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  // Socket.IO real-time listener for availability updates
  useEffect(() => {
    if (socket) {
      joinClubRoom(club.id);

      const handleAvailabilityUpdate = (data: { clubId: string; tableId: string }) => {
        if (data.clubId === club.id) {
          fetchBookedSlots();
        }
      };

      socket.on('availability-updated', handleAvailabilityUpdate);

      return () => {
        socket.off('availability-updated', handleAvailabilityUpdate);
        leaveClubRoom(club.id);
      };
    }
  }, [socket, club.id, joinClubRoom, leaveClubRoom, fetchBookedSlots]);

  // Load pending booking from localStorage if returning from auth redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pending = localStorage.getItem('pendingBooking');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.clubId === club.id) {
            setFormData({
              tableId: parsed.tableId,
              date: parsed.date,
              startTime: parsed.startTime,
              endTime: parsed.endTime,
              durationHours: parsed.durationHours,
            });
            setStep(2);
          }
        } catch (err) {
          console.error('Failed to parse pending booking', err);
        }
      }
      const pendingGroup = localStorage.getItem('pendingGroupLobby');
      if (pendingGroup) {
        try {
          const parsed = JSON.parse(pendingGroup);
          if (parsed.clubId === club.id) {
            setIsGroupModalOpen(true);
            localStorage.removeItem('pendingGroupLobby');
          }
        } catch (err) {
          console.error('Failed to parse pending group lobby', err);
        }
      }
    }
  }, [club.id]);

  // Generate start times capsules based on opening/closing times
  const generateTimeCapsules = (open: string, close: string) => {
    if (!open || !close) return [];
    const capsules = [];
    let [openHr] = open.split(':').map(Number);
    let [closeHr] = close.split(':').map(Number);

    if (closeHr <= openHr) closeHr += 24;

    for (let i = openHr; i < closeHr; i++) {
      const hr24 = i % 24;
      const ampm = hr24 >= 12 ? 'PM' : 'AM';
      const hr12 = hr24 % 12 || 12;
      const formatted = `${hr24.toString().padStart(2, '0')}:00`;
      const display = `${hr12}:00 ${ampm}`;
      capsules.push({ value: formatted, display });
    }
    return capsules;
  };

  const timeCapsules = useMemo(() => {
    return generateTimeCapsules(club.openingTime, club.closingTime);
  }, [club.openingTime, club.closingTime]);

  // Overlap verification helper
  const isSlotOverlap = (timeStr: string) => {
    if (!formData.tableId || !formData.date) return false;

    const proposedStart = new Date(`${formData.date}T${timeStr}:00`);
    let [startHr] = timeStr.split(':').map(Number);
    let endHr = (startHr + formData.durationHours) % 24;
    const endStr = `${endHr.toString().padStart(2, '0')}:00`;

    let proposedEnd = new Date(`${formData.date}T${endStr}:00`);
    if (endStr < timeStr) {
      proposedEnd.setDate(proposedEnd.getDate() + 1);
    }

    return bookedSlots.some((booking: any) => {
      if (booking.tableId !== formData.tableId) return false;

      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      // Overlap: proposedStart < bookingEnd && proposedEnd > bookingStart
      return proposedStart < bookingEnd && proposedEnd > bookingStart;
    });
  };

  const handleTimeSelect = (timeStr: string) => {
    if (isSlotOverlap(timeStr)) return;
    let [startHr] = timeStr.split(':').map(Number);
    let endHr = (startHr + formData.durationHours) % 24;
    const endStr = `${endHr.toString().padStart(2, '0')}:00`;
    setFormData(prev => ({ ...prev, startTime: timeStr, endTime: endStr }));
  };

  const handleNext = () => {
    if (!formData.tableId || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Please fill all fields');
      return;
    }
    setStep(2);
  };

  // Create booking mutation
  const confirmBookingMutation = useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('UNAUTHORIZED');
      }

      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      let endDateObj = new Date(`${formData.date}T${formData.endTime}:00`);

      if (formData.endTime < formData.startTime) {
        endDateObj.setDate(endDateObj.getDate() + 1);
      }

      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clubId: club.id,
          tableId: formData.tableId,
          startTime: startDateTime,
          endTime: endDateObj.toISOString()
        })
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403 || data.message?.toLowerCase().includes('token') || data.message?.toLowerCase().includes('authorized')) {
        throw new Error('UNAUTHORIZED');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to book');
      }

      return data;
    },
    onSuccess: () => {
      localStorage.removeItem('pendingBooking');
      setStep(3);
    },
    onError: (err: any) => {
      if (err.message === 'UNAUTHORIZED') {
        localStorage.removeItem('token');
        localStorage.setItem('pendingBooking', JSON.stringify({ ...formData, clubId: club.id }));
        router.push('/login?returnUrl=' + encodeURIComponent(`/club/${club.id}`));
      } else {
        alert(err.message || 'Error creating booking');
      }
    }
  });

  const handleConfirm = () => {
    confirmBookingMutation.mutate();
  };

  const selectedTable = useMemo(() => {
    return tables.find((t: any) => t.id === formData.tableId);
  }, [tables, formData.tableId]);

  if (step === 3) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-10"
      >
        <div className="w-20 h-20 bg-snookerGreen/20 border border-snookerGreen text-snookerGreen rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>
        <h3 className="text-3xl font-extrabold text-white mb-3">Booking Requested!</h3>
        <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
          Your request has been sent to the club owner. You will receive an instant live notification once they accept or reject it.
        </p>
        <button
          onClick={() => router.push('/bookings')}
          className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-colors"
        >
          View Bookings History
        </button>
      </motion.div>
    );
  }

  // Group tables by type for cleaner display
  const snookerTables = tables.filter((t: any) => t.type === 'SNOOKER');
  const poolTables = tables.filter((t: any) => t.type === 'EIGHT_BALL_POOL');

  return (
    <div>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {/* 1. Table Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3 flex justify-between items-center">
                <span>1. Choose a Specific Table</span>
                {isLoadingTables && <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-500" />}
              </label>

              {tables.length === 0 && !isLoadingTables ? (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center text-gray-400">
                  No tables listed for this club.
                </div>
              ) : (
                <div className="space-y-4">
                  {snookerTables.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Snooker Tables</div>
                      <div className="grid grid-cols-2 gap-2">
                        {snookerTables.map((t: any) => {
                          const isSelected = formData.tableId === t.id;
                          const isMaintenance = t.status !== 'AVAILABLE';
                          return (
                            <button
                              key={t.id}
                              disabled={isMaintenance}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, tableId: t.id, startTime: '', endTime: '' }));
                              }}
                              className={`p-3 rounded-xl border text-left transition-all ${isSelected
                                  ? 'bg-snookerGreen/20 border-snookerGreen text-white shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                                  : isMaintenance
                                    ? 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                              <div className="font-bold text-sm truncate">{t.name}</div>
                              <div className="text-xs opacity-75 mt-0.5">₹{t.pricePerHour}/hr</div>
                              {isMaintenance && <div className="text-[10px] text-red-400 font-semibold mt-1">Maintenance</div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {poolTables.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">8-Ball Pool Tables</div>
                      <div className="grid grid-cols-2 gap-2">
                        {poolTables.map((t: any) => {
                          const isSelected = formData.tableId === t.id;
                          const isMaintenance = t.status !== 'AVAILABLE';
                          return (
                            <button
                              key={t.id}
                              disabled={isMaintenance}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, tableId: t.id, startTime: '', endTime: '' }));
                              }}
                              className={`p-3 rounded-xl border text-left transition-all ${isSelected
                                  ? 'bg-snookerGreen/20 border-snookerGreen text-white shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                                  : isMaintenance
                                    ? 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                              <div className="font-bold text-sm truncate">{t.name}</div>
                              <div className="text-xs opacity-75 mt-0.5">₹{t.pricePerHour}/hr</div>
                              {isMaintenance && <div className="text-[10px] text-red-400 font-semibold mt-1">Maintenance</div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Date Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-snookerGreen" />
                <span>2. Select Date</span>
              </label>
              <input
                type="date"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-snookerGreen transition-colors"
                value={formData.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value, startTime: '', endTime: '' }))}
              />
            </div>

            {/* 3. Duration & Time Selection */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <label className="block text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-goldAccent" />
                  <span>3. Choose Duration & Start Time</span>
                </label>
                <select
                  className="bg-black/50 border border-white/10 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-snookerGreen"
                  value={formData.durationHours}
                  onChange={(e) => {
                    const duration = parseInt(e.target.value);
                    setFormData(prev => {
                      const updated = { ...prev, durationHours: duration };
                      if (prev.startTime) {
                        let [startHr] = prev.startTime.split(':').map(Number);
                        let endHr = (startHr + duration) % 24;
                        updated.endTime = `${endHr.toString().padStart(2, '0')}:00`;
                      }
                      return updated;
                    });
                  }}
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                </select>
              </div>

              {/* Time Capsules Grid */}
              <div className="relative">
                {isLoadingBookings && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
                    <RefreshCw className="w-6 h-6 animate-spin text-snookerGreen" />
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {timeCapsules.map((capsule) => {
                    const isBooked = isSlotOverlap(capsule.value);
                    const isSelected = formData.startTime === capsule.value;
                    return (
                      <button
                        key={capsule.value}
                        disabled={isBooked}
                        onClick={() => handleTimeSelect(capsule.value)}
                        className={`py-2.5 px-1 rounded-lg text-xs font-semibold border transition-all ${isSelected
                            ? 'bg-goldAccent text-black border-goldAccent shadow-[0_0_12px_rgba(255,215,0,0.35)]'
                            : isBooked
                              ? 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed line-through'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        {capsule.display}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability Legend */}
              <div className="flex gap-4 mt-3 text-[10px] text-gray-500 justify-end">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-white/5 border border-white/10 inline-block"></span> Available</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-goldAccent inline-block"></span> Selected</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-white/5 line-through inline-block"></span> Booked</span>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!formData.startTime || !formData.tableId}
              className={`w-full font-bold py-4 px-4 rounded-xl transition-all mt-6 flex items-center justify-center gap-2 ${formData.startTime && formData.tableId
                  ? 'bg-snookerGreen hover:bg-snookerGreen/90 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
            >
              Review Booking Details &rarr;
            </button>

            <div className="relative flex items-center justify-center my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
              </div>
              <span className="relative bg-[#0d0d0d] px-3 text-[10px] text-gray-500 uppercase tracking-wider">Or plan with friends</span>
            </div>

            <button
              type="button"
              onClick={handleStartGroupBooking}
              className="w-full font-bold py-3.5 px-4 rounded-xl bg-snookerGreen/10 hover:bg-snookerGreen/20 border border-snookerGreen/35 hover:border-snookerGreen/50 text-white transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4.5 h-4.5 text-snookerGreen" />
              Start Group Booking Lobby
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
              <h4 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Booking Summary</h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white font-semibold text-base">
                    {new Date(formData.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Time</span>
                  <span className="text-white font-semibold text-base">{formData.startTime} to {formData.endTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-medium">{formData.durationHours} Hour{formData.durationHours > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Selected Table</span>
                  <span className="text-white font-medium bg-black/40 px-3 py-1.5 rounded border border-white/5">
                    {selectedTable?.name || 'Selected Table'} ({selectedTable?.type === 'SNOOKER' ? 'Snooker' : 'Pool'})
                  </span>
                </div>

                {/* Price Calculation */}
                <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-center">
                  <span className="text-gray-300 font-medium">Estimated Total</span>
                  <span className="text-3xl font-extrabold text-goldAccent">
                    ₹{(selectedTable?.pricePerHour || 0) * formData.durationHours}
                  </span>
                </div>
              </div>
            </div>

            {confirmBookingMutation.isError && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{confirmBookingMutation.error.message}</span>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-transparent border border-white/10 hover:bg-white/5 text-white font-semibold py-4 px-4 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmBookingMutation.isPending}
                className="w-2/3 bg-goldAccent hover:bg-goldAccent/90 text-black font-extrabold py-4 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {confirmBookingMutation.isPending ? 'Requesting...' : 'Request Booking'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Booking Setup Modal */}
      <AnimatePresence>
        {isGroupModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-snookerGreen/10 border border-snookerGreen/20 text-snookerGreen rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Setup Group Booking</h3>
                  <p className="text-xs text-gray-400">Invite friends to vote on tables and packages</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Tentative Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={groupData.date}
                    onChange={(e) => setGroupData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-snookerGreen transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Tentative Time
                  </label>
                  <input
                    type="time"
                    value={groupData.time}
                    onChange={(e) => setGroupData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-snookerGreen transition-all text-sm"
                  />
                </div>

                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-4 mt-6">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      {groupData.allowVoting ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                      Allow guest voting?
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      If enabled, guests can vote on packages and tables. If disabled, only the host can select them.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGroupData(prev => ({ ...prev, allowVoting: !prev.allowVoting }))}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${groupData.allowVoting ? 'bg-snookerGreen justify-end' : 'bg-white/10 justify-start'
                      }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md block animate-pulse" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="w-1/3 py-3 border border-white/10 rounded-xl font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => createLobbyMutation.mutate()}
                  disabled={createLobbyMutation.isPending}
                  className="w-2/3 py-3 bg-snookerGreen hover:bg-snookerGreen/90 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {createLobbyMutation.isPending ? 'Creating...' : 'Create Lobby '} &rarr;
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.22);
        }
      `}</style>
    </div>
  );
}
