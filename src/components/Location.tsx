'use client';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Location() {
  return (
    <section className="py-24 relative overflow-hidden backdrop-blur-sm border-t border-white/5">
      <div className="absolute inset-0 bg-linear-to-t from-black to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-snookerGreen to-goldAccent mb-4">
            Find the Kings
          </h2>
          <p className="text-lg text-white/60">Come visit our premium club in person. We are open late for the true night owls.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-4 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Info Details */}
          <div className="lg:col-span-2 space-y-8 py-4 px-2 sm:px-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Cue King Snooker</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-snookerGreen/20 p-3 rounded-2xl text-snookerGreen shrink-0 shadow-[inset_0_0_10px_rgba(0,255,128,0.1)]">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Club Location</h4>
                    <p className="text-white/60 text-sm leading-relaxed">
                      Sector 50, Faridabad<br />
                      Haryana 121006, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-goldAccent/20 p-3 rounded-2xl text-goldAccent shrink-0 shadow-[inset_0_0_10px_rgba(212,175,55,0.1)]">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Opening Hours</h4>
                    <p className="text-white/60 text-sm leading-relaxed">
                      Mon - Sun: 10:00 AM - 2:00 AM<br />
                      VIP Rooms: 24/7 Access
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-400 shrink-0 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Contact Details</h4>
                    <p className="text-white/60 text-sm leading-relaxed">
                      +91 9717179040<br />
                      cueking88@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <a 
              href="https://goo.gl/maps/CueKing" 
              target="_blank" 
              rel="noreferrer"
              className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-snookerGreen hover:border-snookerGreen hover:shadow-[0_0_15px_rgba(0,77,38,0.5)] transition-all flex items-center justify-center tracking-wide"
            >
              Get Directions
            </a>
          </div>

          {/* Map Frame */}
          <div className="lg:col-span-3 h-[400px] lg:h-auto rounded-3xl overflow-hidden relative border border-white/10 filter brightness-90 contrast-125 saturate-150 transition-all duration-500 group">
            {/* Thematic overly */}
            <div className="absolute inset-0 bg-snookerGreen/10 mix-blend-overlay pointer-events-none group-hover:opacity-0 transition-opacity duration-700 z-10" />
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2067.638254420788!2d77.28268414400432!3d28.37623359838809!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cdfca15df947f%3A0x743e3622badd1f3f!2sCue%20King!5e1!3m2!1sen!2sin!4v1776168324638!5m2!1sen!2sin" 
              className="w-full h-full relative z-0"
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
