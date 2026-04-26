'use client';
import { useEffect, useRef, useState } from 'react';
import { Music, Play, Pause, Volume2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SoundCloudPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const widgetRef = useRef<any>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Show prompt after 5 seconds if user hasn't interacted
    const timer = setTimeout(() => {
      if (!hasInteracted && !isExpanded) {
        setShowPrompt(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [hasInteracted, isExpanded]);

  useEffect(() => {
    if (!document.getElementById('soundcloud-widget-api')) {
      const script = document.createElement('script');
      script.id = 'soundcloud-widget-api';
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = initWidget;
    } else {
      initWidget();
    }

    function initWidget() {
      if (iframeRef.current && (window as any).SC) {
        const widget = (window as any).SC.Widget(iframeRef.current);
        widgetRef.current = widget;

        widget.bind((window as any).SC.Widget.Events.READY, () => {
          widget.setVolume(volume);
          widget.bind((window as any).SC.Widget.Events.PLAY, () => setIsPlaying(true));
          widget.bind((window as any).SC.Widget.Events.PAUSE, () => setIsPlaying(false));
          widget.bind((window as any).SC.Widget.Events.FINISH, () => setIsPlaying(false));
        });
      }
    }
  }, []);

  useEffect(() => {
    if (widgetRef.current) widgetRef.current.setVolume(volume);
  }, [volume]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHasInteracted(true);
    setShowPrompt(false);
    if (widgetRef.current) widgetRef.current.toggle();
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setHasInteracted(true);
    setShowPrompt(false);
  };

  return (
    <div className="fixed bottom-[110px] right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {showPrompt && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-black/90 border border-snookerGreen/30 text-white text-sm px-4 py-3 rounded-2xl shadow-[0_5px_20px_rgba(0,255,156,0.2)] backdrop-blur-md pointer-events-auto flex items-center gap-3 relative"
          >
            <span>Set the vibe? Play music 🎶</span>
            <button onClick={() => setShowPrompt(false)} className="text-white/50 hover:text-white">
              <X size={16} />
            </button>
            {/* Arrow pointing down strictly visual */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-black/90 border-b border-r border-snookerGreen/30 rotate-45 transform"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="pointer-events-auto relative bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 ease-in-out"
        onMouseEnter={handleExpand}
        onMouseLeave={() => setIsExpanded(false)}
        style={{ width: isExpanded ? '320px' : '60px', height: isExpanded ? '290px' : '60px' }}
      >
        {/* Collapsed State Icon */}
        <div
          className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity duration-300 z-10 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-white/5'}`}
          onClick={handleExpand}
        >
          {isPlaying ? (
            // Music playing animation (bars)
            <div className="flex items-end justify-center gap-1 h-5 w-5">
              <motion.div animate={{ height: ["4px", "20px", "4px"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 bg-snookerGreen rounded-full shadow-[0_0_5px_#00ff9c]"></motion.div>
              <motion.div animate={{ height: ["12px", "4px", "12px"] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 bg-snookerGreen rounded-full shadow-[0_0_5px_#00ff9c]"></motion.div>
              <motion.div animate={{ height: ["6px", "16px", "6px"] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 bg-snookerGreen rounded-full shadow-[0_0_5px_#00ff9c]"></motion.div>
            </div>
          ) : (
            <Music size={24} className="text-white/70" />
          )}
        </div>

        {/* Expanded State Player */}
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${isExpanded ? 'opacity-100 pointer-events-auto delay-200' : 'opacity-0 pointer-events-none'}`}>
          <div className="p-3 bg-[#111] border-b border-white/5 flex items-center justify-between gap-4 h-[60px] shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 shrink-0 rounded-full bg-snookerGreen text-black flex items-center justify-center hover:bg-snookerGreen/80 transition-colors shadow-[0_0_15px_rgba(0,255,156,0.3)]"
              >
                {isPlaying ? <Pause size={20} className="fill-black" /> : <Play size={20} className="fill-black ml-1" />}
              </button>
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-white text-sm font-bold leading-tight truncate">Motivation Mix</span>
                <span className="text-white/40 text-[10px] truncate">Cue King Soundtrack</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <Volume2 size={12} className="text-white/60 mb-0.5" />
              <input
                type="range" min="0" max="100" value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-16 accent-snookerGreen h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-black flex-1 w-[320px]">
            <iframe
              ref={iframeRef}
              width="100%"
              height="200"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A2227962143&color=%230066cc&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
              className="block"
            ></iframe>

            <div className="px-3 py-1.5 h-[30px] bg-black text-[10px] text-[#cccccc] font-light truncate flex gap-1 items-center border-t border-white/5">
              <a href="https://soundcloud.com/anurag-579831323" target="_blank" className="hover:text-white" rel="noreferrer">Anurag</a> ·
              <a href="https://soundcloud.com/anurag-579831323/sets/motivational" target="_blank" className="hover:text-white" rel="noreferrer">motivational</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
