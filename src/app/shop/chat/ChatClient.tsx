'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Send, MessageSquare, ShoppingBag, X, 
  ChevronLeft, Sparkles, AlertCircle, CheckCircle2, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/providers/SocketProvider';
import { useToast } from '@/components/ToastProvider';
import { API_BASE_URL } from '@/config/api';

interface ChatRoom {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    status: string;
  };
  buyer: {
    id: string;
    name?: string;
    email: string;
  };
  seller: {
    id: string;
    name?: string;
    email: string;
  };
  messages: {
    id: string;
    message: string;
    createdAt: string;
  }[];
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name?: string;
    email: string;
  };
}

export default function ChatClient() {
  const { user, token, isAuthenticated } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Chat states
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth Guard
  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Please login to view your negotiations.');
      router.push(`/login?returnUrl=${encodeURIComponent('/shop/chat')}`);
    }
  }, [isAuthenticated, router]);

  // Load chat rooms for user
  const loadChatRooms = async () => {
    if (!token) return;
    try {
      setLoadingRooms(true);
      const res = await fetch(`${API_BASE_URL}/api/product-chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChatRooms(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load chat threads.');
    } finally {
      setLoadingRooms(false);
    }
  };

  // Load room messages
  const loadRoomMessages = async (roomId: string) => {
    if (!token) return;
    try {
      setLoadingMessages(true);
      const res = await fetch(`${API_BASE_URL}/api/product-chats/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data.messages);
        setActiveRoomId(roomId);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load message history.');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Initialize and handle URL search parameters
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const roomIdParam = searchParams.get('roomId');
    const productIdParam = searchParams.get('productId');

    const initializeChat = async () => {
      // First load rooms list
      await loadChatRooms();

      if (roomIdParam) {
        await loadRoomMessages(roomIdParam);
      } else if (productIdParam) {
        // Create or get chat room for this product
        try {
          const res = await fetch(`${API_BASE_URL}/api/product-chats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ productId: productIdParam })
          });
          const data = await res.json();
          if (data.success) {
            const room = data.data;
            await loadRoomMessages(room.id);
            // Refresh rooms list to include the newly created room if not already listed
            await loadChatRooms();
          } else {
            showToast(data.message || 'Could not initiate chat.');
          }
        } catch (err) {
          console.error(err);
          showToast('Error starting negotiation.');
        }
      }
    };

    initializeChat();
  }, [searchParams, isAuthenticated, token]);

  // Setup Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { roomId: string; message: ChatMessage }) => {
      // If message is in the active thread, append it
      if (activeRoomId === data.roomId) {
        setChatMessages(prev => [...prev, data.message]);
      }

      // Update snippet in the list of threads
      setChatRooms(prevRooms => {
        return prevRooms.map(room => {
          if (room.id === data.roomId) {
            return {
              ...room,
              updatedAt: new Date().toISOString(),
              messages: [data.message]
            };
          }
          return room;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });

      // Play sound / toast if it's from another user and we are not looking at it
      if (data.message.senderId !== user?.id && activeRoomId !== data.roomId) {
        showToast(`New message from ${data.message.sender.name || 'User'}: "${data.message.message}"`);
      }
    };

    socket.on('new-product-message', handleNewMessage);

    return () => {
      socket.off('new-product-message', handleNewMessage);
    };
  }, [socket, activeRoomId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeRoomId || !token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/product-chats/${activeRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText })
      });
      const data = await res.json();
      if (data.success) {
        setMessageText('');
        // Appending to messages log is handled in Socket.io listener
      } else {
        showToast(data.message || 'Failed to send message.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error: failed to send.');
    }
  };

  // Extract active room object
  const activeRoom = chatRooms.find(room => room.id === activeRoomId);
  const otherUser = activeRoom
    ? (user?.id === activeRoom.buyerId ? activeRoom.seller : activeRoom.buyer)
    : null;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex flex-col h-[calc(100vh-96px)] overflow-hidden">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/shop" 
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/80 hover:text-white"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-snookerGreen to-goldAccent flex items-center gap-2">
              Negotiation Inbox <Sparkles size={16} className="text-goldAccent animate-pulse" />
            </h1>
            <p className="text-xs text-white/40">Real-time marketplace negotiations</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-1.5 rounded-full">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-snookerGreen animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
            {isConnected ? 'Active Connection' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Main Container: Sidebar + Chat Thread Panel */}
      <div className="flex-1 flex bg-[#0c0c0c]/80 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl relative h-full">
        
        {/* Left Pane: Inbox Threads List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col h-full bg-black/20 flex-shrink-0 ${
          activeRoomId ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-white/10 bg-white/2">
            <h3 className="font-extrabold text-xs text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare size={12} className="text-snookerGreen" /> Conversation Threads
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-6 h-6 border-2 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Loading...</span>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="text-center py-20 px-6">
                <p className="text-xs text-white/30 italic">No active negotiations found.</p>
                <p className="text-[10px] text-white/20 mt-2">Chat threads appear here when you message a seller on their product detail page.</p>
              </div>
            ) : (
              chatRooms.map((room) => {
                const isActive = activeRoomId === room.id;
                const otherParticipant = user?.id === room.buyerId ? room.seller : room.buyer;
                const lastMessageText = room.messages?.[0]?.message || 'No messages yet';

                return (
                  <button
                    key={room.id}
                    onClick={() => loadRoomMessages(room.id)}
                    className={`w-full p-4 text-left transition-all hover:bg-white/2 flex flex-col gap-1 border-l-2 ${
                      isActive 
                        ? 'bg-white/5 border-l-snookerGreen shadow-[inset_4px_0_12px_rgba(34,197,94,0.02)]' 
                        : 'border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-black text-white truncate max-w-[150px]">
                        {otherParticipant?.name || otherParticipant?.email}
                      </span>
                      <span className="text-[10px] text-goldAccent font-black">
                        ₹{room.product.price.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/40 truncate">
                      {room.product.name}
                    </span>
                    <p className="text-[10px] text-white/60 truncate mt-1 bg-black/25 px-2 py-1 rounded border border-white/5">
                      {lastMessageText}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window Workspace */}
        <div className={`flex-1 flex flex-col h-full bg-gradient-to-b from-transparent to-black/20 ${
          activeRoomId ? 'flex' : 'hidden md:flex'
        }`}>
          {activeRoomId ? (
            <>
              {/* Workspace Header */}
              <div className="p-4 border-b border-white/10 bg-white/2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setActiveRoomId(null)}
                    className="md:hidden p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      {otherUser?.name || otherUser?.email}
                    </h3>
                    <p className="text-[10px] text-snookerGreen font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-snookerGreen animate-pulse"></span> Negotiation Active
                    </p>
                  </div>
                </div>
              </div>

              {/* View Product Context Banner */}
              {activeRoom && (
                <div className="mx-4 mt-4 p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between gap-4 flex-shrink-0 relative overflow-hidden shadow-md">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {activeRoom.product.image ? (
                        <img 
                          src={activeRoom.product.image} 
                          alt={activeRoom.product.name} 
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <ShoppingBag size={18} className="text-white/20" />
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-extrabold text-white truncate max-w-[200px] sm:max-w-md">
                        {activeRoom.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-goldAccent font-black">
                          ₹{activeRoom.product.price.toLocaleString()}
                        </span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          activeRoom.product.status === 'SOLD'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-snookerGreen/20 text-snookerGreen border border-snookerGreen/30'
                        }`}>
                          {activeRoom.product.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/shop/${activeRoom.product.id}`}
                    target="_blank"
                    className="px-4 py-2 bg-gradient-to-r from-snookerGreen to-snookerGreen/80 hover:from-snookerGreen hover:to-snookerGreen text-white text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-snookerGreen/10 flex items-center gap-1.5 shrink-0"
                  >
                    <ShoppingBag size={12} /> View Product
                  </Link>
                </div>
              )}

              {/* Messages History list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-6 h-6 border-2 border-snookerGreen border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-white/40 font-bold uppercase">Loading history...</span>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1 text-[9px] text-white/40 font-bold mb-1 px-1">
                          <span>{isMe ? 'Me' : msg.sender.name || 'User'}</span>
                          <span>•</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg ${
                          isMe
                            ? 'bg-snookerGreen text-white rounded-tr-none'
                            : 'bg-[#151515] border border-white/5 text-white/95 rounded-tl-none'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input form */}
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t border-white/10 bg-black/20 flex gap-2 flex-shrink-0"
              >
                <input
                  type="text"
                  placeholder="Type your message, query, or offer price here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-[#151515] border border-white/10 focus:border-snookerGreen/50 focus:outline-none px-4 py-3 rounded-xl text-xs"
                />
                <button
                  type="submit"
                  className="p-3 bg-snookerGreen hover:bg-snookerGreen/90 text-white rounded-xl transition-all shadow-md shadow-snookerGreen/10 flex items-center justify-center cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0a0a0a]/50">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 mb-4 animate-pulse">
                <MessageSquare size={28} />
              </div>
              <h4 className="text-sm font-bold text-white/60">No active conversation</h4>
              <p className="text-xs text-white/30 max-w-xs mt-1.5">
                Select an existing negotiation thread on the left, or open a product details page and click "Chat & Start Negotiation".
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
