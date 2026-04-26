'use client';
import { MessageCircle } from 'lucide-react';

export function WhatsAppFloat() {
  return (
    <a 
      href="https://chat.whatsapp.com/E6sGieBbvEs5wLysHK3OUK?mode=gi_t&text=Hi!%20I'm%20joining%20from%20the%20Cue%20King%20Website." 
      target="_blank" 
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50000 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-[0_4px_25px_rgba(37,211,102,0.5)] transition-all hover:scale-110 hover:-translate-y-1 flex items-center justify-center group"
    >
      <MessageCircle size={32} />
      <span className="absolute right-full mr-4 bg-black/90 border border-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-xl">
        Chat & Join Community
      </span>
    </a>
  );
}
