import { db } from './db.js';
import { saveUserPermanently, saveTransactionPermanently, saveBetPermanently } from './firebaseDb.js';

// ==========================================
// TYPES & DATA STRUCTURES FOR LIVE CASINO
// ==========================================

export interface PlayingCard {
  rank: string; // '2'-'10', 'J', 'Q', 'K', 'A'
  suit: 'spades' | 'hearts' | 'clubs' | 'diamonds';
  symbol: string;
  value: number; // 2 - 14 (A=14)
  color: 'red' | 'black';
}

export interface HandEvaluation {
  type: 'TRIO' | 'PURE_SEQUENCE' | 'SEQUENCE' | 'COLOR' | 'PAIR' | 'HIGH_CARD';
  title: string;
  score: number;
  highCards: number[];
}

const SUITS: { suit: 'spades' | 'hearts' | 'clubs' | 'diamonds'; symbol: string; color: 'red' | 'black' }[] = [
  { suit: 'spades', symbol: '♠', color: 'black' },
  { suit: 'hearts', symbol: '♥', color: 'red' },
  { suit: 'clubs', symbol: '♣', color: 'black' },
  { suit: 'diamonds', symbol: '♦', color: 'red' },
];

const RANKS: { rank: string; value: number }[] = [
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 11 },
  { rank: 'Q', value: 12 },
  { rank: 'K', value: 13 },
  { rank: 'A', value: 14 },
];

function generateShuffledDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({
        rank: r.rank,
        suit: s.suit,
        symbol: s.symbol,
        value: r.value,
        color: s.color,
      });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function evaluate3Cards(cards: PlayingCard[]): HandEvaluation {
  if (!cards || cards.length < 3) {
    return { type: 'HIGH_CARD', title: 'High Card', score: 0, highCards: [0, 0, 0] };
  }
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const v0 = sorted[0].value;
  const v1 = sorted[1].value;
  const v2 = sorted[2].value;
  const sameSuit = sorted[0].suit === sorted[1].suit && sorted[1].suit === sorted[2].suit;

  // 1. Trio / Trail
  if (v0 === v1 && v1 === v2) {
    const name = sorted[0].rank === 'A' ? 'Aces' : `${sorted[0].rank}s`;
    return { type: 'TRIO', title: `Trio of ${name}`, score: 6000000 + v0 * 10000, highCards: [v0, v1, v2] };
  }

  // Check Straight / Sequence
  let isSequence = false;
  let sequenceWeight = 0;
  if (v0 === 14 && v1 === 13 && v2 === 12) { // AKQ
    isSequence = true;
    sequenceWeight = 1000;
  } else if (v0 === 14 && v1 === 3 && v2 === 2) { // A23
    isSequence = true;
    sequenceWeight = 900;
  } else if (v0 - v1 === 1 && v1 - v2 === 1) { // Normal consecutive
    isSequence = true;
    sequenceWeight = v0 * 10;
  }

  // 2. Pure Sequence
  if (isSequence && sameSuit) {
    return { type: 'PURE_SEQUENCE', title: 'Pure Sequence (Straight Flush)', score: 5000000 + sequenceWeight * 100, highCards: [v0, v1, v2] };
  }

  // 3. Normal Sequence
  if (isSequence) {
    return { type: 'SEQUENCE', title: 'Sequence (Straight)', score: 4000000 + sequenceWeight * 100, highCards: [v0, v1, v2] };
  }

  // 4. Color / Flush
  if (sameSuit) {
    return { type: 'COLOR', title: 'Color (Flush)', score: 3000000 + v0 * 1000 + v1 * 50 + v2, highCards: [v0, v1, v2] };
  }

  // 5. Pair
  if (v0 === v1) {
    return { type: 'PAIR', title: `Pair of ${sorted[0].rank}s`, score: 2000000 + v0 * 1000 + v2, highCards: [v0, v1, v2] };
  }
  if (v1 === v2) {
    return { type: 'PAIR', title: `Pair of ${sorted[1].rank}s`, score: 2000000 + v1 * 1000 + v0, highCards: [v1, v2, v0] };
  }
  if (v0 === v2) {
    return { type: 'PAIR', title: `Pair of ${sorted[0].rank}s`, score: 2000000 + v0 * 1000 + v1, highCards: [v0, v2, v1] };
  }

  // 6. High Card
  return { type: 'HIGH_CARD', title: `High Card ${sorted[0].rank}`, score: 1000000 + v0 * 1000 + v1 * 50 + v2, highCards: [v0, v1, v2] };
}

// ==========================================
// LIVE CASINO CONTINUOUS RUNNING ENGINE
// ==========================================

export class LiveCasinoEngine {
  private timer: NodeJS.Timeout | null = null;

  // ---------------- AVIATOR STATE ----------------
  public aviator = {
    roundId: 28430870,
    phase: 'waiting' as 'waiting' | 'flying' | 'crashed',
    countdown: 5.0,
    currentMultiplier: 1.00,
    crashMultiplier: 2.15,
    phaseStartTime: Date.now(),
    flightDurationMs: 8000,
    history: [
      2.52, 1.72, 3.09, 2.04, 2.04, 1.48, 3.09, 8.52, 1.20, 1.28, 1.84, 1.18, 1.24, 2.06, 19.98, 1.07, 2.68, 1.09
    ] as number[],
    activeBets: new Map<string, {
      id: string;
      userId: string;
      panelNum: 1 | 2;
      amount: number;
      isAuto: boolean;
      autoCashOutAt: number;
      cashedOut: boolean;
      cashOutMultiplier: number;
      cashOutAmount: number;
    }>(),
    queuedBets: new Map<string, {
      userId: string;
      panelNum: 1 | 2;
      amount: number;
      isAuto: boolean;
      autoCashOutAt: number;
    }>(),
  };

  // ---------------- ROULETTE STATE ----------------
  public roulette = {
    roundId: 140020,
    settledRoundId: 0,
    phase: 'betting' as 'betting' | 'spinning' | 'result',
    countdown: 18,
    phaseStartTime: Date.now(),
    winningNumber: 17 as number | null,
    winningColor: 'black' as 'red' | 'black' | 'green' | null,
    history: [
      { roundId: 140019, number: 7, color: 'red' as const, timestamp: Date.now() - 30000 },
      { roundId: 140018, number: 20, color: 'black' as const, timestamp: Date.now() - 60000 },
      { roundId: 140017, number: 0, color: 'green' as const, timestamp: Date.now() - 90000 },
      { roundId: 140016, number: 32, color: 'red' as const, timestamp: Date.now() - 120000 },
      { roundId: 140015, number: 11, color: 'black' as const, timestamp: Date.now() - 150000 },
      { roundId: 140014, number: 26, color: 'black' as const, timestamp: Date.now() - 180000 },
      { roundId: 140013, number: 3, color: 'red' as const, timestamp: Date.now() - 210000 },
    ] as Array<{ roundId: number; number: number; color: 'red' | 'black' | 'green'; timestamp: number }>,
    activeBets: new Map<string, {
      id: string;
      userId: string;
      bets: Record<string, number>;
      totalAmount: number;
    }>(),
  };

  // ---------------- TEEN PATTI STATE ----------------
  public teenPatti = {
    roundId: '256488586',
    roundNumber: 256488586,
    phase: 'betting' as 'betting' | 'dealing' | 'result',
    countdown: 15,
    phaseStartTime: Date.now(),
    cardsA: [] as PlayingCard[],
    cardsB: [] as PlayingCard[],
    cardsRevealedA: [false, false, false],
    cardsRevealedB: [false, false, false],
    winner: null as 'A' | 'B' | 'TIE' | null,
    evaluationA: null as HandEvaluation | null,
    evaluationB: null as HandEvaluation | null,
    history: [
      { roundId: '256488585', winner: 'B' as const },
      { roundId: '256488584', winner: 'A' as const },
      { roundId: '256488583', winner: 'B' as const },
      { roundId: '256488582', winner: 'A' as const },
      { roundId: '256488581', winner: 'B' as const },
      { roundId: '256488580', winner: 'A' as const },
      { roundId: '256488579', winner: 'B' as const },
      { roundId: '256488578', winner: 'A' as const },
    ] as Array<{ roundId: string; winner: 'A' | 'B' | 'TIE' }>,
    activeBets: new Map<string, {
      id: string;
      userId: string;
      selection: 'A_BACK' | 'B_BACK' | 'A_PLUS' | 'B_PLUS';
      stake: number;
      odds: number;
    }>(),
  };

  // ---------------- SEVEN UP DOWN STATE ----------------
  public sevenUpDown = {
    roundId: 1056,
    phase: 'betting' as 'betting' | 'dealing' | 'result',
    countdown: 25,
    phaseStartTime: Date.now(),
    dice1: 3,
    dice2: 4,
    sum: 7,
    zone: 'seven' as 'down' | 'seven' | 'up',
    card1: { rank: '3', suit: 'hearts', suitSymbol: '♥', color: 'red', value: 3, isEven: false, group: 'A23', zone: 'down' } as any,
    card2: { rank: '4', suit: 'spades', suitSymbol: '♠', color: 'black', value: 4, isEven: true, group: '456', zone: 'down' } as any,
    history: [
      { roundId: 1055, dice1: 4, dice2: 5, sum: 9, zone: 'up' as const, timestamp: Date.now() - 30000 },
      { roundId: 1054, dice1: 1, dice2: 3, sum: 4, zone: 'down' as const, timestamp: Date.now() - 60000 },
      { roundId: 1053, dice1: 3, dice2: 4, sum: 7, zone: 'seven' as const, timestamp: Date.now() - 90000 },
      { roundId: 1052, dice1: 6, dice2: 5, sum: 11, zone: 'up' as const, timestamp: Date.now() - 120000 },
      { roundId: 1051, dice1: 2, dice2: 2, sum: 4, zone: 'down' as const, timestamp: Date.now() - 150000 },
    ] as Array<{ roundId: number; dice1: number; dice2: number; sum: number; zone: 'down' | 'seven' | 'up'; timestamp: number }>,
    activeBets: new Map<string, {
      id: string;
      userId: string;
      bets: Record<string, number>;
      totalAmount: number;
    }>(),
  };

  // ---------------- ANDAR BAHAR JOKER+ STATE ----------------
  public andarBahar = {
    roundId: '1550889',
    roundNumber: 1550889,
    phase: 'betting' as 'betting' | 'dealing' | 'result',
    countdown: 15,
    phaseStartTime: Date.now(),
    jokerCard: { rank: '3', suit: 'spades', symbol: '♠', value: 3, color: 'black' } as PlayingCard,
    andarCards: [] as PlayingCard[],
    baharCards: [] as PlayingCard[],
    allDealtSequence: [] as Array<{ side: 'ANDAR' | 'BAHAR'; card: PlayingCard; isMatch: boolean; stepIndex: number }>,
    currentDealStep: 0,
    winner: null as 'ANDAR' | 'BAHAR' | null,
    matchingCard: null as PlayingCard | null,
    winningSide: null as 'ANDAR' | 'BAHAR' | null,
    dealtCount: 0,
    isFirstCardWin: false,
    isFirst3Win: false,
    winningRange: 'range_1_5',
    dealer: { name: 'Edita', id: '1550889' },
    tableLimits: { min: 10, max: 100000 },
    history: [
      { roundId: '1550888', winner: 'ANDAR' as const, jokerRank: 'A', jokerSuit: '♠', winningCardRank: 'A', winningCardSuit: '♦', totalCards: 10, isFirstCardWin: false, timestamp: Date.now() - 30000 },
      { roundId: '1550887', winner: 'BAHAR' as const, jokerRank: '9', jokerSuit: '♥', winningCardRank: '9', winningCardSuit: '♣', totalCards: 17, isFirstCardWin: false, timestamp: Date.now() - 60000 },
      { roundId: '1550886', winner: 'ANDAR' as const, jokerRank: 'A', jokerSuit: '♦', winningCardRank: 'A', winningCardSuit: '♥', totalCards: 27, isFirstCardWin: false, timestamp: Date.now() - 90000 },
      { roundId: '1550885', winner: 'ANDAR' as const, jokerRank: '4', jokerSuit: '♣', winningCardRank: '4', winningCardSuit: '♠', totalCards: 36, isFirstCardWin: false, timestamp: Date.now() - 120000 },
      { roundId: '1550884', winner: 'ANDAR' as const, jokerRank: '4', jokerSuit: '♠', winningCardRank: '4', winningCardSuit: '♥', totalCards: 19, isFirstCardWin: false, timestamp: Date.now() - 150000 },
      { roundId: '1550883', winner: 'ANDAR' as const, jokerRank: '7', jokerSuit: '♥', winningCardRank: '7', winningCardSuit: '♦', totalCards: 2, isFirstCardWin: false, timestamp: Date.now() - 180000 },
      { roundId: '1550882', winner: 'BAHAR' as const, jokerRank: '6', jokerSuit: '♦', winningCardRank: '6', winningCardSuit: '♠', totalCards: 1, isFirstCardWin: true, timestamp: Date.now() - 210000 },
      { roundId: '1550881', winner: 'BAHAR' as const, jokerRank: '6', jokerSuit: '♣', winningCardRank: '6', winningCardSuit: '♥', totalCards: 36, isFirstCardWin: false, timestamp: Date.now() - 240000 },
      { roundId: '1550880', winner: 'ANDAR' as const, jokerRank: '2', jokerSuit: '♠', winningCardRank: '2', winningCardSuit: '♣', totalCards: 1, isFirstCardWin: true, timestamp: Date.now() - 270000 },
      { roundId: '1550879', winner: 'ANDAR' as const, jokerRank: 'J', jokerSuit: '♥', winningCardRank: 'J', winningCardSuit: '♦', totalCards: 9, isFirstCardWin: false, timestamp: Date.now() - 300000 },
      { roundId: '1550878', winner: 'ANDAR' as const, jokerRank: '7', jokerSuit: '♠', winningCardRank: '7', winningCardSuit: '♣', totalCards: 13, isFirstCardWin: false, timestamp: Date.now() - 330000 },
      { roundId: '1550877', winner: 'BAHAR' as const, jokerRank: 'J', jokerSuit: '♣', winningCardRank: 'J', winningCardSuit: '♠', totalCards: 8, isFirstCardWin: false, timestamp: Date.now() - 360000 },
    ],
    activeBets: new Map<string, {
      id: string;
      userId: string;
      selection: string;
      stake: number;
      odds: number;
    }>(),
  };

  constructor() {
    this.initInitialCards();
    this.initInitialAndarBaharRound();
    this.startEngine();
  }

  private initInitialCards() {
    const deck = generateShuffledDeck();
    this.teenPatti.cardsA = [deck[0], deck[2], deck[4]];
    this.teenPatti.cardsB = [deck[1], deck[3], deck[5]];
  }

  public startEngine() {
    if (this.timer) clearInterval(this.timer);
    // Ticks every 100ms for silky smooth continuous real-time live gaming
    this.timer = setInterval(() => {
      this.tick();
    }, 100);
    console.log('[Live Casino Engine] Continuous 24/7 background game server started successfully!');
  }

  // =========================================================================
  // MAIN MASTER TICK LOOP - RUNS 24/7 CONTINUOUSLY WITHOUT WAITING FOR CLIENT
  // =========================================================================
  private tick() {
    const now = Date.now();
    this.tickAviator(now);
    this.tickRoulette(now);
    this.tickTeenPatti(now);
    this.tickSevenUpDown(now);
    this.tickAndarBahar(now);
  }

  // -------------------------------------------------------------
  // 1. AVIATOR CONTINUOUS CYCLE
  // waiting (3s) -> flying (varies by crash point) -> crashed (1.6s) -> loop
  // -------------------------------------------------------------
  private tickAviator(now: number) {
    const elapsedMs = now - this.aviator.phaseStartTime;

    if (this.aviator.phase === 'waiting') {
      const remainingSec = Math.max(0, parseFloat(((3000 - elapsedMs) / 1000).toFixed(1)));
      this.aviator.countdown = remainingSec;
      this.aviator.currentMultiplier = 1.00;

      if (elapsedMs >= 3000) {
        // Transition to FLYING
        this.aviator.phase = 'flying';
        this.aviator.phaseStartTime = now;
        this.aviator.currentMultiplier = 1.00;

        // Determine crash point
        const controls = db.allGameControls?.aviator || { mode: 'house_best' };
        let nextCrash = 1.95;

        if (controls.mode === 'force_multiplier' && controls.forcedCrashMultiplier) {
          nextCrash = Number(controls.forcedCrashMultiplier);
        } else if (controls.mode === 'house_best') {
          // Calculate house best based on active bets
          let totalBetPool = 0;
          for (const bet of this.aviator.activeBets.values()) {
            totalBetPool += bet.amount;
          }
          if (totalBetPool > (controls.autoCrashPoolThreshold || 500)) {
            nextCrash = Number((1.00 + Math.random() * 0.22).toFixed(2));
          } else {
            const r = Math.random();
            if (r < 0.05) nextCrash = 1.00;
            else if (r < 0.4) nextCrash = Number((1.10 + Math.random() * 0.6).toFixed(2));
            else if (r < 0.8) nextCrash = Number((1.70 + Math.random() * 1.5).toFixed(2));
            else nextCrash = Number((3.00 + Math.random() * 4.0).toFixed(2));
          }
        } else {
          // 97% fair RTP distribution
          const rand = Math.random();
          if (rand < 0.03) nextCrash = 1.00;
          else {
            const mult = 0.97 / (1 - rand);
            nextCrash = Math.max(1.01, parseFloat(mult.toFixed(2)));
          }
        }

        this.aviator.crashMultiplier = nextCrash;
        // Exponential flight duration calculation: t = ln(mult) / 0.065 seconds (calm, slower ascent as requested)
        const flightSec = Math.max(0.6, Math.log(Math.max(1.01, nextCrash)) / 0.065);
        this.aviator.flightDurationMs = Math.floor(flightSec * 1000);

        // Move queued bets to active
        for (const [key, qb] of this.aviator.queuedBets.entries()) {
          this.aviator.activeBets.set(key, {
            id: `av-bet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: qb.userId,
            panelNum: qb.panelNum,
            amount: qb.amount,
            isAuto: qb.isAuto,
            autoCashOutAt: qb.autoCashOutAt,
            cashedOut: false,
            cashOutMultiplier: 0,
            cashOutAmount: 0,
          });
        }
        this.aviator.queuedBets.clear();
      }
    } else if (this.aviator.phase === 'flying') {
      const flightElapsedSec = elapsedMs / 1000;
      // Formula: multiplier = Math.exp(0.065 * t) (smooth, slower ascent)
      let mult = parseFloat(Math.exp(0.065 * flightElapsedSec).toFixed(2));
      if (mult < 1.00) mult = 1.00;

      this.aviator.currentMultiplier = mult;

      // Check auto cashout on active bets
      for (const bet of this.aviator.activeBets.values()) {
        if (!bet.cashedOut && bet.isAuto && bet.autoCashOutAt > 1.00 && mult >= bet.autoCashOutAt && mult <= this.aviator.crashMultiplier) {
          this.cashoutAviatorBet(bet.userId, bet.panelNum, bet.autoCashOutAt);
        }
      }

      // Check crash condition
      if (mult >= this.aviator.crashMultiplier || elapsedMs >= this.aviator.flightDurationMs) {
        // PLANE CRASHES!
        this.aviator.phase = 'crashed';
        this.aviator.phaseStartTime = now;
        this.aviator.currentMultiplier = this.aviator.crashMultiplier;

        // Settle uncashed bets as lost
        this.settleAviatorLosses(this.aviator.crashMultiplier);

        // Add to history
        this.aviator.history.unshift(this.aviator.crashMultiplier);
        if (this.aviator.history.length > 50) this.aviator.history.pop();
      }
    } else if (this.aviator.phase === 'crashed') {
      const remainingCrashSec = Math.max(0, parseFloat(((1600 - elapsedMs) / 1000).toFixed(1)));
      this.aviator.countdown = remainingCrashSec;

      if (elapsedMs >= 1600) {
        // Next round starts automatically!
        this.aviator.phase = 'waiting';
        this.aviator.phaseStartTime = now;
        this.aviator.roundId += 1;
        this.aviator.currentMultiplier = 1.00;
        this.aviator.activeBets.clear();
      }
    }
  }

  private settleAviatorLosses(finalMult: number) {
    for (const bet of this.aviator.activeBets.values()) {
      if (!bet.cashedOut) {
        const user = db.getUser(bet.userId);
        if (user) {
          const lossAmount = bet.amount;
          user.totalLoss = parseFloat(((user.totalLoss || 0) + lossAmount).toFixed(2));
          db.syncUserTurnover(user);

          const betRecord = {
            id: `BET-AV-${this.aviator.roundId}-${bet.id}`,
            uid: user.uid,
            gameType: 'aviator' as any,
            periodId: String(this.aviator.roundId),
            unitAmount: bet.amount,
            multiplier: 1,
            totalAmount: bet.amount,
            status: 'lost' as const,
            winAmount: 0,
            feeAmount: 0,
            finalResult: `${finalMult.toFixed(2)}x`,
            createdAt: new Date().toISOString(),
          };
          db.bets.unshift(betRecord as any);
          saveBetPermanently(betRecord as any).catch(() => {});
          saveUserPermanently(user).catch(() => {});
          db.saveToDisk();
        }
      }
    }
  }

  public cashoutAviatorBet(userId: string, panelNum: 1 | 2, forceMult?: number) {
    const key = `${userId}-${panelNum}`;
    const bet = this.aviator.activeBets.get(key);
    if (!bet || bet.cashedOut) return { success: false, message: 'No active bet or already cashed out' };

    if (this.aviator.phase !== 'flying') {
      return { success: false, message: 'Cannot cash out outside of flight phase' };
    }

    const mult = forceMult || this.aviator.currentMultiplier;
    if (mult > this.aviator.crashMultiplier) {
      return { success: false, message: 'Plane already crashed' };
    }

    const winAmount = parseFloat((bet.amount * mult).toFixed(2));
    bet.cashedOut = true;
    bet.cashOutMultiplier = mult;
    bet.cashOutAmount = winAmount;

    // Credit user balance
    const user = db.getUser(userId);
    if (user) {
      const prevBal = user.walletBalance;
      user.walletBalance = parseFloat((user.walletBalance + winAmount).toFixed(2));
      user.totalWin = parseFloat(((user.totalWin || 0) + winAmount).toFixed(2));
      db.syncUserTurnover(user);

      const txRecord = {
        id: `TX-AV-WIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        uid: user.uid,
        type: 'win' as const,
        amount: winAmount,
        previousBalance: prevBal,
        newBalance: user.walletBalance,
        reference: `Aviator Win #${this.aviator.roundId} (${mult.toFixed(2)}x)`,
        note: `Aviator Win at ${mult.toFixed(2)}x multiplier`,
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
      };
      db.transactions.unshift(txRecord as any);
      saveTransactionPermanently(txRecord as any).catch(() => {});

      const betRecord = {
        id: `BET-AV-${this.aviator.roundId}-${bet.id}`,
        uid: user.uid,
        gameType: 'aviator' as any,
        periodId: String(this.aviator.roundId),
        unitAmount: bet.amount,
        multiplier: 1,
        totalAmount: bet.amount,
        status: 'won' as const,
        winAmount,
        feeAmount: 0,
        finalResult: `${mult.toFixed(2)}x`,
        createdAt: new Date().toISOString(),
      };
      db.bets.unshift(betRecord as any);
      saveBetPermanently(betRecord as any).catch(() => {});
      saveUserPermanently(user).catch(() => {});
      db.saveToDisk();
    }

    return { success: true, winAmount, multiplier: mult };
  }

  public pickRouletteWinningNumber(): { number: number; color: 'red' | 'black' | 'green' } {
    const controls = db.allGameControls?.roulette || { mode: 'auto_managed', targetWinRate: 0.48 };
    let winNum = 0;
    const redList = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const blackList = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

    if (controls.mode === 'force_number' && controls.forcedNextNumber !== null && controls.forcedNextNumber !== undefined) {
      winNum = Number(controls.forcedNextNumber);
    } else if (controls.mode === 'force_color' && controls.forcedNextColor) {
      if (controls.forcedNextColor === 'red') winNum = redList[Math.floor(Math.random() * redList.length)];
      else if (controls.forcedNextColor === 'black') winNum = blackList[Math.floor(Math.random() * blackList.length)];
      else winNum = 0;
    } else if (controls.mode === 'auto_managed') {
      // Auto Manage: client wins & loses naturally with dynamic balance
      const activeBets = Array.from(this.roulette.activeBets.values());
      const playerWinningNums: number[] = [];
      for (let n = 0; n <= 36; n++) {
        let wouldWin = false;
        for (const b of activeBets) {
          if (b.bets) {
            if (b.bets[`num_${n}`]) wouldWin = true;
            else if (b.bets['red'] && redList.includes(n)) wouldWin = true;
            else if (b.bets['black'] && blackList.includes(n)) wouldWin = true;
            else if (b.bets['even'] && n > 0 && n % 2 === 0) wouldWin = true;
            else if (b.bets['odd'] && n > 0 && n % 2 === 1) wouldWin = true;
            else if (b.bets['low'] && n >= 1 && n <= 18) wouldWin = true;
            else if (b.bets['high'] && n >= 19 && n <= 36) wouldWin = true;
          }
        }
        if (wouldWin) playerWinningNums.push(n);
      }

      const targetWinRate = Number(controls.targetWinRate ?? 0.48);
      const shouldWin = activeBets.length > 0 && playerWinningNums.length > 0 && Math.random() < targetWinRate;
      if (shouldWin) {
        winNum = playerWinningNums[Math.floor(Math.random() * playerWinningNums.length)];
      } else {
        const losingNums = Array.from({ length: 37 }, (_, i) => i).filter(n => !playerWinningNums.includes(n));
        if (losingNums.length > 0) {
          winNum = losingNums[Math.floor(Math.random() * losingNums.length)];
        } else {
          winNum = Math.floor(Math.random() * 37);
        }
      }
    } else if (controls.mode === 'house_best') {
      // Minimum payout for house advantage
      let minPayout = Infinity;
      let bestNum = 0;
      const allNums = Array.from({ length: 37 }, (_, i) => i).sort(() => Math.random() - 0.5);
      const activeBets = Array.from(this.roulette.activeBets.values());
      for (const num of allNums) {
        let totalPayout = 0;
        for (const b of activeBets) {
          if (b.bets) {
            if (b.bets[`num_${num}`]) totalPayout += b.bets[`num_${num}`] * 36;
            if (b.bets['red'] && redList.includes(num)) totalPayout += b.bets['red'] * 2;
            if (b.bets['black'] && blackList.includes(num)) totalPayout += b.bets['black'] * 2;
            if (b.bets['even'] && num > 0 && num % 2 === 0) totalPayout += b.bets['even'] * 2;
            if (b.bets['odd'] && num > 0 && num % 2 === 1) totalPayout += b.bets['odd'] * 2;
          }
        }
        if (totalPayout < minPayout) {
          minPayout = totalPayout;
          bestNum = num;
        }
      }
      winNum = bestNum;
    } else {
      // Fair European roulette (0-36)
      winNum = Math.floor(Math.random() * 37);
    }

    let color: 'red' | 'black' | 'green' = 'black';
    if (winNum === 0) color = 'green';
    else if (redList.includes(winNum)) color = 'red';

    return { number: winNum, color };
  }

  public triggerRouletteFastSpin(): { success: boolean; winningNumber?: number; winningColor?: string; roundId?: number; message?: string } {
    if (this.roulette.phase === 'betting') {
      const outcome = this.pickRouletteWinningNumber();
      this.roulette.phase = 'spinning';
      this.roulette.phaseStartTime = Date.now();
      this.roulette.countdown = 7;
      this.roulette.winningNumber = outcome.number;
      this.roulette.winningColor = outcome.color;
      return { success: true, winningNumber: outcome.number, winningColor: outcome.color, roundId: this.roulette.roundId };
    }
    if (this.roulette.phase === 'spinning') {
      return { success: true, winningNumber: this.roulette.winningNumber ?? 0, winningColor: this.roulette.winningColor || 'red', roundId: this.roulette.roundId };
    }
    return { success: false, message: 'Round is completing, please wait for next spin' };
  }

  // -------------------------------------------------------------
  // 2. ROULETTE CONTINUOUS CYCLE
  // betting (18s) -> spinning (7s) -> result (5s) -> loop
  // -------------------------------------------------------------
  private tickRoulette(now: number) {
    const elapsedMs = now - this.roulette.phaseStartTime;

    if (this.roulette.phase === 'betting') {
      const remainingSec = Math.max(0, Math.ceil((18000 - elapsedMs) / 1000));
      this.roulette.countdown = remainingSec;

      if (elapsedMs >= 18000) {
        // Transition to SPINNING - Exactly once
        this.roulette.phase = 'spinning';
        this.roulette.phaseStartTime = now;
        this.roulette.countdown = 7;

        const outcome = this.pickRouletteWinningNumber();
        this.roulette.winningNumber = outcome.number;
        this.roulette.winningColor = outcome.color;
      }
    } else if (this.roulette.phase === 'spinning') {
      const remainingSec = Math.max(0, Math.ceil((7000 - elapsedMs) / 1000));
      this.roulette.countdown = remainingSec;

      if (elapsedMs >= 7000) {
        // Transition to RESULT & SETTLEMENT - Exactly once
        this.roulette.phase = 'result';
        this.roulette.phaseStartTime = now;
        this.roulette.countdown = 5;

        this.settleRouletteRound();

        // Add to history (only once per roundId)
        if (!this.roulette.history.some(h => h.roundId === this.roulette.roundId)) {
          this.roulette.history.unshift({
            roundId: this.roulette.roundId,
            number: this.roulette.winningNumber || 0,
            color: this.roulette.winningColor || 'green',
            timestamp: now,
          });
          if (this.roulette.history.length > 50) this.roulette.history.pop();
        }
      }
    } else if (this.roulette.phase === 'result') {
      const remainingSec = Math.max(0, Math.ceil((5000 - elapsedMs) / 1000));
      this.roulette.countdown = remainingSec;

      if (elapsedMs >= 5000) {
        // Next round starts automatically!
        this.roulette.phase = 'betting';
        this.roulette.phaseStartTime = now;
        this.roulette.roundId += 1;
        this.roulette.countdown = 18;
        this.roulette.winningNumber = null;
        this.roulette.winningColor = null;
        this.roulette.activeBets.clear();
      }
    }
  }

  private settleRouletteRound() {
    if (this.roulette.settledRoundId === this.roulette.roundId) {
      return;
    }
    this.roulette.settledRoundId = this.roulette.roundId;

    const winNum = this.roulette.winningNumber ?? 0;
    const redNums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const isRed = redNums.includes(winNum);
    const isBlack = winNum > 0 && !isRed;
    const isEven = winNum > 0 && winNum % 2 === 0;
    const isOdd = winNum > 0 && winNum % 2 === 1;
    const isLow = winNum >= 1 && winNum <= 18;
    const isHigh = winNum >= 19 && winNum <= 36;
    const isDozen1 = winNum >= 1 && winNum <= 12;
    const isDozen2 = winNum >= 13 && winNum <= 24;
    const isDozen3 = winNum >= 25 && winNum <= 36;
    const isCol1 = winNum > 0 && winNum % 3 === 1;
    const isCol2 = winNum > 0 && winNum % 3 === 2;
    const isCol3 = winNum > 0 && winNum % 3 === 0;

    // Snapshot and clear active bets immediately to prevent duplicate settlement
    const betsToSettle = Array.from(this.roulette.activeBets.values());
    this.roulette.activeBets.clear();

    for (const betObj of betsToSettle) {
      const user = db.getUser(betObj.userId);
      if (!user) continue;

      let totalWin = 0;
      for (const [key, amt] of Object.entries(betObj.bets)) {
        if (!amt || amt <= 0) continue;
        if (key === `num_${winNum}`) {
          totalWin += amt * 36;
        } else if (key.startsWith('split_')) {
          const parts = key.replace('split_', '').split('_').map(Number);
          if (parts.includes(winNum)) totalWin += amt * 18;
        } else if (key.startsWith('street_')) {
          const parts = key.replace('street_', '').split('_').map(Number);
          const nums = parts.length === 1 ? [parts[0], parts[0] + 1, parts[0] + 2] : parts;
          if (nums.includes(winNum)) totalWin += amt * 12;
        } else if (key.startsWith('corner_')) {
          const parts = key.replace('corner_', '').split('_').map(Number);
          const nums = parts.length === 1 ? [parts[0], parts[0] + 1, parts[0] + 3, parts[0] + 4] : parts;
          if (nums.includes(winNum)) totalWin += amt * 9;
        } else if (key === 'five_basket' || key === 'basket') {
          if ([0, 1, 2, 3].includes(winNum)) totalWin += amt * 7;
        } else if (key.startsWith('line_')) {
          const start = parseInt(key.replace('line_', ''), 10);
          if (winNum >= start && winNum <= start + 5) totalWin += amt * 6;
        } else if (key === 'red' && isRed) {
          totalWin += amt * 2;
        } else if (key === 'black' && isBlack) {
          totalWin += amt * 2;
        } else if (key === 'even' && isEven) {
          totalWin += amt * 2;
        } else if (key === 'odd' && isOdd) {
          totalWin += amt * 2;
        } else if (key === 'low' && isLow) {
          totalWin += amt * 2;
        } else if (key === 'high' && isHigh) {
          totalWin += amt * 2;
        } else if ((key === 'dozen_1' || key === 'doz_1') && isDozen1) {
          totalWin += amt * 3;
        } else if ((key === 'dozen_2' || key === 'doz_2') && isDozen2) {
          totalWin += amt * 3;
        } else if ((key === 'dozen_3' || key === 'doz_3') && isDozen3) {
          totalWin += amt * 3;
        } else if (key === 'col_1' && isCol1) {
          totalWin += amt * 3;
        } else if (key === 'col_2' && isCol2) {
          totalWin += amt * 3;
        } else if (key === 'col_3' && isCol3) {
          totalWin += amt * 3;
        }
      }

      const status = totalWin > 0 ? 'won' : 'lost';
      const stake = betObj.totalAmount;
      if (totalWin > 0) {
        const prevBal = user.walletBalance;
        user.walletBalance = parseFloat((user.walletBalance + totalWin).toFixed(2));
        user.totalWin = parseFloat(((user.totalWin || 0) + totalWin).toFixed(2));

        const txRecord = {
          id: `TX-ROUL-WIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          uid: user.uid,
          type: 'win' as const,
          amount: totalWin,
          previousBalance: prevBal,
          newBalance: user.walletBalance,
          reference: `Roulette #${this.roulette.roundId} Win`,
          note: `Roulette Win on number ${winNum}`,
          status: 'completed' as const,
          createdAt: new Date().toISOString(),
        };
        db.transactions.unshift(txRecord as any);
        saveTransactionPermanently(txRecord as any).catch(() => {});
      } else {
        const loss = stake;
        user.totalLoss = parseFloat(((user.totalLoss || 0) + loss).toFixed(2));
      }

      const betRecord = {
        id: `BET-ROUL-${this.roulette.roundId}-${betObj.id}`,
        uid: user.uid,
        gameType: 'roulette' as any,
        periodId: String(this.roulette.roundId),
        unitAmount: betObj.totalAmount,
        multiplier: 1,
        totalAmount: betObj.totalAmount,
        status,
        winAmount: totalWin,
        feeAmount: 0,
        finalResult: `Number ${winNum}`,
        createdAt: new Date().toISOString(),
      };
      db.bets.unshift(betRecord as any);
      db.applySettledBetRolling(user, betRecord as any);
      saveBetPermanently(betRecord as any).catch(() => {});
      saveUserPermanently(user).catch(() => {});
      db.saveToDisk();
    }
  }

  // -------------------------------------------------------------
  // 3. TEEN PATTI CONTINUOUS CYCLE
  // betting (15s) -> dealing (5s) -> result (5s) -> loop
  // -------------------------------------------------------------
  private tickTeenPatti(now: number) {
    const elapsedMs = now - this.teenPatti.phaseStartTime;

    if (this.teenPatti.phase === 'betting') {
      const remainingSec = Math.max(0, Math.ceil((15000 - elapsedMs) / 1000));
      this.teenPatti.countdown = remainingSec;
      this.teenPatti.cardsRevealedA = [false, false, false];
      this.teenPatti.cardsRevealedB = [false, false, false];

      if (elapsedMs >= 15000) {
        // Transition to DEALING
        this.teenPatti.phase = 'dealing';
        this.teenPatti.phaseStartTime = now;
        this.teenPatti.countdown = 5;

        // Deal fresh cards from shuffled deck
        const controls = db.allGameControls?.teen_patti || { mode: 'auto_managed', targetWinRate: 0.48 };
        let deck = generateShuffledDeck();
        let cA = [deck[0], deck[2], deck[4]];
        let cB = [deck[1], deck[3], deck[5]];
        let evalA = evaluate3Cards(cA);
        let evalB = evaluate3Cards(cB);

        let targetWinner: 'A' | 'B' | null = null;

        if (controls.mode === 'force_a') {
          targetWinner = 'A';
        } else if (controls.mode === 'force_b') {
          targetWinner = 'B';
        } else if (controls.mode === 'house_best' && this.teenPatti.activeBets.size > 0) {
          let betOnA = 0;
          let betOnB = 0;
          for (const b of this.teenPatti.activeBets.values()) {
            if (b.selection === 'A_BACK' || b.selection === 'A_PLUS') betOnA += b.stake;
            if (b.selection === 'B_BACK' || b.selection === 'B_PLUS') betOnB += b.stake;
          }
          // House best: pick the side with least liability so house maximizes profit
          targetWinner = betOnA <= betOnB ? 'A' : 'B';
        } else if (controls.mode === 'force_win' && this.teenPatti.activeBets.size > 0) {
          let betOnA = 0;
          let betOnB = 0;
          for (const b of this.teenPatti.activeBets.values()) {
            if (b.selection === 'A_BACK' || b.selection === 'A_PLUS') betOnA += b.stake;
            if (b.selection === 'B_BACK' || b.selection === 'B_PLUS') betOnB += b.stake;
          }
          targetWinner = betOnA >= betOnB ? 'A' : 'B';
        } else if (controls.mode === 'auto_managed' && this.teenPatti.activeBets.size > 0) {
          let betOnA = 0;
          let betOnB = 0;
          for (const b of this.teenPatti.activeBets.values()) {
            if (b.selection === 'A_BACK' || b.selection === 'A_PLUS') betOnA += b.stake;
            if (b.selection === 'B_BACK' || b.selection === 'B_PLUS') betOnB += b.stake;
          }
          const shouldPlayerWin = Math.random() < Number(controls.targetWinRate ?? 0.48);
          if (betOnA > betOnB) {
            targetWinner = shouldPlayerWin ? 'A' : 'B';
          } else if (betOnB > betOnA) {
            targetWinner = shouldPlayerWin ? 'B' : 'A';
          }
        }

        if (targetWinner) {
          let tries = 0;
          while (tries < 20 && ((targetWinner === 'A' && evalA.score <= evalB.score) || (targetWinner === 'B' && evalB.score <= evalA.score))) {
            deck = generateShuffledDeck();
            cA = [deck[0], deck[2], deck[4]];
            cB = [deck[1], deck[3], deck[5]];
            evalA = evaluate3Cards(cA);
            evalB = evaluate3Cards(cB);
            tries++;
          }
        }

        this.teenPatti.cardsA = cA;
        this.teenPatti.cardsB = cB;
        this.teenPatti.evaluationA = evalA;
        this.teenPatti.evaluationB = evalB;

        if (evalA.score > evalB.score) {
          this.teenPatti.winner = 'A';
        } else if (evalB.score > evalA.score) {
          this.teenPatti.winner = 'B';
        } else {
          this.teenPatti.winner = 'TIE';
        }
      }
    } else if (this.teenPatti.phase === 'dealing') {
      const remainingSec = Math.max(0, Math.ceil((5000 - elapsedMs) / 1000));
      this.teenPatti.countdown = remainingSec;

      // Card flipping animation states based on elapsed sub-seconds
      if (elapsedMs > 1000) this.teenPatti.cardsRevealedA[0] = true;
      if (elapsedMs > 1800) this.teenPatti.cardsRevealedB[0] = true;
      if (elapsedMs > 2500) this.teenPatti.cardsRevealedA[1] = true;
      if (elapsedMs > 3200) this.teenPatti.cardsRevealedB[1] = true;
      if (elapsedMs > 3900) this.teenPatti.cardsRevealedA[2] = true;
      if (elapsedMs > 4600) this.teenPatti.cardsRevealedB[2] = true;

      if (elapsedMs >= 5000) {
        // Transition to RESULT & SETTLEMENT
        this.teenPatti.phase = 'result';
        this.teenPatti.phaseStartTime = now;
        this.teenPatti.countdown = 5;
        this.teenPatti.cardsRevealedA = [true, true, true];
        this.teenPatti.cardsRevealedB = [true, true, true];

        this.settleTeenPattiRound();

        // Add to history
        this.teenPatti.history.unshift({
          roundId: this.teenPatti.roundId,
          winner: this.teenPatti.winner || 'A',
        });
        if (this.teenPatti.history.length > 50) this.teenPatti.history.pop();
      }
    } else if (this.teenPatti.phase === 'result') {
      const remainingSec = Math.max(0, Math.ceil((5000 - elapsedMs) / 1000));
      this.teenPatti.countdown = remainingSec;

      if (elapsedMs >= 5000) {
        // Next round starts automatically!
        this.teenPatti.phase = 'betting';
        this.teenPatti.phaseStartTime = now;
        this.teenPatti.roundNumber += 1;
        this.teenPatti.roundId = String(this.teenPatti.roundNumber);
        this.teenPatti.countdown = 15;
        this.teenPatti.winner = null;
        this.teenPatti.evaluationA = null;
        this.teenPatti.evaluationB = null;
        this.teenPatti.activeBets.clear();
      }
    }
  }

  private settleTeenPattiRound() {
    const winner = this.teenPatti.winner;
    const controls = db.allGameControls?.teen_patti || {};
    const configuredMainOdds = Number(controls.mainOdds) > 0 ? Number(controls.mainOdds) : 1.98;
    const configuredPlusOdds = Number(controls.plusOdds) > 0 ? Number(controls.plusOdds) : 4.5;

    for (const bet of this.teenPatti.activeBets.values()) {
      const user = db.getUser(bet.userId);
      if (!user) continue;

      let won = false;
      let multiplier = bet.odds || configuredMainOdds;

      if (bet.selection === 'A_BACK' && winner === 'A') {
        won = true;
        multiplier = bet.odds || configuredMainOdds;
      } else if (bet.selection === 'B_BACK' && winner === 'B') {
        won = true;
        multiplier = bet.odds || configuredMainOdds;
      } else if (bet.selection === 'A_PLUS' && (winner === 'A' || this.teenPatti.evaluationA?.type !== 'HIGH_CARD')) {
        won = true;
        multiplier = bet.odds || configuredPlusOdds;
      } else if (bet.selection === 'B_PLUS' && (winner === 'B' || this.teenPatti.evaluationB?.type !== 'HIGH_CARD')) {
        won = true;
        multiplier = bet.odds || configuredPlusOdds;
      }

      const winAmount = won ? parseFloat((bet.stake * multiplier).toFixed(2)) : 0;
      const status = won ? 'won' : 'lost';
      const stake = bet.stake;

      if (won) {
        const prevBal = user.walletBalance;
        user.walletBalance = parseFloat((user.walletBalance + winAmount).toFixed(2));
        user.totalWin = parseFloat(((user.totalWin || 0) + winAmount).toFixed(2));
        db.syncUserTurnover(user);

        const txRecord = {
          id: `TX-TP-WIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          uid: user.uid,
          type: 'win' as const,
          amount: winAmount,
          previousBalance: prevBal,
          newBalance: user.walletBalance,
          reference: `Teen Patti Win (${bet.selection}) #${this.teenPatti.roundId}`,
          note: `Won ₹${winAmount} on Teen Patti`,
          status: 'completed' as const,
          createdAt: new Date().toISOString(),
        };
        db.transactions.unshift(txRecord as any);
        saveTransactionPermanently(txRecord as any).catch(() => {});
      } else {
        const loss = stake;
        user.totalLoss = parseFloat(((user.totalLoss || 0) + loss).toFixed(2));
        db.syncUserTurnover(user);
      }

      const betRecord = {
        id: `BET-TP-${this.teenPatti.roundId}-${bet.id}`,
        uid: user.uid,
        gameType: 'teen_patti' as any,
        periodId: this.teenPatti.roundId,
        unitAmount: bet.stake,
        multiplier: 1,
        totalAmount: bet.stake,
        status,
        winAmount,
        feeAmount: 0,
        finalResult: `Winner: ${winner}`,
        createdAt: new Date().toISOString(),
      };
      db.bets.unshift(betRecord as any);
      saveBetPermanently(betRecord as any).catch(() => {});
      saveUserPermanently(user).catch(() => {});
      db.saveToDisk();
    }
  }

  // -------------------------------------------------------------
  // 4. SEVEN UP DOWN CONTINUOUS CYCLE
  // betting (25s) -> dealing (6s) -> result (5s) -> loop
  // -------------------------------------------------------------
  private tickSevenUpDown(now: number) {
    const elapsedMs = now - this.sevenUpDown.phaseStartTime;

    if (this.sevenUpDown.phase === 'betting') {
      const remainingSec = Math.max(0, Math.ceil((25000 - elapsedMs) / 1000));
      this.sevenUpDown.countdown = remainingSec;

      if (elapsedMs >= 25000) {
        // Transition to DEALING / ROLLING
        this.sevenUpDown.phase = 'dealing';
        this.sevenUpDown.phaseStartTime = now;
        this.sevenUpDown.countdown = 6;

        // Roll 2 dice
        const controls = db.allGameControls?.seven_up_down || { mode: 'auto_managed', targetWinRate: 0.48 };
        let d1 = Math.floor(Math.random() * 6) + 1;
        let d2 = Math.floor(Math.random() * 6) + 1;
        let sum = d1 + d2;

        let targetZone: 'down' | 'seven' | 'up' | null = null;

        if (controls.mode === 'force_down') {
          targetZone = 'down';
        } else if (controls.mode === 'force_seven') {
          targetZone = 'seven';
        } else if (controls.mode === 'force_up') {
          targetZone = 'up';
        } else if (controls.mode === 'house_best' && this.sevenUpDown.activeBets.size > 0) {
          let betDown = 0;
          let betSeven = 0;
          let betUp = 0;
          for (const b of this.sevenUpDown.activeBets.values()) {
            betDown += (b.bets?.down || 0) + (b.bets?.zone_down || 0);
            betSeven += (b.bets?.seven || 0) + (b.bets?.zone_seven || 0);
            betUp += (b.bets?.up || 0) + (b.bets?.zone_up || 0);
          }
          // House liability: down & up pay 1.9x, seven pays 12x
          const liabDown = betDown * 1.9;
          const liabSeven = betSeven * 12.0;
          const liabUp = betUp * 1.9;
          if (liabDown <= liabSeven && liabDown <= liabUp) targetZone = 'down';
          else if (liabUp <= liabDown && liabUp <= liabSeven) targetZone = 'up';
          else targetZone = 'seven';
        } else if (controls.mode === 'force_win' && this.sevenUpDown.activeBets.size > 0) {
          let betDown = 0;
          let betSeven = 0;
          let betUp = 0;
          for (const b of this.sevenUpDown.activeBets.values()) {
            betDown += (b.bets?.down || 0) + (b.bets?.zone_down || 0);
            betSeven += (b.bets?.seven || 0) + (b.bets?.zone_seven || 0);
            betUp += (b.bets?.up || 0) + (b.bets?.zone_up || 0);
          }
          if (betDown >= betUp && betDown >= betSeven) targetZone = 'down';
          else if (betUp >= betDown && betUp >= betSeven) targetZone = 'up';
          else targetZone = 'seven';
        } else if (controls.mode === 'auto_managed' && this.sevenUpDown.activeBets.size > 0) {
          let betDown = 0;
          let betSeven = 0;
          let betUp = 0;
          for (const b of this.sevenUpDown.activeBets.values()) {
            betDown += (b.bets?.down || 0) + (b.bets?.zone_down || 0);
            betSeven += (b.bets?.seven || 0) + (b.bets?.zone_seven || 0);
            betUp += (b.bets?.up || 0) + (b.bets?.zone_up || 0);
          }
          const shouldPlayerWin = Math.random() < Number(controls.targetWinRate ?? 0.48);
          if (betDown >= betUp && betDown >= betSeven && betDown > 0) {
            targetZone = shouldPlayerWin ? 'down' : (Math.random() < 0.5 ? 'up' : 'seven');
          } else if (betUp >= betDown && betUp >= betSeven && betUp > 0) {
            targetZone = shouldPlayerWin ? 'up' : (Math.random() < 0.5 ? 'down' : 'seven');
          } else if (betSeven > 0) {
            targetZone = shouldPlayerWin ? 'seven' : (Math.random() < 0.5 ? 'down' : 'up');
          }
        }

        if (targetZone) {
          let tries = 0;
          while (tries < 25) {
            const currentZone = sum < 7 ? 'down' : sum === 7 ? 'seven' : 'up';
            if (currentZone === targetZone) break;
            d1 = Math.floor(Math.random() * 6) + 1;
            d2 = Math.floor(Math.random() * 6) + 1;
            sum = d1 + d2;
            tries++;
          }
        }

        this.sevenUpDown.dice1 = d1;
        this.sevenUpDown.dice2 = d2;
        this.sevenUpDown.sum = sum;

        const SUITS_LIST: Array<{ suit: 'spades' | 'hearts' | 'clubs' | 'diamonds'; symbol: string; color: 'red' | 'black' }> = [
          { suit: 'spades', symbol: '♠', color: 'black' },
          { suit: 'hearts', symbol: '♥', color: 'red' },
          { suit: 'clubs', symbol: '♣', color: 'black' },
          { suit: 'diamonds', symbol: '♦', color: 'red' },
        ];
        const s1 = SUITS_LIST[Math.floor(Math.random() * SUITS_LIST.length)];
        const s2 = SUITS_LIST[Math.floor(Math.random() * SUITS_LIST.length)];
        const rankNames: Record<number, string> = { 1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6' };
        this.sevenUpDown.card1 = {
          rank: rankNames[d1] || String(d1),
          suit: s1.suit,
          suitSymbol: s1.symbol,
          value: d1,
          color: s1.color,
          isEven: d1 % 2 === 0,
          group: d1 <= 3 ? 'A23' : '456',
          zone: 'down',
        };
        this.sevenUpDown.card2 = {
          rank: rankNames[d2] || String(d2),
          suit: s2.suit,
          suitSymbol: s2.symbol,
          value: d2,
          color: s2.color,
          isEven: d2 % 2 === 0,
          group: d2 <= 3 ? 'A23' : '456',
          zone: 'down',
        };

        if (sum < 7) this.sevenUpDown.zone = 'down';
        else if (sum === 7) this.sevenUpDown.zone = 'seven';
        else this.sevenUpDown.zone = 'up';
      }
    } else if (this.sevenUpDown.phase === 'dealing') {
      const remainingSec = Math.max(0, Math.ceil((6000 - elapsedMs) / 1000));
      this.sevenUpDown.countdown = remainingSec;

      if (elapsedMs >= 6000) {
        // Transition to RESULT & SETTLEMENT
        this.sevenUpDown.phase = 'result';
        this.sevenUpDown.phaseStartTime = now;
        this.sevenUpDown.countdown = 5;

        this.settleSevenUpDownRound();

        // Add to history
        this.sevenUpDown.history.unshift({
          roundId: this.sevenUpDown.roundId,
          dice1: this.sevenUpDown.dice1,
          dice2: this.sevenUpDown.dice2,
          sum: this.sevenUpDown.sum,
          zone: this.sevenUpDown.zone,
          timestamp: now,
        });
        if (this.sevenUpDown.history.length > 50) this.sevenUpDown.history.pop();
      }
    } else if (this.sevenUpDown.phase === 'result') {
      const remainingSec = Math.max(0, Math.ceil((5000 - elapsedMs) / 1000));
      this.sevenUpDown.countdown = remainingSec;

      if (elapsedMs >= 5000) {
        // Next round starts automatically!
        this.sevenUpDown.phase = 'betting';
        this.sevenUpDown.phaseStartTime = now;
        this.sevenUpDown.roundId += 1;
        this.sevenUpDown.countdown = 25;
        this.sevenUpDown.activeBets.clear();
      }
    }
  }

  private settleSevenUpDownRound() {
    const zone = this.sevenUpDown.zone;
    const sum = this.sevenUpDown.sum;
    const controls = db.allGameControls?.seven_up_down || {};
    const downUpMult = (Number(controls.downUpMultiplier) > 0 && Number(controls.downUpMultiplier) !== 2) ? Number(controls.downUpMultiplier) : 1.9;
    const sevenMult = Number(controls.sevenMultiplier) > 0 ? Number(controls.sevenMultiplier) : 12.0;
    const evenMult = Number(controls.evenMultiplier) > 0 ? Number(controls.evenMultiplier) : 2.10;
    const oddMult = Number(controls.oddMultiplier) > 0 ? Number(controls.oddMultiplier) : 1.80;
    const colorMult = Number(controls.colorMultiplier) > 0 ? Number(controls.colorMultiplier) : 1.98;

    for (const betObj of this.sevenUpDown.activeBets.values()) {
      const user = db.getUser(betObj.userId);
      if (!user) continue;

      let totalWin = 0;
      for (const [z, amt] of Object.entries(betObj.bets)) {
        if (!amt || amt <= 0) continue;
        if ((z === 'down' || z === 'zone_down') && zone === 'down') {
          totalWin += amt * downUpMult;
        } else if ((z === 'up' || z === 'zone_up') && zone === 'up') {
          totalWin += amt * downUpMult;
        } else if ((z === 'seven' || z === 'zone_seven') && zone === 'seven') {
          totalWin += amt * sevenMult;
        } else if (z === 'oe_even' && sum % 2 === 0) {
          totalWin += amt * evenMult;
        } else if (z === 'oe_odd' && sum % 2 !== 0) {
          totalWin += amt * oddMult;
        } else if (z === 'color_red' && sum % 2 === 0) {
          totalWin += amt * colorMult;
        } else if (z === 'color_black' && sum % 2 !== 0) {
          totalWin += amt * colorMult;
        }
      }
      totalWin = parseFloat(totalWin.toFixed(2));

      const status = totalWin > 0 ? 'won' : 'lost';
      const stake = betObj.totalAmount;
      const netProfit = totalWin > 0 ? parseFloat((totalWin - stake).toFixed(2)) : 0;

      if (totalWin > 0) {
        const prevBal = user.walletBalance;
        user.walletBalance = parseFloat((user.walletBalance + totalWin).toFixed(2));
        user.totalWin = parseFloat(((user.totalWin || 0) + totalWin).toFixed(2));
        db.syncUserTurnover(user);

        const txRecord = {
          id: `TX-7UP-WIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          uid: user.uid,
          type: 'win' as const,
          amount: totalWin,
          previousBalance: prevBal,
          newBalance: user.walletBalance,
          reference: `7 Up Down Win (${zone.toUpperCase()} - Sum ${this.sevenUpDown.sum}) #${this.sevenUpDown.roundId}`,
          note: `Won ₹${totalWin} (₹${netProfit} profit + ₹${stake} stake return) on 7 Up Down`,
          status: 'completed' as const,
          createdAt: new Date().toISOString(),
        };
        db.transactions.unshift(txRecord as any);
        saveTransactionPermanently(txRecord as any).catch(() => {});
      } else {
        const loss = stake;
        user.totalLoss = parseFloat(((user.totalLoss || 0) + loss).toFixed(2));
        db.syncUserTurnover(user);
      }

      const betRecord = {
        id: `BET-7UP-${this.sevenUpDown.roundId}-${betObj.id}`,
        uid: user.uid,
        gameType: 'seven_up_down' as any,
        periodId: String(this.sevenUpDown.roundId),
        unitAmount: betObj.totalAmount,
        multiplier: downUpMult,
        totalAmount: betObj.totalAmount,
        status,
        winAmount: totalWin,
        lossAmount: totalWin > 0 ? 0 : stake,
        netProfit: totalWin > 0 ? netProfit : -stake,
        feeAmount: 0,
        finalResult: `Sum: ${this.sevenUpDown.sum} (${zone.toUpperCase()})`,
        createdAt: new Date().toISOString(),
      };
      db.bets.unshift(betRecord as any);
      saveBetPermanently(betRecord as any).catch(() => {});
      saveUserPermanently(user).catch(() => {});
      db.saveToDisk();
    }
  }

  // -------------------------------------------------------------
  // 5. ANDAR BAHAR JOKER+ CONTINUOUS CYCLE
  // betting (15s) -> dealing (progressive cards) -> result (6s) -> loop
  // -------------------------------------------------------------
  private initInitialAndarBaharRound() {
    this.startNewAndarBaharRound(Date.now());
  }

  private startNewAndarBaharRound(now: number) {
    const deck = generateShuffledDeck();
    const joker = deck[0];
    const remainingDeck = deck.slice(1);

    // 100% Exact Matching Rule per user requirement:
    // Must match BOTH Rank AND Suit (e.g. Red Hearts 2 matches ONLY Red Hearts 2; Diamond 2 or Spades 2 does NOT match!)
    const isExactMatch = (c: PlayingCard) => c.rank === joker.rank && c.suit === joker.suit;

    // Pick how many cards to deal before the exact matching card arrives (typically 3 to 15 cards)
    const targetIdx = Math.floor(Math.random() * 12) + 3;

    // Filter remaining deck
    const deckWithoutExactJoker = remainingDeck.filter(c => !(c.rank === joker.rank && c.suit === joker.suit));

    // Optional tease: place a card of the same rank but DIFFERENT suit earlier in the deck
    // e.g. If Joker is 2 of Hearts, place 2 of Spades or 2 of Diamonds at an earlier step to prove that different suits do NOT clear the bet!
    const diffSuitRanks = deckWithoutExactJoker.filter(c => c.rank === joker.rank);
    if (diffSuitRanks.length > 0 && targetIdx >= 4) {
      const teaseCard = diffSuitRanks[0];
      const teaseIdx = Math.floor(targetIdx / 2);
      const currIdx = deckWithoutExactJoker.indexOf(teaseCard);
      if (currIdx !== -1) {
        deckWithoutExactJoker.splice(currIdx, 1);
        deckWithoutExactJoker.splice(teaseIdx, 0, teaseCard);
      }
    }

    // Insert the exact matching duplicate card at targetIdx
    const exactCloneCard: PlayingCard = {
      rank: joker.rank,
      suit: joker.suit,
      symbol: joker.symbol,
      value: joker.value,
      color: joker.color,
    };
    deckWithoutExactJoker.splice(targetIdx, 0, exactCloneCard);

    const actualMatchIdx = targetIdx;
    const remainingCardsForRound = deckWithoutExactJoker;

    const dealtCards = remainingCardsForRound.slice(0, actualMatchIdx + 1);

    // Build the dealing sequence: 1st card -> ANDAR, 2nd card -> BAHAR, 3rd -> ANDAR...
    // If an opposite color card of the same rank appears before the match (e.g. Black 10 when Joker is Red 10),
    // it is explicitly NOT a match! Dealing continues until the same color card arrives!
    const sequence: Array<{ side: 'ANDAR' | 'BAHAR'; card: PlayingCard; isMatch: boolean; stepIndex: number }> = [];
    dealtCards.forEach((card, idx) => {
      const side: 'ANDAR' | 'BAHAR' = idx % 2 === 0 ? 'ANDAR' : 'BAHAR';
      const isMatch = isExactMatch(card);
      sequence.push({
        side,
        card,
        isMatch,
        stepIndex: idx + 1,
      });
    });

    const totalDealt = sequence.length;
    const matchItem = sequence[sequence.length - 1];
    const winner: 'ANDAR' | 'BAHAR' = matchItem ? matchItem.side : (Math.random() < 0.5 ? 'ANDAR' : 'BAHAR');
    const matchingCard = matchItem ? matchItem.card : joker;

    const isFirstCardWin = totalDealt === 1 ? winner === 'ANDAR' : (totalDealt === 2 && winner === 'BAHAR');

    // Check First 3 combination: Joker + 1st Andar card + 1st Bahar card
    let isFirst3Win = false;
    if (dealtCards.length >= 2) {
      const first3Cards = [joker, dealtCards[0], dealtCards[1]];
      const eval3 = evaluate3Cards(first3Cards);
      isFirst3Win = eval3.type !== 'HIGH_CARD';
    }

    // Determine winning range
    let winningRange = 'range_1_5';
    if (totalDealt <= 5) winningRange = 'range_1_5';
    else if (totalDealt <= 10) winningRange = 'range_6_10';
    else if (totalDealt <= 15) winningRange = 'range_11_15';
    else if (totalDealt <= 20) winningRange = 'range_16_20';
    else if (totalDealt <= 25) winningRange = 'range_21_25';
    else if (totalDealt <= 30) winningRange = 'range_26_30';
    else if (totalDealt <= 35) winningRange = 'range_31_35';
    else if (totalDealt <= 40) winningRange = 'range_36_40';
    else if (totalDealt <= 45) winningRange = 'range_41_45';
    else winningRange = 'range_46_49';

    this.andarBahar.roundNumber += 1;
    this.andarBahar.roundId = String(this.andarBahar.roundNumber);
    this.andarBahar.phase = 'betting';
    this.andarBahar.countdown = 15;
    this.andarBahar.phaseStartTime = now;
    this.andarBahar.jokerCard = joker;
    this.andarBahar.andarCards = [];
    this.andarBahar.baharCards = [];
    this.andarBahar.allDealtSequence = sequence;
    this.andarBahar.currentDealStep = 0;
    this.andarBahar.winner = winner;
    this.andarBahar.matchingCard = matchingCard;
    this.andarBahar.winningSide = winner;
    this.andarBahar.dealtCount = totalDealt;
    this.andarBahar.isFirstCardWin = isFirstCardWin;
    this.andarBahar.isFirst3Win = isFirst3Win;
    this.andarBahar.winningRange = winningRange;
    this.andarBahar.activeBets.clear();
  }

  private tickAndarBahar(now: number) {
    const elapsedMs = now - this.andarBahar.phaseStartTime;

    if (this.andarBahar.phase === 'betting') {
      const remainingSec = Math.max(0, Math.ceil((15000 - elapsedMs) / 1000));
      this.andarBahar.countdown = remainingSec;

      if (elapsedMs >= 15000) {
        // Transition to DEALING
        this.andarBahar.phase = 'dealing';
        this.andarBahar.phaseStartTime = now;
        this.andarBahar.currentDealStep = 0;
        this.andarBahar.andarCards = [];
        this.andarBahar.baharCards = [];
      }
    } else if (this.andarBahar.phase === 'dealing') {
      // Progressively reveal cards every 800ms
      const dealInterval = 800;
      const step = Math.min(
        this.andarBahar.allDealtSequence.length,
        Math.floor(elapsedMs / dealInterval)
      );

      this.andarBahar.currentDealStep = step;

      // Slice cards dealt so far
      const currentCards = this.andarBahar.allDealtSequence.slice(0, step);
      this.andarBahar.andarCards = currentCards.filter(c => c.side === 'ANDAR').map(c => c.card);
      this.andarBahar.baharCards = currentCards.filter(c => c.side === 'BAHAR').map(c => c.card);

      const totalDealDuration = this.andarBahar.allDealtSequence.length * dealInterval + 1000;
      if (elapsedMs >= totalDealDuration) {
        // Transition to RESULT & SETTLEMENT
        this.andarBahar.phase = 'result';
        this.andarBahar.phaseStartTime = now;
        this.andarBahar.countdown = 6;
        this.andarBahar.currentDealStep = this.andarBahar.allDealtSequence.length;
        this.andarBahar.andarCards = this.andarBahar.allDealtSequence.filter(c => c.side === 'ANDAR').map(c => c.card);
        this.andarBahar.baharCards = this.andarBahar.allDealtSequence.filter(c => c.side === 'BAHAR').map(c => c.card);

        this.settleAndarBaharRound();

        // Add to history
        this.andarBahar.history.unshift({
          roundId: this.andarBahar.roundId,
          winner: this.andarBahar.winner || 'ANDAR',
          jokerRank: this.andarBahar.jokerCard.rank,
          jokerSuit: this.andarBahar.jokerCard.symbol,
          winningCardRank: this.andarBahar.matchingCard?.rank || this.andarBahar.jokerCard.rank,
          winningCardSuit: this.andarBahar.matchingCard?.symbol || this.andarBahar.jokerCard.symbol,
          totalCards: this.andarBahar.dealtCount,
          isFirstCardWin: this.andarBahar.isFirstCardWin,
          timestamp: now,
        });
        if (this.andarBahar.history.length > 500) this.andarBahar.history.pop();
      }
    } else if (this.andarBahar.phase === 'result') {
      const remainingSec = Math.max(0, Math.ceil((6000 - elapsedMs) / 1000));
      this.andarBahar.countdown = remainingSec;

      if (elapsedMs >= 6000) {
        // Automatically start next continuous round
        this.startNewAndarBaharRound(now);
      }
    }
  }

  public triggerAndarBaharFastDeal(): { success: boolean; message: string; roundId?: string } {
    if (this.andarBahar.phase === 'betting') {
      this.andarBahar.phase = 'dealing';
      this.andarBahar.phaseStartTime = Date.now();
      this.andarBahar.currentDealStep = 0;
      return { success: true, message: 'Fast dealing started', roundId: this.andarBahar.roundId };
    }
    return { success: false, message: 'Round is already in progress' };
  }

  private settleAndarBaharRound() {
    const winner = this.andarBahar.winner || 'ANDAR';
    const isFirstCardWin = this.andarBahar.isFirstCardWin;
    const isFirst3Win = this.andarBahar.isFirst3Win;
    const winningRange = this.andarBahar.winningRange;

    for (const bet of this.andarBahar.activeBets.values()) {
      const user = db.getUser(bet.userId);
      if (!user) continue;

      let won = false;
      let multiplier = bet.odds || 1.9;

      if (bet.selection === 'andar' && winner === 'ANDAR') {
        won = true;
        multiplier = 1.9;
      } else if (bet.selection === 'bahar' && winner === 'BAHAR') {
        won = true;
        multiplier = 1.9;
      } else if (bet.selection === 'andar_first' && winner === 'ANDAR' && isFirstCardWin) {
        won = true;
        multiplier = 16.5;
      } else if (bet.selection === 'bahar_first' && winner === 'BAHAR' && isFirstCardWin) {
        won = true;
        multiplier = 17.0;
      } else if (bet.selection === 'first_3' && isFirst3Win) {
        won = true;
        multiplier = 4.5;
      } else if (bet.selection === winningRange) {
        won = true;
        multiplier = bet.odds;
      }

      const totalWin = won ? parseFloat((bet.stake * multiplier).toFixed(2)) : 0;
      const netProfit = won ? parseFloat((bet.stake * (multiplier - 1)).toFixed(2)) : 0;
      const status = won ? 'won' : 'lost';

      if (won && totalWin > 0) {
        const prevBal = user.walletBalance;
        user.walletBalance = parseFloat((user.walletBalance + totalWin).toFixed(2));
        user.totalWin = parseFloat(((user.totalWin || 0) + totalWin).toFixed(2));
        db.syncUserTurnover(user);

        const txRecord = {
          id: `TX-AB-WIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          uid: user.uid,
          type: 'win' as const,
          amount: totalWin,
          previousBalance: prevBal,
          newBalance: user.walletBalance,
          reference: `Andar Bahar Win (${winner} - ${bet.selection.toUpperCase()}) #${this.andarBahar.roundId}`,
          note: `Won ₹${totalWin} (₹${netProfit} profit + ₹${bet.stake} stake return) @ ${multiplier}x payout`,
          status: 'completed' as const,
          createdAt: new Date().toISOString(),
        };
        db.transactions.unshift(txRecord as any);
        saveTransactionPermanently(txRecord as any).catch(() => {});
      } else {
        const lossAmount = bet.stake;
        user.totalLoss = parseFloat(((user.totalLoss || 0) + lossAmount).toFixed(2));
        db.syncUserTurnover(user);
      }

      const betRecord = {
        id: `BET-AB-${this.andarBahar.roundId}-${bet.id}`,
        uid: user.uid,
        gameType: 'andar_bahar' as any,
        periodId: String(this.andarBahar.roundId),
        unitAmount: bet.stake,
        multiplier,
        totalAmount: bet.stake,
        status,
        winAmount: totalWin,
        lossAmount: won ? 0 : bet.stake,
        netProfit: won ? netProfit : -bet.stake,
        feeAmount: 0,
        finalResult: `Winner: ${winner} (Dealt ${this.andarBahar.dealtCount} cards, Joker: ${this.andarBahar.jokerCard.rank}${this.andarBahar.jokerCard.symbol} ${this.andarBahar.jokerCard.color.toUpperCase()})`,
        createdAt: new Date().toISOString(),
      };
      db.bets.unshift(betRecord as any);
      saveBetPermanently(betRecord as any).catch(() => {});
      saveUserPermanently(user).catch(() => {});
      db.saveToDisk();
    }
  }

  // ==========================================
  // PUBLIC API STATE SERIALIZERS
  // ==========================================

  public getAviatorState() {
    return {
      roundId: this.aviator.roundId,
      phase: this.aviator.phase,
      countdown: this.aviator.countdown,
      currentMultiplier: this.aviator.currentMultiplier,
      crashMultiplier: this.aviator.phase === 'crashed' ? this.aviator.crashMultiplier : null,
      history: this.aviator.history,
      phaseStartTime: this.aviator.phaseStartTime,
      serverTime: Date.now(),
    };
  }

  public getRouletteState() {
    return {
      roundId: this.roulette.roundId,
      phase: this.roulette.phase,
      countdown: this.roulette.countdown,
      winningNumber: this.roulette.phase !== 'betting' ? this.roulette.winningNumber : null,
      winningColor: this.roulette.phase !== 'betting' ? this.roulette.winningColor : null,
      history: this.roulette.history,
      serverTime: Date.now(),
    };
  }

  public getTeenPattiState() {
    return {
      roundId: this.teenPatti.roundId,
      roundNumber: this.teenPatti.roundNumber,
      phase: this.teenPatti.phase,
      countdown: this.teenPatti.countdown,
      cardsA: this.teenPatti.cardsA,
      cardsB: this.teenPatti.cardsB,
      cardsRevealedA: this.teenPatti.cardsRevealedA,
      cardsRevealedB: this.teenPatti.cardsRevealedB,
      winner: this.teenPatti.phase === 'result' ? this.teenPatti.winner : null,
      evaluationA: this.teenPatti.phase === 'result' ? this.teenPatti.evaluationA : null,
      evaluationB: this.teenPatti.phase === 'result' ? this.teenPatti.evaluationB : null,
      history: this.teenPatti.history,
      serverTime: Date.now(),
    };
  }

  public getSevenUpDownState() {
    return {
      roundId: this.sevenUpDown.roundId,
      phase: this.sevenUpDown.phase,
      countdown: this.sevenUpDown.countdown,
      card1: this.sevenUpDown.phase !== 'betting' ? this.sevenUpDown.card1 : null,
      card2: this.sevenUpDown.phase !== 'betting' ? this.sevenUpDown.card2 : null,
      dice1: this.sevenUpDown.phase !== 'betting' ? this.sevenUpDown.dice1 : null,
      dice2: this.sevenUpDown.phase !== 'betting' ? this.sevenUpDown.dice2 : null,
      sum: this.sevenUpDown.phase !== 'betting' ? this.sevenUpDown.sum : null,
      zone: this.sevenUpDown.phase !== 'betting' ? this.sevenUpDown.zone : null,
      history: this.sevenUpDown.history,
      serverTime: Date.now(),
    };
  }

  public getAndarBaharState() {
    // Calculate last 500 rounds win percentages
    const totalHist = this.andarBahar.history.length;
    let andarWins = 0;
    this.andarBahar.history.forEach(h => {
      if (h.winner === 'ANDAR') andarWins++;
    });
    const andarStatsPercent = totalHist > 0 ? parseFloat(((andarWins / totalHist) * 100).toFixed(1)) : 50.0;
    const baharStatsPercent = parseFloat((100 - andarStatsPercent).toFixed(1));

    return {
      roundId: this.andarBahar.roundId,
      roundNumber: this.andarBahar.roundNumber,
      phase: this.andarBahar.phase,
      countdown: this.andarBahar.countdown,
      jokerCard: this.andarBahar.jokerCard,
      andarCards: this.andarBahar.andarCards,
      baharCards: this.andarBahar.baharCards,
      allDealtCards: this.andarBahar.allDealtSequence.slice(0, this.andarBahar.currentDealStep),
      currentDealStep: this.andarBahar.currentDealStep,
      winner: this.andarBahar.phase === 'result' ? this.andarBahar.winner : null,
      matchingCard: this.andarBahar.phase === 'result' ? this.andarBahar.matchingCard : null,
      winningSide: this.andarBahar.phase === 'result' ? this.andarBahar.winningSide : null,
      dealtCount: this.andarBahar.dealtCount,
      isFirstCardWin: this.andarBahar.phase === 'result' ? this.andarBahar.isFirstCardWin : false,
      isFirst3Win: this.andarBahar.phase === 'result' ? this.andarBahar.isFirst3Win : false,
      winningRange: this.andarBahar.phase === 'result' ? this.andarBahar.winningRange : '',
      history: this.andarBahar.history,
      andarStatsPercent,
      baharStatsPercent,
      dealer: this.andarBahar.dealer,
      tableLimits: this.andarBahar.tableLimits,
      serverTime: Date.now(),
    };
  }

  public getAllLiveStates() {
    return {
      serverTime: Date.now(),
      aviator: this.getAviatorState(),
      roulette: this.getRouletteState(),
      teenPatti: this.getTeenPattiState(),
      sevenUpDown: this.getSevenUpDownState(),
      andarBahar: this.getAndarBaharState(),
    };
  }
}

// Global live casino singleton instance running 24/7 on server startup
export const liveCasinoEngine = new LiveCasinoEngine();
