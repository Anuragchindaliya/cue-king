'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Camera, MapPin, Upload, Trash2, Save } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/config/api';

const clubSchema = z.object({
  name: z.string().min(1, "Club name is required"),
  description: z.string().optional(),
  fullAddress: z.string().min(1, "Full address is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().min(1, "Area is required"),
  openingTime: z.string().min(1, "Opening time is required"),
  closingTime: z.string().min(1, "Closing time is required"),
  amenities: z.array(z.string()),
});

type ClubFormValues = z.infer<typeof clubSchema>;

const COMMON_AMENITIES = ['Air Condition', 'Parking', 'Cafe', 'Wifi', 'Ball Boy'];

export default function EditClubPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;
  const { isAuthenticated, initialize, token } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push(`/login?returnUrl=/owner/club/${clubId}/edit`);
    }
  }, [isMounted, isAuthenticated, router, clubId]);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ClubFormValues>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: '',
      description: '',
      fullAddress: '',
      city: '',
      area: '',
      openingTime: '10:00',
      closingTime: '23:00',
      amenities: [],
    }
  });

  const { data: clubData, isLoading } = useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/clubs/${clubId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!clubId
  });

  useEffect(() => {
    if (clubData) {
      reset({
        name: clubData.name,
        description: clubData.description || '',
        fullAddress: clubData.location.fullAddress,
        city: clubData.location.city,
        area: clubData.location.area,
        openingTime: clubData.openingTime,
        closingTime: clubData.closingTime,
        amenities: clubData.amenities,
      });
    }
  }, [clubData, reset]);

  const updateClubMutation = useMutation({
    mutationFn: async (data: ClubFormValues) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/clubs/${clubId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message || 'Failed to update club');
      return resData;
    },
    onSuccess: () => {
      router.push('/owner/dashboard');
    }
  });

  const onSubmit = (data: ClubFormValues) => {
    updateClubMutation.mutate(data);
  };

  if (!isMounted || !isAuthenticated) return null;
  if (isLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MapPin className="text-goldAccent w-8 h-8" />
            Edit Club
          </h1>
          <p className="text-gray-400 mt-2">Update information for {clubData?.name}</p>
        </div>

        {updateClubMutation.isError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
            {updateClubMutation.error.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Club Name *</label>
                <input {...register('name')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea {...register('description')} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Location & Timings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Full Address *</label>
                <input {...register('fullAddress')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" />
                {errors.fullAddress && <p className="text-red-500 text-sm mt-1">{errors.fullAddress.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">City *</label>
                <input {...register('city')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Area / Locality *</label>
                <input {...register('area')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" />
                {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Opening Time *</label>
                <input type="time" {...register('openingTime')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" />
                {errors.openingTime && <p className="text-red-500 text-sm mt-1">{errors.openingTime.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Closing Time *</label>
                <input type="time" {...register('closingTime')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" />
                {errors.closingTime && <p className="text-red-500 text-sm mt-1">{errors.closingTime.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Amenities</h2>
            <Controller
              name="amenities"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-3">
                  {COMMON_AMENITIES.map(amenity => {
                    const isSelected = field.value.includes(amenity);
                    return (
                      <button 
                        key={amenity}
                        type="button" 
                        onClick={() => {
                          const newValue = isSelected 
                            ? field.value.filter(a => a !== amenity)
                            : [...field.value, amenity];
                          field.onChange(newValue);
                        }}
                        className={`px-4 py-2 rounded-full border text-sm font-bold transition-all shadow-sm ${isSelected ? 'border-goldAccent bg-goldAccent text-black shadow-[0_0_10px_rgba(255,215,0,0.4)]' : 'border-white/20 text-gray-300 hover:bg-white/10'}`}
                      >
                        {amenity}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={updateClubMutation.isPending}
              className="w-full bg-gradient-to-r from-snookerGreen to-emerald-500 hover:from-snookerGreen/90 hover:to-emerald-500/90 text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {updateClubMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
