import ChatClient from './ChatClient';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Negotiation Inbox | Cue King Shop',
  description: 'Negotiate prices, check availability, and chat with buyers and sellers in the Cue King marketplace.',
};

export default function ChatPage() {
  return (
    <div className="pt-24 min-h-[calc(100vh-80px)] bg-black text-white relative z-10 flex flex-col">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center bg-black text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-400 font-medium">Loading inbox threads...</span>
          </div>
        </div>
      }>
        <ChatClient />
      </Suspense>
    </div>
  );
}
