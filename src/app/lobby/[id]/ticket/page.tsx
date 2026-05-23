'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  Tag,
  CreditCard,
  User,
  AlertCircle,
  Home
} from 'lucide-react';

interface BookingDetails {
  id: string;
  club: {
    name: string;
    location?: {
      city: string;
      area: string;
    };
  };
  table: {
    name: string;
    type: string;
  };
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  user: {
    name: string;
    email: string;
  };
}

function TicketContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { token: userToken } = useAuthStore();

  const lobbyId = params.id as string;
  const bookingId = searchParams.get('bookingId') || '';
  const paymentType = searchParams.get('paymentType') || 'ONLINE';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      const storedToken = localStorage.getItem(`lobby_token_${lobbyId}`);
      const activeToken = userToken || storedToken;

      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${activeToken}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setBooking(data.data);
        } else {
          showToast(data.message || 'Failed to load ticket details');
        }
      } catch (err) {
        console.error(err);
        showToast('Error connecting to API server');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId, lobbyId, userToken, showToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
        <div className="max-w-sm space-y-4">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Ticket Not Found</h2>
          <p className="text-zinc-500 text-sm">We couldn&apos;t load the reservation details for this ticket.</p>
          <button
            onClick={() => router.push('/clubs')}
            className="px-6 py-2.5 bg-zinc-800 rounded-xl text-white text-sm font-semibold hover:bg-zinc-700 transition-all inline-block"
          >
            Explore Clubs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.04),transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Ticket Header Banner */}
        <div className="bg-gradient-to-r from-snookerGreen to-goldAccent p-4 rounded-t-3xl text-black font-extrabold flex justify-between items-center shadow-lg">
          <span className="text-xs uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            Cue King Pass
          </span>
          <span className="text-xs bg-black/10 px-2 py-0.5 rounded uppercase">
            {paymentType === 'ONLINE' ? 'Paid Online' : 'Pay at Venue'}
          </span>
        </div>

        {/* Ticket Body Stub */}
        <div className="bg-zinc-950 border-x border-b border-zinc-850 p-6 space-y-6 shadow-2xl relative">
          
          {/* Jagged coupon cutouts on the sides */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full border-r border-zinc-850" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full border-l border-zinc-850" />

          {/* Club Info */}
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-tight">{booking.club.name}</h2>
            <div className="flex items-center text-zinc-500 text-xs mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {booking.club.location?.area}, {booking.club.location?.city}
            </div>
          </div>

          <hr className="border-dashed border-zinc-800" />

          {/* Booking Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Date</span>
              <p className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-snookerGreen" />
                {new Date(booking.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
              </p>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Time</span>
              <p className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-goldAccent" />
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Reserved Table</span>
              <p className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-400" />
                {booking.table.name}
              </p>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Lobby Host</span>
              <p className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-400" />
                {booking.user.name || booking.user.email.split('@')[0]}
              </p>
            </div>
          </div>

          <hr className="border-dashed border-zinc-800" />

          {/* Pricing Info */}
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
            <div className="space-y-0.5">
              <span className="text-zinc-400 text-xs">Simulated Price</span>
              <p className="text-[10px] text-zinc-500">Includes all chosen packages</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-goldAccent">₹{booking.totalPrice}</span>
            </div>
          </div>

          {/* QR Code section */}
          <div className="flex flex-col items-center justify-center p-4 border border-zinc-800/80 rounded-2xl bg-zinc-900/30">
            <div className="w-36 h-36 bg-white p-3 rounded-xl shadow-lg relative flex items-center justify-center">
              {/* QR Pattern mock */}
              <div className="w-full h-full bg-[radial-gradient(square_at_center,rgba(0,0,0,0.8)_3px,transparent_3px)] bg-[size:10px_10px] border-2 border-zinc-900 flex flex-wrap p-1 gap-1">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className={`w-8 h-8 border border-black ${i % 3 === 0 || i === 8 ? 'bg-black' : ''}`} />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 mt-3 font-semibold uppercase tracking-wider">
              Scan ticket stub at club reception
            </span>
          </div>

        </div>

        {/* Ticket bottom footer styling */}
        <div className="h-6 w-full bg-zinc-950 border-x border-b border-zinc-850 rounded-b-3xl relative overflow-hidden">
          {/* Stub perforation holes representation */}
          <div className="absolute inset-x-0 bottom-1 flex justify-between px-2 gap-1.5">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-black border border-zinc-850" />
            ))}
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="mt-8 flex gap-3 w-full">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => router.push('/bookings')}
            className="flex-1 py-3.5 rounded-2xl bg-goldAccent hover:bg-goldAccent/90 text-black font-extrabold transition-all flex items-center justify-center gap-2 text-xs shadow-[0_0_15px_rgba(255,215,0,0.15)]"
          >
            <CreditCard className="w-4 h-4" />
            My Bookings List
          </button>
        </div>

      </motion.div>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <TicketContent />
    </Suspense>
  );
}
