import { RANKS, type PlayedCard, type RoundResult, type Suit } from "./types";

export function trickWinner(cards: PlayedCard[], trump: Suit): string {
  if (!cards.length) throw new Error("A trick must contain at least one card");
  return cards.reduce((best, play) => {
    const bestTrump = best.card.suit === trump;
    const playTrump = play.card.suit === trump;
    if (playTrump !== bestTrump) return playTrump ? play : best;
    if (play.card.suit !== best.card.suit) return best;
    return RANKS.indexOf(play.card.rank) > RANKS.indexOf(best.card.rank) ? play : best;
  }).playerId;
}

export function scoreRound(bid: number, tricks: number): number {
  if (bid === 0) return tricks === 0 ? 10 : -10;
  return bid === tricks ? 10 * bid : -10 * bid;
}

export function roundResults(players: Array<{ id: string; bid: number | null; tricksWon: number; totalScore: number }>): RoundResult[] {
  return players.map((player) => {
    if (player.bid === null) throw new Error("Cannot score before every bid is submitted");
    const roundScore = scoreRound(player.bid, player.tricksWon);
    return { playerId: player.id, bid: player.bid, tricksWon: player.tricksWon, roundScore, totalScore: player.totalScore + roundScore };
  });
}

export function competitionPositions(scores: Array<{ id: string; score: number }>): Record<string, number> {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const positions: Record<string, number> = {};
  sorted.forEach((entry, index) => {
    positions[entry.id] = index > 0 && entry.score === sorted[index - 1].score ? positions[sorted[index - 1].id] : index + 1;
  });
  return positions;
}
