'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, MapPin, Tag, Calendar, User, Phone, 
  MessageSquare, Edit3, Trash2, ArrowLeft, ShieldCheck, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';
import { API_BASE_URL } from '@/config/api';

// Helper for calculating geographical distance in km using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  condition?: string;
  age?: string;
  lat?: number;
  lng?: number;
  locationName?: string;
  status: string;
  ownerId: string;
  createdAt: string;
  club?: {
    id: string;
    name: string;
  } | null;
  owner?: {
    id: string;
    name?: string;
    email: string;
    phoneNumber?: string;
  } | null;
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const { user, token, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const isOwner = user?.id === product.ownerId || user?.role === 'ADMIN';

  // Geolocation detection
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Location permissions denied: fallback to city details.', error);
        }
      );
    }
  }, []);

  // Calculate distance for display
  let distanceStr = '';
  if (userCoords && product.lat && product.lng) {
    const d = getDistance(userCoords.lat, userCoords.lng, product.lat, product.lng);
    distanceStr = `${d.toFixed(1)} km away from you`;
  } else {
    distanceStr = product.locationName || 'Location details not provided';
  }

  // Delete Ad handler
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Listing deleted successfully.');
        router.push('/shop');
      } else {
        showToast(data.message || 'Could not delete product');
      }
    } catch (err) {
      showToast('Error during deletion');
    }
  };

  // Toggle status SOLD
  const handleToggleSold = async (newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${product.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Product status updated to ${newStatus}`);
        router.refresh();
      } else {
        showToast(data.message || 'Could not update status');
      }
    } catch (e) {
      showToast('Error updating status');
    }
  };

  // Redirect to negotiation chat
  const handleStartChat = () => {
    if (!isAuthenticated) {
      showToast('Please login to message the seller.');
      router.push(`/login?returnUrl=${encodeURIComponent('/shop/chat?productId=' + product.id)}`);
      return;
    }
    router.push(`/shop/chat?productId=${product.id}`);
  };

  // Redirect to edit listing
  const handleEditRedirect = () => {
    router.push(`/shop/${product.id}/edit`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
      
      {/* Back button */}
      <Link 
        href="/shop" 
        className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors font-medium text-sm group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image */}
        <div className="lg:col-span-7 space-y-6">
          <div className="w-full bg-[#111] border border-white/10 rounded-3xl overflow-hidden flex items-center justify-center p-4 min-h-[400px] relative shadow-2xl">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="object-contain max-h-[500px] w-full rounded-2xl"
              />
            ) : (
              <div className="flex flex-col items-center text-white/20 gap-3">
                <ShoppingBag size={64} />
                <span className="text-xs uppercase font-extrabold tracking-widest">No Image Available</span>
              </div>
            )}

            {product.status === 'SOLD' && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-xs z-10">
                <span className="px-8 py-3 border-4 border-red-500 bg-black text-red-500 font-black text-lg uppercase tracking-widest rounded-xl transform -rotate-12 shadow-2xl animate-pulse">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Description Card */}
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              About this Product <ShoppingBag size={18} className="text-goldAccent" />
            </h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {product.description || 'Welcome to Cue King Marketplace! The seller has not provided a description for this product. Use the Chat option to contact the seller directly for specifics.'}
            </p>
          </div>
        </div>

        {/* Right Column: Listing info & Actions */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl relative overflow-hidden">
            {/* Condition badge */}
            <div className="flex justify-between items-start gap-4">
              {product.condition && (
                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-black ${
                  product.condition === 'NEW' 
                    ? 'bg-snookerGreen text-white' 
                    : product.condition === 'GENTLE_USE'
                    ? 'bg-goldAccent text-black'
                    : 'bg-red-400 text-black'
                }`}>
                  {product.condition === 'GENTLE_USE' ? 'Gentle Use' : product.condition === 'HEAVILY_USED' ? 'Moderate Use' : product.condition}
                </span>
              )}
              {product.age && (
                <span className="text-xs text-white/40 font-bold uppercase tracking-wider">{product.age} Old</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">
                {product.name}
              </h1>
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
                ₹{product.price.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5 text-sm">
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="text-goldAccent flex-shrink-0" size={16} />
                <span className="font-semibold">{distanceStr}</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Calendar className="text-zinc-500 flex-shrink-0" size={16} />
                <span>Listed on {new Date(product.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
              {product.club && (
                <div className="flex items-center gap-3 text-white/70">
                  <ShieldCheck className="text-snookerGreen flex-shrink-0" size={16} />
                  <span>Associated Club: <span className="text-goldAccent font-bold">{product.club.name}</span></span>
                </div>
              )}
            </div>
          </div>

          {/* Seller Details Card */}
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white/40 mb-3">Seller Details</h3>
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="w-12 h-12 rounded-full bg-snookerGreen/20 border border-snookerGreen flex items-center justify-center text-snookerGreen font-extrabold text-lg">
                {(product.owner?.name || 'S')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-base font-bold text-white">{product.owner?.name || 'Anonymous User'}</p>
                <p className="text-xs text-white/40">{product.owner?.email}</p>
              </div>
            </div>

            {/* Phone Reveal */}
            {product.owner?.phoneNumber ? (
              <div className="flex items-center justify-between py-2 text-sm bg-black/40 px-4 rounded-xl border border-white/5 font-mono">
                <span className="flex items-center gap-2 text-white/50"><Phone size={14} className="text-goldAccent" /> Contact:</span>
                <span className="font-bold tracking-wider text-white">{product.owner.phoneNumber}</span>
              </div>
            ) : (
              <p className="text-xs text-white/30 italic text-center py-2">No direct contact number shared. Start chat to negotiate.</p>
            )}
          </div>

          {/* Action Box */}
          <div className="space-y-3">
            {isOwner ? (
              <>
                <button
                  onClick={handleEditRedirect}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 size={16} /> Edit Ad Listing
                </button>
                {product.status !== 'SOLD' ? (
                  <button
                    onClick={() => handleToggleSold('SOLD')}
                    className="w-full py-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Mark as Sold Out
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleSold('ACTIVE')}
                    className="w-full py-3.5 bg-snookerGreen/10 border border-snookerGreen/20 rounded-2xl text-sm font-bold text-snookerGreen hover:bg-snookerGreen/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Republish Ad (Mark Active)
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full py-3.5 bg-red-500/20 hover:bg-red-500 border border-red-500/35 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 size={16} /> Delete Listing Ad
                </button>
              </>
            ) : (
              product.status !== 'SOLD' && (
                <button
                  onClick={handleStartChat}
                  className="w-full py-4 bg-gradient-to-r from-snookerGreen to-snookerGreen/80 hover:from-snookerGreen hover:to-snookerGreen text-white rounded-2xl text-base font-extrabold transition-all shadow-lg shadow-snookerGreen/20 flex items-center justify-center gap-2.5 cursor-pointer hover:shadow-xl"
                >
                  <MessageSquare size={18} /> Chat & Start Negotiation
                </button>
              )
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
