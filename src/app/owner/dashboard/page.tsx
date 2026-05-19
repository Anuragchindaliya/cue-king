'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';

export default function OwnerDashboard() {
  const router = useRouter();

  const { data: clubs = [], isLoading } = useQuery({
    queryKey: ['my-clubs'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/owner/signup');
        throw new Error('No token found');
      }

      const res = await fetch(`${API_BASE_URL}/api/clubs/my-clubs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/owner/signup');
        }
        throw new Error('Failed to fetch clubs');
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch clubs');
      }
      return data.data;
    },
    retry: false
  });

  if (isLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  console.log("🚀 ~ OwnerDashboard ~ clubs:", clubs)
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
            Owner Dashboard
          </h1>
          <Link
            href="/owner/club/new"
            className="bg-snookerGreen hover:bg-snookerGreen/80 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            + Register New Club
          </Link>
        </div>

        {clubs?.data.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-sm">
            <h3 className="text-xl font-medium text-white mb-2">No Clubs Registered Yet</h3>
            <p className="text-gray-400 mb-6">Register your first club to start accepting bookings on Cue King.</p>
            <Link
              href="/owner/club/new"
              className="inline-block bg-goldAccent hover:bg-goldAccent/90 text-black font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs?.data?.map((club: any) => (
              <div key={club.id} className="bg-white/5 border border-white/10 rounded-xl p-6 relative">
                {club.coverImage && (
                  <div className="h-40 w-full mb-4 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url('${API_BASE_URL}${club.coverImage}')` }} />
                )}
                <h3 className="text-xl font-bold text-white mb-2">{club.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{club.description || 'No description provided'}</p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <Link href={`/owner/club/${club.id}/edit`} className="text-snookerGreen hover:underline text-sm font-medium">
                    Edit Details
                  </Link>
                  <Link href={`/owner/club/${club.id}/tables`} className="text-goldAccent hover:underline text-sm font-medium">
                    Manage Tables
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
