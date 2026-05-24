'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/config/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EditProfilePage() {
  const router = useRouter();
  const { token, isAuthenticated, initialize } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  const [name, setName] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [upiId, setUpiId] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setName(data.data.name || '');
          setTelegramChatId(data.data.telegramChatId || '');
          setUpiId(data.data.upiId || '');
          setRole(data.data.role || '');
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, telegramChatId, upiId })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[url('/noise.png')]">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/profile" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Edit Profile</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl"
        >
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-xl shadow-sm placeholder-gray-500 bg-black/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm text-white transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {role === 'CLUB_OWNER' && (
              <div>
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-300">
                  UPI ID (VPA)
                </label>
                <p className="text-xs text-gray-500 mb-2 mt-1">Default payment address for generated QR codes.</p>
                <div className="mt-1">
                  <input
                    id="upiId"
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-xl shadow-sm placeholder-gray-500 bg-black/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm text-white transition-all"
                    placeholder="owner@upi"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="telegramChatId" className="block text-sm font-medium text-gray-300">
                Telegram Username (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2 mt-1">Used for sending you booking notifications quickly.</p>
              <div className="mt-1 flex rounded-xl shadow-sm">
                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-white/10 bg-white/5 text-gray-400 sm:text-sm">
                  @
                </span>
                <input
                  id="telegramChatId"
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="flex-1 appearance-none block w-full px-4 py-3 border border-white/10 rounded-none rounded-r-xl shadow-sm placeholder-gray-500 bg-black/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm text-white transition-all"
                  placeholder="username"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-black bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-black disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
