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
