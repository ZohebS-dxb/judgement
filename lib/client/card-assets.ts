import { RANKS, SUITS, type Card, type Suit } from "@/lib/game/types";

export const cardAsset = (card: Card) => `/cards-minimal/${card.rank}-${card.suit}.svg`;
export const suitAsset = (suit: Suit) => `/suit-icons/${suit}.svg`;

export function preloadCardAssets() {
  if (typeof window === "undefined") return;
  for (const suit of SUITS) {
    const icon = new window.Image(); icon.src = suitAsset(suit);
    for (const rank of RANKS) { const card = new window.Image(); card.src = cardAsset({ rank, suit }); }
  }
}
