import type { Card } from "@/lib/game/types";

const symbols = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" } as const;

export function PlayingCard({ card, title }: { card: Card; title?: string }) {
  const red = card.suit === "hearts" || card.suit === "diamonds";
  return <svg className="playing-card-svg" viewBox="0 0 140 196" role="img" aria-label={title ?? `${card.rank} of ${card.suit}`}>
    <rect x="2" y="2" width="136" height="192" rx="12" fill="#fffdf8" stroke="#c9c1b2" strokeWidth="2"/>
    <g fill={red ? "#b9333b" : "#172726"} fontFamily="Georgia,serif" fontWeight="700">
      <text x="13" y="28" fontSize="23">{card.rank}</text><text x="14" y="48" fontSize="21">{symbols[card.suit]}</text>
      <text x="70" y="116" fontSize="64" textAnchor="middle">{symbols[card.suit]}</text>
      <g transform="rotate(180 70 98)"><text x="13" y="28" fontSize="23">{card.rank}</text><text x="14" y="48" fontSize="21">{symbols[card.suit]}</text></g>
    </g>
  </svg>;
}
