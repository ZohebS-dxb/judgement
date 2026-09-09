export const ACTIVE_GAME_STATUSES = ["lobby", "in_progress"] as const;

export function activeParticipantIds(
  games: Array<{ id: string; status: string }>,
  participants: Array<{ id: string; gameId: string }>,
) {
  const activeIds = new Set(games.filter((game) => ACTIVE_GAME_STATUSES.includes(game.status as (typeof ACTIVE_GAME_STATUSES)[number])).map((game) => game.id));
  return participants.filter((participant) => activeIds.has(participant.gameId)).map((participant) => participant.id);
}
