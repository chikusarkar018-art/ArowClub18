import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { andarBaharAudio } from '../../utils/andarBaharAudio.js';
import {
  PlayingCard,
  AndarBaharPhase,
  AndarBaharSelection,
  DealtCardStep,
  AndarBaharHistoryRecord,
  AndarBaharGameState,
} from '../../types/andarBahar.js';
import confetti from 'canvas-confetti';
import { LiveCasinoAndarBaharTable } from './LiveCasinoAndarBaharTable.js';
import {
  X,
  Volume2,
  VolumeX,
  Maximize2,
  HelpCircle,
  History,
  BarChart3,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Trophy,
  RotateCcw,
  Trash2,
  Zap,
  ShieldCheck,
  Flame,
  Info,
  Send,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';

interface UserAndarBaharGameViewProps {
  onBack: () => void;
  onNavigateDeposit?: () => void;
}

// Chip values matching the exact uploaded screenshots
const CHIP_VALUES = [
  { value: 50, label: '50', bg: 'from-pink-500 to-rose-600', border: 'border-pink-300', text: 'text-white' },
  { value: 100, label: '100', bg: 'from-cyan-400 to-sky-600', border: 'border-cyan-200', text: 'text-white' },
  { value: 250, label: '250', bg: 'from-amber-700 to-amber-900', border: 'border-amber-400', text: 'text-amber-100' },
  { value: 500, label: '500', bg: 'from-amber-400 to-yellow-600', border: 'border-yellow-200', text: 'text-stone-900' },
  { value: 1000, label: '1K', bg: 'from-blue-600 to-indigo-800', border: 'border-blue-300', text: 'text-white' },
  { value: 2500, label: '2.5K', bg: 'from-rose-600 to-red-800', border: 'border-red-300', text: 'text-white' },
  { value: 10000, label: '10K', bg: 'from-zinc-700 to-zinc-900', border: 'border-zinc-400', text: 'text-zinc-100' },
  { value: 50000, label: '50K', bg: 'from-indigo-900 to-purple-950', border: 'border-purple-400', text: 'text-purple-100' },
];

// Card Count Side Bet Range Boxes matching screenshots
const RANGE_BET_BOXES = [
  { key: 'range_1_5', label: '1-5', mult: '3x', minCards: 1, maxCards: 5 },
  { key: 'range_6_10', label: '6-10', mult: '4x', minCards: 6, maxCards: 10 },
  { key: 'range_11_15', label: '11-15', mult: '5x', minCards: 11, maxCards: 15 },
  { key: 'range_16_20', label: '16-20', mult: '6x', minCards: 16, maxCards: 20 },
  { key: 'range_21_25', label: '21-25', mult: '9x', minCards: 21, maxCards: 25 },
  { key: 'range_26_30', label: '26-30', mult: '13x', minCards: 26, maxCards: 30 },
  { key: 'range_31_35', label: '31-35', mult: '32x', minCards: 31, maxCards: 35 },
  { key: 'range_36_40', label: '36-40', mult: '40x', minCards: 36, maxCards: 40 },
  { key: 'range_41_45', label: '41-45', mult: '110x', minCards: 41, maxCards: 45 },
  { key: 'range_46_49', label: '46-49', mult: '800x', minCards: 46, maxCards: 49 },
];

// Market definitions for 7 Up Down style Bet Placement Slip
const ANDAR_BAHAR_MARKET_INFO: Record<string, { label: string; odds: number; badge?: string; color: string }> = {
  andar: { label: 'ANDAR', odds: 1.90, badge: 'Main Bet', color: 'from-blue-600 to-blue-700' },
  bahar: { label: 'BAHAR', odds: 1.90, badge: 'Main Bet', color: 'from-amber-600 to-amber-700' },
  andar_first: { label: 'Andar On 1st Card', odds: 16.50, badge: 'Special', color: 'from-blue-700 to-indigo-800' },
  bahar_first: { label: 'Bahar On 1st Card', odds: 17.00, badge: 'Special', color: 'from-orange-600 to-amber-800' },
  first_3: { label: 'First 3 Cards Combo', odds: 4.50, badge: 'Special', color: 'from-purple-600 to-purple-800' },
  range_1_5: { label: '1 - 5 Cards Dealt', odds: 3.00, badge: 'Range', color: 'from-emerald-600 to-teal-700' },
  range_6_10: { label: '6 - 10 Cards Dealt', odds: 4.00, badge: 'Range', color: 'from-emerald-600 to-teal-700' },
  range_11_15: { label: '11 - 15 Cards Dealt', odds: 5.00, badge: 'Range', color: 'from-emerald-600 to-teal-700' },
  range_16_20: { label: '16 - 20 Cards Dealt', odds: 6.00, badge: 'Range', color: 'from-emerald-600 to-teal-700' },
  range_21_25: { label: '21 - 25 Cards Dealt', odds: 9.00, badge: 'Range', color: 'from-cyan-600 to-blue-700' },
  range_26_30: { label: '26 - 30 Cards Dealt', odds: 13.00, badge: 'Range', color: 'from-cyan-600 to-blue-700' },
  range_31_35: { label: '31 - 35 Cards Dealt', odds: 32.00, badge: 'Range', color: 'from-amber-600 to-orange-700' },
  range_36_40: { label: '36 - 40 Cards Dealt', odds: 40.00, badge: 'Range', color: 'from-amber-600 to-orange-700' },
  range_41_45: { label: '41 - 45 Cards Dealt', odds: 110.00, badge: 'Range', color: 'from-rose-600 to-red-700' },
  range_46_49: { label: '46 - 49 Cards Dealt', odds: 800.00, badge: 'Range', color: 'from-rose-700 to-red-900' },
};

export const UserAndarBaharGameView: React.FC<UserAndarBaharGameViewProps> = ({
  onBack,
  onNavigateDeposit,
}) => {
  const { user, refreshUser, showToast } = useAuth();

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false);
  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    andarBaharAudio.setMuted(next);
  };

  // Chips & Placed Bets state
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [placedBets, setPlacedBets] = useState<Record<string, number>>({});
  const placedBetsRef = useRef<Record<string, number>>({});
  const submittedBetsInRoundRef = useRef<Record<string, number>>({});
  const [betHistoryStack, setBetHistoryStack] = useState<Array<{ selection: string; amount: number }>>([]);
  const [lastPlacedRoundBets, setLastPlacedRoundBets] = useState<Record<string, number>>({});
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);

  // 7 Up Down Style Bet Placement Bottom Sheet / Modal state
  const [showBetSlip, setShowBetSlip] = useState<boolean>(false);
  const [isClosingBetSlip, setIsClosingBetSlip] = useState<boolean>(false);
  const [pendingBet, setPendingBet] = useState<{
    key: string;
    label: string;
    odds: number;
    badge?: string;
  } | null>(null);
  const [betUnitAmount, setBetUnitAmount] = useState<number>(100);
  const [customBetInput, setCustomBetInput] = useState<string>('100');
  const [betMultiplier, setBetMultiplier] = useState<number>(1);

  // Result & Win Announcement Strip
  const [winAnnouncement, setWinAnnouncement] = useState<{
    won: boolean;
    grossWin: number;
    netProfit: number;
    winner: string;
    message: string;
  } | null>(null);

  // Active Flying Chips state for visual bet placement animation
  const [flyingChips, setFlyingChips] = useState<Array<{
    id: string;
    targetSelection: string;
    amount: number;
    startX: number;
    startY: number;
  }>>([]);

  // Active spot pulse highlight
  const [pulseSpot, setPulseSpot] = useState<string | null>(null);

  // Live Game State from Server
  const [gameState, setGameState] = useState<AndarBaharGameState>({
    roundId: '1550889',
    roundNumber: 1550889,
    phase: 'betting',
    countdown: 15,
    jokerCard: { rank: '3', suit: 'spades', symbol: '♠', value: 3, color: 'black' },
    andarCards: [],
    baharCards: [],
    allDealtCards: [],
    currentDealStep: 0,
    winner: null,
    matchingCard: null,
    winningSide: null,
    dealtCount: 0,
    isFirstCardWin: false,
    isFirst3Win: false,
    winningRange: '',
    history: [],
    andarStatsPercent: 50.0,
    baharStatsPercent: 50.0,
    dealer: { name: 'Edita', id: '1550889' },
    tableLimits: { min: 10, max: 100000 },
    serverTime: Date.now(),
  });

  // Track previous phase for sound triggers & dealer voice announcements
  const prevPhaseRef = useRef<AndarBaharPhase>('betting');
  const prevStepRef = useRef<number>(0);
  const prevCountdownRef = useRef<number>(15);

  // Modals & Drawers
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Smooth Exit Animation States
  const [isClosingChat, setIsClosingChat] = useState(false);
  const [isClosingRules, setIsClosingRules] = useState(false);
  const [isClosingStats, setIsClosingStats] = useState(false);
  const [isClosingHistory, setIsClosingHistory] = useState(false);

  const handleCloseChat = () => {
    setIsClosingChat(true);
    setTimeout(() => {
      setShowChatDrawer(false);
      setIsClosingChat(false);
    }, 220);
  };

  const handleCloseRules = () => {
    setIsClosingRules(true);
    setTimeout(() => {
      setShowRulesModal(false);
      setIsClosingRules(false);
    }, 220);
  };

  const handleCloseStats = () => {
    setIsClosingStats(true);
    setTimeout(() => {
      setShowStatsModal(false);
      setIsClosingStats(false);
    }, 220);
  };

  const handleCloseHistory = () => {
    setIsClosingHistory(true);
    setTimeout(() => {
      setShowHistoryModal(false);
      setIsClosingHistory(false);
    }, 220);
  };

  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string; isDealer?: boolean }>>([
    { sender: 'Dealer Edita', text: 'Welcome to Andar Bahar Joker+! Best of luck to all players.', time: '18:28', isDealer: true },
    { sender: 'LuckyPlayer', text: 'Joker 3 of spades lets go!', time: '18:28' },
    { sender: 'VIP_Rahul', text: 'Betting heavy on Bahar 1.9x today 🔥', time: '18:29' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Flying Card Animation State (Dealer drawing card and dealing down)
  const [flyingCard, setFlyingCard] = useState<{
    side: 'ANDAR' | 'BAHAR';
    card: PlayingCard;
    isDealing: boolean;
  } | null>(null);

  // Continuously refresh user wallet balance to ensure 100% accuracy with user ID/database
  useEffect(() => {
    refreshUser();
    const balInterval = setInterval(() => {
      refreshUser();
    }, 4000);
    return () => clearInterval(balInterval);
  }, [refreshUser]);

  // Poll server state every 300ms for continuous 24/7 sync
  useEffect(() => {
    let isMounted = true;

    const fetchState = async () => {
      try {
        const res: any = await api.getAndarBaharLiveState();
        if (res && res.success && isMounted) {
          setGameState(res);

          // Phase transition audio announcements and result handling
          if (res.phase !== prevPhaseRef.current || (res.phase === 'result' && !winAnnouncement && res.winner)) {
            if (res.phase === 'betting') {
              andarBaharAudio.announce('Place your bets please');
              // Clear placed bets for the new round
              placedBetsRef.current = {};
              setPlacedBets({});
              setBetHistoryStack([]);
              setWinAnnouncement(null);
              submittedBetsInRoundRef.current = {};
            } else if (res.phase === 'dealing') {
              andarBaharAudio.playBetsClosed();
              andarBaharAudio.announce('Bets are closed');
              setWinAnnouncement(null);
            } else if (res.phase === 'result' && res.winner) {
              if (res.phase !== prevPhaseRef.current) {
                andarBaharAudio.playWinFanfare();
                andarBaharAudio.announce(`${res.winner} wins`);
              }

              // Check if current user had a winning bet and celebrate with exact numbers
              const activeBets = { ...placedBetsRef.current, ...placedBets };
              const andarStake = activeBets['andar'] || 0;
              const baharStake = activeBets['bahar'] || 0;
              const andarWon = res.winner === 'ANDAR' && andarStake > 0;
              const baharWon = res.winner === 'BAHAR' && baharStake > 0;
              const firstWon = res.isFirstCardWin && (activeBets[`${res.winner.toLowerCase()}_first`] || 0) > 0;
              const first3Won = res.isFirst3Win && (activeBets['first_3'] || 0) > 0;

              let totalPayout = 0;
              let netProfit = 0;
              if (andarWon) {
                totalPayout += andarStake * 1.9;
                netProfit += andarStake * 0.9;
              }
              if (baharWon) {
                totalPayout += baharStake * 1.9;
                netProfit += baharStake * 0.9;
              }
              if (firstWon) {
                const mult = res.winner === 'ANDAR' ? 16.5 : 17.0;
                const st = activeBets[`${res.winner.toLowerCase()}_first`];
                totalPayout += st * mult;
                netProfit += st * (mult - 1);
              }
              if (first3Won) {
                const st = activeBets['first_3'];
                totalPayout += st * 4.5;
                netProfit += st * 3.5;
              }

              // Check range bets
              const rangeStake = activeBets[res.winningRange] || 0;
              if (rangeStake > 0) {
                const rangeBox = RANGE_BET_BOXES.find(b => b.key === res.winningRange);
                const rMult = rangeBox ? parseFloat(rangeBox.mult) : 3;
                totalPayout += rangeStake * rMult;
                netProfit += rangeStake * (rMult - 1);
              }

              const hasWon = totalPayout > 0;
              const matchedCardDesc = res.jokerCard ? `${res.jokerCard.rank}${res.jokerCard.symbol} (${res.jokerCard.suit.toUpperCase()})` : '';
              const roundTotalBet = Object.values(activeBets).reduce((sum, v) => sum + v, 0);

              setWinAnnouncement({
                won: hasWon,
                grossWin: totalPayout,
                netProfit: netProfit,
                winner: res.winner,
                message: hasWon
                  ? `🎉 You Won +₹${totalPayout.toFixed(2)}! Exact Matched Joker ${matchedCardDesc} on Card #${res.dealtCount}`
                  : roundTotalBet > 0
                  ? `Round #${res.roundId} finished: ${res.winner} WON. Matched Joker ${matchedCardDesc} on Card #${res.dealtCount}. Loss: ₹${roundTotalBet.toFixed(2)}`
                  : `Round #${res.roundId} Result: ${res.winner} WON (1.9X) • Matched Joker ${matchedCardDesc} on Card #${res.dealtCount}`,
              });

              if (totalPayout > 0 && res.phase !== prevPhaseRef.current) {
                try {
                  confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#f5c443', '#3b82f6', '#f97316', '#ffffff'],
                  });
                } catch {}
                showToast(`🎉 WINNER! +₹${totalPayout.toFixed(2)} credited to ID (₹${netProfit.toFixed(2)} Net Profit) @ ${res.winner} 1.9x`, 'success');
              } else if (roundTotalBet > 0 && res.phase !== prevPhaseRef.current) {
                showToast(`Round finished: ${res.winner} won. Loss: ₹${roundTotalBet}`, 'info');
              }
              // Refresh user balance after settlement
              setTimeout(() => {
                refreshUser();
              }, 1200);
            }
            prevPhaseRef.current = res.phase;
          }

          // Countdown tick audio for last 3 seconds
          if (res.phase === 'betting' && res.countdown <= 3 && res.countdown > 0 && res.countdown !== prevCountdownRef.current) {
            andarBaharAudio.playCountdownTick();
            prevCountdownRef.current = res.countdown;
          }

          // Card dealt animation trigger
          if (res.phase === 'dealing' && res.currentDealStep > prevStepRef.current) {
            const latestCardStep = res.allDealtCards[res.currentDealStep - 1];
            if (latestCardStep) {
              setFlyingCard({
                side: latestCardStep.side,
                card: latestCardStep.card,
                isDealing: true,
              });
              andarBaharAudio.playCardSlide();
              setTimeout(() => {
                andarBaharAudio.playCardFlip();
                setFlyingCard(prev => prev ? { ...prev, isDealing: false } : null);
              }, 400);
            }
            prevStepRef.current = res.currentDealStep;
          } else if (res.phase === 'betting') {
            prevStepRef.current = 0;
            setFlyingCard(null);
          }
        }
      } catch {
        // ignore network glitches
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 350);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [placedBets, refreshUser]);

  // Continuously refresh user wallet balance to ensure 100% real-time accuracy with user ID/database
  useEffect(() => {
    refreshUser();
    const balInterval = setInterval(() => {
      refreshUser();
    }, 2500);
    return () => clearInterval(balInterval);
  }, [refreshUser]);

  // Calculate total stake placed
  const totalBetAmount = useMemo(() => {
    return Object.values(placedBets).reduce((sum, val) => sum + val, 0);
  }, [placedBets]);

  // Open 7 Up Down Style Bet Placement Bottom Sheet / Modal
  const openBetSlip = (betKey: string, customLabel?: string, customOdds?: number, badge?: string) => {
    if (gameState.phase !== 'betting') {
      showToast('Betting is currently closed for this round! Wait for next round.', 'info');
      return;
    }
    const info = ANDAR_BAHAR_MARKET_INFO[betKey] || {
      label: customLabel || betKey.toUpperCase(),
      odds: customOdds || 1.9,
      badge,
      color: 'from-amber-600 to-amber-700',
    };
    setPendingBet({
      key: betKey,
      label: customLabel || info.label,
      odds: customOdds || info.odds,
      badge: badge || info.badge,
    });
    const initAmt = selectedChip || 100;
    setBetUnitAmount(initAmt);
    setCustomBetInput(String(initAmt));
    setBetMultiplier(1);
    setIsClosingBetSlip(false);
    setShowBetSlip(true);
  };

  const closeBetSlip = () => {
    setIsClosingBetSlip(true);
    setTimeout(() => {
      setShowBetSlip(false);
      setIsClosingBetSlip(false);
      setPendingBet(null);
    }, 200);
  };

  const handleConfirmBet = async () => {
    if (!pendingBet) return;
    if (gameState.phase !== 'betting') {
      showToast('Betting is closed for this round!', 'error');
      closeBetSlip();
      return;
    }

    const totalDeposit = Number(user?.totalDeposit || 0);
    if (totalDeposit < 100) {
      window.dispatchEvent(new CustomEvent('open-deposit-required', {
        detail: { minRequired: 100, currentDeposit: totalDeposit }
      }));
      closeBetSlip();
      return;
    }

    const parsedUnit = Math.max(10, Math.floor(Number(customBetInput) || betUnitAmount || 100));
    const calculatedAmount = parsedUnit * (betMultiplier || 1);
    const userBalance = user?.walletBalance || 0;
    const currentTotal = totalBetAmount;

    if (currentTotal + calculatedAmount > userBalance) {
      showToast('Insufficient wallet balance! Please recharge to place bet.', 'error');
      return;
    }

    if (calculatedAmount > gameState.tableLimits.max) {
      showToast(`Maximum table bet limit is ₹${gameState.tableLimits.max.toLocaleString()}`, 'error');
      return;
    }

    setIsSubmittingBet(true);
    andarBaharAudio.playChip();

    const betKey = pendingBet.key;
    placedBetsRef.current = {
      ...placedBetsRef.current,
      [betKey]: (placedBetsRef.current[betKey] || 0) + calculatedAmount,
    };
    setPlacedBets((prev) => ({
      ...prev,
      [betKey]: (prev[betKey] || 0) + calculatedAmount,
    }));
    setBetHistoryStack((prev) => [...prev, { selection: betKey, amount: calculatedAmount }]);

    if (user?.uid) {
      try {
        const res: any = await api.placeAndarBaharLiveBet(user.uid, { [betKey]: calculatedAmount });
        if (res && res.success) {
          refreshUser();
          showToast(`Bet placed on ${pendingBet.label} for ₹${calculatedAmount.toFixed(2)}!`, 'success');
        } else if (res && res.error) {
          showToast(res.error, 'error');
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to place bet', 'error');
      } finally {
        setIsSubmittingBet(false);
        closeBetSlip();
      }
    } else {
      setIsSubmittingBet(false);
      closeBetSlip();
    }
  };

  // Place bet on a spot opens the bet placement slip (matching Seven Up Down)
  const handleSelectBet = (selection: string) => {
    openBetSlip(selection);
  };

  // Clear all current round bets
  const handleClearBets = () => {
    if (gameState.phase !== 'betting') return;
    if (Object.keys(placedBets).length === 0) return;
    setPlacedBets({});
    setBetHistoryStack([]);
    andarBaharAudio.playChip();
    showToast('All bets cleared', 'info');
  };

  // Undo last chip placement
  const handleUndoBet = () => {
    if (gameState.phase !== 'betting') return;
    if (betHistoryStack.length === 0) return;

    const lastAction = betHistoryStack[betHistoryStack.length - 1];
    const newStack = betHistoryStack.slice(0, -1);
    setBetHistoryStack(newStack);

    setPlacedBets(prev => {
      const next = { ...prev };
      const cur = next[lastAction.selection] || 0;
      const rem = cur - lastAction.amount;
      if (rem <= 0) {
        delete next[lastAction.selection];
      } else {
        next[lastAction.selection] = rem;
      }
      return next;
    });
    andarBaharAudio.playChip();
  };

  // Repeat or double previous bets
  const handleRepeatOrDouble = () => {
    if (gameState.phase !== 'betting') return;

    // If no bets placed yet and we have last round bets, re-apply them
    if (totalBetAmount === 0 && Object.keys(lastPlacedRoundBets).length > 0) {
      setPlacedBets({ ...lastPlacedRoundBets });
      andarBaharAudio.playChip();
      showToast('Previous bets repeated', 'info');
      return;
    }

    // Double current placed bets
    if (totalBetAmount > 0) {
      const currentWalletBal = Number(user?.walletBalance || 0);
      if (totalBetAmount * 2 > currentWalletBal) {
        showToast('Insufficient balance to double bets', 'error');
        return;
      }
      setPlacedBets(prev => {
        const doubled: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          doubled[k] = v * 2;
        }
        return doubled;
      });
      andarBaharAudio.playChip();
      showToast('Bets doubled', 'info');
    }
  };

  // Fast Deal trigger for testing or speed play
  const handleFastDeal = async () => {
    try {
      await api.triggerAndarBaharFastDeal();
      showToast('Starting dealing immediately!', 'success');
    } catch {
      // ignore
    }
  };

  // Send Live Chat Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChatMessages(prev => [
      ...prev,
      {
        sender: user?.username || 'You',
        text: chatInput.trim(),
        time: timeStr,
      },
    ]);
    setChatInput('');
  };

  // Render authentic 3D Stacked Casino Chip Badge on bet spots
  const renderChipStack = (selectionKey: string, multValue?: number) => {
    const amount = placedBets[selectionKey];
    if (!amount || amount <= 0) return null;
    const chipConfig = CHIP_VALUES.slice().reverse().find(c => amount >= c.value) || CHIP_VALUES[0];
    const potentialWin = multValue ? Math.floor(amount * multValue) : null;

    return (
      <div className="absolute -top-3.5 right-1.5 sm:right-3 flex flex-col items-end pointer-events-none z-30 animate-bet-hit select-none">
        {/* 3D Stacked Chips Visual Disc */}
        <div className="relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]">
          {/* Bottom shadow disc */}
          <div className="absolute -bottom-1 w-7 h-3 bg-black/60 rounded-full blur-[1px]" />
          {/* Stack layer 1 */}
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-400 absolute -top-0.5" />
          {/* Stack layer 2 top */}
          <div className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr ${chipConfig.bg} border-2 ${chipConfig.border} flex items-center justify-center ring-1 ring-black/40`}>
            <span className="text-[8px] sm:text-[9px] font-black font-mono text-white drop-shadow-xs">
              {amount >= 1000 ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : amount}
            </span>
          </div>
        </div>

        {/* Potential Payout Indicator */}
        {potentialWin && (
          <span className="mt-0.5 px-1 py-0.2 rounded bg-black/85 border border-emerald-400/60 text-emerald-300 font-mono text-[8px] font-bold shadow-md">
            +₹{potentialWin.toLocaleString()}
          </span>
        )}
      </div>
    );
  };

  // Digital clock time for live casino table HUD
  const [clockTime, setClockTime] = useState('09:22:20');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen h-[100dvh] max-h-screen w-full bg-[#0a0a0e] text-white flex flex-col font-sans select-none overflow-hidden relative">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR: Back, Flag, Limits, Chat Bar, Tools                    */}
      {/* ========================================================================= */}
      <header className="h-12 bg-black/90 border-b border-white/10 px-3 sm:px-4 flex items-center justify-between z-40 shrink-0">
        {/* Left: Close Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            title="Leave Table"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Click to chat input bar */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
          <button
            onClick={() => setShowChatDrawer(true)}
            className="w-full py-1.5 px-3 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/25 flex items-center gap-2 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span className="truncate">Click to chat...</span>
          </button>
        </div>

        {/* Right Action Icons: Real Balance, Fast Deal, Chat, Stats, History, Rules, Audio */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* User Real Balance Badge (Always 100% accurate with ID balance) */}
          <button
            onClick={onNavigateDeposit}
            className="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-[#171b2b] via-[#21273d] to-[#171b2b] border border-amber-500/40 hover:border-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 shrink-0"
            title="Wallet Balance (Click to Deposit)"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[7.5px] text-amber-300/80 font-bold uppercase tracking-wider leading-none">
                Balance
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-amber-300 leading-tight mt-0.5">
                ₹{(user?.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {onNavigateDeposit && (
              <span className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black text-[10px] flex items-center justify-center ml-0.5 shadow-sm">
                +
              </span>
            )}
          </button>

          {/* Fast Deal Button (Allows instant action) */}
          {gameState.phase === 'betting' && (
            <button
              onClick={handleFastDeal}
              className="px-2 py-1 rounded-md bg-[#5b50e6] hover:bg-[#4f46e5] text-white text-[11px] font-bold flex items-center gap-1 shadow-md transition active:scale-95 cursor-pointer"
              title="Deal Now"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="hidden sm:inline">Deal Now</span>
            </button>
          )}

          {/* Chat Drawer Toggle */}
          <button
            onClick={() => setShowChatDrawer(!showChatDrawer)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer relative"
            title="Live Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Stats / Bead Plate Toggle */}
          <button
            onClick={() => setShowStatsModal(true)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            title="Statistics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* History Toggle */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            title="Past Rounds"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Info / Rules */}
          <button
            onClick={() => setShowRulesModal(true)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN SCROLLABLE CONTAINER: Table Stage, Chips & Betting Control Panels */}
      {/* The live video / table scrolls along smoothly when user scrolls the page! */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain casino-scrollbar bg-[#0a0a0e] flex flex-col">
        {/* Live Table Stage */}
        <LiveCasinoAndarBaharTable
          phase={gameState.phase}
          countdown={gameState.countdown}
          roundId={gameState.roundId}
          clockTime={clockTime}
          jokerCard={gameState.jokerCard}
          andarCards={gameState.andarCards}
          baharCards={gameState.baharCards}
          winner={gameState.winner}
          matchingCard={gameState.matchingCard}
          flyingCard={flyingCard}
          onSelectBet={handleSelectBet}
          placedBets={placedBets}
        />

        {/* Win / Result Notification Strip (Prominent banner during result phase) */}
        {gameState.phase === 'result' && winAnnouncement && (
          <div className="max-w-5xl mx-auto w-full px-2 sm:px-4 py-2 shrink-0 animate-fadeIn">
            <div
              className={`p-3 rounded-2xl flex items-center justify-between border shadow-lg ${
                winAnnouncement.won
                  ? 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/70 to-emerald-950/90 border-emerald-500/70'
                  : 'bg-[#151824] border-zinc-700/60'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    winAnnouncement.won ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div
                    className={`font-black text-xs sm:text-sm flex items-center gap-2 ${
                      winAnnouncement.won ? 'text-emerald-300' : 'text-zinc-200'
                    }`}
                  >
                    <span>{winAnnouncement.won ? '🎉 CONGRATULATIONS! YOU WON!' : 'Round Completed'}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        winAnnouncement.winner === 'ANDAR' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
                      }`}
                    >
                      {winAnnouncement.winner} WIN (1.9X)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5">{winAnnouncement.message}</p>
                </div>
              </div>

              {winAnnouncement.won && (
                <div className="text-right font-mono shrink-0 pl-2">
                  <div className="text-[10px] text-emerald-400 font-bold">Winning Credited:</div>
                  <div className="text-base sm:text-lg font-black text-emerald-300">
                    +₹{winAnnouncement.grossWin.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. BETTING CONTROL PANELS (Immediately visible right beneath table without scrolling!) */}
        <div className="bg-[#0e1017] border-t border-white/10 p-2 sm:p-3 pb-16 flex-1">
          <div className="max-w-5xl mx-auto space-y-2.5">
            {/* MAIN BETS: ANDAR (1.9X) - JOKER - BAHAR (1.9X) */}
            <div className="grid grid-cols-12 gap-2">
              {/* ANDAR Button (1.9x) */}
              <button
                onClick={() => handleSelectBet('andar')}
                disabled={gameState.phase !== 'betting'}
                className={`col-span-5 relative py-2.5 px-2 sm:p-3 rounded-2xl border-2 flex flex-col justify-between transition-all duration-150 active:scale-98 cursor-pointer shadow-lg ${
                  gameState.phase === 'result' && gameState.winner === 'ANDAR'
                    ? 'bg-blue-600 border-yellow-400 ring-4 ring-yellow-400 text-white shadow-[0_0_25px_rgba(59,130,246,0.8)]'
                    : placedBets['andar']
                    ? 'bg-blue-600/90 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                    : 'bg-blue-600/70 hover:bg-blue-600/85 border-blue-500/60 text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-sm sm:text-base tracking-wider uppercase">
                    ANDAR
                  </span>
                  <span className="text-xs sm:text-sm font-bold opacity-90 font-mono">
                    1.90x
                  </span>
                </div>

                <div className="flex items-center justify-between w-full text-[10px] text-blue-200 mt-1">
                  <span>Dealt: {gameState.andarCards.length}</span>
                  {placedBets['andar'] ? (
                    <span className="font-bold text-yellow-300 font-mono">₹{placedBets['andar']}</span>
                  ) : null}
                </div>

                {renderChipStack('andar', 1.9)}
              </button>

              {/* Center JOKER Display Box */}
              <div className="col-span-2 bg-[#181b28] border border-white/15 rounded-2xl flex flex-col items-center justify-center p-1 shadow-md">
                {gameState.jokerCard ? (
                  <div className="w-8 h-11 sm:w-10 sm:h-13 bg-white rounded shadow text-zinc-900 flex flex-col items-center justify-center leading-none">
                    <span className={`font-black text-xs sm:text-sm ${gameState.jokerCard.color === 'red' ? 'text-red-600' : 'text-zinc-900'}`}>
                      {gameState.jokerCard.rank}
                    </span>
                    <span className={`text-[11px] sm:text-xs ${gameState.jokerCard.color === 'red' ? 'text-red-600' : 'text-zinc-900'}`}>
                      {gameState.jokerCard.symbol}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 font-bold">Joker</span>
                )}
                <span className="text-[8px] sm:text-[9px] text-zinc-400 font-mono font-bold mt-0.5">JOKER</span>
              </div>

              {/* BAHAR Button (1.9x) */}
              <button
                onClick={() => handleSelectBet('bahar')}
                disabled={gameState.phase !== 'betting'}
                className={`col-span-5 relative py-2.5 px-2 sm:p-3 rounded-2xl border-2 flex flex-col justify-between transition-all duration-150 active:scale-98 cursor-pointer shadow-lg ${
                  gameState.phase === 'result' && gameState.winner === 'BAHAR'
                    ? 'bg-amber-600 border-yellow-400 ring-4 ring-yellow-400 text-white shadow-[0_0_25px_rgba(245,158,11,0.8)]'
                    : placedBets['bahar']
                    ? 'bg-amber-600/90 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                    : 'bg-amber-600/70 hover:bg-amber-600/85 border-amber-500/60 text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-black text-sm sm:text-base tracking-wider uppercase">
                    BAHAR
                  </span>
                  <span className="text-xs sm:text-sm font-bold opacity-90 font-mono">
                    1.90x
                  </span>
                </div>

                <div className="flex items-center justify-between w-full text-[10px] text-amber-200 mt-1">
                  <span>Dealt: {gameState.baharCards.length}</span>
                  {placedBets['bahar'] ? (
                    <span className="font-bold text-yellow-300 font-mono">₹{placedBets['bahar']}</span>
                  ) : null}
                </div>

                {renderChipStack('bahar', 1.9)}
              </button>
            </div>

            {/* Special Bets: Andar On 1st (16.5x), First 3 (4.5x), Bahar On 1st (17x) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectBet('andar_first')}
                disabled={gameState.phase !== 'betting'}
                className={`relative py-2 px-2 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 cursor-pointer ${
                  placedBets['andar_first']
                    ? 'bg-blue-900/60 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                    : 'bg-[#181b28] hover:bg-[#202436] border-white/10 text-zinc-300'
                }`}
              >
                <span className="text-xs font-bold">Andar On 1st</span>
                <span className="text-[10px] text-blue-400 font-semibold font-mono">16.5x</span>
                {renderChipStack('andar_first', 16.5)}
              </button>

              <button
                onClick={() => handleSelectBet('first_3')}
                disabled={gameState.phase !== 'betting'}
                className={`relative py-2 px-2 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 cursor-pointer ${
                  placedBets['first_3']
                    ? 'bg-purple-900/70 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                    : 'bg-purple-950/40 hover:bg-purple-900/40 border-purple-500/30 text-purple-200'
                }`}
              >
                <span className="text-xs font-bold">First 3</span>
                <span className="text-[10px] text-purple-300 font-semibold font-mono">4.5x</span>
                {renderChipStack('first_3', 4.5)}
              </button>

              <button
                onClick={() => handleSelectBet('bahar_first')}
                disabled={gameState.phase !== 'betting'}
                className={`relative py-2 px-2 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 cursor-pointer ${
                  placedBets['bahar_first']
                    ? 'bg-orange-900/60 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                    : 'bg-[#181b28] hover:bg-[#202436] border-white/10 text-zinc-300'
                }`}
              >
                <span className="text-xs font-bold">Bahar On 1st</span>
                <span className="text-[10px] text-orange-400 font-semibold font-mono">17.0x</span>
                {renderChipStack('bahar_first', 17)}
              </button>
            </div>

            {/* Range Bets: Number of Cards Dealt */}
            <div className="bg-[#151824] border border-white/10 rounded-2xl p-2.5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-zinc-400 font-semibold text-[11px]">
                  How many cards will be dealt
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-[11px] text-[#f5c443] font-bold">
                  Dealt {gameState.andarCards.length + gameState.baharCards.length}
                </span>
              </div>

              {/* 10 Multiplier Boxes Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {RANGE_BET_BOXES.map(box => {
                  const isSelected = placedBets[box.key] && placedBets[box.key] > 0;
                  const isCurrentWin = gameState.phase === 'result' && gameState.winningRange === box.key;
                  return (
                    <button
                      key={box.key}
                      onClick={() => handleSelectBet(box.key)}
                      disabled={gameState.phase !== 'betting'}
                      className={`relative p-1.5 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 cursor-pointer ${
                        isCurrentWin
                          ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300 ring-2 ring-yellow-400 animate-pulse'
                          : isSelected
                          ? 'bg-amber-600/30 border-amber-400 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                          : 'bg-[#12141f] border-white/10 text-zinc-300 hover:border-white/30'
                      }`}
                    >
                      <span className="font-bold text-xs sm:text-sm">{box.label}</span>
                      <span className="text-[10px] text-zinc-400 font-medium font-mono">{box.mult}</span>
                      {renderChipStack(box.key, parseFloat(box.mult))}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Chip Selection Bar & Actions (Clear / Undo / Double) */}
            <div className="bg-[#151824] border border-white/10 rounded-2xl p-2 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClearBets}
                  disabled={gameState.phase !== 'betting' || Object.keys(placedBets).length === 0}
                  className="w-8 h-8 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 flex items-center justify-center text-rose-300 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shadow cursor-pointer"
                  title="Clear All Bets"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleUndoBet}
                  disabled={gameState.phase !== 'betting' || betHistoryStack.length === 0}
                  className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/20 flex items-center justify-center text-white disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shadow cursor-pointer"
                  title="Undo Bet"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRepeatOrDouble}
                  disabled={gameState.phase !== 'betting'}
                  className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/20 flex items-center justify-center text-white disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shadow cursor-pointer"
                  title={totalBetAmount > 0 ? 'Double Bets (2x)' : 'Repeat Previous Bets'}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Chip Buttons to set initial amount */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {[10, 50, 100, 500, 1000, 5000].map(amt => {
                  const isSelected = selectedChip === amt;
                  return (
                    <button
                      key={`quick-chip-${amt}`}
                      onClick={() => {
                        setSelectedChip(amt);
                        andarBaharAudio.playChip();
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-400 text-black border-amber-300 shadow font-black scale-105'
                          : 'bg-[#1b2030] text-zinc-300 hover:bg-[#252c42] border-white/10'
                      }`}
                    >
                      ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats / Bead Plate Box */}
            <div className="bg-[#151824] border border-white/10 rounded-2xl p-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1.5">
                <span>Last 500 rounds</span>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-blue-400 font-bold">ANDAR {gameState.andarStatsPercent}%</span>
                  <span className="text-orange-400 font-bold">BAHAR {gameState.baharStatsPercent}%</span>
                </div>
              </div>

              {/* Dual-color Progress Bar */}
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex mb-2">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${gameState.andarStatsPercent}%` }}
                />
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${gameState.baharStatsPercent}%` }}
                />
              </div>

              {/* Bead Plate Table */}
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 overflow-hidden">
                {gameState.history.slice(0, 12).map((item, idx) => {
                  const isAndar = item.winner === 'ANDAR';
                  return (
                    <div
                      key={`bead-${idx}`}
                      className={`p-1 rounded-lg flex flex-col items-center justify-center text-center ${
                        isAndar ? 'bg-blue-950/60 border border-blue-500/30' : 'bg-orange-950/60 border border-orange-500/30'
                      }`}
                    >
                      <span className={`text-[10px] font-black ${isAndar ? 'text-blue-400' : 'text-orange-400'}`}>
                        {isAndar ? 'A' : 'B'}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-300 font-bold">
                        {item.totalCards}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  View Full Roadmap →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM STATUS BAR: Total Bet, Balance, Dealer, Limits                  */}
      {/* ========================================================================= */}
      <footer className="h-11 bg-black/95 border-t border-white/10 px-3 sm:px-4 flex items-center justify-between text-xs z-30 shrink-0">
        {/* Left: Total Bet & Available Wallet Balance */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Total Bet:</span>
            <span className="font-mono font-bold text-white">
              ₹{totalBetAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Balance:</span>
            <span className="font-mono font-bold text-[#f5c443]">
              ₹{(user?.walletBalance || 0).toLocaleString()}
            </span>
            {onNavigateDeposit && (
              <button
                onClick={onNavigateDeposit}
                className="ml-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] active:scale-95 transition"
              >
                + Add
              </button>
            )}
          </div>
        </div>

        {/* Right: Dealer info & Table limit details */}
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="hidden sm:inline text-[11px]">
            Dealer: <strong className="text-white">Edita</strong> (ID: 1550889)
          </span>

          <div className="flex items-center gap-1 text-[11px] bg-white/5 px-2 py-1 rounded-md border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-zinc-300">50 - 100K</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. MODALS & DRAWERS (Chat, Stats, Rules, History)                         */}
      {/* ========================================================================= */}

      {/* 5.1 LIVE CHAT DRAWER WITH PROPER SMOOTH CLOSE ANIMATION */}
      {showChatDrawer && (
        <div 
          onClick={handleCloseChat}
          className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end ${
            isClosingChat ? 'animate-backdrop-out' : 'animate-backdrop-in'
          }`}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm h-full bg-[#12141f] border-l border-white/15 flex flex-col justify-between shadow-2xl ${
              isClosingChat ? 'animate-drawer-out' : 'animate-drawer-in'
            }`}
          >
            <div className="p-3 bg-black/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#f5c443]" />
                <span className="font-bold text-sm text-white">Live Table Chat</span>
              </div>
              <button
                onClick={handleCloseChat}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-zinc-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl ${
                    msg.isDealer
                      ? 'bg-[#d4af37]/15 border border-[#d4af37]/30 text-amber-200'
                      : 'bg-white/5 border border-white/5 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                    <span className="font-bold text-white">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="p-3 bg-black/80 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type message to table..."
                className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#f5c443]"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#f5c443] text-black font-bold text-xs flex items-center gap-1 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5.2 RULES & PAYTABLE MODAL WITH PROPER CLOSE ANIMATION */}
      {showRulesModal && (
        <div 
          onClick={handleCloseRules}
          className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 ${
            isClosingRules ? 'animate-backdrop-out' : 'animate-backdrop-in'
          }`}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-[#151724] border border-[#d4af37]/30 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl text-white ${
              isClosingRules ? 'animate-modal-out' : 'animate-modal-in'
            }`}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#f5c443]" />
                <h3 className="font-bold text-base text-[#fce08b]">Andar Bahar Joker+ Rules</h3>
              </div>
              <button
                onClick={handleCloseRules}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-zinc-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-zinc-300">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <h4 className="font-bold text-white text-sm mb-1">🃏 Game Objective & Matching Rule</h4>
                <p className="leading-relaxed">
                  At the beginning of each round, the dealer reveals the <strong>Joker Card</strong>.
                  Cards are then dealt alternately to <strong>ANDAR</strong> and <strong>BAHAR</strong>.
                  The side that receives a card matching both the <strong>rank and color</strong> (e.g. Red 10 matches only Red 10; Black 10 does not win) of the Joker card wins the round!
                </p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <h4 className="font-bold text-white text-sm mb-2">💰 Main Bets & Payouts</h4>
                <ul className="space-y-1.5">
                  <li className="flex justify-between border-b border-white/5 pb-1">
                    <span><strong>ANDAR</strong> (Left/Top side):</span>
                    <span className="font-bold text-blue-400">1.9x</span>
                  </li>
                  <li className="flex justify-between border-b border-white/5 pb-1">
                    <span><strong>BAHAR</strong> (Right/Bottom side):</span>
                    <span className="font-bold text-orange-400">1.9x</span>
                  </li>
                  <li className="flex justify-between border-b border-white/5 pb-1">
                    <span><strong>Andar On 1st</strong> (First card to Andar matches Joker):</span>
                    <span className="font-bold text-blue-400">16.5x</span>
                  </li>
                  <li className="flex justify-between border-b border-white/5 pb-1">
                    <span><strong>Bahar On 1st</strong> (First card to Bahar matches Joker):</span>
                    <span className="font-bold text-orange-400">17.0x</span>
                  </li>
                  <li className="flex justify-between">
                    <span><strong>First 3</strong> (Joker + first 2 cards form Flush/Straight/Trio):</span>
                    <span className="font-bold text-purple-400">4.5x</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <h4 className="font-bold text-white text-sm mb-2">🎯 Cards Count Range Bets</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>1 - 5 Cards:</span> <strong className="text-yellow-400">3x</strong>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>6 - 10 Cards:</span> <strong className="text-yellow-400">4x</strong>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>11 - 15 Cards:</span> <strong className="text-yellow-400">5x</strong>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>16 - 20 Cards:</span> <strong className="text-yellow-400">6x</strong>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>21 - 25 Cards:</span> <strong className="text-yellow-400">9x</strong>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>26 - 30 Cards:</span> <strong className="text-yellow-400">13x</strong>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>31 - 35 Cards:</span> <strong className="text-yellow-400">32x</strong>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>36 - 40 Cards:</span> <strong className="text-yellow-400">40x</strong>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>41 - 45 Cards:</span> <strong className="text-yellow-400">110x</strong>
                  </div>
                  <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>46 - 49 Cards:</span> <strong className="text-yellow-400">800x</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5.3 STATS & ROADMAP MODAL WITH PROPER CLOSE ANIMATION */}
      {showStatsModal && (
        <div 
          onClick={handleCloseStats}
          className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 ${
            isClosingStats ? 'animate-backdrop-out' : 'animate-backdrop-in'
          }`}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-[#151724] border border-white/20 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl text-white ${
              isClosingStats ? 'animate-modal-out' : 'animate-modal-in'
            }`}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#f5c443]" />
                <h3 className="font-bold text-base text-white">Roadmap & Statistics</h3>
              </div>
              <button
                onClick={handleCloseStats}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-zinc-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-blue-400">ANDAR: {gameState.andarStatsPercent}%</span>
                  <span className="text-orange-400">BAHAR: {gameState.baharStatsPercent}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500" style={{ width: `${gameState.andarStatsPercent}%` }} />
                  <div className="h-full bg-orange-500" style={{ width: `${gameState.baharStatsPercent}%` }} />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-zinc-300 text-xs mb-2">Bead Plate History (Recent 50 Rounds)</h4>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 bg-black/50 p-3 rounded-xl border border-white/10">
                  {gameState.history.map((h, i) => (
                    <div
                      key={i}
                      className={`p-1 rounded-lg text-center font-bold flex flex-col items-center justify-center ${
                        h.winner === 'ANDAR'
                          ? 'bg-blue-600/30 border border-blue-500 text-blue-400'
                          : 'bg-orange-600/30 border border-orange-500 text-orange-400'
                      }`}
                    >
                      <span className="text-xs">{h.winner === 'ANDAR' ? 'A' : 'B'}</span>
                      <span className="text-[9px] text-zinc-300">{h.totalCards}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5.4 RECENT ROUNDS HISTORY MODAL WITH PROPER CLOSE ANIMATION */}
      {showHistoryModal && (
        <div 
          onClick={handleCloseHistory}
          className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 ${
            isClosingHistory ? 'animate-backdrop-out' : 'animate-backdrop-in'
          }`}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-[#151724] border border-white/20 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl text-white ${
              isClosingHistory ? 'animate-modal-out' : 'animate-modal-in'
            }`}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#f5c443]" />
                <h3 className="font-bold text-base text-white">Round History</h3>
              </div>
              <button
                onClick={handleCloseHistory}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-zinc-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
              {gameState.history.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      item.winner === 'ANDAR' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
                    }`}>
                      {item.winner === 'ANDAR' ? 'A' : 'B'}
                    </span>
                    <div>
                      <div className="font-bold text-white">Round #{item.roundId}</div>
                      <div className="text-[11px] text-zinc-400">
                        Joker: {item.jokerRank}{item.jokerSuit} • Matched on Card {item.totalCards}
                      </div>
                    </div>
                  </div>
                  <span className={`font-bold ${item.winner === 'ANDAR' ? 'text-blue-400' : 'text-orange-400'}`}>
                    {item.winner} WON
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5.5 SEVEN UP DOWN STYLE BET PLACEMENT BOTTOM SHEET / MODAL     */}
      {/* Type amount, quick chips, multipliers, confirm bet            */}
      {/* ============================================================== */}
      {showBetSlip && pendingBet && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeBetSlip();
          }}
          className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 ${
            isClosingBetSlip ? 'animate-backdrop-out' : 'animate-backdrop-in'
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-[#121522] border-t sm:border border-amber-500/30 rounded-t-[32px] sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden text-white shadow-[0_-10px_50px_rgba(0,0,0,0.8)] ${
              isClosingBetSlip ? 'animate-slide-up-out' : 'animate-slide-down-in'
            }`}
          >
            {/* Top Ribbon Header */}
            <div className="pt-3.5 pb-3 px-4 shrink-0 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-black text-center space-y-1 relative shadow-md">
              <div className="flex items-center justify-between text-xs font-black font-mono">
                <span className="text-black/80 uppercase">ANDAR BAHAR • #{gameState.roundId}</span>
                <span className="bg-black/85 text-amber-300 px-2 py-0.5 rounded-full text-[10px]">
                  ⏱ 0:{String(gameState.countdown).padStart(2, '0')}s
                </span>
              </div>
              <div className="inline-block px-5 py-1.5 bg-black/90 text-amber-300 rounded-xl shadow-lg border border-amber-400/40 mt-1">
                <span className="text-xs sm:text-sm font-black tracking-wide">
                  {pendingBet.label} ({pendingBet.odds.toFixed(2)}x)
                </span>
              </div>
            </div>

            {/* Sheet Body */}
            <div className="p-4 sm:p-5 space-y-4 bg-[#121522] overflow-y-auto flex-1">
              {/* Quick Amount Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
                  <span>Select Amount</span>
                  <span className="font-mono text-amber-300/80">Wallet: ₹{(user?.walletBalance || 0).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[10, 50, 100, 500, 1000, 5000].map((amt) => {
                    const isActive = (Number(customBetInput) || betUnitAmount) === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setBetUnitAmount(amt);
                          setCustomBetInput(String(amt));
                          andarBaharAudio.playChip();
                        }}
                        className={`py-2 rounded-xl text-xs font-mono font-black transition cursor-pointer border ${
                          isActive
                            ? 'bg-amber-400 text-black border-amber-300 shadow-md ring-2 ring-amber-400'
                            : 'bg-[#1b2030] text-zinc-200 border-white/10 hover:bg-[#252c42]'
                        }`}
                      >
                        ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Custom Amount Input (User can type custom amount!) */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-bold flex items-center justify-between">
                  <span>Edit Amount</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Type custom amount</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-amber-400 font-mono font-black text-sm">₹</span>
                  <input
                    type="number"
                    min="10"
                    max="100000"
                    value={customBetInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomBetInput(val);
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num > 0) {
                        setBetUnitAmount(num);
                      }
                    }}
                    placeholder="Enter amount (min ₹10)"
                    className="w-full bg-[#181d2c] border border-amber-500/40 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono font-black text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Multiplier / Quantity [-] [ 1 ] [+] */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Multiplier / Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBetMultiplier((m) => Math.max(1, m - 1))}
                    className="w-8 h-8 rounded-lg bg-[#22283a] hover:bg-[#2e374f] text-white font-black text-base flex items-center justify-center active:scale-95 border border-white/10 cursor-pointer"
                  >
                    -
                  </button>
                  <div className="w-16 h-8 rounded-lg bg-[#181d2c] border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-amber-300">
                    {betMultiplier}X
                  </div>
                  <button
                    type="button"
                    onClick={() => setBetMultiplier((m) => m + 1)}
                    className="w-8 h-8 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-base flex items-center justify-center active:scale-95 cursor-pointer shadow"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Multipliers [X1] [X5] [X10] [X20] [X50] [X100] */}
              <div className="flex items-center justify-between gap-1.5">
                {[1, 5, 10, 20, 50, 100].map((m) => {
                  const isActive = betMultiplier === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBetMultiplier(m)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer border ${
                        isActive
                          ? 'bg-amber-400 text-black border-amber-300 shadow'
                          : 'bg-[#1b2030] text-zinc-300 hover:bg-[#252c42] border-white/10'
                      }`}
                    >
                      X{m}
                    </button>
                  );
                })}
              </div>

              {/* Calculation Summary Card */}
              <div className="p-3 bg-[#171c2b] rounded-2xl border border-white/10 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Total Stake</span>
                  <span className="text-sm font-black text-white">
                    ₹{((Math.max(10, Number(customBetInput) || betUnitAmount || 100)) * (betMultiplier || 1)).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block text-[10px]">Potential Return ({pendingBet.odds.toFixed(2)}x)</span>
                  <span className="text-sm font-black text-emerald-400">
                    +₹{(((Math.max(10, Number(customBetInput) || betUnitAmount || 100)) * (betMultiplier || 1)) * pendingBet.odds).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Cancel (left) | Confirm Bet (right) */}
            <div className="shrink-0 flex items-center border-t border-white/10 bg-[#0c0e15] p-3 gap-2">
              <button
                type="button"
                onClick={closeBetSlip}
                className="w-1/3 py-3.5 bg-[#1b2030] hover:bg-[#252c42] text-zinc-300 font-bold text-xs rounded-2xl transition text-center cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBet}
                disabled={isSubmittingBet || gameState.phase !== 'betting'}
                className="w-2/3 py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 active:scale-95 text-black font-black text-xs rounded-2xl transition text-center disabled:opacity-50 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmittingBet
                  ? 'Placing Bet...'
                  : gameState.phase !== 'betting'
                  ? 'Round Locked'
                  : `Confirm Bet ₹${((Math.max(10, Number(customBetInput) || betUnitAmount || 100)) * (betMultiplier || 1)).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
