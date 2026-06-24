'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Calendar, Bell, Trophy, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import appPreview from '@/assets/gallery/app-preview.png';
import { useHitSound } from '@/hooks/useHitSound';

export function DownloadSection() {
  const playHitSound = useHitSound();
  const apkDownloadUrl = 'https://github.com/Anuragchindaliya/cue-king-mobile/releases/download/latest/app-release.apk';

  return (
    <section className="relative py-24 overflow-hidden border-t border-white/5 bg-black/30">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-snookerGreen/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left Side: Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center order-2 md:order-1"
          >
            {/* Phone Frame mockup using Tailwind */}
            <div className="relative w-full max-w-[340px] aspect-[9/18.5] bg-[#0c0c0c] border-[8px] border-zinc-800 rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,77,38,0.3)] overflow-hidden ring-1 ring-white/10 group">
              {/* Dynamic camera notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-4 ring-1 ring-white/5">
                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                <div className="w-10 h-1 bg-zinc-900 rounded-full" />
                <div className="w-2.5 h-2.5 bg-blue-950/40 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-blue-500/50 rounded-full" />
                </div>
              </div>

              {/* Status bar details inside notch area */}
              <div className="absolute top-3 inset-x-0 flex justify-between px-6 text-[10px] text-white/50 z-20 font-sans pointer-events-none">
                <span>9:41 AM</span>
                <span className="flex items-center gap-1">5G 🔋</span>
              </div>

              {/* Screenshot Image */}
              <div className="relative w-full h-full">
                <Image
                  src={appPreview}
                  alt="Cue King Mobile App Interface"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              </div>

              {/* Decorative inner ambient reflection */}
              <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none z-10" />
            </div>

            {/* Glowing backgrounds */}
            <div className="absolute inset-x-10 bottom-0 top-1/3 bg-linear-to-t from-snookerGreen/20 to-transparent blur-3xl -z-10 rounded-full" />
          </motion.div>

          {/* Right Side: Text & Actions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col text-left order-1 md:order-2"
          >
            {/* Tagline */}
            <span className="text-sm font-bold tracking-widest text-goldAccent uppercase mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-snookerGreen animate-pulse" />
              Cue King Mobile App
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              Take the Game
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
                Anywhere You Go
              </span>
            </h2>

            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Book tables on the fly, track queue times live, view real-time scoreboards, and manage your club profile from the convenience of your phone. Built with speed and accuracy for premium players.
            </p>

            {/* Features Bullet List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-snookerGreen/10 border border-snookerGreen/20 flex items-center justify-center text-snookerGreen">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Instant Reservation</h4>
                  <p className="text-white/50 text-xs mt-0.5">Book physical tables instantly.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-snookerGreen/10 border border-snookerGreen/20 flex items-center justify-center text-snookerGreen">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Live Notifications</h4>
                  <p className="text-white/50 text-xs mt-0.5">Alerts when your table is ready.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-snookerGreen/10 border border-snookerGreen/20 flex items-center justify-center text-snookerGreen">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Live Leaderboards</h4>
                  <p className="text-white/50 text-xs mt-0.5">Track your rankings real-time.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-snookerGreen/10 border border-snookerGreen/20 flex items-center justify-center text-snookerGreen">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">Safe & Verified</h4>
                  <p className="text-white/50 text-xs mt-0.5">Signed package, malware-free.</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <a
                href={apkDownloadUrl}
                onClick={playHitSound}
                className="group w-full sm:w-auto relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-snookerGreen hover:bg-snookerGreen/90 border border-white/10 rounded-full transition-all shadow-[0_0_20px_rgba(0,77,38,0.4)] hover:shadow-[0_0_30px_rgba(0,77,38,0.7)] text-center cursor-pointer overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                  Download for Android
                </span>
                <span className="absolute right-3 top-1 text-[9px] text-white/40 font-mono font-normal">APK (~30MB)</span>
                <div className="absolute inset-0 h-full w-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              </a>

              <Link
                href="/download"
                onClick={playHitSound}
                className="w-full sm:w-auto text-center px-6 py-4 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 border border-white/10 rounded-full transition-all"
              >
                Installation Instructions
              </Link>
            </div>

            {/* Desktop Scan-to-download section */}
            <div className="hidden lg:flex items-center gap-4 mt-8 p-4 border border-white/5 bg-white/2 rounded-2xl max-w-sm">
              {/* Dynamic QR Code represented as SVG */}
              <svg className="w-16 h-16 bg-white p-1 rounded-lg shadow-md shrink-0" viewBox="0 0 29 29">
                <path d="M0 0h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm17-2h9v9h-9zm1 1h7v7h-7zm1 1h5v5h-5zM0 20h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm12-22h2v4h-2zm0 6h2v3h-2zm4-4h2v2h-2zm4 0h2v2h-2zm-6 8h2v2h-2zm4-2h2v2h-2zm2 2h2v3h-2zm-4 4h2v2h-2zm4 0h2v2h-2zm2-2h2v2h-2zm-12 2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm2 4h2v3h-2zm-8 1h2v2h-2zm6 2h2v2h-2zm2-2h2v2h-2zm4 0h2v2h-2zm0-4h2v2h-2zm-10 1h2v2h-2z" fill="#000" />
                {/* Visual center anchor */}
                <rect x="12" y="12" width="5" height="5" fill="#004d26" rx="1" />
              </svg>
              <div>
                <p className="text-white/80 text-xs font-semibold">Scan to Download</p>
                <p className="text-white/40 text-[10px] mt-0.5">Point your camera to download the APK directly onto your phone.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
