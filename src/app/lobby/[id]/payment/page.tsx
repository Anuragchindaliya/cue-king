'use client';

import { useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/components/ToastProvider';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Store,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

function PaymentContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const lobbyId = params.id as string;
  const bookingId = searchParams.get('bookingId') || '';
  const price = searchParams.get('price') || '150';

  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form inputs for simulated card
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/lobby/${lobbyId}/payment-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          paymentType: paymentMode
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        showToast('Payment processed successfully!');
        // Redirect will be broadcast to all members, but let's push host too in case
        setTimeout(() => {
          router.push(`/lobby/${lobbyId}/ticket?bookingId=${bookingId}&paymentType=${paymentMode}`);
        }, 1500);
      } else {
        showToast(data.message || 'Payment processing failed');
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.03),transparent_70%)] pointer-events-none" />

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
            <h3 className="text-3xl font-extrabold text-white mb-2">Booking Confirmed!</h3>
            <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
              Your payment has been finalized. Redirecting you and your lobby guests to the ticket stub...
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
              <span className="text-2xl font-extrabold text-goldAccent">₹{price}</span>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-black/60 border border-zinc-800/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentMode('ONLINE')}
                className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  paymentMode === 'ONLINE' ? 'bg-zinc-850 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Pay Online
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('OFFLINE')}
                className={`py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  paymentMode === 'OFFLINE' ? 'bg-zinc-850 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Store className="w-4 h-4" />
                Pay Offline Later
              </button>
            </div>

            {/* Checkout Options Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {paymentMode === 'ONLINE' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-goldAccent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="•••• •••• •••• ••••"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      required
                      className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-goldAccent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength={5}
                        required
                        className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-goldAccent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value)}
                        maxLength={3}
                        required
                        className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-goldAccent transition-all"
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 pt-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Secure simulated checkout environment. No real money charged.
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                    <Store className="w-5 h-5" />
                    Offline Payment Confirmation
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    By choosing Pay Offline, your group booking request will be submitted to the club owner. Your group members will be redirected, and you can settle the amount directly with the vendor upon your arrival.
                  </p>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 pt-2">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                    Subject to club verification policies.
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-goldAccent hover:bg-goldAccent/90 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-6"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {paymentMode === 'ONLINE' ? 'Pay Online (Free Simulation)' : 'Confirm Offline Booking'}
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
