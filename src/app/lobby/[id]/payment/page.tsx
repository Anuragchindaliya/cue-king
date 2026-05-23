'use client';

import { useState, Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import {
  Store,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  QrCode,
  Smartphone,
  Info
} from 'lucide-react';

function PaymentContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { token } = useAuthStore();

  const lobbyId = params.id as string;
  const bookingId = searchParams.get('bookingId') || '';
  const price = searchParams.get('price') || '150';

  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    if (bookingId && token) {
      fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBookingDetails(data.data);
          }
        })
        .catch(err => console.error("Error fetching booking details:", err));
    }
  }, [bookingId, token]);

  const upiId = bookingDetails?.club?.upiId || 'cueking@upi';
  const clubName = bookingDetails?.club?.name || 'Cue King Club';
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(clubName)}&am=${price}&cu=INR&tn=${encodeURIComponent('Lobby-' + lobbyId)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&color=000000&bgcolor=ffffff`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/lobby/${lobbyId}/payment-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          paymentType: paymentMode
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        showToast('Payment submitted successfully!');
        setTimeout(() => {
          router.push(`/lobby/${lobbyId}/ticket?bookingId=${bookingId}&paymentType=${paymentMode}`);
        }, 1500);
      } else {
        showToast(data.message || 'Payment submission failed');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Error processing checkout');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-16 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,100,0.03),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-lg bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative backdrop-blur-xl">
        
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10"
          >
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-3xl font-extrabold text-white mb-2">Booking Processing!</h3>
            <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
              Your booking status is updating. Settle offline with the vendor or wait for confirmation. Redirecting...
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-white">Lobby Checkout</h1>
              <p className="text-zinc-400 text-xs mt-1">Complete your group reservation details</p>
            </div>

            {/* Price Badge */}
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Total Due</span>
              <span className="text-2xl font-extrabold text-snookerGreen">₹{price}</span>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-black/60 border border-zinc-800/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentMode('ONLINE')}
                className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  paymentMode === 'ONLINE' ? 'bg-zinc-900 text-white border border-zinc-850 shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Smartphone className="w-4 h-4 text-snookerGreen" />
                Pay via UPI
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('OFFLINE')}
                className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  paymentMode === 'OFFLINE' ? 'bg-zinc-900 text-white border border-zinc-850 shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Store className="w-4 h-4 text-amber-500" />
                Pay Offline Later
              </button>
            </div>

            {/* Checkout Options Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {paymentMode === 'ONLINE' ? (
                <div className="space-y-6 flex flex-col items-center">
                  <div className="bg-white p-4 rounded-2xl border border-zinc-800 shadow-lg inline-block">
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI QR Code" 
                      className="w-48 h-48 block" 
                    />
                  </div>
                  
                  <div className="text-center space-y-1.5 px-4">
                    <p className="text-xs text-zinc-400">
                      Scan QR code with any UPI app to pay
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      UPI ID: {upiId}
                    </p>
                  </div>

                  {/* Deep Link for Mobile Browsers */}
                  <a
                    href={upiLink}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-all border border-zinc-800 flex items-center justify-center gap-2 shadow-inner"
                  >
                    <Smartphone className="w-4 h-4 text-snookerGreen" />
                    Open in Mobile UPI App
                  </a>

                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 w-full flex gap-3 text-left">
                    <Info className="w-5 h-5 text-snookerGreen shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Settle this pre-filled amount of <strong>₹{price}</strong> through UPI. Once done, tap the <strong>Confirm Payment</strong> button below. The owner will verify the transaction against bank credit.
                    </p>
                  </div>

                  <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 w-full justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Frictionless UPI Checkout. Zero Gateway Fees.
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                    <Store className="w-5 h-5" />
                    Offline Payment Confirmation
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    By choosing Pay Offline, your booking request is logged and the owner will finalize reservation details when you arrive. You can settle the amount at the club counter.
                  </p>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 pt-2">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                    Subject to club availability check.
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-snookerGreen hover:bg-snookerGreen/90 text-white font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(0,185,100,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-6"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {paymentMode === 'ONLINE' ? 'Confirm Payment Details' : 'Confirm Offline Booking'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
