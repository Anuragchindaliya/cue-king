'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function ImageCarousel({ cover, interiors, tables }: { cover?: string, interiors?: string[], tables?: string[] }) {
  const allImages = [];
  if (cover) allImages.push(`http://localhost:5001${cover}`);
  if (interiors) interiors.forEach(img => allImages.push(`http://localhost:5001${img}`));
  if (tables) tables.forEach(img => { if (img) allImages.push(`http://localhost:5001${img}`) });
  
  if (allImages.length === 0) {
    return <div className="w-full h-48 bg-white/5 flex items-center justify-center text-gray-500 rounded-t-xl">No Images Available</div>;
  }

  return (
    <div className="w-full h-48 overflow-x-auto flex snap-x snap-mandatory hide-scrollbar rounded-t-xl">
      {allImages.map((src, i) => (
        <div key={i} className="min-w-full h-full snap-center bg-cover bg-center" style={{ backgroundImage: `url(${src})` }} />
      ))}
    </div>
  );
}

export default function ClientClubList({ initialClubs }: { initialClubs: any[] }) {
  const [clubs, setClubs] = useState(initialClubs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLoading(true);
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`http://localhost:5001/api/clubs?lat=${latitude}&lng=${longitude}`);
            const data = await res.json();
            if (data.success) {
              setClubs(data.data);
            }
          } catch (err) {
            console.error('Failed to fetch nearby clubs', err);
            setError('Could not fetch clubs near you. Showing default list.');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.warn('Geolocation permission denied', err);
        }
      );
    }
  }, []);

  const formatDistance = (distKm: number) => {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} meters away`;
    }
    return `${distKm.toFixed(1)} km away`;
  };

  return (
    <div>
      {loading && <div className="text-goldAccent mb-4 animate-pulse">Updating clubs near you...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => {
          const tableTypes = club.tableCategories?.map((c: any) => c.name).join(', ') || 'No tables added';
          const tableImages = club.tableCategories?.map((c: any) => c.image).filter(Boolean);

          return (
            <div key={club.id} className="bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex flex-col">
              <ImageCarousel cover={club.coverImage} interiors={club.interiorImages} tables={tableImages} />
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white line-clamp-1">{club.name}</h3>
                  <div className="flex items-center bg-black/50 px-2 py-1 rounded text-sm text-goldAccent font-medium">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {club.rating?.toFixed(1) || '0.0'}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{club.description || 'A great place to play.'}</p>
                
                <div className="text-xs text-gray-500 mb-3 space-y-1">
                  <p>🕚 {club.openingTime} - {club.closingTime}</p>
                  <p>🎱 {tableTypes}</p>
                  {club.distance !== undefined && club.distance !== Infinity && (
                    <p className="text-snookerGreen">📍 {formatDistance(club.distance)}</p>
                  )}
                </div>

                <div className="mt-auto flex gap-3 pt-4 border-t border-white/10">
                  <Link
                    href={`/club/${club.id}`}
                    className="flex-1 text-center bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/club/${club.id}?booking=true`}
                    className="flex-1 text-center bg-snookerGreen hover:bg-snookerGreen/80 text-white text-sm font-bold py-2 rounded-lg transition-colors"
                  >
                    Book Table
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {clubs.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-500 py-12">
            No clubs found in your area.
          </div>
        )}
      </div>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
