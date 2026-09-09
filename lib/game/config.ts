import type { RoundMode, Suit } from "./types";

export const TRUMP_ROTATION: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
export const DEFAULT_BIDDING_SECONDS = 20;
export const DEFAULT_SCORECARD_SECONDS = 30;
export const TRICK_REVIEW_SECONDS = 1;
export const PRESENCE_WINDOW_SECONDS = 20;

export function maximumCards(playerCount: number) {
  if (playerCount === 3) return 17;
  if (playerCount === 4) return 12;
  throw new Error("Judgement requires three or four players");
}

export function roundSizes(mode: RoundMode, playerCount: number, customRounds = 10): number[] {
  const maximum = maximumCards(playerCount);
  if (mode === "custom") {
    if (!Number.isInteger(customRounds) || customRounds < 1 || customRounds > maximum) throw new Error(`Custom rounds must be between 1 and ${maximum}`);
    return Array.from({ length: customRounds }, (_, index) => index + 1);
  }
  if (mode === "half") return Array.from({ length: maximum }, (_, index) => index + 1);
  return [
    ...Array.from({ length: maximum }, (_, index) => maximum - index),
    ...Array.from({ length: maximum - 1 }, (_, index) => index + 2),
  ];
}

export function trumpForRound(roundNumber: number): Suit {
  return TRUMP_ROTATION[(roundNumber - 1) % TRUMP_ROTATION.length];
}
