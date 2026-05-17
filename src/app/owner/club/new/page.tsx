'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, Upload, Trash2, X } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const clubSchema = z.object({
  name: z.string().min(1, "Club name is required"),
  description: z.string().optional(),
  fullAddress: z.string().min(1, "Full address is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().min(1, "Area is required"),
  openingTime: z.string().min(1, "Opening time is required"),
  closingTime: z.string().min(1, "Closing time is required"),
  amenities: z.array(z.string()),
  tableCategories: z.array(z.object({
    name: z.string().min(1, "Table name is required"),
    quantity: z.number().min(1, "Must be at least 1"),
    pricePerHour: z.number().min(0, "Cannot be negative")
  })).min(1, "At least one table type is required")
});

type ClubFormValues = z.infer<typeof clubSchema>;

const COMMON_AMENITIES = ['Air Condition', 'Parking', 'Cafe', 'Wifi', 'Ball Boy'];

export default function CreateClubPage() {
  const router = useRouter();
  const { isAuthenticated, initialize } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // File states for previews and custom validation
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [coverImageError, setCoverImageError] = useState('');

  const [interiorImages, setInteriorImages] = useState<File[]>([]);
  const [interiorImagesPreview, setInteriorImagesPreview] = useState<string[]>([]);
  const [interiorImagesError, setInteriorImagesError] = useState('');

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/login?returnUrl=/owner/club/new');
    }
  }, [isMounted, isAuthenticated, router]);

  const { register, control, handleSubmit, formState: { errors } } = useForm<ClubFormValues>({
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
      tableCategories: [{ name: 'Snooker Table', quantity: 1, pricePerHour: 500 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tableCategories"
  });

  const validateFiles = () => {
    let isValid = true;
    setCoverImageError('');
    setInteriorImagesError('');

    if (!coverImage) {
      setCoverImageError('Cover image is required');
      isValid = false;
    } else if (coverImage.size > MAX_FILE_SIZE) {
      setCoverImageError('Max image size is 5MB.');
      isValid = false;
    } else if (!ACCEPTED_IMAGE_TYPES.includes(coverImage.type)) {
      setCoverImageError('Only .jpg, .jpeg, .png and .webp formats are supported.');
      isValid = false;
    }

    if (interiorImages.length > 5) {
      setInteriorImagesError('Maximum 5 interior images allowed.');
      isValid = false;
    }

    interiorImages.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        setInteriorImagesError('One or more interior images exceed the 5MB limit.');
        isValid = false;
      } else if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setInteriorImagesError('Only .jpg, .jpeg, .png and .webp formats are supported.');
        isValid = false;
      }
    });

    return isValid;
  };

  const createClubMutation = useMutation({
    mutationFn: async (formDataObj: FormData) => {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/clubs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create club');
      return data;
    },
    onSuccess: () => {
      router.push('/clubs');
    }
  });

  const onSubmit = (data: ClubFormValues) => {
    if (!validateFiles()) return;

    const formDataObj = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'amenities' || key === 'tableCategories') {
        formDataObj.append(key, JSON.stringify((data as any)[key]));
      } else {
        formDataObj.append(key, (data as any)[key] || '');
      }
    });

    if (coverImage) {
      formDataObj.append('coverImage', coverImage);
    }
    interiorImages.forEach(img => {
      formDataObj.append('interiorImages', img);
    });

    createClubMutation.mutate(formDataObj);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
      setCoverImageError(''); // clear error
    }
  };

  const handleInteriorImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setInteriorImages(files);
      setInteriorImagesPreview(files.map(f => URL.createObjectURL(f)));
      setInteriorImagesError(''); // clear error
    }
  };

  if (!isMounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MapPin className="text-goldAccent w-8 h-8" />
            List Your Club
          </h1>
          <p className="text-gray-400 mt-2">Add your Snooker or Pool club to Cue King and start getting bookings.</p>
        </div>

        {createClubMutation.isError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
            {createClubMutation.error.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Info */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Club Name *</label>
                <input {...register('name')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" placeholder="e.g. Rack & Roll Snooker Academy" />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea {...register('description')} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen resize-none" placeholder="Tell players about your club's atmosphere and tables..." />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-2"><Camera className="w-5 h-5" /> Images</h2>
            <p className="text-sm text-gray-400 mb-2">Upload images to showcase your club. Maximum size per image is 5MB.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">Cover Image (Required)</label>
                <div className="flex flex-col w-full gap-2">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-black/30 hover:bg-black/50 transition-colors relative overflow-hidden">
                    {coverImagePreview ? (
                      <>
                        <img src={coverImagePreview} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white font-bold">Change Image</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-400 font-semibold">Click to upload Cover Image</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleCoverImageChange} />
                  </label>
                  {coverImageError && <p className="text-red-500 text-sm font-medium">{coverImageError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">Interior Images (Optional, up to 5)</label>
                <div className="flex flex-col w-full gap-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-black/30 hover:bg-black/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400 font-semibold">Click to select Interior Images</p>
                    </div>
                    <input type="file" multiple className="hidden" accept="image/*" onChange={handleInteriorImagesChange} />
                  </label>
                  
                  {interiorImagesPreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {interiorImagesPreview.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                           <img src={src} className="w-full h-full object-cover" alt={`Interior ${idx+1}`} />
                        </div>
                      ))}
                    </div>
                  )}
                  {interiorImagesError && <p className="text-red-500 text-sm font-medium">{interiorImagesError}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Location & Timings */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Location & Timings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Full Address *</label>
                <input {...register('fullAddress')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" placeholder="Complete street address" />
                {errors.fullAddress && <p className="text-red-500 text-sm mt-1">{errors.fullAddress.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">City *</label>
                <input {...register('city')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" placeholder="e.g. New Delhi" />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Area / Locality *</label>
                <input {...register('area')} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" placeholder="e.g. Connaught Place" />
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

          {/* Tables & Pricing */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Tables & Pricing</h2>
              <button type="button" onClick={() => append({ name: '8 Ball Pool Table', quantity: 1, pricePerHour: 300 })} className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                + Add Table Type
              </button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-black/30 p-4 rounded-xl border border-white/5">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-gray-400 mb-1">Table Name</label>
                    <input {...register(`tableCategories.${index}.name` as const)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-snookerGreen outline-none" />
                    {errors.tableCategories?.[index]?.name && <p className="text-red-500 text-xs mt-1">{errors.tableCategories[index]?.name?.message}</p>}
                  </div>
                  <div className="w-full md:w-24">
                    <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                    <input type="number" {...register(`tableCategories.${index}.quantity` as const, { valueAsNumber: true })} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-snookerGreen outline-none" />
                    {errors.tableCategories?.[index]?.quantity && <p className="text-red-500 text-xs mt-1">{errors.tableCategories[index]?.quantity?.message}</p>}
                  </div>
                  <div className="w-full md:w-32">
                    <label className="block text-xs text-gray-400 mb-1">Price/Hr (₹)</label>
                    <input type="number" {...register(`tableCategories.${index}.pricePerHour` as const, { valueAsNumber: true })} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-snookerGreen outline-none" />
                    {errors.tableCategories?.[index]?.pricePerHour && <p className="text-red-500 text-xs mt-1">{errors.tableCategories[index]?.pricePerHour?.message}</p>}
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg h-[38px] w-full md:w-auto flex justify-center items-center mt-2 md:mt-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {errors.tableCategories && !Array.isArray(errors.tableCategories) && <p className="text-red-500 text-sm">{errors.tableCategories.message}</p>}
            </div>
          </div>

          {/* Amenities */}
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

          {/* Submit */}
          <div className="pt-4">
            <button 
              type="submit"
              disabled={createClubMutation.isPending}
              className="w-full bg-gradient-to-r from-snookerGreen to-emerald-500 hover:from-snookerGreen/90 hover:to-emerald-500/90 text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {createClubMutation.isPending ? 'Creating Club...' : 'Publish Club Listing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
