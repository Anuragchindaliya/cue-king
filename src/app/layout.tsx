import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { CustomCursor } from '@/components/CustomCursor';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Cue King Snooker',
  description: 'Premium Physical Club & Digital Hub - Leaderboards, live tables, and bookings.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased selection:bg-snookerGreen selection:text-white`}>
        <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-snookerGreen rounded-[100%] mix-blend-screen filter blur-[120px] opacity-30 pointer-events-none -z-10"></div>
        <div className="fixed top-3/4 right-1/4 translate-x-1/2 translate-y-1/4 w-80 h-80 bg-goldAccent rounded-[100%] mix-blend-screen filter blur-[120px] opacity-15 pointer-events-none -z-10"></div>
        <CustomCursor />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
