import type { BidCallStatus, PlayerState } from "./types";

export function bidCallStatus(players: Pick<PlayerState, "bid">[], cardsDealt: number): BidCallStatus | null {
  if (players.some((player) => player.bid === null)) return null;
  const total = players.reduce((sum, player) => sum + (player.bid ?? 0), 0);
  return total < cardsDealt ? "UNDER CALL" : total > cardsDealt ? "OVER CALL" : "EXACT";
}
