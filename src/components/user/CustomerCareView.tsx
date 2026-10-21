import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronLeft, ArrowUp, Paperclip, Smile, Mic, Sparkles,
  Home, MessageSquare, MoreHorizontal, Clock, Check, CheckCheck,
  Headphones, Send, Image as ImageIcon, Trash2, ExternalLink,
  ShieldCheck, AlertCircle, RefreshCw, ChevronRight, FileText, Bot
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface CustomerCareViewProps {
  onClose: () => void;
  brandName?: string;
  supportTelegram?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  fileName?: string;
  subtext?: string;
}

// Detect whether user wrote in Hindi or Roman Hinglish
const isHindiQuery = (text: string): boolean => {
  if (!text) return false;
  // Check for Devanagari script (e.g. नमस्ते, पैसा)
  if (/[\u0900-\u097F]/.test(text)) return true;

  // Common Hindi / Hinglish keywords
  const hinglishKeywords = [
    'khel', 'paisa', 'paise', 'rupaye', 'rupya', 'mera', 'meri', 'mere', 'kab',
    'aayega', 'aaya', 'fasa', 'fas', 'nahi', 'karo', 'kaise', 'batao', 'bat',
    'baat', 'karna', 'kare', 'mujhe', 'kya', 'kyun', 'nikasi', 'namaste', 'bhai',
    'bataiye', 'dena', 'chahiye', 'jodo', 'aaye', 'plz', 'kar do', 'madad',
    'problem', 'dikkat', 'nhi', 'gya', 'gaya', 'hua', 'kardo', 'jaldi', 'kitna',
    'bacha', 'baki', 'stuts', 'stutes', 'hai', 'hain'
  ];
  const lower = text.toLowerCase();
  const words = lower.split(/[^a-zA-Z0-9\u0900-\u097F]+/);
  return hinglishKeywords.some((w) => words.includes(w));
};

export const CustomerCareView: React.FC<CustomerCareViewProps> = ({
  onClose,
  brandName = 'ArowClub',
  supportTelegram = 'https://t.me/ArowClubSupport',
}) => {
  const { user, showToast } = useAuth();

  // Navigation state: 'home' (Screen 1) or 'chat' (Screen 2 & 3)
  const [subView, setSubView] = useState<'home' | 'chat'>('home');
  const [homeTab, setHomeTab] = useState<'home' | 'messages'>('home');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`customer_care_msgs_${user?.uid || 'guest'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [isWaitingTeammate, setIsWaitingTeammate] = useState(false);
  const [waitingLanguage, setWaitingLanguage] = useState<'hi' | 'en'>('en');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; fileName: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync messages with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`customer_care_msgs_${user?.uid || 'guest'}`, JSON.stringify(messages));
    } catch {}
  }, [messages, user?.uid]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (subView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, subView, isTyping, isAdminTyping, isWaitingTeammate]);

  // Mark messages as seen when chat view is opened
  useEffect(() => {
    api.markSupportSeen().catch(() => {});
    setUnreadCount(0);
  }, [subView]);

  // Fetch backend chat & sync admin typing status
  useEffect(() => {
    let isMounted = true;
    const syncChat = async () => {
      try {
        const res: any = await api.getMySupportChat();
        if (!isMounted) return;
        if (typeof res?.adminTyping === 'boolean') {
          setIsAdminTyping(res.adminTyping);
        }
        if (res?.ticket) {
          setIsEscalated(Boolean(res.ticket.escalatedToAdmin));
          if (res.ticket.messages && res.ticket.messages.length > 0) {
            const mapped: ChatMessage[] = res.ticket.messages.map((m: any) => ({
              id: m.id || String(Math.random()),
              sender: m.sender === 'user' ? 'user' : 'agent',
              text: m.message || '',
              timestamp: m.timestamp || new Date().toISOString(),
              mediaUrl: m.mediaUrl,
              mediaType: m.mediaType,
              fileName: m.fileName,
              subtext: m.sender === 'user' ? undefined : (m.sender === 'admin' ? `${brandName} Official Admin Desk • Live` : `${brandName} Support • AI Agent`),
            }));
            setMessages(mapped);
          }
          if (typeof res.ticket.unreadCountByUser === 'number') {
            setUnreadCount(res.ticket.unreadCountByUser);
          }
        }
      } catch {
        // use local
      }
    };

    syncChat();
    const interval = setInterval(syncChat, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [brandName]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!content && !mediaPreview) return;

    // Detect language: Hindi/Hinglish vs English
    const isHindi = isHindiQuery(content);
    setWaitingLanguage(isHindi ? 'hi' : 'en');

    const newMsgId = `m-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: newMsgId,
      sender: 'user',
      text: content,
      timestamp: new Date().toISOString(),
      mediaUrl: mediaPreview?.url,
      mediaType: mediaPreview ? 'image' : undefined,
      fileName: mediaPreview?.fileName,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setMediaPreview(null);
    setShowEmojiPicker(false);
    setIsTyping(true);

    try {
      const res: any = await api.sendSupportMessage({
        message: content,
        mediaUrl: userMsg.mediaUrl,
        mediaType: userMsg.mediaType,
        fileName: userMsg.fileName,
      });

      if (res?.ticket) {
        setIsEscalated(Boolean(res.ticket.escalatedToAdmin));
        if (res.ticket.messages && res.ticket.messages.length > 0) {
          const mapped: ChatMessage[] = res.ticket.messages.map((m: any) => ({
            id: m.id || String(Math.random()),
            sender: m.sender === 'user' ? 'user' : 'agent',
            text: m.message || '',
            timestamp: m.timestamp || new Date().toISOString(),
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            fileName: m.fileName,
            subtext: m.sender === 'user' ? undefined : (m.sender === 'admin' ? `${brandName} Official Admin Desk • Live` : `${brandName} Support • AI Agent`),
          }));
          setMessages(mapped);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsTyping(false);
      setIsWaitingTeammate(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast?.('File size exceeds 5MB limit', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setMediaPreview({
        url: dataUrl,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearChat = async () => {
    await api.clearUserSupportChat().catch(() => {});
    setMessages([]);
    localStorage.removeItem(`customer_care_msgs_${user?.uid || 'guest'}`);
    setIsWaitingTeammate(false);
    setIsEscalated(false);
    setShowOptionsMenu(false);
    showToast?.('Conversation cleared. AI Assistant ready.', 'info');
  };

  const handleStartNewChat = async () => {
    await api.startNewUserSupportChat().catch(() => {});
    setMessages([
      {
        id: `m-welcome-${Date.now()}`,
        sender: 'agent',
        text: `Hi there! 👋 Welcome to ${brandName} 24/7 VIP Customer Support. Ask us anything, or share your feedback.`,
        timestamp: new Date().toISOString(),
        subtext: `Fin • AI Agent • Just now`,
      },
    ]);
    setIsWaitingTeammate(false);
    setIsEscalated(false);
    setShowOptionsMenu(false);
    showToast?.('Started a new conversation', 'success');
  };

  const emojis = ['👍', '❤️', '🙏', '😊', '🔥', '⚡', '💰', '💳', '❓', '✅'];

  // ==========================================
  // VIEW 1: HOME VIEW (Yellow/Gold Luxury Theme) - Dedicated Full Page
  // ==========================================
  if (subView === 'home') {
    return (
      <div className="fixed inset-0 z-50 bg-[#faf8f2] flex flex-col w-full max-w-md mx-auto h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none select-none touch-pan-y shadow-2xl">
        <div className="relative w-full h-full bg-[#faf8f2] flex flex-col flex-1 overflow-hidden">
          {/* Top Yellow/Gold & Black Luxury Hero Section */}
          <div className="relative bg-gradient-to-b from-[#1c1809] via-[#2c220a] to-[#141106] text-white pt-5 pb-14 px-5 border-b border-[#f5c443]/30 shrink-0">
            {/* Top Bar: Back & VIP Support Avatar on left, 'X' on right */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                {/* VIP Support Badge - Gold Theme */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#d99b26] to-[#f5c443] flex items-center justify-center text-black font-black text-sm shadow-[0_0_15px_rgba(245,196,67,0.4)]">
                  <Headphones className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Big Greeting Heading in Gold & White */}
            <div className="mt-8 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                <span className="text-[#f5c443]">Hi there</span>
                <span className="inline-block animate-wave">👋</span>
              </h1>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                How can we help?
              </h2>
            </div>
          </div>

          {/* Floating Action Card: "Send us a message" with Yellow Accents */}
          <div className="relative -mt-8 px-4 z-10">
            <button
              onClick={() => setSubView('chat')}
              className="w-full bg-white rounded-2xl p-4 shadow-xl border border-amber-100 hover:border-[#f5c443]/40 flex items-center justify-between text-left transition-all active:scale-[0.99] group"
            >
              <div>
                <div className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-1.5">
                  <span>Send us a message</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  We typically reply in under 5 minutes
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-[#d99b26] transition-all">
                <ChevronRight className="w-5 h-5 text-[#d99b26] stroke-[2.5]" />
              </div>
            </button>
          </div>

          {/* Middle Body Content: Home vs Messages tab */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {homeTab === 'home' ? (
              <>
                {/* Instant Help Topics */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold tracking-wider text-amber-700/80 uppercase px-1">
                    Instant Topics
                  </div>

                  {/* Topic 1: Deposit & UTR */}
                  <button
                    onClick={() => {
                      setSubView('chat');
                      handleSendMessage('Mujhe Recharge / Deposit UTR me help chahiye (Deposit Help)');
                    }}
                    className="w-full bg-amber-50/50 hover:bg-amber-50 rounded-xl p-3 border border-amber-200/50 flex items-center justify-between text-left transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">💳</span>
                      <div>
                        <div className="font-semibold text-gray-800">Deposit & Recharge UTR</div>
                        <div className="text-[10px] text-gray-500">2-5 minutes me balance credit</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600" />
                  </button>

                  {/* Topic 2: Withdrawal */}
                  <button
                    onClick={() => {
                      setSubView('chat');
                      handleSendMessage('Mera withdrawal status check karein (Withdrawal status)');
                    }}
                    className="w-full bg-amber-50/50 hover:bg-amber-50 rounded-xl p-3 border border-amber-200/50 flex items-center justify-between text-left transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">💸</span>
                      <div>
                        <div className="font-semibold text-gray-800">Withdrawal Inquiry</div>
                        <div className="text-[10px] text-gray-500">Bank accounts aur transfer status</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600" />
                  </button>

                  {/* Topic 3: Rolling Turnover Inquiry */}
                  <button
                    onClick={() => {
                      setSubView('chat');
                      handleSendMessage('Mera rolling status kitna bacha hai? (Rolling status)');
                    }}
                    className="w-full bg-amber-50/50 hover:bg-amber-50 rounded-xl p-3 border border-amber-200/50 flex items-center justify-between text-left transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🔄</span>
                      <div>
                        <div className="font-semibold text-gray-800">Rolling Turnover Status</div>
                        <div className="text-[10px] text-gray-500">Check remaining incomplete rolling</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600" />
                  </button>

                  {/* Topic 4: Telegram Support */}
                  <a
                    href={supportTelegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-sky-50 hover:bg-sky-100/80 rounded-xl p-3 border border-sky-100 flex items-center justify-between text-left transition-all text-xs text-sky-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">✈️</span>
                      <div>
                        <div className="font-semibold">Official Telegram Helpline</div>
                        <div className="text-[10px] text-sky-600">Direct human agent chat on Telegram</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-sky-500" />
                  </a>
                </div>

                {/* User Info Capsule */}
                {user && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>UID: <strong className="text-gray-900 font-mono">{user.uid}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[11px] font-semibold text-amber-800">VIP Verified</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Messages Tab List */
              <div className="space-y-3">
                <div className="text-[11px] font-bold tracking-wider text-amber-700/80 uppercase px-1">
                  Active Conversations
                </div>

                {messages.length > 0 ? (
                  <button
                    onClick={() => setSubView('chat')}
                    className="w-full bg-white hover:bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200 text-left shadow-sm flex items-start gap-3 transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#d99b26] to-[#f5c443] text-black flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      <Bot className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs">{brandName} Support</span>
                        <span className="text-[10px] text-gray-400">Recent</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {messages[messages.length - 1]?.text || 'Click to continue conversation...'}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    No past messages. Click "Send us a message" to start!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar: Home & Messages with Yellow Active State */}
          <div className="border-t border-gray-200 bg-white px-8 py-2.5 flex items-center justify-around shrink-0">
            {/* Home Tab */}
            <button
              onClick={() => setHomeTab('home')}
              className={`flex flex-col items-center gap-1 transition-all ${
                homeTab === 'home' ? 'text-[#d99b26] font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[11px]">Home</span>
            </button>

            {/* Messages Tab (Shows unread count ONLY if unseen messages exist) */}
            <button
              onClick={() => setHomeTab('messages')}
              className={`flex flex-col items-center gap-1 transition-all relative ${
                homeTab === 'messages' ? 'text-[#d99b26] font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#e52e2e] text-white font-bold text-[9px] flex items-center justify-center">
                    {unreadCount}
                  </div>
                )}
              </div>
              <span className="text-[11px]">Messages</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2 & 3: CHAT CONVERSATION VIEW (Yellow Theme) - Dedicated Full Page
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col w-full max-w-md mx-auto h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none select-none touch-pan-y shadow-2xl">
      <div className="relative w-full h-full bg-white flex flex-col flex-1 overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-3 py-3 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back Chevron '<' to return to Home view */}
            <button
              onClick={() => setSubView('home')}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-all active:scale-90"
              aria-label="Back to Home"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Support Agent Avatar - NO static number 1! */}
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#d99b26] to-[#f5c443] flex items-center justify-center text-black font-black text-xs shrink-0 shadow-sm">
              <Headphones className="w-4 h-4 text-black stroke-[2.5]" />
              {/* Online green indicator dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
            </div>

            {/* Title & Subtext */}
            <div className="min-w-0">
              <div className="font-bold text-gray-900 text-xs sm:text-sm truncate leading-tight flex items-center gap-1.5">
                <span>{brandName} Support</span>
                {isEscalated ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold animate-pulse">Live Admin</span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">24/7 AI</span>
                )}
              </div>
              <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5 text-amber-600" />
                <span>{isEscalated ? 'Live Desk Connected' : 'Under 5 minutes'}</span>
              </div>
            </div>
          </div>

          {/* Right Header Icons: '...' options and 'X' close */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-all active:scale-90"
                aria-label="Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {/* Options Dropdown Menu */}
              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fadeIn text-xs text-gray-700">
                  <button
                    onClick={handleStartNewChat}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Start New Chat</span>
                  </button>
                  <button
                    onClick={handleClearChat}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Clear Messages</span>
                  </button>
                  <a
                    href={supportTelegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-sky-600 border-t border-gray-100"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                    <span>Telegram VIP Support</span>
                  </a>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-all active:scale-90"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Area - Buttery smooth non-shaking scroll container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-4 space-y-3.5 bg-[#fbfbfa] overscroll-contain scroll-smooth touch-pan-y">
          {/* Top Subtle Centered Text */}
          <div className="text-center text-xs text-gray-500 py-2 px-4 leading-relaxed select-none">
            Ask us anything, or share your feedback.
          </div>

          {/* Messages Stream */}
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn`}
              >
                {/* Message Bubble - User is Yellow/Gold (#f5c443), Agent is soft grey */}
                <div
                  className={`px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[#f5c443] text-black font-semibold rounded-2xl rounded-tr-sm max-w-[82%]'
                      : 'bg-[#f4f5f7] text-gray-900 rounded-2xl rounded-tl-sm max-w-[85%]'
                  }`}
                >
                  {/* Media attachment if any */}
                  {m.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                      <img
                        src={m.mediaUrl}
                        alt="attachment"
                        className="max-h-48 w-full object-cover"
                      />
                      {m.fileName && (
                        <div className="text-[10px] p-1 bg-black/60 text-white truncate">
                          {m.fileName}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                </div>

                {/* Subtext beneath agent bubble */}
                {!isUser && (
                  <div className="text-[10px] text-gray-400 mt-1 pl-1 flex items-center gap-1">
                    <span>{m.subtext || `${brandName} Support • Just now`}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Admin Typing Indicator */}
          {isAdminTyping && (
            <div className="flex flex-col items-start animate-fadeIn">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold shadow-sm">
                <span className="text-[11px] font-bold">Official Admin Desk typing</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#d99b26] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#d99b26] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#d99b26] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[#f4f5f7] text-amber-500 w-16 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Media Preview before sending */}
        {mediaPreview && (
          <div className="px-3 pt-2 bg-white flex items-center justify-between text-xs text-gray-600 border-t border-gray-100">
            <div className="flex items-center gap-2 min-w-0">
              <img src={mediaPreview.url} alt="preview" className="w-8 h-8 rounded-lg object-cover border" />
              <span className="truncate max-w-[200px] font-mono text-[11px]">{mediaPreview.fileName}</span>
            </div>
            <button
              onClick={() => setMediaPreview(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold p-1"
            >
              Remove
            </button>
          </div>
        )}

        {/* Emoji Quick Picker */}
        {showEmojiPicker && (
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-2 overflow-x-auto text-lg select-none">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Area Box - Golden / Yellow Border matching user request */}
        <div className="p-3 bg-white border-t border-gray-100 shrink-0 z-20">
          <div className="border-2 border-[#f5c443] rounded-2xl p-2.5 bg-white shadow-sm flex flex-col gap-2 transition-all focus-within:ring-2 focus-within:ring-[#f5c443]/30">
            {/* Input field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (e.target.value.trim()) {
                  api.setSupportTyping('user', true).catch(() => {});
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isEscalated ? "Type message to live admin desk..." : "Message..."}
              className="w-full text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none px-1"
            />

            {/* Bottom Row Inside Container: Action Icons on left, Circular Up Arrow on right */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              {/* Left Action Icons: Paperclip, Smiley, GIF, Mic */}
              <div className="flex items-center gap-3 text-gray-500">
                {/* Paperclip / Attachment */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:text-amber-600 transition-colors"
                  title="Attach payment receipt or screenshot"
                >
                  <Paperclip className="w-4 h-4 stroke-[2]" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />

                {/* Smiley Face */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="hover:text-amber-600 transition-colors"
                  title="Emojis"
                >
                  <Smile className="w-4 h-4 stroke-[2]" />
                </button>

                {/* Quick preset inquiry */}
                <button
                  type="button"
                  onClick={() => {
                    handleSendMessage('Deposit nahi aaya, UTR check karein (Deposit status)');
                  }}
                  className="hover:text-amber-600 transition-colors text-[10px] font-black tracking-wider px-1 py-0.5 rounded border border-amber-300 text-amber-700"
                  title="Quick preset questions"
                >
                  HELP
                </button>

                {/* Microphone */}
                <button
                  type="button"
                  onClick={() => {
                    showToast?.('Voice note recorded: connecting to agent', 'info');
                    handleSendMessage('🎤 [Voice Message Attached]');
                  }}
                  className="hover:text-amber-600 transition-colors"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4 stroke-[2]" />
                </button>
              </div>

              {/* Right: Circular Send Button with Up Arrow in Gold/Yellow */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() && !mediaPreview}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  inputText.trim() || mediaPreview
                    ? 'bg-[#f5c443] text-black shadow-md hover:bg-[#e6b12a] active:scale-95 cursor-pointer font-bold'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
