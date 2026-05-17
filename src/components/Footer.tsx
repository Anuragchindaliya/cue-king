'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-8 text-center text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-snookerGreen to-goldAccent">
            Cue King
          </span>
          <p className="text-sm mt-1">© {new Date().getFullYear()} Cue King. All rights reserved.</p>
        </div>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-snookerGreen transition-colors">
            About Us
          </Link>
          <Link href="/privacy" className="hover:text-snookerGreen transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-snookerGreen transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
