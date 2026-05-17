'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';

export default function BookingFlow({ club }: { club: any }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    tableCategoryId: club.tableCategories?.[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    durationHours: 1,
  });

  const generateTimeCapsules = (open: string, close: string) => {
    if (!open || !close) return [];
    const capsules = [];
    let [openHr] = open.split(':').map(Number);
    let [closeHr] = close.split(':').map(Number);
    
    if (closeHr <= openHr) closeHr += 24; // Handle overnight

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

  const handleTimeSelect = (timeStr: string) => {
    let [startHr] = timeStr.split(':').map(Number);
    let endHr = (startHr + formData.durationHours) % 24;
    const endStr = `${endHr.toString().padStart(2, '0')}:00`;
    setFormData({ ...formData, startTime: timeStr, endTime: endStr });
  };

  const handleNext = () => {
    if (!formData.tableCategoryId || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Please fill all fields');
      return;
    }
    setStep(2);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pending = localStorage.getItem('pendingBooking');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.clubId === club.id) {
            setFormData({
              tableCategoryId: parsed.tableCategoryId,
              date: parsed.date,
              startTime: parsed.startTime,
              endTime: parsed.endTime,
              durationHours: parsed.durationHours,
            });
            setStep(2); // Go straight to review step
          }
        } catch (err) {
          console.error('Failed to parse pending booking', err);
        }
      }
    }
  }, [club.id]);

  const confirmBookingMutation = useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('UNAUTHORIZED');
      }

      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      let endDateObj = new Date(`${formData.date}T${formData.endTime}:00`);
      
      // Handle next day end time
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
          tableCategoryId: formData.tableCategoryId,
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
      localStorage.removeItem('pendingBooking'); // Clear it on success
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

  if (step === 3) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-snookerGreen rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Booking Requested!</h3>
        <p className="text-gray-400">The club owner has been notified and will accept or reject your request shortly.</p>
      </div>
    );
  }

  return (
    <div>
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">1. Select Table Type</label>
            <div className="grid grid-cols-2 gap-3">
              {club.tableCategories?.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, tableCategoryId: cat.id })}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formData.tableCategoryId === cat.id 
                      ? 'bg-snookerGreen/20 border-snookerGreen text-white' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className="font-bold">{cat.name}</div>
                  <div className="text-sm opacity-80">₹{cat.pricePerHour}/hr</div>
                </button>
              ))}
            </div>
            {!club.tableCategories?.length && <p className="text-gray-500">No tables available</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">2. Select Date</label>
            <input
              type="date"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-snookerGreen transition-colors"
              value={formData.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="block text-sm font-medium text-gray-300">3. Select Start Time</label>
              <select 
                className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                value={formData.durationHours}
                onChange={(e) => {
                  const duration = parseInt(e.target.value);
                  setFormData({ ...formData, durationHours: duration });
                  if (formData.startTime) {
                    let [startHr] = formData.startTime.split(':').map(Number);
                    let endHr = (startHr + duration) % 24;
                    setFormData(prev => ({...prev, endTime: `${endHr.toString().padStart(2, '0')}:00`}));
                  }
                }}
              >
                <option value={1}>1 Hour</option>
                <option value={2}>2 Hours</option>
                <option value={3}>3 Hours</option>
                <option value={4}>4 Hours</option>
              </select>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {timeCapsules.map((capsule) => (
                <button
                  key={capsule.value}
                  onClick={() => handleTimeSelect(capsule.value)}
                  className={`py-2 px-1 rounded-md text-sm font-medium border transition-colors ${
                    formData.startTime === capsule.value
                      ? 'bg-goldAccent text-black border-goldAccent shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {capsule.display}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!formData.startTime}
            className={`w-full font-bold py-4 px-4 rounded-lg transition-colors mt-6 ${
              formData.startTime 
                ? 'bg-snookerGreen hover:bg-snookerGreen/80 text-white shadow-[0_0_15px_rgba(0,255,156,0.2)]' 
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            Review Booking Details
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h4 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Booking Summary</h4>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Date</span>
                <span className="text-white font-medium text-lg">{new Date(formData.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Time</span>
                <span className="text-white font-medium text-lg">{formData.startTime} to {formData.endTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Duration</span>
                <span className="text-white font-medium">{formData.durationHours} Hour{formData.durationHours > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Table Type</span>
                <span className="text-white font-medium bg-black/30 px-3 py-1 rounded">
                  {club.tableCategories?.find((c: any) => c.id === formData.tableCategoryId)?.name}
                </span>
              </div>
              
              {/* Price Calculation */}
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-gray-300">Estimated Total</span>
                <span className="text-2xl font-bold text-goldAccent">
                  ₹{(club.tableCategories?.find((c: any) => c.id === formData.tableCategoryId)?.pricePerHour || 0) * formData.durationHours}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setStep(1)}
              className="w-1/3 bg-transparent border border-white/20 hover:bg-white/5 text-white font-medium py-4 px-4 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmBookingMutation.isPending}
              className="w-2/3 bg-goldAccent hover:bg-goldAccent/80 text-black font-bold py-4 px-4 rounded-lg transition-colors shadow-[0_0_15px_rgba(255,215,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmBookingMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
