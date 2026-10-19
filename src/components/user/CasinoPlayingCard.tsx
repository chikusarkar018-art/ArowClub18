import React from 'react';

export interface CasinoPlayingCardProps {
  rank: string; // 'A', '2', ..., '10', 'J', 'Q', 'K'
  suit: 'spades' | 'hearts' | 'clubs' | 'diamonds';
  symbol?: string; // '♠', '♥', '♣', '♦'
  isFaceUp?: boolean;
  isWinner?: boolean;
  isHighlighted?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SUIT_SYMBOLS: Record<'spades' | 'hearts' | 'clubs' | 'diamonds', string> = {
  spades: '♠',
  hearts: '♥',
  clubs: '♣',
  diamonds: '♦',
};

export const CasinoPlayingCard: React.FC<CasinoPlayingCardProps> = ({
  rank,
  suit,
  symbol,
  isFaceUp = true,
  isWinner = false,
  isHighlighted = false,
  className = '',
  style = {},
}) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const suitSymbol = symbol || SUIT_SYMBOLS[suit] || '♠';
  const suitColor = isRed ? '#dc2626' : '#0f172a';

  const isKing = rank === 'K';
  const isQueen = rank === 'Q';
  const isJack = rank === 'J';
  const isAce = rank === 'A';

  // If card is FACE DOWN (Luxury Burgundy & Gold Casino Pattern)
  if (!isFaceUp) {
    return (
      <div
        style={style}
        className={`relative aspect-[5/7] w-full h-full select-none ${className}`}
      >
        <svg
          viewBox="0 0 100 140"
          className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="cardBackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7a1212" />
              <stop offset="50%" stopColor="#9e1c1c" />
              <stop offset="100%" stopColor="#4f0c0c" />
            </linearGradient>
            <pattern id="cardBackPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 0 5 L 5 0 L 10 5 L 5 10 Z"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="0.6"
                opacity="0.3"
              />
            </pattern>
          </defs>

          {/* Card Outer Border & Shadow */}
          <rect
            x="1.5"
            y="1.5"
            width="97"
            height="137"
            rx="7"
            ry="7"
            fill="url(#cardBackGrad)"
            stroke="#f59e0b"
            strokeWidth="2"
          />

          {/* Intricate Inner Guilloche Pattern */}
          <rect
            x="5.5"
            y="5.5"
            width="89"
            height="129"
            rx="5"
            ry="5"
            fill="url(#cardBackPattern)"
          />
          <rect
            x="5.5"
            y="5.5"
            width="89"
            height="129"
            rx="5"
            ry="5"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="0.8"
            opacity="0.8"
          />

          {/* Center Luxury Medallion */}
          <circle cx="50" cy="70" r="19" fill="#3b0707" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="50" cy="70" r="16" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2,2" />

          {/* Crown Emoji / Symbol */}
          <text
            x="50"
            y="70"
            fontSize="14"
            textAnchor="middle"
            dominantBaseline="central"
          >
            👑
          </text>
          <text
            x="50"
            y="82"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="900"
            fontSize="5.5"
            fill="#fef08a"
            textAnchor="middle"
            letterSpacing="1"
          >
            CASINO
          </text>
        </svg>
      </div>
    );
  }

  // If card is FACE UP (100% Crisp Visible Playing Card)
  return (
    <div
      style={style}
      className={`relative aspect-[5/7] w-full h-full select-none ${
        isWinner
          ? 'scale-105 z-30 transition-transform duration-300'
          : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 100 140"
        className={`w-full h-full ${
          isWinner
            ? 'drop-shadow-[0_0_15px_rgba(250,204,21,0.9)]'
            : isHighlighted
            ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]'
            : 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)]'
        }`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Crisp Linen Finish Card Gradient */}
          <linearGradient id="cardFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="85%" stopColor="#fafafc" />
            <stop offset="100%" stopColor="#f1f2f6" />
          </linearGradient>

          {/* Glossy Sheen Overlay */}
          <linearGradient id="cardSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Card Body Rect */}
        <rect
          x="1.5"
          y="1.5"
          width="97"
          height="137"
          rx="7"
          ry="7"
          fill="url(#cardFrontGrad)"
          stroke={isWinner ? '#eab308' : isHighlighted ? '#f59e0b' : '#cbd5e1'}
          strokeWidth={isWinner ? '3' : isHighlighted ? '2.5' : '1.5'}
        />

        {/* Glossy Highlight */}
        <rect
          x="2"
          y="2"
          width="96"
          height="68"
          rx="6"
          ry="6"
          fill="url(#cardSheen)"
          pointerEvents="none"
        />

        {/* Winning Gold Inner Border */}
        {isWinner && (
          <rect
            x="4"
            y="4"
            width="92"
            height="132"
            rx="5"
            ry="5"
            fill="none"
            stroke="#fde047"
            strokeWidth="1.2"
            strokeDasharray="4,2"
          />
        )}

        {/* ========================================================= */}
        {/* TOP-LEFT: Rank & Suit                                     */}
        {/* ========================================================= */}
        <g>
          <text
            x="9"
            y="23"
            fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="19"
            fill={suitColor}
            textAnchor="start"
            letterSpacing="-0.5"
          >
            {rank}
          </text>
          <text
            x="9"
            y="37"
            fontFamily="serif, ui-sans-serif, system-ui"
            fontWeight="900"
            fontSize="14"
            fill={suitColor}
            textAnchor="start"
          >
            {suitSymbol}
          </text>
        </g>

        {/* ========================================================= */}
        {/* CENTER EMBLEM / SUIT                                      */}
        {/* ========================================================= */}
        <g>
          {isKing ? (
            <g transform="translate(50, 70)">
              <rect x="-24" y="-28" width="48" height="56" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
              <text x="0" y="-10" fontSize="16" textAnchor="middle" dominantBaseline="central">👑</text>
              <text x="0" y="8" fontFamily="serif" fontWeight="900" fontSize="18" fill={suitColor} textAnchor="middle" dominantBaseline="central">
                {suitSymbol}
              </text>
              <text x="0" y="20" fontFamily="ui-sans-serif, system-ui" fontWeight="900" fontSize="7" fill={suitColor} textAnchor="middle">
                KING
              </text>
            </g>
          ) : isQueen ? (
            <g transform="translate(50, 70)">
              <rect x="-24" y="-28" width="48" height="56" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
              <text x="0" y="-10" fontSize="16" textAnchor="middle" dominantBaseline="central">👸</text>
              <text x="0" y="8" fontFamily="serif" fontWeight="900" fontSize="18" fill={suitColor} textAnchor="middle" dominantBaseline="central">
                {suitSymbol}
              </text>
              <text x="0" y="20" fontFamily="ui-sans-serif, system-ui" fontWeight="900" fontSize="7" fill={suitColor} textAnchor="middle">
                QUEEN
              </text>
            </g>
          ) : isJack ? (
            <g transform="translate(50, 70)">
              <rect x="-24" y="-28" width="48" height="56" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
              <text x="0" y="-10" fontSize="16" textAnchor="middle" dominantBaseline="central">⚔️</text>
              <text x="0" y="8" fontFamily="serif" fontWeight="900" fontSize="18" fill={suitColor} textAnchor="middle" dominantBaseline="central">
                {suitSymbol}
              </text>
              <text x="0" y="20" fontFamily="ui-sans-serif, system-ui" fontWeight="900" fontSize="7" fill={suitColor} textAnchor="middle">
                JACK
              </text>
            </g>
          ) : isAce ? (
            <g transform="translate(50, 70)">
              <circle cx="0" cy="0" r="22" fill="#f1f5f9" opacity="0.6" />
              <text
                x="0"
                y="3"
                fontFamily="serif, ui-sans-serif, system-ui"
                fontWeight="900"
                fontSize="42"
                fill={suitColor}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {suitSymbol}
              </text>
            </g>
          ) : (
            <g transform="translate(50, 70)">
              {/* Main Center Suit */}
              <text
                x="0"
                y="2"
                fontFamily="serif, ui-sans-serif, system-ui"
                fontWeight="900"
                fontSize="38"
                fill={suitColor}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {suitSymbol}
              </text>
            </g>
          )}
        </g>

        {/* ========================================================= */}
        {/* BOTTOM-RIGHT: Inverted Rank & Suit (180 deg Rotated)      */}
        {/* ========================================================= */}
        <g transform="rotate(180 50 70)">
          <text
            x="9"
            y="23"
            fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="19"
            fill={suitColor}
            textAnchor="start"
            letterSpacing="-0.5"
          >
            {rank}
          </text>
          <text
            x="9"
            y="37"
            fontFamily="serif, ui-sans-serif, system-ui"
            fontWeight="900"
            fontSize="14"
            fill={suitColor}
            textAnchor="start"
          >
            {suitSymbol}
          </text>
        </g>
      </svg>
    </div>
  );
};
