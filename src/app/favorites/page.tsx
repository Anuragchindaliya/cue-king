'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Star, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';

interface Club {
  id: string;
  name: string;
  coverImage: string | null;
  rating: number;
  fullAddress: string | null;
  description: string | null;
}

interface Favorite {
  id: string;
  club: Club;
}

export default function FavoritesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, initialize, token } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/login?returnUrl=/favorites');
    }
  }, [isMounted, isAuthenticated, router]);

  // Query favorites
  const { data: favorites = [], isLoading } = useQuery<Favorite[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token,
  });

  // Toggle favorite mutation (for removing)
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (clubId: string) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenVal}`,
        },
        body: JSON.stringify({ clubId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return clubId;
    },
    onSuccess: (clubId) => {
      // Optimistically update favorites by removing the item
      queryClient.setQueryData<Favorite[]>(['favorites'], (prev) => {
        if (!prev) return [];
        return prev.filter((f) => f.club.id !== clubId);
      });
    },
  });

  if (!isMounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 border-b border-white/15 pb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
            Favorite Clubs
          </h1>
          <p className="text-gray-400 mt-2">
            Your curated list of preferred venues for pool and snooker.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 bg-white/5 rounded-2xl border border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 border border-white/10 bg-white/5 rounded-3xl backdrop-blur-md"
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Favorites Yet</h3>
            <p className="text-gray-400 text-center max-w-sm mb-8">
              Save your favorite clubs to easily book them in the future.
            </p>
            <Link
              href="/play"
              className="px-6 py-3 rounded-xl bg-snookerGreen hover:bg-snookerGreen/90 text-white font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-2"
            >
              Explore Clubs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {favorites.map((fav) => (
                <motion.div
                  key={fav.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group relative bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
                >
                  <div className="relative h-48 w-full bg-white/5 overflow-hidden">
                    {fav.club.coverImage ? (
                      <div
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{
                          backgroundImage: `url('${
                            fav.club.coverImage.startsWith('http')
                              ? fav.club.coverImage
                              : `${API_BASE_URL}${fav.club.coverImage}`
                          }')`,
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10 text-gray-500 font-bold">
                        Cue King Venue
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <button
                      onClick={() => toggleFavoriteMutation.mutate(fav.club.id)}
                      disabled={toggleFavoriteMutation.isPending}
                      className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-rose-500 hover:bg-black/80 hover:scale-110 active:scale-95 transition-all"
                      title="Remove from favorites"
                    >
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </button>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15">
                        <Star className="w-4 h-4 text-goldAccent fill-goldAccent" />
                        <span className="text-xs font-bold text-white">
                          {fav.club.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-snookerGreen transition-colors line-clamp-1">
                        {fav.club.name}
                      </h3>
                      {fav.club.fullAddress && (
                        <p className="text-gray-400 text-sm flex items-center gap-1.5 mb-4">
                          <MapPin className="w-4 h-4 text-goldAccent shrink-0" />
                          <span className="line-clamp-1">{fav.club.fullAddress}</span>
                        </p>
                      )}
                      <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">
                        {fav.club.description || 'Premium snooker tables with high quality service.'}
                      </p>
                    </div>

                    <Link
                      href={`/club/${fav.club.id}`}
                      className="w-full py-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-snookerGreen group-hover:border-snookerGreen group-hover:text-white text-gray-200 font-bold transition-all text-center flex items-center justify-center gap-2 text-sm shadow-md"
                    >
                      Book A Slot
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
