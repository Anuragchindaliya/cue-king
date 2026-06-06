import ProductDetailClient from './ProductDetailClient';
import { API_BASE_URL } from '@/config/api';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 10; // Incremental Static Regeneration: revalidate page cache every 10s

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(4000)
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const p = await params;
  const product = await getProduct(p.id);

  if (!product) {
    return { title: 'Product Not Found | Cue King Marketplace' };
  }

  return {
    title: `${product.name} | Cue King Marketplace`,
    description: `Buy ${product.name} for ₹${product.price.toLocaleString()}. Condition: ${product.condition || 'Used'}. Location: ${product.locationName || 'Local'}.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await params;
  const product = await getProduct(p.id);

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 pt-28">
        <h1 className="text-3xl text-red-500 font-bold mb-4">Listing Not Found</h1>
        <p className="text-white/40 text-sm mb-6">This listing may have been deleted by the seller or marked as inactive.</p>
        <Link href="/shop" className="px-6 py-2.5 bg-snookerGreen text-white font-bold rounded-full transition-all hover:bg-snookerGreen/90">
          Back to Shop Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 relative z-10">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-snookerGreen/5 rounded-full blur-[120px] pointer-events-none"></div>
      <ProductDetailClient product={product} />
    </div>
  );
}
