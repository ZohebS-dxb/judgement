import type { Card } from "@/lib/game/types";

const symbols = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" } as const;

const pipLayouts: Partial<Record<Card["rank"], Array<[number, number]>>> = {
  "2": [[70, 82], [70, 124]],
  "3": [[70, 76], [70, 103], [70, 130]],
  "4": [[48, 82], [92, 82], [48, 124], [92, 124]],
  "5": [[48, 78], [92, 78], [70, 103], [48, 128], [92, 128]],
  "6": [[48, 76], [92, 76], [48, 103], [92, 103], [48, 130], [92, 130]],
  "7": [[48, 74], [92, 74], [70, 91], [48, 106], [92, 106], [48, 132], [92, 132]],
  "8": [[48, 72], [92, 72], [70, 88], [48, 103], [92, 103], [70, 118], [48, 134], [92, 134]],
  "9": [[48, 70], [92, 70], [48, 92], [92, 92], [70, 103], [48, 114], [92, 114], [48, 136], [92, 136]],
  "10": [[48, 68], [92, 68], [70, 82], [48, 96], [92, 96], [48, 112], [92, 112], [70, 126], [48, 140], [92, 140]],
};

export function PlayingCard({ card, title }: { card: Card; title?: string }) {
  const red = card.suit === "hearts" || card.suit === "diamonds";
  const symbol = symbols[card.suit];
  const pips = pipLayouts[card.rank];
  const isFace = card.rank === "J" || card.rank === "Q" || card.rank === "K";
  return <svg className="playing-card-svg" viewBox="0 0 140 196" role="img" aria-label={title ?? `${card.rank} of ${card.suit}`}>
    <rect x="2" y="2" width="136" height="192" rx="12" fill="#ffffff" stroke="#c8c8c8" strokeWidth="2"/>
    <g fill={red ? "#c82932" : "#101716"} fontFamily="Arial Black,Arial,sans-serif" fontWeight="900">
      <text x="8" y="36" fontSize={card.rank === "10" ? "30" : "35"} letterSpacing="-2">{card.rank}</text>
      <text x="10" y="67" fontSize="29">{symbol}</text>
      {pips?.map(([x, y], index) => <text x={x} y={y} fontSize="22" textAnchor="middle" dominantBaseline="middle" opacity=".82" key={`${x}-${y}-${index}`}>{symbol}</text>)}
      {card.rank === "A" && <text x="76" y="119" fontSize="62" textAnchor="middle">{symbol}</text>}
      {isFace && <g opacity=".88"><rect x="48" y="72" width="56" height="62" rx="8" fill={red ? "#fff0f0" : "#eef2f1"} stroke="currentColor" strokeWidth="2"/><text x="76" y="113" fontSize="39" textAnchor="middle">{card.rank}</text><text x="76" y="132" fontSize="18" textAnchor="middle">{symbol}</text></g>}
      <g transform="rotate(180 70 98)"><text x="8" y="36" fontSize={card.rank === "10" ? "30" : "35"} letterSpacing="-2">{card.rank}</text><text x="10" y="67" fontSize="29">{symbol}</text></g>
    </g>
  </svg>;
}
