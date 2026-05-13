import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Cue King | Revolutionizing Table Booking',
  description: 'Learn more about Cue King, the premier snooker and pool table booking marketplace.',
};

export default function AboutPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does booking a table on Cue King work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can browse clubs near you, select your preferred table and time slot, and continue as a guest or sign in. The club owner will receive your request and confirm your booking instantly via Telegram or Email."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to create an account to book?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, you can initiate a booking as a guest. However, an account is automatically created to manage your future bookings easily."
        }
      },
      {
        "@type": "Question",
        "name": "How will I know if my booking is confirmed?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Once the club owner accepts your request, you will receive an instant notification confirming your table and time slot."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
          About Cue King
        </h1>
        
        <div className="prose prose-invert lg:prose-xl max-w-none">
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Cue King is the premier snooker and pool table booking marketplace. We connect players with top-rated clubs, making it easier than ever to discover, reserve, and play.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6">Our Mission</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Our mission is to eliminate the friction of calling or waiting for tables. By providing a low-friction booking flow and instant dual-notifications for club owners, we ensure that both players and vendors have a seamless experience.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-snookerGreen mb-2">How does booking a table on Cue King work?</h3>
              <p className="text-gray-400">You can browse clubs near you, select your preferred table and time slot, and continue as a guest or sign in. The club owner will receive your request and confirm your booking instantly via Telegram or Email.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-snookerGreen mb-2">Do I need to create an account to book?</h3>
              <p className="text-gray-400">No, you can initiate a booking as a guest. However, an account is automatically created to manage your future bookings easily.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-snookerGreen mb-2">How will I know if my booking is confirmed?</h3>
              <p className="text-gray-400">Once the club owner accepts your request, you will receive an instant notification confirming your table and time slot.</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/clubs" className="inline-block bg-goldAccent hover:bg-goldAccent/80 text-black font-bold py-3 px-8 rounded-lg transition-colors">
              Find a Club
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
