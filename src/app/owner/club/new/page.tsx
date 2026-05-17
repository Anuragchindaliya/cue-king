'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, Clock, Upload, Trash2, IndianRupee } from 'lucide-react';

const COMMON_AMENITIES = ['Air Condition', 'Parking', 'Cafe', 'Wifi', 'Ball Boy'];

export default function CreateClubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fullAddress: '',
    city: '',
    area: '',
    openingTime: '10:00',
    closingTime: '23:00',
    amenities: [] as string[],
    cancellationPolicy: '',
    reschedulingPolicy: '',
    lat: '',
    lng: ''
  });

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [interiorImages, setInteriorImages] = useState<File[]>([]);

  // Table Categories
  const [tableCategories, setTableCategories] = useState([{ name: 'Snooker Table', quantity: 1, pricePerHour: 500 }]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login?returnUrl=/owner/club/new');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleTableChange = (index: number, field: string, value: any) => {
    const updated = [...tableCategories];
    updated[index] = { ...updated[index], [field]: value };
    setTableCategories(updated);
  };

  const addTableCategory = () => {
    setTableCategories(prev => [...prev, { name: '8 Ball Pool Table', quantity: 1, pricePerHour: 300 }]);
  };

  const removeTableCategory = (index: number) => {
    setTableCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'amenities') {
          data.append(key, JSON.stringify(formData.amenities));
        } else {
          data.append(key, (formData as any)[key]);
        }
      });

      data.append('tableCategories', JSON.stringify(tableCategories));

      if (coverImage) {
        data.append('coverImage', coverImage);
      }
      
      interiorImages.forEach(img => {
        data.append('interiorImages', img);
      });

      const res = await fetch('http://localhost:5001/api/clubs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data // Do not set Content-Type, browser will set it with boundary
      });

      const result = await res.json();
      
      if (result.success) {
        router.push('/clubs'); // Redirect to clubs or owner dashboard
      } else {
        setError(result.message || 'Failed to create club');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while creating the club');
    } finally {
      setLoading(false);
    }
  };

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

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Info */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Club Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" placeholder="e.g. Rack & Roll Snooker Academy" />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen resize-none" placeholder="Tell players about your club's atmosphere and tables..." />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-2"><Camera className="w-5 h-5" /> Images</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Cover Image (Required)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-black/30 hover:bg-black/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400 font-semibold">{coverImage ? coverImage.name : 'Click to upload Cover Image'}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} required />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Interior Images (Optional, up to 5)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-black/30 hover:bg-black/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400 font-semibold">{interiorImages.length > 0 ? `${interiorImages.length} images selected` : 'Click to upload Interior Images'}</p>
                    </div>
                    <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => {
                       if (e.target.files) {
                         setInteriorImages(Array.from(e.target.files).slice(0, 5));
                       }
                    }} />
                  </label>
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
                <input required type="text" name="fullAddress" value={formData.fullAddress} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" placeholder="Complete street address" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">City *</label>
                <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" placeholder="e.g. New Delhi" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Area / Locality *</label>
                <input required type="text" name="area" value={formData.area} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" placeholder="e.g. Connaught Place" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Opening Time *</label>
                <input required type="time" name="openingTime" value={formData.openingTime} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Closing Time *</label>
                <input required type="time" name="closingTime" value={formData.closingTime} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen" />
              </div>
            </div>
          </div>

          {/* Tables & Pricing */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Tables & Pricing</h2>
              <button type="button" onClick={addTableCategory} className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                + Add Table Type
              </button>
            </div>
            
            <div className="space-y-4">
              {tableCategories.map((tc, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-black/30 p-4 rounded-xl border border-white/5">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-gray-400 mb-1">Table Name</label>
                    <input type="text" value={tc.name} onChange={(e) => handleTableChange(index, 'name', e.target.value)} required className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-snookerGreen outline-none" />
                  </div>
                  <div className="w-full md:w-24">
                    <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                    <input type="number" min="1" value={tc.quantity} onChange={(e) => handleTableChange(index, 'quantity', Number(e.target.value))} required className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-snookerGreen outline-none" />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="block text-xs text-gray-400 mb-1">Price/Hr (₹)</label>
                    <input type="number" min="0" value={tc.pricePerHour} onChange={(e) => handleTableChange(index, 'pricePerHour', Number(e.target.value))} required className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-snookerGreen outline-none" />
                  </div>
                  {tableCategories.length > 1 && (
                    <button type="button" onClick={() => removeTableCategory(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg h-[38px] w-full md:w-auto flex justify-center items-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Amenities</h2>
            <div className="flex flex-wrap gap-3">
              {COMMON_AMENITIES.map(amenity => {
                const isSelected = formData.amenities.includes(amenity);
                return (
                  <button 
                    key={amenity}
                    type="button" 
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${isSelected ? 'border-snookerGreen bg-snookerGreen/20 text-snookerGreen' : 'border-white/20 text-gray-300 hover:bg-white/10'}`}
                  >
                    {amenity}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-snookerGreen to-emerald-500 hover:from-snookerGreen/90 hover:to-emerald-500/90 text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? 'Creating Club...' : 'Publish Club Listing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
