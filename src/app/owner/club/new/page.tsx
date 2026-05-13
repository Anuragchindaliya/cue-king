'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AMENITIES_LIST = [
  'Ball Boy', 'Cafe', 'Drinking Water', 'Parking', 
  'Seating Area', 'Sound System', 'Air Condition', 'Wifi'
];

export default function NewClubPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    openingTime: '10:00',
    closingTime: '22:00',
    fullAddress: '',
    cancellationPolicy: '',
    reschedulingPolicy: '',
    locationId: '', // Ideally we'd fetch locations, but we'll leave it empty or default it
  });
  
  const [amenities, setAmenities] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [interiorImages, setInteriorImages] = useState<File[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleAmenity = (item: string) => {
    setAmenities(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/owner/signup');
      return;
    }

    try {
      let coverImageUrl = '';
      let interiorImageUrls: string[] = [];

      // 1. Upload Cover Image
      if (coverImage) {
        const formDataObj = new FormData();
        formDataObj.append('image', coverImage);
        const res = await fetch('http://localhost:5001/api/uploads', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataObj
        });
        const data = await res.json();
        if (data.success) coverImageUrl = data.data.url;
      }

      // 2. Upload Interior Images
      if (interiorImages.length > 0) {
        const formDataObj = new FormData();
        interiorImages.forEach(img => formDataObj.append('images', img));
        const res = await fetch('http://localhost:5001/api/uploads/multiple', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataObj
        });
        const data = await res.json();
        if (data.success) interiorImageUrls = data.data.urls;
      }

      // 3. Create Club
      // Hardcode location ID for now if we don't have a selector, or fetch the first one.
      // Let's assume the backend requires locationId. We'll fetch one first.
      let locId = formData.locationId;
      if (!locId) {
        const locRes = await fetch('http://localhost:5001/api/locations');
        const locData = await locRes.json();
        if (locData.success && locData.data.length > 0) {
          locId = locData.data[0].id;
        } else {
           setError('Please ask admin to create a location first.');
           setLoading(false);
           return;
        }
      }

      const clubRes = await fetch('http://localhost:5001/api/clubs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          locationId: locId,
          amenities,
          coverImage: coverImageUrl,
          interiorImages: interiorImageUrls,
          // lat/lng could be implemented via a map picker later
        })
      });

      const clubData = await clubRes.json();
      if (clubData.success) {
        router.push(`/owner/club/${clubData.data.id}/tables`);
      } else {
        setError(clubData.message || 'Failed to create club');
      }

    } catch (err) {
      setError('An error occurred during submission.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm">
        <div className="mb-8">
          <Link href="/owner/dashboard" className="text-gray-400 hover:text-white mb-4 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
            Register a New Club
          </h1>
          <p className="text-gray-400 mt-2">Fill in the details below. You can add tables and pricing in the next step.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">Club Name</label>
              <input required type="text" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-snookerGreen" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <textarea required rows={3} className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-snookerGreen"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Full Address</label>
              <input required type="text" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-snookerGreen" 
                value={formData.fullAddress} onChange={e => setFormData({...formData, fullAddress: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Opening Time</label>
                <input required type="time" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-snookerGreen" 
                  value={formData.openingTime} onChange={e => setFormData({...formData, openingTime: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Closing Time</label>
                <input required type="time" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-snookerGreen" 
                  value={formData.closingTime} onChange={e => setFormData({...formData, closingTime: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AMENITIES_LIST.map(amenity => (
                  <label key={amenity} className="flex items-center space-x-2 text-sm text-gray-400 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-snookerGreen focus:ring-snookerGreen"
                      checked={amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300">Cancellation Policy</label>
                <textarea rows={2} placeholder="e.g. Free cancellation up to 2 hours before" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-snookerGreen"
                  value={formData.cancellationPolicy} onChange={e => setFormData({...formData, cancellationPolicy: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Rescheduling Policy</label>
                <textarea rows={2} placeholder="e.g. Allowed once" className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-snookerGreen"
                  value={formData.reschedulingPolicy} onChange={e => setFormData({...formData, reschedulingPolicy: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300">Cover Image</label>
                <input type="file" accept="image/*" className="mt-1 w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  onChange={e => setCoverImage(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Interior Images (Multiple)</label>
                <input type="file" multiple accept="image/*" className="mt-1 w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  onChange={e => setInteriorImages(Array.from(e.target.files || []))} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-goldAccent hover:bg-goldAccent/90 text-black font-bold py-3 px-4 rounded-lg transition-colors mt-4"
            >
              {loading ? 'Creating Club...' : 'Save & Continue to Tables'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
