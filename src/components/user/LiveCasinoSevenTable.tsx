import React, { useMemo } from 'react';
import { PlayingCard } from './UserSevenUpDownGameView.js';
import { sevenUpDownAudio } from '../../utils/sevenUpDownAudio.js';
import { CasinoPlayingCard } from './CasinoPlayingCard.js';

interface LiveCasinoSevenTableProps {
  phase: 'betting' | 'dealing' | 'result';
  dealingStep: number;
  countdown: number;
  roundNumber: number;
  clockTime: string;
  card1: PlayingCard | null;
  card2: PlayingCard | null;
  totalResult: {
    sum: number;
    zone: 'down' | 'seven' | 'up';
    card1: PlayingCard;
    card2: PlayingCard;
  } | null;
  history: { zone: 'down' | 'seven' | 'up'; rank: string; symbol: string; color: string }[];
  bets: Record<string, number>;
  onPlaceBet: (key: string) => void;
}

export const LiveCasinoSevenTable: React.FC<LiveCasinoSevenTableProps> = ({
  phase,
  dealingStep,
  countdown,
  roundNumber,
  clockTime,
  card1,
  card2,
  totalResult,
  history,
  bets = {},
  onPlaceBet = () => {},
}) => {
  // Determine the effective result zone
  const effectiveZone: 'down' | 'seven' | 'up' | null = useMemo(() => {
    if (totalResult?.zone) return totalResult.zone;
    if (phase === 'result' || dealingStep >= 5) {
      if (card1 && card2) {
        const sum = card1.value + card2.value;
        if (sum < 7) return 'down';
        if (sum === 7) return 'seven';
        return 'up';
      }
    }
    return null;
  }, [totalResult, phase, dealingStep, card1, card2]);

  // Card visibility & flip states based on dealingStep:
  // Step 0: Round is betting. Both card spaces are empty.
  // Step 1: Card 1 dealt from shoe face down.
  // Step 2: Card 2 dealt from shoe face down.
  // Step 3: Card 1 flips face up.
  // Step 4: Card 2 flips face up.
  // Step 5 / Result: Both cards face up, sum computed, winner highlighted.
  const isCard1Visible = phase !== 'betting' && (dealingStep >= 1 || !!card1);
  const isCard2Visible = phase !== 'betting' && (dealingStep >= 2 || !!card2);
  const isCard1FaceUp = phase === 'result' || dealingStep >= 3;
  const isCard2FaceUp = phase === 'result' || dealingStep >= 4;

  const sumValue = useMemo(() => {
    if (totalResult?.sum) return totalResult.sum;
    if (card1 && card2 && (phase === 'result' || dealingStep >= 5)) {
      return card1.value + card2.value;
    }
    return null;
  }, [totalResult, card1, card2, phase, dealingStep]);

  return (
    <div className="relative w-full max-w-5xl mx-auto select-none shrink-0 z-20 px-1 sm:px-3 py-1 sm:py-2">
      {/* ============================================================== */}
      {/* 1. REALISTIC LUXURY CASINO TABLE CONTAINER (Straight & Centered)*/}
      {/* Outer Polished Wood Rim + Black Padded Rail + Green Felt Surface*/}
      {/* ============================================================== */}
      <div className="relative w-full rounded-[24px] sm:rounded-[36px] p-2 sm:p-3.5 bg-gradient-to-b from-[#3a1a0c] via-[#5c2d15] to-[#250e05] border-2 border-[#caa455] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.25)]">
        
        {/* Brass Cup Holders on corners */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#ffd778] via-[#b88928] to-[#68490e] border border-[#ffd778]/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none" />
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#ffd778] via-[#b88928] to-[#68490e] border border-[#ffd778]/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none" />
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#ffd778] via-[#b88928] to-[#68490e] border border-[#ffd778]/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none" />
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#ffd778] via-[#b88928] to-[#68490e] border border-[#ffd778]/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none" />

        {/* Black Padded Leather Bumper / Rail */}
        <div className="relative w-full rounded-[18px] sm:rounded-[28px] p-1.5 sm:p-2.5 bg-gradient-to-b from-[#1c1917] via-[#09090b] to-[#1c1917] border border-black/90 shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)]">
          
          {/* ============================================================== */}
          {/* GREEN FELT TABLE SURFACE (Integrated Physical Felt Area)       */}
          {/* Subtle dotted texture, gold outlines, warm ambient lighting    */}
          {/* ============================================================== */}
          <div
            className="relative w-full rounded-[14px] sm:rounded-[22px] bg-[#09351d] overflow-hidden shadow-[inset_0_4px_25px_rgba(0,0,0,0.85)] border border-[#caa455]/50 flex flex-col justify-between py-2 sm:py-3.5 px-2 sm:px-5"
            style={{
              backgroundImage: `radial-gradient(rgba(202, 164, 85, 0.12) 1.2px, transparent 1.2px), radial-gradient(ellipse at 50% 10%, rgba(255, 225, 120, 0.15), transparent 70%)`,
              backgroundSize: '16px 16px, 100% 100%',
            }}
          >
            {/* Subtle table border line */}
            <div className="absolute inset-1.5 sm:inset-2.5 rounded-[10px] sm:rounded-[18px] border border-[#caa455]/30 pointer-events-none" />

            {/* ============================================================ */}
            {/* 2. TOP SECTION: TWO COMPACT INTEGRATED PANELS                */}
            {/* Left: Clock, Table #, Round # | Right: Timer & Status        */}
            {/* ============================================================ */}
            <div className="relative z-20 flex items-center justify-between gap-2 mb-2 sm:mb-3">
              
              {/* Left Top Panel: Time, Table #701, Round # */}
              <div className="bg-[#090b10]/90 backdrop-blur-md px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-[#caa455]/80 shadow-md text-left">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#06d6a0] animate-pulse shrink-0" />
                  <span className="text-[#ffd166] font-mono font-black text-xs sm:text-sm tracking-wider leading-none">
                    {clockTime || '18:56:11'}
                  </span>
                </div>
                <div className="text-zinc-300 font-mono text-[8.5px] sm:text-[11px] font-semibold tracking-wide leading-none mt-1">
                  Table #701 • Round #{roundNumber || 1058}
                </div>
              </div>

              {/* Right Top Panel: Countdown Timer & Status */}
              <div className="bg-[#090b10]/90 backdrop-blur-md px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-[#caa455]/80 shadow-md text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${
                      phase === 'betting' ? 'bg-[#06d6a0] animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-[#06d6a0] font-mono font-black text-xs sm:text-sm tracking-wider leading-none">
                    0:{String(countdown).padStart(2, '0')}
                  </span>
                </div>
                <div
                  className={`font-mono font-bold text-[8.5px] sm:text-[11px] uppercase tracking-wider leading-none mt-1 ${
                    phase === 'betting'
                      ? 'text-white'
                      : phase === 'dealing'
                      ? 'text-rose-400'
                      : 'text-amber-300'
                  }`}
                >
                  {phase === 'betting'
                    ? 'BETTING OPEN'
                    : phase === 'dealing'
                    ? 'BETTING CLOSED'
                    : 'RESULT DECLARED'}
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3. THREE BETTING AREAS (One Horizontal Row near Top-Center)  */}
            {/* [ 7 DOWN - 1.98X ]   [ 7 - 12.0X ]   [ 7 UP - 1.98X ]       */}
            {/* ============================================================ */}
            <div className="relative z-20 grid grid-cols-11 gap-1.5 sm:gap-3 items-center max-w-3xl w-full mx-auto my-1 sm:my-2">
              
              {/* 3.1 LEFT PANEL: 7 DOWN (Cols 1-4) */}
              <div
                onClick={() => onPlaceBet('zone_down')}
                className={`col-span-4 relative rounded-xl sm:rounded-2xl p-2 sm:p-3 transition-all duration-200 cursor-pointer select-none border shadow-md flex items-center justify-between ${
                  effectiveZone === 'down'
                    ? 'border-yellow-400 bg-blue-600/30 ring-2 sm:ring-4 ring-yellow-400/90 shadow-[0_0_25px_rgba(250,204,21,0.7)] scale-[1.02]'
                    : 'border-[#caa455] bg-black/40 hover:bg-black/55 hover:border-amber-300 active:scale-98'
                }`}
                title="Bet on 7 DOWN (1.9X)"
              >
                {/* Active Bet Chip Badge */}
                {((bets['zone_down'] || bets['down'] || 0) > 0) && (
                  <span className="absolute -top-2.5 left-2 bg-amber-400 text-black font-mono font-black text-[9px] sm:text-xs px-2 py-0.5 rounded-full shadow-lg border border-black z-30 animate-bounce">
                    ₹{bets['zone_down'] || bets['down']}
                  </span>
                )}

                <div className="flex flex-col text-left leading-none">
                  <span className="font-sans font-black text-xl min-[400px]:text-2xl sm:text-3xl text-white tracking-tight">
                    7
                  </span>
                  <span className="font-sans font-black text-xs min-[400px]:text-sm sm:text-base text-white tracking-wider mt-0.5 sm:mt-1">
                    DOWN
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-xs sm:text-base text-[#48cae4] tracking-tight">
                    1.9X
                  </span>
                </div>
              </div>

              {/* 3.2 CENTER PANEL: [ 7 ] (Cols 5-7, Centered) */}
              <div
                onClick={() => onPlaceBet('zone_seven')}
                className={`col-span-3 relative rounded-xl sm:rounded-2xl p-2 sm:p-3 transition-all duration-200 cursor-pointer select-none border-2 shadow-md flex items-center justify-center gap-1 sm:gap-2 ${
                  effectiveZone === 'seven'
                    ? 'border-yellow-400 bg-red-600/30 ring-2 sm:ring-4 ring-yellow-400/90 shadow-[0_0_25px_rgba(250,204,21,0.8)] scale-[1.03]'
                    : 'border-[#e63946] bg-black/50 hover:bg-black/65 shadow-[0_0_12px_rgba(230,57,70,0.35)] active:scale-98'
                }`}
                title="Bet on EXACT 7 (12.0X)"
              >
                {/* Active Bet Chip Badge */}
                {((bets['zone_seven'] || bets['seven'] || 0) > 0) && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-mono font-black text-[9px] sm:text-xs px-2 py-0.5 rounded-full shadow-lg border border-black z-30 animate-bounce">
                    ₹{bets['zone_seven'] || bets['seven']}
                  </span>
                )}

                {/* Red bracket and prominent 7 */}
                <span className="font-serif font-black text-lg sm:text-2xl text-[#e63946] leading-none">[</span>
                <span className="font-serif font-black text-2xl min-[400px]:text-3xl sm:text-4xl text-[#e63946] leading-none drop-shadow-xs">
                  7
                </span>
                <span className="font-serif font-black text-lg sm:text-2xl text-[#e63946] leading-none">]</span>

                <div className="ml-1 sm:ml-2 text-right">
                  <span className="font-mono font-black text-xs sm:text-base text-[#ffd166] tracking-tight">
                    12.0X
                  </span>
                </div>
              </div>

              {/* 3.3 RIGHT PANEL: 7 UP (Cols 8-11) */}
              <div
                onClick={() => onPlaceBet('zone_up')}
                className={`col-span-4 relative rounded-xl sm:rounded-2xl p-2 sm:p-3 transition-all duration-200 cursor-pointer select-none border shadow-md flex items-center justify-between ${
                  effectiveZone === 'up'
                    ? 'border-yellow-400 bg-emerald-600/30 ring-2 sm:ring-4 ring-yellow-400/90 shadow-[0_0_25px_rgba(250,204,21,0.7)] scale-[1.02]'
                    : 'border-[#caa455] bg-black/40 hover:bg-black/55 hover:border-amber-300 active:scale-98'
                }`}
                title="Bet on 7 UP (1.9X)"
              >
                {/* Active Bet Chip Badge */}
                {((bets['zone_up'] || bets['up'] || 0) > 0) && (
                  <span className="absolute -top-2.5 right-2 bg-amber-400 text-black font-mono font-black text-[9px] sm:text-xs px-2 py-0.5 rounded-full shadow-lg border border-black z-30 animate-bounce">
                    ₹{bets['zone_up'] || bets['up']}
                  </span>
                )}

                <div className="flex flex-col text-left leading-none">
                  <span className="font-sans font-black text-xl min-[400px]:text-2xl sm:text-3xl text-white tracking-tight">
                    7
                  </span>
                  <span className="font-sans font-black text-xs min-[400px]:text-sm sm:text-base text-white tracking-wider mt-0.5 sm:mt-1">
                    UP
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-xs sm:text-base text-[#52b788] tracking-tight">
                    1.9X
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 4. CARD DISPLAY AREA: SHOE (Left) + CARD 1 + (+) + CARD 2    */}
            {/* Symmetrical Dashed Gold Outlines, Empty before round start   */}
            {/* ============================================================ */}
            <div className="relative z-20 flex items-center justify-center my-2 sm:my-3">
              
              {/* 4.1 COMPACT CARD SHOE (Left Side of Table) */}
              <div className="absolute left-1 sm:left-3 md:left-6 flex flex-col items-center select-none pointer-events-none">
                <div className="w-10 sm:w-14 md:w-16 aspect-[1/1.6] rounded-xl bg-gradient-to-br from-[#262626] via-[#09090b] to-[#1c1917] border-2 border-[#caa455] shadow-2xl p-1 sm:p-1.5 flex flex-col justify-between items-center relative">
                  {/* Shoe brass handle */}
                  <div className="w-4 sm:w-7 h-1 rounded-full bg-[#caa455] shadow-xs" />
                  
                  {/* SHOE Gold Label */}
                  <span className="font-mono font-black text-[8px] sm:text-[10px] md:text-xs text-[#caa455] tracking-widest uppercase">
                    SHOE
                  </span>

                  {/* Red Card Dealing Slot */}
                  <div className="w-full h-1.5 sm:h-2 rounded bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-red-400" />
                </div>
              </div>

              {/* 4.2 CARD SPACES ROW: [ CARD 1 ]  +  [ CARD 2 ] */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
                
                {/* CARD 1 SPACE (Left Card Zone) */}
                <div className="relative w-24 min-[400px]:w-28 sm:w-36 md:w-44 aspect-[5/7] rounded-xl sm:rounded-2xl border-2 border-dashed border-[#caa455] bg-black/35 flex flex-col items-center justify-center p-1 sm:p-1.5 transition-all shadow-inner">
                  {isCard1Visible && card1 ? (
                    <div className="w-full h-full animate-fadeIn transition-transform duration-500 flex items-center justify-center">
                      <CasinoPlayingCard
                        rank={card1.rank}
                        suit={card1.suit}
                        symbol={card1.suitSymbol}
                        isFaceUp={isCard1FaceUp}
                        isWinner={phase === 'result' && effectiveZone !== null}
                      />
                    </div>
                  ) : (
                    /* Empty Placeholder Before Dealing Starts */
                    <div className="flex flex-col items-center justify-center text-center select-none pointer-events-none">
                      <span className="font-mono font-black text-[10px] sm:text-xs md:text-sm text-[#ffd778] tracking-widest uppercase mb-1 sm:mb-2 drop-shadow-sm">
                        CARD 1
                      </span>
                      {/* Gold card back outline icon */}
                      <div className="w-8 h-12 sm:w-10 sm:h-14 border-2 border-dashed border-[#ffd778]/50 rounded-lg bg-black/20 flex items-center justify-center shadow-xs">
                        <span className="text-xs sm:text-sm text-[#ffd778]/60">🂠</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* PLUS (+) SYMBOL */}
                <div className="text-2xl sm:text-4xl md:text-5xl font-black text-[#ffd778] select-none drop-shadow-md flex items-center justify-center px-1">
                  +
                </div>

                {/* CARD 2 SPACE (Right Card Zone) */}
                <div className="relative w-24 min-[400px]:w-28 sm:w-36 md:w-44 aspect-[5/7] rounded-xl sm:rounded-2xl border-2 border-dashed border-[#caa455] bg-black/35 flex flex-col items-center justify-center p-1 sm:p-1.5 transition-all shadow-inner">
                  {isCard2Visible && card2 ? (
                    <div className="w-full h-full animate-fadeIn transition-transform duration-500 flex items-center justify-center">
                      <CasinoPlayingCard
                        rank={card2.rank}
                        suit={card2.suit}
                        symbol={card2.suitSymbol}
                        isFaceUp={isCard2FaceUp}
                        isWinner={phase === 'result' && effectiveZone !== null}
                      />
                    </div>
                  ) : (
                    /* Empty Placeholder Before Dealing Starts */
                    <div className="flex flex-col items-center justify-center text-center select-none pointer-events-none">
                      <span className="font-mono font-black text-[10px] sm:text-xs md:text-sm text-[#ffd778] tracking-widest uppercase mb-1 sm:mb-2 drop-shadow-sm">
                        CARD 2
                      </span>
                      {/* Gold card back outline icon */}
                      <div className="w-8 h-12 sm:w-10 sm:h-14 border-2 border-dashed border-[#ffd778]/50 rounded-lg bg-black/20 flex items-center justify-center shadow-xs">
                        <span className="text-xs sm:text-sm text-[#ffd778]/60">🂠</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sum / Result Indicator when both cards are revealed */}
            {sumValue !== null && phase === 'result' && (
              <div className="relative z-20 flex justify-center -mt-1 mb-1 animate-fadeIn">
                <span className="bg-black/85 border border-[#caa455] text-amber-300 font-mono font-black text-[10px] sm:text-xs px-3 py-0.5 rounded-full shadow-lg">
                  SUM: {sumValue} ({sumValue < 7 ? '7 DOWN' : sumValue === 7 ? 'EXACT 7' : '7 UP'} WIN)
                </span>
              </div>
            )}

            {/* ============================================================ */}
            {/* 5. ROAD / HISTORY SECTION (Horizontal Strip at Bottom Edge)  */}
            {/* Embedded at bottom of felt, scrollable, colored outcome cells */}
            {/* ============================================================ */}
            <div className="relative z-20 w-full pt-1.5 sm:pt-2 border-t border-[#caa455]/40 flex items-center">
              <span className="font-mono font-black text-[10px] sm:text-xs text-[#caa455] tracking-wider uppercase shrink-0 mr-2 sm:mr-3">
                ROAD :
              </span>

              {/* Horizontally scrollable outcome cells */}
              <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1 sm:gap-1.5 py-0.5">
                {history && history.length > 0 ? (
                  history.slice(-20).map((item, idx) => {
                    const isDown = item.zone === 'down';
                    const isUp = item.zone === 'up';
                    const isSeven = item.zone === 'seven';

                    return (
                      <div
                        key={`road-${idx}-${item.rank}`}
                        className={`px-2 sm:px-2.5 py-0.5 rounded font-mono font-black text-[9px] sm:text-[11px] shadow-sm shrink-0 border select-none ${
                          isDown
                            ? 'bg-[#1d4ed8] text-white border-[#60a5fa]'
                            : isUp
                            ? 'bg-[#059669] text-white border-[#34d399]'
                            : 'bg-[#d97706] text-white border-[#fbbf24]'
                        }`}
                        title={`Round outcome: ${isDown ? '7 DOWN' : isUp ? '7 UP' : '7'}`}
                      >
                        {isDown ? '7D' : isUp ? '7U' : '7'}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-zinc-400 font-mono text-[9px] sm:text-[10px]">
                    Waiting for history...
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
