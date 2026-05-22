'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Bell, Shield, User, Info, MessageCircle, Save, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';

interface UserSettings {
  name: string;
  email: string;
  telegramChatId: string | null;
  emailNotifications: boolean;
  telegramNotifications: boolean;
  pushNotifications: boolean;
  soundAlerts: boolean;
  shareHistory: boolean;
  profilePublic: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, initialize, token } = useAuthStore();
  const { showToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile');

  // Form states matching schema
  const [name, setName] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [telegramNotifications, setTelegramNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [shareHistory, setShareHistory] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/login?returnUrl=/settings');
    }
  }, [isMounted, isAuthenticated, router]);

  // Query profile settings
  const { data: profile, isLoading } = useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${tokenVal}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token,
  });

  // Populate form states when data loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setTelegramChatId(profile.telegramChatId || '');
      setEmailNotifications(profile.emailNotifications);
      setTelegramNotifications(profile.telegramNotifications);
      setPushNotifications(profile.pushNotifications);
      setSoundAlerts(profile.soundAlerts);
      setShareHistory(profile.shareHistory);
      setProfilePublic(profile.profilePublic);
    }
  }, [profile]);

  // Update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedData: Partial<UserSettings>) => {
      const tokenVal = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenVal}`,
        },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-settings'], data);
      showToast('Settings saved successfully');
    },
    onError: (err: any) => {
      showToast(`Error saving settings: ${err.message}`);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      name,
      telegramChatId: telegramChatId || null,
      emailNotifications,
      telegramNotifications,
      pushNotifications,
      soundAlerts,
      shareHistory,
      profilePublic,
    });
  };

  if (!isMounted || !isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabItems = [
    { id: 'profile' as const, label: 'Profile Details', icon: <User className="w-4 h-4" /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'privacy' as const, label: 'Privacy & Security', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 border-b border-white/15 pb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-3">
            <Settings className="w-8 h-8 text-snookerGreen" />
            Settings
          </h1>
          <p className="text-gray-400 mt-2">
            Configure your notifications, privacy preferences, and account details.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1 flex flex-col gap-2">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left text-sm ${
                  activeTab === tab.id
                    ? 'bg-snookerGreen text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="md:col-span-3">
            <form onSubmit={handleSave} className="space-y-6">
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6"
                >
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                    <User className="w-5 h-5 text-snookerGreen" />
                    Profile Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen transition-colors"
                        placeholder="Your Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Contact support to change your account email.</p>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-sky-400" />
                        Telegram Chat ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-snookerGreen transition-colors"
                        placeholder="e.g. 123456789"
                      />
                      <div className="flex gap-2.5 items-start mt-3 text-xs bg-white/5 border border-white/10 rounded-xl p-4 text-gray-400">
                        <Info className="w-4 h-4 text-goldAccent shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white mb-1">How to link Telegram:</p>
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>Search for <span className="text-snookerGreen font-bold">@CueKingBot</span> on Telegram.</li>
                            <li>Send a <span className="font-mono text-white bg-black/50 px-1 py-0.5 rounded">/start</span> message.</li>
                            <li>Paste the Chat ID provided by the bot into the box above.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6"
                >
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                    <Bell className="w-5 h-5 text-snookerGreen" />
                    Notification Channels
                  </h2>

                  <div className="space-y-4">
                    {/* Toggle Switches */}
                    {[
                      {
                        title: 'Email Notifications',
                        desc: 'Receive confirmation and cancellation updates via email',
                        val: emailNotifications,
                        set: setEmailNotifications,
                      },
                      {
                        title: 'Telegram Notifications',
                        desc: 'Receive real-time booking alerts directly in Telegram chat (requires Chat ID)',
                        val: telegramNotifications,
                        set: setTelegramNotifications,
                      },
                      {
                        title: 'Push Notifications',
                        desc: 'In-app notifications for instant status changes',
                        val: pushNotifications,
                        set: setPushNotifications,
                      },
                      {
                        title: 'Enable Sound Alerts',
                        desc: 'Play dynamic notification sounds when booking statuses update',
                        val: soundAlerts,
                        set: setSoundAlerts,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5"
                      >
                        <div className="pr-4">
                          <h4 className="font-bold text-white text-sm">{item.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => item.set(!item.val)}
                          className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                            item.val ? 'bg-snookerGreen' : 'bg-zinc-800'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                              item.val ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6"
                >
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                    <Shield className="w-5 h-5 text-snookerGreen" />
                    Privacy Settings
                  </h2>

                  <div className="space-y-4">
                    {[
                      {
                        title: 'Public Profile Visibility',
                        desc: 'Allow other players to view your statistics, ranking, and avatar',
                        val: profilePublic,
                        set: setProfilePublic,
                      },
                      {
                        title: 'Share Booking History',
                        desc: 'Allow your booking analytics to be summarized on platform leaderboards',
                        val: shareHistory,
                        set: setShareHistory,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5"
                      >
                        <div className="pr-4">
                          <h4 className="font-bold text-white text-sm">{item.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => item.set(!item.val)}
                          className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                            item.val ? 'bg-snookerGreen' : 'bg-zinc-800'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                              item.val ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="w-full bg-gradient-to-r from-snookerGreen to-emerald-500 hover:from-snookerGreen/90 hover:to-emerald-500/90 text-black font-extrabold text-md py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {updateSettingsMutation.isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
