'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, UserCircle, Edit3, MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';


interface ProfileDetailsProps {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

export default function ProfileDetails({ user: initialUser }: ProfileDetailsProps) {
  const [profile, setProfile] = useState<any>(initialUser);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    if (token) fetchProfile();
  }, [token]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl space-y-8"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 p-1 flex items-center justify-center">
          <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
            <UserCircle className="w-12 h-12 text-zinc-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{profile?.name || 'User'}</h2>
          <p className="text-zinc-400">{profile?.email}</p>
        </div>
        
        <div className="px-4 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-medium tracking-wide">
          {profile?.role === 'CLUB_OWNER' ? 'Club Owner' : profile?.role === 'PLAYER' ? 'Player' : profile?.role}
        </div>

      </div>

      <div className="space-y-4 pt-6 border-t border-zinc-800/50">
        <div className="flex items-center gap-4 text-zinc-300 bg-black/20 p-4 rounded-2xl">
          <User className="w-5 h-5 text-green-400" />
          <div className="flex-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Full Name</p>
            <p className="font-medium">{profile?.name || 'Not provided'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-zinc-300 bg-black/20 p-4 rounded-2xl">
          <Mail className="w-5 h-5 text-green-400" />
          <div className="flex-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Email Address</p>
            <p className="font-medium">{profile?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-zinc-300 bg-black/20 p-4 rounded-2xl">
          <MessageCircle className="w-5 h-5 text-green-400" />
          <div className="flex-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Telegram Handle</p>
            <p className="font-medium">{profile?.telegramChatId || 'Not provided'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-zinc-300 bg-black/20 p-4 rounded-2xl">
          <Shield className="w-5 h-5 text-green-400" />
          <div className="flex-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Account Role</p>
            <p className="font-medium">{profile?.role === 'CLUB_OWNER' ? 'Owner' : profile?.role}</p>
          </div>
        </div>

        {profile?.role === 'CLUB_OWNER' && (
          <div className="flex items-center gap-4 text-zinc-300 bg-black/20 p-4 rounded-2xl">
            <Edit3 className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Default UPI VPA</p>
              <p className="font-medium font-mono">{profile?.upiId || 'Not provided'}</p>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/profile/edit"
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10 font-medium mt-4"
      >
        <Edit3 className="w-4 h-4" />
        Edit Profile
      </Link>
    </motion.div>
  );
}
