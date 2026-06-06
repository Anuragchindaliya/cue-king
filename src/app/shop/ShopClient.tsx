'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, SlidersHorizontal, Plus, MapPin, Tag, Compass, 
  MessageSquare, User, Phone, CheckCircle, Trash2, X, Send, 
  Upload, Sparkles, Filter, Check, ShoppingBag, Eye, Calendar, ArrowUpDown
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/providers/SocketProvider';
import { useToast } from '@/components/ToastProvider';
import { API_BASE_URL } from '@/config/api';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface ChatRoom {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    status: string;
  };
  buyer: {
    id: string;
    name?: string;
    email: string;
  };
  seller: {
    id: string;
    name?: string;
    email: string;
  };
  messages: {
    id: string;
    message: string;
    createdAt: string;
  }[];
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name?: string;
    email: string;
  };
}

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const { user, token, isAuthenticated } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core State
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  
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

  // Deep linking and redirects after login
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const openCreateParam = searchParams.get('openCreate');

    if (isAuthenticated && token) {
      if (openCreateParam === 'true') {
        setIsCreateDrawerOpen(true);
        router.replace('/shop');
      }
    }
  }, [searchParams, isAuthenticated, token]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [maxDistance, setMaxDistance] = useState<number>(50); // max 50km
  const [sortBy, setSortBy] = useState<'date' | 'price-asc' | 'price-desc' | 'distance'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [viewTab, setViewTab] = useState<'all' | 'my'>('all');

  // Modal / Drawer States
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  // Form State
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
  const [myClubs, setMyClubs] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch my clubs for the dropdown (if club owner)
  useEffect(() => {
    if (isAuthenticated && token && user?.role === 'CLUB_OWNER') {
      fetch(`${API_BASE_URL}/api/clubs/my-clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMyClubs(data.data);
        }
      })
      .catch(err => console.error('Error fetching owner clubs:', err));
    }
  }, [isAuthenticated, token, user]);

  // Fetch all products (handles server filters & merges client locations)
  const refreshProducts = async () => {
    try {
      let url = `${API_BASE_URL}/api/products?`;
      if (viewTab === 'my' && token) {
        url = `${API_BASE_URL}/api/products/my`;
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.append('name', searchQuery);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (selectedCondition !== 'ALL') params.append('condition', selectedCondition);
        url += params.toString();
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (e) {
      console.error(e);
      showToast('Error fetching products');
    }
  };

  // Re-fetch products when filters or tabs change
  useEffect(() => {
    refreshProducts();
  }, [viewTab, searchQuery, minPrice, maxPrice, selectedCondition]);

  // Geolocation auto-detection inside Form
  const handleAutoDetectFormLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormLat(position.coords.latitude);
        setFormLng(position.coords.longitude);
        setFormLocationName('My Current Location');
        showToast('Detected coordinates successfully!');
      }, () => {
        showToast('Could not access current location coordinates.');
      });
    }
  };

  // Image Drag-and-Drop or Select
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Form Reset
  const resetForm = () => {
    setFormName('');
    setFormPrice('');
    setFormDescription('');
    setFormCondition('NEW');
    setFormAge('');
    setFormLocationName('');
    setFormLat(null);
    setFormLng(null);
    setFormImage(null);
    setImagePreview(null);
    setFormClubId('');
  };

  // Create Ad
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      showToast('Title and Price are required.');
      return;
    }

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

    try {
      const url = `${API_BASE_URL}/api/products`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData // Let browser set Content-Type header with boundaries
      });

      const data = await res.json();
      if (data.success) {
        showToast('Ad created successfully!');
        resetForm();
        setIsCreateDrawerOpen(false);
        refreshProducts();
      } else {
        showToast(data.message || 'Operation failed');
      }
    } catch (err) {
      showToast('Network error during form submission');
    } finally {
      setIsSubmitting(false);
    }
  };



  // Filter products on client (mainly coordinates distance filter)
  const processedProducts = products.filter(product => {
    // Distance Filter
    if (userCoords && product.lat && product.lng) {
      const dist = getDistance(userCoords.lat, userCoords.lng, product.lat, product.lng);
      if (dist > maxDistance) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'distance' && userCoords) {
      const distA = a.lat && a.lng ? getDistance(userCoords.lat, userCoords.lng, a.lat, a.lng) : 9999;
      const distB = b.lat && b.lng ? getDistance(userCoords.lat, userCoords.lng, b.lat, b.lng) : 9999;
      return distA - distB;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // date desc
  });

  return (
    <div className="relative min-h-screen bg-black/90 text-white font-sans overflow-hidden">
      
      {/* Background Neon Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-snookerGreen/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-goldAccent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        {/* Marketplace Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-3">
              Cue King Marketplace <Sparkles className="text-goldAccent animate-pulse w-8 h-8" />
            </h1>
            <p className="text-lg text-white/50 mt-2 max-w-xl">
              Buy, sell, and negotiate premium cue sticks, tournament balls, and accessories directly within our cue sports community.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* View switcher */}
            <div className="flex bg-[#111] p-1 rounded-full border border-white/15">
              <button 
                onClick={() => setViewTab('all')}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${viewTab === 'all' ? 'bg-snookerGreen text-white shadow-md shadow-snookerGreen/20' : 'text-white/60 hover:text-white'}`}
              >
                Browse Ads
              </button>
              {isAuthenticated && (
                <button 
                  onClick={() => setViewTab('my')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${viewTab === 'my' ? 'bg-snookerGreen text-white shadow-md shadow-snookerGreen/20' : 'text-white/60 hover:text-white'}`}
                >
                  My Listings
                </button>
              )}
            </div>

            {/* Chat Inbox Button */}
            {isAuthenticated && (
              <button 
                onClick={() => router.push('/shop/chat')}
                className="relative flex items-center gap-2 px-5 py-2 bg-[#111] border border-white/10 rounded-full text-sm font-bold hover:bg-white/5 hover:border-goldAccent/30 transition-all text-goldAccent"
              >
                <MessageSquare size={16} /> Negotiation Inbox
              </button>
            )}

            {/* Create Ad Button */}
            <button 
              onClick={() => {
                if (!isAuthenticated) {
                  showToast('Please login to post a listing.');
                  router.push(`/login?returnUrl=${encodeURIComponent('/shop?openCreate=true')}`);
                  return;
                }
                resetForm();
                setIsCreateDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-snookerGreen to-snookerGreen/80 hover:from-snookerGreen/90 hover:to-snookerGreen border border-white/20 text-white rounded-full font-bold transition-all shadow-[0_0_15px_rgba(0,77,38,0.3)] cursor-pointer"
            >
              <Plus size={18} /> Post Ad
            </button>
          </div>
        </div>

        {/* Search & Top Action Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Search by title, cue stick, Aramith balls..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/10 hover:border-white/20 focus:border-snookerGreen/60 focus:outline-none pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/30 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* Toggle filter sidebar */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all w-full md:w-auto justify-center ${showFilters ? 'bg-goldAccent/10 border-goldAccent text-goldAccent' : 'bg-[#111] border-white/10 hover:border-white/20 text-white/70 hover:text-white'}`}
            >
              <Filter size={16} /> Filters {showFilters && 'Active'}
            </button>

            {/* Sort Dropdown */}
            <div className="relative w-full md:w-auto">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                <ArrowUpDown size={14} />
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#111] border border-white/10 focus:border-snookerGreen/60 focus:outline-none pl-10 pr-8 py-3 rounded-xl text-sm font-bold text-white/80 appearance-none cursor-pointer w-full md:w-60"
              >
                <option value="date">Latest Additions</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                {userCoords && <option value="distance">Nearest Distance</option>}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Expanded Sidebar Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:col-span-1 bg-[#111] border border-white/10 rounded-2xl p-6 space-y-6 overflow-hidden w-full"
              >
                <h3 className="text-lg font-bold border-b border-white/5 pb-3 flex items-center justify-between">
                  Refine Listings <SlidersHorizontal size={16} className="text-goldAccent" />
                </h3>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/40">Price Range (₹)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 rounded-lg text-sm text-center focus:border-snookerGreen/50 focus:outline-none"
                    />
                    <span className="text-white/40">-</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 rounded-lg text-sm text-center focus:border-snookerGreen/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Condition Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/40">Item Condition</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['ALL', 'NEW', 'GENTLE_USE', 'HEAVILY_USED'].map((cond) => (
                      <button
                        key={cond}
                        onClick={() => setSelectedCondition(cond)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                          selectedCondition === cond 
                            ? 'bg-snookerGreen/20 border-snookerGreen text-snookerGreen shadow-sm shadow-snookerGreen/25' 
                            : 'bg-black border-white/5 hover:border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {cond === 'GENTLE_USE' ? 'Gentle Use' : cond === 'HEAVILY_USED' ? 'Moderate Use' : cond}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Distance Slider */}
                {userCoords ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-white/40">
                      <span>Max Distance</span>
                      <span className="text-snookerGreen font-extrabold">{maxDistance} km</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                      className="w-full accent-snookerGreen cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                      <MapPin size={10} className="text-goldAccent" /> Calculating from coordinates
                    </div>
                  </div>
                ) : (
                  <div className="text-xs bg-white/5 border border-white/5 rounded-xl p-3.5 text-white/40 flex items-start gap-2">
                    <MapPin size={16} className="text-white/20 mt-0.5" />
                    <span>Geolocation is disabled. Distance filtering is unavailable. Backing up to listed addresses.</span>
                  </div>
                )}

                {/* Reset Filters */}
                <button
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    setSelectedCondition('ALL');
                    setMaxDistance(50);
                    setSearchQuery('');
                  }}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold hover:text-red-400 transition-colors"
                >
                  Clear All Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid Area */}
          <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'} w-full`}>
            {processedProducts.length === 0 ? (
              <div className="bg-[#111] border border-white/10 rounded-2xl py-24 text-center flex flex-col items-center justify-center">
                <ShoppingBag size={48} className="text-white/10 mb-4 animate-bounce" />
                <h3 className="text-xl font-bold mb-2">No listings found</h3>
                <p className="text-white/40 text-sm max-w-sm">Try adjusting your filters, clearing your search, or be the first to post a new listing!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {processedProducts.map((product) => {
                  const isOwner = user?.id === product.ownerId;
                  
                  // Calculate distance for badge
                  let distanceStr = '';
                  if (userCoords && product.lat && product.lng) {
                    const d = getDistance(userCoords.lat, userCoords.lng, product.lat, product.lng);
                    distanceStr = `${d.toFixed(1)} km away`;
                  } else {
                    distanceStr = product.locationName || 'Unknown Loc';
                  }

                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -6, scale: 1.01 }}
                      className={`relative bg-[#111]/90 border rounded-2xl overflow-hidden flex flex-col group cursor-pointer ${
                        product.status === 'SOLD' 
                          ? 'border-white/5 opacity-60' 
                          : 'border-white/10 hover:border-snookerGreen/50 shadow-lg hover:shadow-snookerGreen/5'
                      }`}
                      onClick={() => router.push(`/shop/${product.id}`)}
                    >
                      {/* Product Image */}
                      <div className="h-48 w-full bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-white/20 gap-2">
                            <ShoppingBag size={36} />
                            <span className="text-[10px] uppercase font-bold tracking-wider">No Image Provided</span>
                          </div>
                        )}

                        {/* Sold overlay */}
                        {product.status === 'SOLD' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                            <span className="px-5 py-2 border-2 border-red-500 bg-black text-red-500 font-extrabold text-sm uppercase tracking-widest rounded-lg transform -rotate-12">
                              Sold Out
                            </span>
                          </div>
                        )}

                        {/* Distance Badge */}
                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                          <MapPin size={10} className="text-goldAccent" /> {distanceStr}
                        </div>

                        {/* Condition Badge */}
                        {product.condition && (
                          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-black ${
                            product.condition === 'NEW' 
                              ? 'bg-snookerGreen text-white' 
                              : product.condition === 'GENTLE_USE'
                              ? 'bg-goldAccent text-black'
                              : 'bg-red-400 text-black'
                          }`}>
                            {product.condition === 'GENTLE_USE' ? 'Gentle Use' : product.condition === 'HEAVILY_USED' ? 'Moderate Use' : product.condition}
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xl font-extrabold text-white">₹{product.price.toLocaleString()}</span>
                            {product.age && (
                              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{product.age} old</span>
                            )}
                          </div>
                          <h3 className="font-bold text-base text-white/90 group-hover:text-goldAccent transition-colors truncate mb-2">
                            {product.name}
                          </h3>
                          <p className="text-xs text-white/50 line-clamp-2 mb-4 leading-relaxed">
                            {product.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                          <span className="text-[10px] text-white/40 font-medium truncate flex items-center gap-1.5">
                            <User size={12} className="text-zinc-500" /> By {isOwner ? 'Me' : product.owner?.name || 'Seller'}
                          </span>
                          
                          {isOwner ? (
                            <span className="text-[10px] bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-full font-bold">My Ad</span>
                          ) : (
                            <span className="text-xs text-snookerGreen group-hover:text-goldAccent transition-colors font-bold flex items-center gap-1">
                              Negotiate <MessageSquare size={12} />
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          PRODUCT DETAIL DRAWER (Slide in from right)
          ───────────────────────────────────────────────────────────────────────────── */}


      {/* ─────────────────────────────────────────────────────────────────────────────
          PRODUCT CREATION / EDIT DRAWER (Slide in from right)
          ───────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCreateDrawerOpen(false);
                resetForm();
              }}
              className="fixed inset-0 bg-black z-[55]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-[#0d0d0d] border-l border-white/10 p-6 sm:p-8 z-[60] overflow-y-auto flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-2">
                  Post Ad Listing <Sparkles size={16} className="text-goldAccent" />
                </h2>
                <button 
                  onClick={() => {
                    setIsCreateDrawerOpen(false);
                    resetForm();
                  }}
                  className="p-1.5 hover:bg-white/5 rounded-full text-white/70 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/50 uppercase">Product Title *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Predator Limited Cue Stick" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full bg-[#151515] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3 rounded-xl text-sm"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/50 uppercase">Price (₹) *</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 15000" 
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                      className="w-full bg-[#151515] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3 rounded-xl text-sm font-semibold"
                    />
                  </div>

                  {/* Condition & Age */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/50 uppercase">Condition</label>
                      <select
                        value={formCondition}
                        onChange={(e) => setFormCondition(e.target.value)}
                        className="w-full bg-[#151515] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3 rounded-xl text-sm cursor-pointer"
                      >
                        <option value="NEW">New</option>
                        <option value="GENTLE_USE">Gentle Use</option>
                        <option value="HEAVILY_USED">Moderate Use</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/50 uppercase">How Old</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 3 months" 
                        value={formAge}
                        onChange={(e) => setFormAge(e.target.value)}
                        className="w-full bg-[#151515] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/50 uppercase">Description</label>
                    <textarea 
                      placeholder="Describe the cue wood type, tip width, condition details, delivery options..." 
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full bg-[#151515] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3 rounded-xl text-sm resize-none"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase">Product Image</label>
                    <div className="border border-dashed border-white/15 rounded-xl p-4 flex flex-col items-center justify-center bg-[#151515] hover:bg-white/2 cursor-pointer transition-colors relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {imagePreview ? (
                        <div className="relative w-full h-32 flex items-center justify-center">
                          <img src={imagePreview} alt="Preview" className="object-contain h-full rounded" />
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setFormImage(null); setImagePreview(null); }}
                            className="absolute top-1 right-1 p-1 bg-black/80 rounded-full hover:bg-red-500 text-white transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center text-white/40 gap-1 py-2">
                          <Upload size={24} className="text-goldAccent animate-pulse" />
                          <span className="text-xs font-bold text-white/60">Drag and drop or select file</span>
                          <span className="text-[10px]">PNG, JPG, WEBP up to 5MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location Area & Detection */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-white/50 uppercase">Location Address / City</label>
                      <button 
                        type="button" 
                        onClick={handleAutoDetectFormLocation}
                        className="text-[10px] text-goldAccent font-extrabold hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Compass size={10} /> Auto-detect Coords
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. Connaught Place, New Delhi" 
                      value={formLocationName}
                      onChange={(e) => setFormLocationName(e.target.value)}
                      className="w-full bg-[#151515] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3 rounded-xl text-sm"
                    />
                    {formLat && formLng && (
                      <span className="text-[9px] text-snookerGreen font-mono block mt-1">
                        GPS Coordinates locked: {formLat.toFixed(4)}, {formLng.toFixed(4)}
                      </span>
                    )}
                  </div>

                  {/* Optional Club Attachment */}
                  {myClubs.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-white/50 uppercase">Attach to My Club (Optional)</label>
                      <select
                        value={formClubId}
                        onChange={(e) => setFormClubId(e.target.value)}
                        className="w-full bg-[#151515] border border-white/10 focus:border-snookerGreen/50 focus:outline-none p-3 rounded-xl text-sm cursor-pointer"
                      >
                        <option value="">No club attachment</option>
                        {myClubs.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="pt-6 border-t border-white/10 mt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsCreateDrawerOpen(false);
                      resetForm();
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gradient-to-r from-snookerGreen to-snookerGreen/80 hover:from-snookerGreen hover:to-snookerGreen text-white rounded-xl text-sm font-extrabold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-snookerGreen/15"
                  >
                    {isSubmitting ? 'Posting...' : 'Publish Ad'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
