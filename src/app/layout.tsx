import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Queue King Snooker',
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
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
