import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import BookingFlow from '@/components/BookingFlow';

type Props = {
  params: Promise<{ id: string }>;
};

async function getClub(id: string) {
  try {
    const res = await fetch(`http://localhost:5001/api/clubs/${id}`, {
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

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto">
        <Link href="/clubs" className="text-gray-400 hover:text-white mb-8 inline-block transition-colors">
          &larr; Back to Clubs
        </Link>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 backdrop-blur-sm">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
            {club.name}
          </h1>
          
          <address className="not-italic text-gray-300 mb-6 flex flex-col gap-1">
            <span className="font-semibold text-white">Address:</span>
            <span>{club.location?.area || 'Area not specified'}</span>
            <span>{club.location?.city || 'City not specified'}</span>
          </address>

          <div className="flex gap-4 text-gray-400">
            <div className="bg-black/50 px-4 py-2 rounded-lg border border-white/5">
              <span className="block text-sm text-gray-500">Opens</span>
              <span className="font-medium text-white">{club.openingTime}</span>
            </div>
            <div className="bg-black/50 px-4 py-2 rounded-lg border border-white/5">
              <span className="block text-sm text-gray-500">Closes</span>
              <span className="font-medium text-white">{club.closingTime}</span>
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6 text-white">Book a Table</h2>
          <BookingFlow club={club} />
        </div>
      </div>
    </div>
  );
}
