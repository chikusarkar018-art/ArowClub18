export interface PlayingCard {
  rank: string; // '2'-'10', 'J', 'Q', 'K', 'A'
  suit: 'spades' | 'hearts' | 'clubs' | 'diamonds';
  symbol: string;
  value: number; // 2 - 14 (A=14)
  color: 'red' | 'black';
}

export type AndarBaharPhase = 'betting' | 'dealing' | 'result';

export type AndarBaharSelection =
  | 'andar'
  | 'bahar'
  | 'andar_first'
  | 'bahar_first'
  | 'first_3'
  | 'range_1_5'
  | 'range_6_10'
  | 'range_11_15'
  | 'range_16_20'
  | 'range_21_25'
  | 'range_26_30'
  | 'range_31_35'
  | 'range_36_40'
  | 'range_41_45'
  | 'range_46_49';

export interface DealtCardStep {
  side: 'ANDAR' | 'BAHAR';
  card: PlayingCard;
  isMatch: boolean;
  stepIndex: number;
}

export interface AndarBaharHistoryRecord {
  roundId: string;
  winner: 'ANDAR' | 'BAHAR';
  jokerRank: string;
  jokerSuit: string;
  winningCardRank: string;
  winningCardSuit: string;
  totalCards: number;
  isFirstCardWin: boolean;
  timestamp: number;
}

export interface AndarBaharGameState {
  roundId: string;
  roundNumber: number;
  phase: AndarBaharPhase;
  countdown: number;
  jokerCard: PlayingCard | null;
  andarCards: PlayingCard[];
  baharCards: PlayingCard[];
  allDealtCards: DealtCardStep[];
  currentDealStep: number;
  winner: 'ANDAR' | 'BAHAR' | null;
  matchingCard: PlayingCard | null;
  winningSide: 'ANDAR' | 'BAHAR' | null;
  dealtCount: number;
  isFirstCardWin: boolean;
  isFirst3Win: boolean;
  winningRange: string;
  history: AndarBaharHistoryRecord[];
  andarStatsPercent: number;
  baharStatsPercent: number;
  dealer: {
    name: string;
    id: string;
  };
  tableLimits: {
    min: number;
    max: number;
  };
  serverTime: number;
}
