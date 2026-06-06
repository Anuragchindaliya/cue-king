'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Upload, X, Compass, Sparkles, ShoppingBag, Save, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';
import { API_BASE_URL } from '@/config/api';

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
  club?: {
    id: string;
    name: string;
  } | null;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { token, user, isAuthenticated } = useAuthStore();
  const productId = params.id as string;

  // Page States
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myClubs, setMyClubs] = useState<{ id: string; name: string }[]>([]);

  // Form States
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCondition, setFormCondition] = useState('NEW');
  const [formAge, setFormAge] = useState('');
  const [formLocationName, setFormLocationName] = useState('');
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);
  const [formImage, setFormImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formClubId, setFormClubId] = useState('');

  // Auth & Permissions Guard
  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Please login to edit your listing.');
      router.push(`/login?returnUrl=${encodeURIComponent(`/shop/${productId}/edit`)}`);
    }
  }, [isAuthenticated, productId, router]);

  // Load product details & user clubs
  useEffect(() => {
    if (!isAuthenticated || !token || !productId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Product
        const productRes = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        const productData = await productRes.json();
        
        if (!productData.success) {
          showToast(productData.message || 'Product not found.');
          router.push('/shop');
          return;
        }

        const product: Product = productData.data;

        // Verify ownership (or Admin)
        if (product.ownerId !== user?.id && user?.role !== 'ADMIN') {
          showToast('Unauthorized: You do not own this listing.');
          router.push(`/shop/${productId}`);
          return;
        }

        // Prepopulate form
        setFormName(product.name);
        setFormPrice(product.price.toString());
        setFormDescription(product.description || '');
        setFormCondition(product.condition || 'NEW');
        setFormAge(product.age || '');
        setFormLocationName(product.locationName || '');
        setFormLat(product.lat || null);
        setFormLng(product.lng || null);
        setFormClubId(product.club?.id || '');
        setImagePreview(product.image ? `${product.image}` : null);

        // 2. Fetch User Clubs if they are club owner
        if (user?.role === 'CLUB_OWNER') {
          const clubsRes = await fetch(`${API_BASE_URL}/api/clubs/my-clubs`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const clubsData = await clubsRes.json();
          if (clubsData.success) {
            setMyClubs(clubsData.data);
          }
        }
      } catch (err) {
        console.error(err);
        showToast('Error loading details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, isAuthenticated, token, user, router]);

  // Geolocation detection inside Form
  const handleAutoDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormLat(position.coords.latitude);
        setFormLng(position.coords.longitude);
        setFormLocationName(prev => prev || 'My Current Location');
        showToast('Detected coordinates successfully!');
      }, (err) => {
        console.error(err);
        showToast('Could not access current location coordinates.');
      });
    } else {
      showToast('Geolocation is not supported by your browser.');
    }
  };

  // Handle Image Change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Submit Updated Details
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      showToast('Product title and price are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('price', formPrice);
      formData.append('description', formDescription);
      formData.append('condition', formCondition);
      formData.append('age', formAge);
      formData.append('locationName', formLocationName);
      
      if (formLat) formData.append('lat', formLat.toString());
      if (formLng) formData.append('lng', formLng.toString());
      if (formClubId) formData.append('clubId', formClubId);
      if (formImage) formData.append('image', formImage);

      const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        showToast('Listing updated successfully!');
        router.push(`/shop/${productId}`);
        router.refresh();
      } else {
        showToast(data.message || 'Failed to update listing.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 min-h-screen bg-black text-white flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-400 font-medium">Loading listing details...</span>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16 min-h-screen bg-black text-white relative z-10">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Back Link */}
        <Link 
          href={`/shop/${productId}`} 
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors font-medium text-xs group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Product Details
        </Link>

        {/* Title */}
        <div className="mb-8 border-b border-white/10 pb-5">
          <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-2">
            Edit Ad Listing <Sparkles size={20} className="text-goldAccent animate-pulse" />
          </h1>
          <p className="text-xs text-white/40 mt-1">Make changes to your product details and republish</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#0c0c0c] border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Product Title *</label>
              <input 
                type="text"
                placeholder="e.g. Predator Limited Cue Stick"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full bg-[#141414] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3.5 rounded-xl text-sm"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Price (₹) *</label>
              <input 
                type="number"
                placeholder="e.g. 15000"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
                className="w-full bg-[#141414] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3.5 rounded-xl text-sm font-semibold text-goldAccent"
              />
            </div>

            {/* Condition & Age */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Condition</label>
                <select
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3.5 rounded-xl text-sm cursor-pointer"
                >
                  <option value="NEW">New</option>
                  <option value="GENTLE_USE">Gentle Use</option>
                  <option value="HEAVILY_USED">Moderate Use</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">How Old</label>
                <input 
                  type="text"
                  placeholder="e.g. 3 months"
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3.5 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Description</label>
              <textarea 
                placeholder="Describe the cue wood type, tip width, condition details, delivery options..."
                rows={4}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3.5 rounded-xl text-sm resize-none leading-relaxed"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Product Image</label>
              <div className="border border-dashed border-white/15 rounded-xl p-6 flex flex-col items-center justify-center bg-[#141414] hover:bg-white/2 cursor-pointer transition-all relative min-h-[140px]">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {imagePreview ? (
                  <div className="relative w-full h-40 flex items-center justify-center p-2">
                    <img src={imagePreview} alt="Preview" className="object-contain h-full rounded-xl" />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 p-1.5 bg-black/80 rounded-full hover:bg-red-500 text-white transition-all shadow-md"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center text-white/40 gap-1.5 py-4">
                    <Upload size={24} className="text-goldAccent animate-pulse" />
                    <span className="text-xs font-bold text-white/60">Upload new image or keep existing</span>
                    <span className="text-[9px]">PNG, JPG, WEBP up to 5MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Area & GPS Coordinates */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Location / City</label>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  className="text-[9px] text-goldAccent font-black hover:text-white transition-colors flex items-center gap-1"
                >
                  <Compass size={11} /> Auto-detect Coordinates
                </button>
              </div>
              <input 
                type="text"
                placeholder="e.g. Connaught Place, New Delhi"
                value={formLocationName}
                onChange={(e) => setFormLocationName(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3.5 rounded-xl text-sm"
              />
              {formLat && formLng && (
                <span className="text-[9px] text-snookerGreen font-mono block mt-1">
                  GPS Coordinates Locked: {formLat.toFixed(4)}, {formLng.toFixed(4)}
                </span>
              )}
            </div>

            {/* Optional Club Attachment */}
            {myClubs.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Attach to My Club (Optional)</label>
                <select
                  value={formClubId}
                  onChange={(e) => setFormClubId(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3.5 rounded-xl text-sm cursor-pointer"
                >
                  <option value="">No club attachment</option>
                  {myClubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit & Cancel Buttons */}
            <div className="pt-6 border-t border-white/10 mt-8 flex gap-4">
              <Link
                href={`/shop/${productId}`}
                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all text-center border border-white/5"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-gradient-to-r from-snookerGreen to-snookerGreen/80 hover:from-snookerGreen hover:to-snookerGreen text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-snookerGreen/10 cursor-pointer"
              >
                <Save size={14} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
