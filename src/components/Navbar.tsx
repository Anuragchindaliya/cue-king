'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, ChevronDown, Bell, Heart, Settings, Calendar, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { BookingModal } from '@/components/BookingModal';
import { useHitSound } from '@/hooks/useHitSound';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/SocketProvider';
import { API_BASE_URL } from '@/config/api';

export function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const playHitSound = useHitSound();
  const router = useRouter();

  const { isAuthenticated, user, logout } = useAuthStore();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    playHitSound();
    logout();
    setIsProfileMenuOpen(false);
    router.push('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Query notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      if (!tokenVal) return [];
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: isAuthenticated,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Real-time notification updates
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('new-notification', handleNewNotification);
    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-black/60 backdrop-blur-md border-white/10 shadow-glass"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="shrink-0">
            <Link href="/" onClick={playHitSound} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-snookerGreen to-goldAccent">
              Cue King
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              <Link href="/" onClick={playHitSound} className="text-white hover:text-goldAccent transition-colors px-2 py-2 rounded-md text-sm font-medium">Home</Link>
              <Link href="/clubs" onClick={playHitSound} className="text-white/70 hover:text-white transition-colors px-2 py-2 rounded-md text-sm font-medium">Clubs</Link>
              <Link href="/experience" onClick={playHitSound} className="text-white/70 hover:text-white transition-colors px-2 py-2 rounded-md text-sm font-medium">Experience</Link>
              <Link href="/shop" onClick={playHitSound} className="text-white/70 hover:text-white transition-colors px-2 py-2 rounded-md text-sm font-medium">Shop</Link>

              <div className="border-l border-white/20 pl-4 ml-2 flex items-center space-x-4 relative">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    {/* Header Favorites Link */}
                    <Link
                      href="/favorites"
                      onClick={playHitSound}
                      className="relative p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                      title="Favorites"
                    >
                      <Heart className="w-5 h-5" />
                    </Link>

                    {/* Header Notifications Link */}
                    <Link
                      href="/notifications"
                      onClick={playHitSound}
                      className="relative p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors mr-2"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-snookerGreen text-black text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </Link>

                    <div className="relative">
                      <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">{user?.name || user?.email || 'Profile'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isProfileMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-52 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden backdrop-blur-md z-50"
                          >
                            <div className="p-2.5 border-b border-white/5 bg-white/2">
                              <p className="text-xs text-gray-400 px-1 truncate font-medium">{user?.email}</p>
                            </div>
                            <div className="p-1.5 space-y-0.5">
                              <Link href="/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <User className="w-4 h-4 text-zinc-400" />
                                Profile
                              </Link>
                              
                              {user?.role === 'CLUB_OWNER' ? (
                                <>
                                  <Link href="/owner/dashboard" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <UserCheck className="w-4 h-4 text-zinc-400" />
                                    Owner Dashboard
                                  </Link>
                                  <Link href="/owner/bookings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <Calendar className="w-4 h-4 text-zinc-400" />
                                    Booking Requests
                                  </Link>
                                  <Link href="/owner/club/new" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <span className="text-zinc-400 font-bold text-sm leading-none pl-0.5 pr-0.5">+</span>
                                    Add Club
                                  </Link>
                                </>
                              ) : (
                                <>
                                  <Link href="/bookings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <Calendar className="w-4 h-4 text-zinc-400" />
                                    My Bookings
                                  </Link>
                                  <Link href="/favorites" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <Heart className="w-4 h-4 text-zinc-400" />
                                    Favorites
                                  </Link>
                                </>
                              )}

                              <Link href="/notifications" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <Bell className="w-4 h-4 text-zinc-400" />
                                Notifications
                                {unreadCount > 0 && (
                                  <span className="ml-auto w-2 h-2 rounded-full bg-snookerGreen animate-pulse"></span>
                                )}
                              </Link>

                              <Link href="/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <Settings className="w-4 h-4 text-zinc-400" />
                                Settings
                              </Link>

                              <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors text-left"
                              >
                                <LogOut className="w-4 h-4" />
                                Logout
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link href="/login" className="text-white/70 hover:text-white transition-colors text-sm font-medium">Login</Link>
                    <Link href="/signup" className="text-green-300 hover:text-snookerGreen/80 transition-colors text-sm font-medium">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <button
              onClick={() => { playHitSound(); setIsModalOpen(true); }}
              className="bg-snookerGreen/80 hover:bg-snookerGreen border border-white/20 text-white px-5 py-2 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(0,77,38,0.5)]"
            >
              Book Table
            </button>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden glass-panel"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/80 backdrop-blur-xl border-b border-white/10">
              <Link href="/" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white block px-3 py-2 rounded-md text-base font-medium">Home</Link>
              <Link href="/clubs" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Clubs</Link>
              <Link href="/experience" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Experience</Link>
              <Link href="/shop" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Shop</Link>
              <div className="border-t border-white/10 mt-4 pt-4 pb-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-400 mb-2 truncate border-b border-white/5">{user?.email}</div>
                    <Link href="/profile" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Profile</Link>
                    
                    {user?.role === 'CLUB_OWNER' ? (
                      <>
                        <Link href="/owner/dashboard" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Owner Dashboard</Link>
                        <Link href="/owner/bookings" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Booking Requests</Link>
                        <Link href="/owner/club/new" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Add Club</Link>
                      </>
                    ) : (
                      <>
                        <Link href="/bookings" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">My Bookings</Link>
                        <Link href="/favorites" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Favorites</Link>
                      </>
                    )}

                    <Link href="/notifications" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center justify-between">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-snookerGreen text-black text-xs font-bold rounded-full animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    
                    <Link href="/settings" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Settings</Link>
                    
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300 block w-full text-left px-3 py-2 rounded-md text-base font-medium">Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-white/70 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Login</Link>
                    <Link href="/signup" onClick={() => { playHitSound(); setIsMobileMenuOpen(false); }} className="text-snookerGreen hover:text-snookerGreen/80 block px-3 py-2 rounded-md text-base font-medium">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
}
