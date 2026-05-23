import ClientClubList from './ClientClubList';
import { Metadata } from 'next';
import { API_BASE_URL } from '@/config/api';

export const metadata: Metadata = {
  title: 'Top Snooker & Pool Clubs | Cue King',
  description: 'Find and book the best snooker and pool clubs near you.',
};

async function getInitialClubs() {
  try {
    // SSR Fetch from backend API with 4s timeout to prevent Vercel timeouts
    const res = await fetch(`${API_BASE_URL}/api/clubs?limit=12`, {
      cache: 'no-store', // Ensure we fetch fresh data on server
      signal: AbortSignal.timeout(4000)
    });
    const data = await res.json();
    // console.log("🚀 ~ getInitialClubs ~ data:", data)
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch clubs for SSR:', error);
    return [];
  }
}

export default async function ClubsPage() {
  const initialClubs = await getInitialClubs();

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
          Discover Clubs
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Find the perfect table for your next game.
        </p>

        <ClientClubList initialClubs={initialClubs} />
      </div>
    </div>
  );
}
