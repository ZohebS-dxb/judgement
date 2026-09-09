import { competitionPositions } from "@/lib/game/rules";
import type { GameState } from "@/lib/game/types";
import { adminDb } from "./db";

export async function persistCompletedGame(previous: GameState, next: GameState) {
  if (next.phase !== "game_complete" || previous.phase === "game_complete") return;
  const db = adminDb();
  const positions = competitionPositions(next.players.map((player) => ({ id: player.id, score: player.totalScore })));
  const highest = Math.max(...next.players.map((player) => player.totalScore));
  const lowest = Math.min(...next.players.map((player) => player.totalScore));
  await Promise.all(next.players.map((player) => db.from("game_participants").update({
    final_score: player.totalScore, finishing_position: positions[player.id],
    is_winner: player.totalScore === highest, is_last: player.totalScore === lowest,
  }).eq("id", player.id).eq("game_id", next.gameId)));
  await db.from("games").update({ status: "completed", completed_at: new Date().toISOString(), ended_by_participant_id: next.endedByPlayerId ?? null }).eq("id", next.gameId);
}
