import ShopClient from './ShopClient';
import { API_BASE_URL } from '@/config/api';
import { Metadata } from 'next';
import { Location } from "@/components/Location";
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Pro Shop & P2P Marketplace | Cue King',
  description: 'Buy and sell new or gently used snooker cues, pool tables, and elite cue accessories. Chat and negotiate directly with local sellers.',
};

export const revalidate = 10; // Incremental Static Regeneration: revalidate page cache every 10s

async function getProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch marketplace products for SSR:', error);
    return [];
  }
}

export default async function ShopPage() {
  const initialProducts = await getProducts();

  return (
    <div className="pt-24 min-h-screen relative z-10 flex flex-col">
      <div className="flex-1">
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Marketplace...</div>}>
          <ShopClient initialProducts={initialProducts} />
        </Suspense>
      </div>
      <Location />
      <footer className="py-8 text-center text-white/40 text-sm border-t border-white/10 mt-auto bg-black/80 flex flex-col items-center gap-2">
        <p>&copy; {new Date().getFullYear()} Cue King Snooker. All rights reserved.</p>
        <p>Created by <a href="https://www.linkedin.com/in/anurag-chindaliya/" target="_blank" rel="noopener noreferrer" className="text-snookerGreen hover:text-goldAccent transition-colors font-medium">Anurag Chindaliya</a></p>
      </footer>
    </div>
  );
}
