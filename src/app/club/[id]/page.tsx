import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import BookingFlow from '@/components/BookingFlow';
import { API_BASE_URL } from '@/config/api';

type Props = {
  params: Promise<{ id: string }>;
};

async function getClub(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/clubs/${id}`, {
      cache: 'no-store'
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
  const club = await getClub(p.id);

  if (!club) {
    return { title: 'Club Not Found | Cue King' };
  }

  return {
    title: `${club.name} | Cue King Bookings`,
    description: `Book your snooker or pool table at ${club.name}. Located in ${club.location?.city || 'your area'}. Open from ${club.openingTime} to ${club.closingTime}.`,
  };
}

import ClientCarousel from './ClientCarousel';
import { MapPin, Clock, Info } from 'lucide-react';

const resolveImageUrl = (src: string | null | undefined): string => {
  if (!src) return '';
  return src.startsWith('http') ? src : `${API_BASE_URL}${src}`;
};

export default async function ClubPage({ params }: Props) {
  const p = await params;
  const club = await getClub(p.id);

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <h1 className="text-3xl text-red-500">Club Not Found</h1>
        <Link href="/clubs" className="ml-4 text-snookerGreen hover:underline">Back to Clubs</Link>
      </div>
    );
  }

  // JSON-LD for LocalBusiness
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": club.name,
    "image": "https://cueking.example.com/images/default-club.jpg",
    "@id": `https://cueking.example.com/club/${club.id}`,
    "url": `https://cueking.example.com/club/${club.id}`,
    "telephone": "+1234567890", // placeholder
    "address": {
      "@type": "PostalAddress",
      "streetAddress": club.location?.area || "Unknown Area",
      "addressLocality": club.location?.city || "Unknown City",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": club.openingTime,
      "closes": club.closingTime
    }
  };

  // Combine images for Carousel
  const allImages = [];
  if (club.coverImage) {
    const resolved = resolveImageUrl(club.coverImage);
    if (resolved) allImages.push(resolved);
  }
  if (Array.isArray(club.interiorImages)) {
    club.interiorImages.forEach((img: string) => {
      const resolved = resolveImageUrl(img);
      if (resolved) allImages.push(resolved);
    });
  }


  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto">
        <Link href="/clubs" className="text-gray-400 hover:text-white mb-6 inline-block transition-colors font-medium">
          &larr; Back to Clubs
        </Link>

        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent mb-2">
            {club.name}
          </h1>
          <div className="flex items-center text-gray-400 text-sm gap-4">
            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {club.location?.area}, {club.location?.city}</span>
            <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {club.openingTime} - {club.closingTime}</span>
            {club.rating && <span className="flex items-center text-goldAccent">⭐ {club.rating.toFixed(1)}</span>}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Top / Desktop Right: Booking Flow */}
          <div className="order-1 lg:order-2 lg:w-[45%]">
            <div className="sticky top-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-white flex items-center">Book a Table</h2>
              <BookingFlow club={club} />
            </div>
          </div>

          {/* Mobile Bottom / Desktop Left: Details & Images */}
          <div className="order-2 lg:order-1 lg:w-[55%] space-y-8">
            <div className="border border-white/10 rounded-2xl overflow-hidden shadow-lg bg-white/5">
              <ClientCarousel images={allImages} />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-lg">
              <h3 className="text-xl font-bold mb-4 flex items-center text-white"><Info className="w-5 h-5 mr-2 text-snookerGreen" /> About the Club</h3>
              <p className="text-gray-300 leading-relaxed">
                {club.description || 'Welcome to one of the finest pool and snooker clubs in the city. We offer premium tables, excellent service, and a great atmosphere for players of all levels.'}
              </p>

              {club.amenities && club.amenities.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {club.amenities.map((amenity: string, idx: number) => (
                      <span key={idx} className="bg-black/50 border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-full">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
