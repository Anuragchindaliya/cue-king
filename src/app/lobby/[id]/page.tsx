'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSSE } from '@/hooks/useSSE';
import { API_BASE_URL } from '@/config/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Copy,
  Check,
  Send,
  Lock,
  Unlock,
  CreditCard,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface LobbyState {
  lobbyId: string;
  clubId: string;
  clubName: string;
  hostId: string;
  isLocked: boolean;
  expiresAt: string;
  activeUsers: Array<{
    id: string;
    name: string;
    role: 'HOST' | 'GUEST';
    status: 'ONLINE' | 'OFFLINE';
  }>;
  tables: Array<{
    id: string;
    name: string;
    type: 'SNOOKER' | 'EIGHT_BALL_POOL';
    pricePerHour: number;
  }>;
  votes: {
    tables: Record<string, string[]>;
    foodPackages: Record<string, string[]>;
    timeslots: Record<string, string[]>;
  };
  messages: Array<{
    id: string;
    senderName: string;
    message: string;
    createdAt: string;
  }>;
}

const STATIC_TIMESLOTS = [
  { id: 'time_21_00', display: '9:00 PM', value: '21:00' },
  { id: 'time_22_00', display: '10:00 PM', value: '22:00' },
  { id: 'time_23_00', display: '11:00 PM', value: '23:00' },
  { id: 'time_00_00', display: '12:00 AM', value: '00:00' },
];

const STATIC_PACKAGES = [
  { id: 'pkg_a', name: 'Package A (Standard Platters)', price: 1500, desc: 'Includes light finger snacks, chips & dip, and soft beverages for up to 5 players.' },
  { id: 'pkg_b', name: 'Package B (Premium VIP)', price: 3000, desc: 'Includes signature club platters, dynamic mocktails, red bull starters, and personal butler service.' },
  { id: 'pkg_c', name: 'Package C (Ultimate Feast)', price: 5000, desc: 'Includes hot gourmet main course meals, unlimited beverages, and dedicated dessert platter.' }
];

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.id as string;
  const { showToast } = useToast();
  const { token: userToken, user: authUser, isAuthenticated } = useAuthStore();

  // Local state
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [lobbyToken, setLobbyToken] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Host checkout selections
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedTimeslot, setSelectedTimeslot] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeToken = userToken || lobbyToken;

  // Verify connection token or trigger name modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(`lobby_token_${lobbyId}`);
      if (isAuthenticated && userToken) {
        setLobbyToken(userToken);
      } else if (storedToken) {
        setLobbyToken(storedToken);
      } else {
        setNeedsName(true);
      }
    }
  }, [lobbyId, isAuthenticated, userToken]);

  // Establish SSE Connection
  const { isConnected } = useSSE({
    url: activeToken ? `${API_BASE_URL}/api/lobby/${lobbyId}/events` : '',
    token: activeToken,
    events: {
      lobby_state_update: (newState: LobbyState) => {
        setLobbyState(newState);
        // Play notification sound on vote or membership change
        if (soundEnabled && typeof Audio !== 'undefined') {
          const audio = new Audio('/assets/notification.mp3');
          audio.volume = 0.2;
          audio.play().catch(() => { });
        }
      },
      new_message: (message: any) => {
        setLobbyState((prev) => {
          if (!prev) return null;
          // Avoid duplicates
          if (prev.messages.some((m) => m.id === message.id)) return prev;
          return { ...prev, messages: [...prev.messages, message] };
        });
        if (soundEnabled && typeof Audio !== 'undefined') {
          const audio = new Audio('/assets/chat.mp3');
          audio.volume = 0.15;
          audio.play().catch(() => { });
        }
      },
      booking_processing: (data: any) => {
        setProcessingPayment(true);
        showToast(`Host is processing payment for the reservation...`);
      },
      booking_redirect: (data: any) => {
        showToast('Payment successful! Redirecting to ticket stub...');
        setTimeout(() => {
          router.push(data.redirectUrl);
        }, 1500);
      }
    }
  });

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lobbyState?.messages]);

  // Set default selections for host based on current votes
  useEffect(() => {
    if (lobbyState && lobbyState.hostId === (authUser?.id || '')) {
      // Find table with max votes
      let maxTable = '';
      let maxTableVotes = -1;
      Object.entries(lobbyState.votes.tables).forEach(([tableId, voters]) => {
        if (voters.length > maxTableVotes) {
          maxTableVotes = voters.length;
          maxTable = tableId;
        }
      });
      if (maxTable && !selectedTable) setSelectedTable(maxTable);

      // Find timeslot with max votes
      let maxTime = '';
      let maxTimeVotes = -1;
      Object.entries(lobbyState.votes.timeslots).forEach(([timeId, voters]) => {
        if (voters.length > maxTimeVotes) {
          maxTimeVotes = voters.length;
          maxTime = timeId;
        }
      });
      if (maxTime && !selectedTimeslot) setSelectedTimeslot(maxTime);
    }
  }, [lobbyState, authUser, selectedTable, selectedTimeslot]);

  // Handle Nickname submission
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsJoining(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/lobby/${lobbyId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nickname })
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.token) {
          localStorage.setItem(`lobby_token_${lobbyId}`, data.data.token);
          setLobbyToken(data.data.token);
        }
        setNeedsName(false);
        showToast(`Welcome to the lobby, ${nickname}!`);
      } else {
        showToast(data.message || 'Failed to join');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to lobby server');
    } finally {
      setIsJoining(false);
    }
  };

  // Copy share invite link to clipboard
  const handleCopyLink = () => {
    const inviteUrl = window.location.href;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    showToast('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Cast vote on a lobby item
  const handleVote = async (itemType: 'TABLE' | 'FOOD_PACKAGE' | 'TIMESLOT', itemId: string) => {
    if (lobbyState?.isLocked && !isHost) {
      showToast('Voting is locked by the host.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/lobby/${lobbyId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ itemType, itemId })
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Voting failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Parameter Lock settings (Host Only)
  const handleToggleLock = async () => {
    const targetLockState = !lobbyState?.isLocked;
    try {
      const res = await fetch(`${API_BASE_URL}/api/lobby/${lobbyId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ isLocked: targetLockState })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Voting ${targetLockState ? 'locked' : 'unlocked'} successfully`);
      } else {
        showToast(data.message || 'Lock toggle failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send message in chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const msg = chatMessage;
    setChatMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/lobby/${lobbyId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Finalize booking parameters & launch simulated checkout
  const handleFinalize = async () => {
    if (!selectedTable) {
      showToast('Please select the final Table to book');
      return;
    }
    if (!selectedTimeslot) {
      showToast('Please select the final Timeslot');
      return;
    }

    const matchedSlot = STATIC_TIMESLOTS.find(s => s.id === selectedTimeslot);
    if (!matchedSlot) return;

    const startStr = `${lobbyState?.expiresAt.split('T')[0]}T${matchedSlot.value}:00.000Z`;
    const startObj = new Date(startStr);
    const endObj = new Date(startObj.getTime() + 60 * 60 * 1000); // 1 hour booking

    // Calculate total price based on table and food package
    const tablePrice = lobbyState?.tables.find(t => t.id === selectedTable)?.pricePerHour || 150;
    const foodPrice = STATIC_PACKAGES.find(p => p.id === selectedPackage)?.price || 0;
    const total = tablePrice + foodPrice;

    try {
      const res = await fetch(`${API_BASE_URL}/api/lobby/${lobbyId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          tableId: selectedTable,
          startTime: startObj.toISOString(),
          endTime: endObj.toISOString(),
          totalPrice: total
        })
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.data.paymentUrl);
      } else {
        showToast(data.message || 'Failed to finalize booking');
      }
    } catch (err) {
      console.error(err);
      showToast('Error finalizing booking');
    }
  };

  const isHost = lobbyState?.hostId === (authUser?.id || '');

  // Render nickname joining modal
  if (needsName) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.1),transparent_70%)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-snookerGreen/10 border border-snookerGreen/25 rounded-2xl flex items-center justify-center mx-auto mb-4 text-snookerGreen">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-white">Join Booking Lobby</h1>
            <p className="text-sm text-zinc-400 mt-2">Enter your nickname to join the collaborative lobby</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Your Nickname
              </label>
              <input
                type="text"
                placeholder="e.g. Alice, Bob, DJ King"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                required
                className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white outline-none focus:border-snookerGreen focus:ring-1 focus:ring-snookerGreen/20 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining || !nickname.trim()}
              className="w-full py-4 bg-snookerGreen hover:bg-snookerGreen/90 text-white font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isJoining ? 'Joining party...' : 'Join Collaborative Lobby '} &rarr;
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!lobbyState) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm font-medium">Entering lobby environment...</p>
        </div>
      </div>
    );
  }

  // Active status color counts
  const activeMembers = lobbyState.activeUsers;
  const onlineCount = activeMembers.filter(m => m.status === 'ONLINE').length;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-32 px-4 md:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-snookerGreen/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-goldAccent/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Guest Lock Overlay on Payment Processing */}
      <AnimatePresence>
        {processingPayment && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-sm"
            >
              <div className="w-20 h-20 bg-goldAccent/10 border border-goldAccent/30 text-goldAccent rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Processing Payment</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                The host is currently completing checkout for the table. Hang tight, this will update automatically!
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-snookerGreen font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-snookerGreen animate-ping" />
                Live Sync Active
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Lobby Header */}
        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/40 backdrop-blur-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-snookerGreen/10 border border-snookerGreen/20 text-snookerGreen text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Booking Lobby
              </span>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            </div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              {lobbyState.clubName}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 flex items-center gap-1">
              <Clock className="w-4 h-4 text-zinc-500" />
              Lobby active • Expires at {new Date(lobbyState.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Invite Button */}
            <button
              onClick={handleCopyLink}
              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              Invite Friends
            </button>

            {/* Host Controls */}
            {isHost && (
              <button
                onClick={handleToggleLock}
                className={`flex-1 lg:flex-initial px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${lobbyState.isLocked
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
              >
                {lobbyState.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {lobbyState.isLocked ? 'Unlock Voting' : 'Lock Voting'}
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Member Avatars list */}
        <div className="flex items-center gap-3 px-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Online ({onlineCount}):</span>
          <div className="flex flex-wrap gap-2">
            {activeMembers.map((member) => {
              const isUserOnline = member.status === 'ONLINE';
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${isUserOnline
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800/20 border-zinc-800/50 text-zinc-500'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isUserOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                  {member.name}
                  {member.role === 'HOST' && <span className="text-[9px] bg-goldAccent/10 border border-goldAccent/25 text-goldAccent px-1.5 py-0.5 rounded ml-1 font-bold">HOST</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT PANEL: VOTING MATRIX */}
          <div className="lg:col-span-8 space-y-6">

            {/* Section 1: Timeslots */}
            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-snookerGreen" />
                1. Vote on Booking Timeslot
                {lobbyState.isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATIC_TIMESLOTS.map((slot) => {
                  const voters = lobbyState.votes.timeslots[slot.id] || [];
                  const userHasVoted = voters.includes(authUser?.name || nickname);
                  const isSelectable = !lobbyState.isLocked || isHost;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => isSelectable && handleVote('TIMESLOT', slot.id)}
                      disabled={!isSelectable}
                      className={`p-4 rounded-2xl border text-left transition-all ${userHasVoted
                          ? 'bg-snookerGreen/20 border-snookerGreen text-white shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                        } ${!isSelectable ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-extrabold text-sm">{slot.display}</div>
                      <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
                        <span>👍 {voters.length} Vote{voters.length !== 1 ? 's' : ''}</span>
                        {userHasVoted && <span className="text-snookerGreen text-[9px] font-bold">Voted</span>}
                      </div>

                      {/* Voters details */}
                      {voters.length > 0 && (
                        <div className="text-[9px] text-zinc-500 mt-1 truncate">
                          {voters.join(', ')}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Table Selection */}
            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-goldAccent" />
                2. Vote on Available Tables
                {lobbyState.isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
              </h2>
              {lobbyState.tables.length === 0 ? (
                <p className="text-sm text-zinc-500 py-6 text-center">No available tables found for this venue.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lobbyState.tables.map((table) => {
                    const voters = lobbyState.votes.tables[table.id] || [];
                    const userHasVoted = voters.includes(authUser?.name || nickname);
                    const isSelectable = !lobbyState.isLocked || isHost;
                    return (
                      <button
                        key={table.id}
                        onClick={() => isSelectable && handleVote('TABLE', table.id)}
                        disabled={!isSelectable}
                        className={`p-5 rounded-2xl border text-left transition-all ${userHasVoted
                            ? 'bg-goldAccent/10 border-goldAccent text-white shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                          } ${!isSelectable ? 'opacity-80 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-base">{table.name}</h4>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                              {table.type === 'SNOOKER' ? 'Snooker Table' : '8-Ball Pool'}
                            </span>
                          </div>
                          <span className="text-goldAccent font-extrabold text-sm">₹{table.pricePerHour}/hr</span>
                        </div>

                        <div className="text-xs text-zinc-400 mt-4 flex items-center justify-between">
                          <span>👍 {voters.length} Vote{voters.length !== 1 ? 's' : ''}</span>
                          {userHasVoted && <span className="text-goldAccent text-[9px] font-bold">Voted</span>}
                        </div>

                        {voters.length > 0 && (
                          <div className="text-[9px] text-zinc-500 mt-1.5 truncate">
                            {voters.join(', ')}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: Food & Drink Packages */}
            <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-snookerGreen" />
                3. Choose Food & Beverage Addons
                {lobbyState.isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
              </h2>
              <div className="space-y-3">
                {STATIC_PACKAGES.map((pkg) => {
                  const voters = lobbyState.votes.foodPackages[pkg.id] || [];
                  const userHasVoted = voters.includes(authUser?.name || nickname);
                  const isSelectable = !lobbyState.isLocked || isHost;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => isSelectable && handleVote('FOOD_PACKAGE', pkg.id)}
                      disabled={!isSelectable}
                      className={`w-full p-5 rounded-2xl border text-left transition-all ${userHasVoted
                          ? 'bg-snookerGreen/10 border-snookerGreen/35 text-white'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                        } ${!isSelectable ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-white">{pkg.name}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">{pkg.desc}</p>
                        </div>
                        <span className="text-snookerGreen font-extrabold text-sm shrink-0">₹{pkg.price}</span>
                      </div>

                      <div className="text-xs text-zinc-400 mt-4 flex items-center justify-between">
                        <span>👍 {voters.length} Vote{voters.length !== 1 ? 's' : ''}</span>
                        {userHasVoted && <span className="text-snookerGreen text-[9px] font-bold">Selected</span>}
                      </div>

                      {voters.length > 0 && (
                        <div className="text-[9px] text-zinc-500 mt-1 truncate">
                          {voters.join(', ')}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: CHAT */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/40 backdrop-blur-md flex flex-col h-[550px]">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" />
              Lobby Discussion
            </h3>

            {/* Chat Messages Panel */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {lobbyState.messages.map((msg) => {
                const isSystem = msg.senderName === 'System';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSystem ? 'items-center my-2' : ''}`}
                  >
                    {isSystem ? (
                      <span className="text-[10px] bg-zinc-800/50 border border-zinc-700/30 px-3 py-1 rounded-full text-zinc-400 max-w-[85%] text-center">
                        {msg.message}
                      </span>
                    ) : (
                      <div className="bg-white/5 border border-white/5 p-3 rounded-2xl max-w-[90%] space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[11px] font-bold text-snookerGreen">{msg.senderName}</span>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed break-words">{msg.message}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Negotiate booking details..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-black/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-snookerGreen transition-all"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="p-2.5 bg-snookerGreen hover:bg-snookerGreen/90 text-white rounded-xl transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* FOOTER (Host Only Settings Controls) */}
      {isHost && (
        <div className="fixed bottom-0 inset-x-0 bg-zinc-950 border-t border-zinc-800/80 p-5 shadow-2xl backdrop-blur-lg z-40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">

              {/* Select Table */}
              <div className="flex-1 sm:flex-initial">
                <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Select Final Table</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-black/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-snookerGreen w-full min-w-[150px]"
                >
                  <option value="">-- Choose Table --</option>
                  {lobbyState.tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (₹{t.pricePerHour}/hr)</option>
                  ))}
                </select>
              </div>

              {/* Select Timeslot */}
              <div className="flex-1 sm:flex-initial">
                <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Select Final Timeslot</label>
                <select
                  value={selectedTimeslot}
                  onChange={(e) => setSelectedTimeslot(e.target.value)}
                  className="bg-black/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-snookerGreen w-full min-w-[150px]"
                >
                  <option value="">-- Choose Time --</option>
                  {STATIC_TIMESLOTS.map(t => (
                    <option key={t.id} value={t.id}>{t.display}</option>
                  ))}
                </select>
              </div>

              {/* Select Package */}
              <div className="flex-1 sm:flex-initial">
                <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">Select Package (Optional)</label>
                <select
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="bg-black/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-snookerGreen w-full min-w-[180px]"
                >
                  <option value="">No Food Package</option>
                  {STATIC_PACKAGES.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (+₹{p.price})</option>
                  ))}
                </select>
              </div>

            </div>

            <button
              onClick={handleFinalize}
              disabled={!selectedTable || !selectedTimeslot}
              className="w-full md:w-auto px-8 py-3.5 bg-snookerGreen hover:bg-snookerGreen/90 text-white font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.35)] flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <ShieldCheck className="w-5 h-5" />
              Confirm & Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* FOOTER (Guest Wait Bar) */}
      {!isHost && (
        <div className="fixed bottom-0 inset-x-0 bg-zinc-950/90 border-t border-zinc-800/80 p-5 shadow-2xl backdrop-blur-md z-40 text-center">
          <div className="max-w-md mx-auto flex items-center justify-center gap-3 text-zinc-400 text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-snookerGreen animate-ping" />
            <span>Awaiting host Dave to finalize reservation parameters...</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.18);
        }
      `}</style>
    </div>
  );
}
