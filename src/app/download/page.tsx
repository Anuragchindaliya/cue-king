'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import appPreview from '@/assets/gallery/app-preview.png';
import { useHitSound } from '@/hooks/useHitSound';

export default function DownloadPage() {
  const playHitSound = useHitSound();
  const apkDownloadUrl = 'https://github.com/Anuragchindaliya/cue-king-mobile/releases/download/latest/app-release.apk';

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-snookerGreen/20 rounded-[100%] filter blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-goldAccent/10 rounded-[100%] filter blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            onClick={playHitSound}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-12 gap-12 items-start">
          {/* Main Content (8 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="md:col-span-7 flex flex-col"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Get the <span className="text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">Cue King</span> App
            </h1>
            <p className="text-white/60 text-base mb-8">
              Download the official Cue King mobile client for Android devices to unlock direct table bookings, real-time queues, and customized profile options on the go.
            </p>

            {/* Direct Download Card */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-glass mb-10">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-snookerGreen" />
                Latest Build for Android
              </h3>
              <p className="text-white/50 text-xs mb-6">
                This APK is built directly from the latest source code. File is scanned and verified safe.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <a
                  href={apkDownloadUrl}
                  onClick={playHitSound}
                  className="group w-full sm:w-auto relative inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold text-white bg-snookerGreen hover:bg-snookerGreen/90 border border-white/10 rounded-full transition-all shadow-[0_0_20px_rgba(0,77,38,0.4)] cursor-pointer overflow-hidden"
                >
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  Download APK
                  <div className="absolute inset-0 h-full w-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                </a>
                <span className="text-white/30 text-xs font-mono">Size: ~30 MB • Version: 1.0 (latest)</span>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <h2 className="text-2xl font-bold text-white mb-6">How to Install</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-snookerGreen/10 border border-snookerGreen/20 flex items-center justify-center text-snookerGreen font-mono text-sm font-bold">1</span>
                <div>
                  <h4 className="text-white font-semibold text-sm">Download the APK file</h4>
                  <p className="text-white/50 text-xs mt-1">
                    Click the download button above to retrieve the package. Your browser might ask you to confirm the download.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-snookerGreen/10 border border-snookerGreen/20 flex items-center justify-center text-snookerGreen font-mono text-sm font-bold">2</span>
                <div>
                  <h4 className="text-white font-semibold text-sm">Allow Unknown Sources (if required)</h4>
                  <p className="text-white/50 text-xs mt-1">
                    Because this is downloaded directly and not from the Play Store, Android requires manual confirmation. If prompted:
                  </p>
                  <div className="mt-2 p-3 bg-white/2 border border-white/5 rounded-xl text-[11px] text-white/60 flex gap-2 items-start">
                    <Info className="w-4 h-4 shrink-0 text-goldAccent mt-0.5" />
                    <span>Go to <strong>Settings</strong> &gt; <strong>Apps</strong> &gt; <strong>Special Access</strong> &gt; <strong>Install unknown apps</strong>. Allow your browser or file manager to install packages.</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-snookerGreen/10 border border-snookerGreen/20 flex items-center justify-center text-snookerGreen font-mono text-sm font-bold">3</span>
                <div>
                  <h4 className="text-white font-semibold text-sm">Launch and install</h4>
                  <p className="text-white/50 text-xs mt-1">
                    Locate the downloaded file `app-release.apk` in your notifications or download folder, tap it, and select <strong>Install</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-snookerGreen/10 border border-snookerGreen/20 flex items-center justify-center text-snookerGreen font-mono text-sm font-bold">4</span>
                <div>
                  <h4 className="text-white font-semibold text-sm">Ready to play</h4>
                  <p className="text-white/50 text-xs mt-1">
                    Open Cue King App, sign in to your existing account or sign up, and immediately explore digital club tables!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Mockup Image and QR code (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-5 flex flex-col items-center gap-8"
          >
            {/* Embedded mockup preview image */}
            <div className="relative w-full max-w-[280px] aspect-[9/18.5] bg-[#0c0c0c] border-[6px] border-zinc-800 rounded-[38px] shadow-2xl overflow-hidden ring-1 ring-white/10">
              <Image
                src={appPreview}
                alt="Cue King Mobile App Preview"
                fill
                className="object-cover"
              />
            </div>

            {/* QR Code Card */}
            <div className="w-full p-6 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl flex flex-col items-center text-center">
              <svg className="w-24 h-24 bg-white p-1 rounded-xl shadow-md mb-4" viewBox="0 0 29 29">
                <path d="M0 0h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm17-2h9v9h-9zm1 1h7v7h-7zm1 1h5v5h-5zM0 20h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm12-22h2v4h-2zm0 6h2v3h-2zm4-4h2v2h-2zm4 0h2v2h-2zm-6 8h2v2h-2zm4-2h2v2h-2zm2 2h2v3h-2zm-4 4h2v2h-2zm4 0h2v2h-2zm2-2h2v2h-2zm-12 2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm2 4h2v3h-2zm-8 1h2v2h-2zm6 2h2v2h-2zm2-2h2v2h-2zm4 0h2v2h-2zm0-4h2v2h-2zm-10 1h2v2h-2z" fill="#000" />
                <rect x="12" y="12" width="5" height="5" fill="#004d26" rx="1" />
              </svg>
              <h4 className="text-white text-xs font-semibold">Scan to Get the App</h4>
              <p className="text-white/40 text-[10px] mt-1 max-w-[200px]">
                Scan this code with your phone camera to download the APK directly.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
