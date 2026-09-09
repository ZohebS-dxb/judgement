import { randomInt } from "node:crypto";
import { RANKS, SUITS, type Card } from "./types";

export const cardId = (card: Card) => `${card.rank}-${card.suit}`;
export const createDeck = (): Card[] => SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));

export function shuffle(deck: Card[], rng: (max: number) => number = randomInt): Card[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function legalCards(hand: Card[], ledSuit: Card["suit"] | null): Card[] {
  if (!ledSuit) return hand;
  const following = hand.filter((card) => card.suit === ledSuit);
  return following.length ? following : hand;
}

export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Card["suit"], number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
  const rankOrder = Object.fromEntries(RANKS.map((rank, index) => [rank, index]));
  return [...hand].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || rankOrder[b.rank] - rankOrder[a.rank]);
}
