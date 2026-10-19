import React from 'react';
import { PlayingCard, AndarBaharPhase } from '../../types/andarBahar.js';
import { Trophy } from 'lucide-react';
import { CasinoPlayingCard } from './CasinoPlayingCard.js';

interface LiveCasinoAndarBaharTableProps {
  phase: AndarBaharPhase;
  countdown: number;
  roundId: string;
  clockTime: string;
  jokerCard: PlayingCard | null;
  andarCards: PlayingCard[];
  baharCards: PlayingCard[];
  winner: 'ANDAR' | 'BAHAR' | null;
  matchingCard: PlayingCard | null;
  flyingCard: {
    side: 'ANDAR' | 'BAHAR';
    card: PlayingCard;
    isDealing: boolean;
  } | null;
  onSelectBet?: (selection: string) => void;
  placedBets?: Record<string, number>;
}

export const LiveCasinoAndarBaharTable: React.FC<LiveCasinoAndarBaharTableProps> = ({
  phase,
  countdown,
  roundId,
  clockTime,
  jokerCard,
  andarCards,
  baharCards,
  winner,
  matchingCard,
  flyingCard,
  onSelectBet = () => {},
  placedBets = {},
}) => {
  const isMatchedRound = phase === 'result' && !!winner;
  const targetRank = jokerCard?.rank || '';

  // Render horizontal card display spanning the full box elegantly
  // Dynamic large card sizing: ensures cards are large, crisp, clean, and 100% visible on both mobile and desktop
  const renderCardCascade = (cards: PlayingCard[], side: 'ANDAR' | 'BAHAR') => {
    const total = cards.length;
    if (total === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center text-amber-300/40 font-mono text-[8.5px] sm:text-[11px] uppercase tracking-wider select-none">
          <span className="border border-dashed border-amber-500/30 px-2 py-0.5 rounded bg-black/30">
            {side} • WAITING FOR DEAL
          </span>
        </div>
      );
    }

    // Dynamic width percentage for cards to ensure big clear size with smooth overlap
    const cardWidthPct = total <= 2 ? 28.0 : total <= 4 ? 22.0 : total <= 7 ? 18.0 : 15.0;

    let stepPct = cardWidthPct * 0.70;
    if (total > 1) {
      const maxAvailablePct = 100.0 - cardWidthPct - 1.0;
      const calculatedStep = maxAvailablePct / (total - 1);
      stepPct = Math.min(cardWidthPct * 0.70, calculatedStep);
    }

    return (
      <div className="relative w-full h-full overflow-hidden flex items-center px-1">
        {cards.map((card, idx) => {
          const isLastCard = idx === total - 1;
          // Strict user requirement: Must match BOTH Rank AND Suit (e.g. 2 of Hearts matches ONLY 2 of Hearts!)
          const isSameRank = jokerCard && card.rank === jokerCard.rank;
          const isSameSuit = jokerCard && card.suit === jokerCard.suit;
          const isExactMatch = isSameRank && isSameSuit;
          const isWinnerCard = winner === side && isExactMatch && isLastCard;
          const isDifferentSuitRank = isSameRank && !isSameSuit;
          const leftPct = 1.0 + idx * stepPct;

          return (
            <div
              key={`${side}-card-${idx}-${card.rank}-${card.suit}`}
              style={{
                position: 'absolute',
                left: `${leftPct}%`,
                top: '1px',
                bottom: '1px',
                width: `${cardWidthPct}%`,
                zIndex: isWinnerCard ? 50 : idx + 1,
              }}
              className={`flex items-center justify-center drop-shadow-md ${isLastCard ? 'transition-all duration-200 animate-fadeIn' : ''}`}
            >
              <CasinoPlayingCard
                rank={card.rank}
                suit={card.suit}
                symbol={card.symbol}
                isFaceUp={true}
                isWinner={isWinnerCard}
                isHighlighted={isWinnerCard}
              />

              {/* Exact Winner Match Notification - ONLY on identical card match */}
              {isWinnerCard && (
                <div className="absolute -top-3.5 sm:-top-5 inset-x-0 flex justify-center z-50 pointer-events-none">
                  <span className="bg-yellow-400 text-black font-mono font-black text-[7px] sm:text-[9.5px] px-1.5 py-0.2 rounded shadow-[0_0_12px_rgba(250,204,21,1)] border border-black animate-bounce flex items-center gap-0.5 whitespace-nowrap">
                    👑 EXACT MATCH! ({card.rank}{card.symbol})
                  </span>
                </div>
              )}

              {/* Explicit Different Suit Alert on Same-Rank non-matching card to prove it did NOT clear */}
              {isDifferentSuitRank && !isWinnerCard && (
                <div className="absolute -top-3 sm:-top-4 inset-x-0 flex justify-center z-40 pointer-events-none">
                  <span className="bg-rose-950/90 text-rose-300 font-mono font-bold text-[6.5px] sm:text-[8px] px-1 py-0.2 rounded border border-rose-500/50 shadow whitespace-nowrap">
                    ≠ Different Suit
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto bg-[#07090e] overflow-hidden shadow-2xl border-b border-[#232738] select-none shrink-0 z-20">
      {/* ============================================================== */}
      {/* 1. COMPACT CASINO TABLE (Fits in viewport without scrolling!)  */}
      {/* ============================================================== */}
      <div
        className="relative w-full aspect-[16/9] max-h-[29vh] sm:max-h-[35vh] overflow-hidden bg-[#072412] border-y border-[#caa455]/40"
        style={{
          backgroundImage: `radial-gradient(rgba(202, 164, 85, 0.14) 1.2px, transparent 1.2px), radial-gradient(ellipse at 50% 12%, rgba(255, 230, 130, 0.20), transparent 75%)`,
          backgroundSize: '16px 16px, 100% 100%',
        }}
      >
        {/* Subtle Outer Casino Wood Table Border Rim */}
        <div className="absolute inset-0 pointer-events-none border-4 border-[#3a1a0c] shadow-[inset_0_0_20px_rgba(0,0,0,0.85)]" />
        <div className="absolute inset-1.5 rounded-lg border border-[#caa455]/30 pointer-events-none" />

        {/* ============================================================== */}
        {/* 2. TOP HUD: Brand Logo & Round ID on Left | Timer on Right     */}
        {/* ============================================================== */}
        <div className="absolute top-1.5 inset-x-2 sm:inset-x-4 z-30 flex items-center justify-between pointer-events-none">
          {/* Left: Brand Logo & Round ID */}
          <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-amber-500/40 font-mono text-[9px] sm:text-[11px] text-amber-300 font-bold shadow">
            <span className="text-[10px] sm:text-xs">👑</span>
            <span className="font-serif font-black text-amber-300">CROWN 247</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-300">#{roundId}</span>
            <span className="text-zinc-400 hidden sm:inline text-[8px]">{clockTime}</span>
          </div>

          {/* Right: Phase / Timer */}
          <div
            className={`px-2.5 py-0.5 rounded-lg backdrop-blur-md border font-mono font-black text-[9px] sm:text-[11px] uppercase shadow ${
              phase === 'betting'
                ? 'bg-black/85 border-emerald-400 text-emerald-300'
                : phase === 'dealing'
                ? 'bg-black/85 border-amber-400 text-amber-300'
                : 'bg-black/85 border-rose-400 text-rose-300'
            }`}
          >
            {phase === 'betting' ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>0:{String(countdown).padStart(2, '0')}s</span>
              </span>
            ) : phase === 'dealing' ? (
              <span>MATCHING {jokerCard ? `${jokerCard.rank}${jokerCard.symbol}` : '...'}</span>
            ) : (
              <span>{winner ? `${winner} WIN` : 'RESULT'}</span>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. TOP-CENTER JOKER CARD POSITION: STEADY & CLEAN (NO BLINK)   */}
        {/* Exactly 1 single card, stationary, zero animation/blink,       */}
        {/* changes ONLY when the round ends and a new round begins!        */}
        {/* ============================================================== */}
        <div
          style={{
            position: 'absolute',
            left: '42.0%',
            top: '2.5%',
            width: '16.0%',
            height: '38.0%',
          }}
          className="z-20 flex flex-col items-center justify-center p-0.5 pointer-events-none"
        >
          {jokerCard ? (
            <div className="h-full aspect-[5/7] relative flex items-center justify-center drop-shadow-xl">
              <CasinoPlayingCard
                rank={jokerCard.rank}
                suit={jokerCard.suit}
                symbol={jokerCard.symbol}
                isFaceUp={true}
                isWinner={false}
                isHighlighted={false}
              />
            </div>
          ) : (
            <div className="h-full aspect-[5/7] flex items-center justify-center drop-shadow-xl">
              <CasinoPlayingCard rank="?" suit="spades" isFaceUp={false} />
            </div>
          )}
        </div>

        {/* Floating Joker Indicator cleanly below the card */}
        {jokerCard && (
          <div
            style={{
              position: 'absolute',
              left: '35.0%',
              top: '41.5%',
              width: '30.0%',
            }}
            className="z-25 flex justify-center pointer-events-none"
          >
            <span className="bg-black/95 text-amber-300 border border-amber-400 text-[8px] sm:text-[10px] font-mono font-black uppercase px-2 py-0.2 rounded shadow-lg whitespace-nowrap">
              JOKER: {jokerCard.rank} {jokerCard.symbol} ({jokerCard.suit.toUpperCase()})
            </span>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. ANDAR & BAHAR INTERACTIVE CLICK ZONES & CHIP PILES          */}
        {/* ============================================================== */}
        {/* ANDAR Click Zone (Left) */}
        <div
          onClick={() => onSelectBet('andar')}
          style={{
            position: 'absolute',
            left: '8%',
            top: '22%',
            width: '32%',
            height: '24%',
          }}
          className={`z-25 cursor-pointer rounded-xl transition-all flex flex-col items-center justify-center select-none border-2 p-1 ${
            winner === 'ANDAR'
              ? 'ring-2 ring-yellow-400 bg-blue-600/50 border-yellow-400 shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-pulse'
              : 'bg-blue-900/60 hover:bg-blue-800/70 border-blue-400/50'
          }`}
          title="Click to Bet on ANDAR (1.9X)"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-black text-xs sm:text-sm text-white tracking-wider">ANDAR</span>
            <span className="font-mono font-black text-[10px] sm:text-xs text-yellow-300 bg-black/60 px-1.5 py-0.2 rounded border border-amber-400/40">1.9X</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {(placedBets['andar'] || 0) > 0 && (
              <span className="bg-amber-400 text-black font-mono font-black text-[9px] sm:text-[11px] px-2 py-0.5 rounded-full shadow-lg border border-black animate-bounce">
                ₹{placedBets['andar']}
              </span>
            )}
            {andarCards.length > 0 && (
              <span className="bg-blue-600 text-white font-mono font-bold text-[8px] sm:text-[10px] px-1.5 py-0.2 rounded shadow">
                {andarCards.length}
              </span>
            )}
          </div>
        </div>

        {/* BAHAR Click Zone (Right) */}
        <div
          onClick={() => onSelectBet('bahar')}
          style={{
            position: 'absolute',
            left: '60%',
            top: '22%',
            width: '32%',
            height: '24%',
          }}
          className={`z-25 cursor-pointer rounded-xl transition-all flex flex-col items-center justify-center select-none border-2 p-1 ${
            winner === 'BAHAR'
              ? 'ring-2 ring-yellow-400 bg-amber-600/50 border-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse'
              : 'bg-amber-950/60 hover:bg-amber-900/70 border-amber-400/50'
          }`}
          title="Click to Bet on BAHAR (1.9X)"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-black text-xs sm:text-sm text-white tracking-wider">BAHAR</span>
            <span className="font-mono font-black text-[10px] sm:text-xs text-yellow-300 bg-black/60 px-1.5 py-0.2 rounded border border-amber-400/40">1.9X</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {(placedBets['bahar'] || 0) > 0 && (
              <span className="bg-amber-400 text-black font-mono font-black text-[9px] sm:text-[11px] px-2 py-0.5 rounded-full shadow-lg border border-black animate-bounce">
                ₹{placedBets['bahar']}
              </span>
            )}
            {baharCards.length > 0 && (
              <span className="bg-amber-600 text-white font-mono font-bold text-[8px] sm:text-[10px] px-1.5 py-0.2 rounded shadow">
                {baharCards.length}
              </span>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. DEDICATED CARD BOXES (GENEROUS HEIGHT & CLEAR VISIBILITY)   */}
        {/* Coordinates: Top 50%, Height 44%                               */}
        {/* ============================================================== */}
        {/* 5.1 ANDAR CARD BOX */}
        <div
          onClick={() => onSelectBet('andar')}
          style={{
            position: 'absolute',
            left: '2.0%',
            top: '49.0%',
            width: '46.0%',
            height: '45.0%',
          }}
          className={`z-20 p-1 rounded-lg border-2 transition-all cursor-pointer ${
            winner === 'ANDAR'
              ? 'border-yellow-400 bg-[#0c2f18]/95 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.6)]'
              : 'border-[#5a3212] bg-[#072412]/90 ring-1 ring-[#c89b3c]/50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)] hover:border-[#8b5a2b]'
          }`}
          title="ANDAR Card Bay (Click to Bet)"
        >
          {/* Subtle Corner Badge */}
          <div className="absolute top-0.5 right-1 z-30 pointer-events-none flex items-center gap-1">
            <span className="text-[7.5px] sm:text-[9.5px] font-mono font-black text-blue-300 bg-blue-950/90 px-1.5 py-0.2 rounded border border-blue-500/40 shadow">
              ANDAR {andarCards.length > 0 ? `(${andarCards.length})` : ''}
            </span>
          </div>

          {/* Cards cascading with generous width and full latest card visibility */}
          {renderCardCascade(andarCards, 'ANDAR')}
        </div>

        {/* 5.2 BAHAR CARD BOX */}
        <div
          onClick={() => onSelectBet('bahar')}
          style={{
            position: 'absolute',
            left: '52.0%',
            top: '49.0%',
            width: '46.0%',
            height: '45.0%',
          }}
          className={`z-20 p-1 rounded-lg border-2 transition-all cursor-pointer ${
            winner === 'BAHAR'
              ? 'border-yellow-400 bg-[#0c2f18]/95 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.6)]'
              : 'border-[#5a3212] bg-[#072412]/90 ring-1 ring-[#c89b3c]/50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)] hover:border-[#8b5a2b]'
          }`}
          title="BAHAR Card Bay (Click to Bet)"
        >
          {/* Subtle Corner Badge */}
          <div className="absolute top-0.5 right-1 z-30 pointer-events-none flex items-center gap-1">
            <span className="text-[7.5px] sm:text-[9.5px] font-mono font-black text-amber-300 bg-amber-950/90 px-1.5 py-0.2 rounded border border-amber-500/40 shadow">
              BAHAR {baharCards.length > 0 ? `(${baharCards.length})` : ''}
            </span>
          </div>

          {/* Cards cascading with generous width and full latest card visibility */}
          {renderCardCascade(baharCards, 'BAHAR')}
        </div>


        {/* ============================================================== */}
        {/* 7. DISCREET WINNER ANNOUNCEMENT STRIP (Bottom of Table)        */}
        {/* ============================================================== */}
        {phase === 'result' && winner && (
          <div className="absolute inset-x-4 bottom-1.5 z-40 flex items-center justify-center pointer-events-none animate-fadeIn">
            <div className="bg-black/90 border border-amber-400 px-3 py-0.5 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.8)] flex items-center gap-2 sm:gap-3 backdrop-blur-md">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex items-center gap-1 text-[9px] sm:text-[11px] font-serif font-black text-white">
                <span>{winner} WINS (1.9X)!</span>
                <span className="text-amber-300 font-mono text-[8px] sm:text-[9.5px] font-normal">
                  (Matched: {jokerCard?.rank} {jokerCard?.symbol} {jokerCard?.color.toUpperCase()})
                </span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[8px] sm:text-[9.5px] font-mono font-black uppercase text-white shadow ${
                  winner === 'ANDAR' ? 'bg-blue-600' : 'bg-amber-600'
                }`}
              >
                {winner} WIN
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
