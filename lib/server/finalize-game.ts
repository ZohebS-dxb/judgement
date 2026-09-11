import type { GameState } from "@/lib/game/types";
import { adminDb } from "./db";

function positions(players: GameState["players"]) {
  return Object.fromEntries(players.map((player) => [player.id, 1 + players.filter((other) => other.totalScore > player.totalScore).length]));
}

export async function finalizeCompletedGame(gameId: string) {
  const db = adminDb();
  const [{ data: game, error: gameError }, { data: stored, error: stateError }] = await Promise.all([
    db.from("games").select("id,status").eq("id", gameId).maybeSingle(),
    db.from("game_states").select("state").eq("game_id", gameId).maybeSingle(),
  ]);
  if (gameError) throw gameError;
  if (!game) throw new Error("Game not found");
  if (game.status === "abandoned") throw new Error("Abandoned games cannot be finalized");
  if (stateError) throw stateError;
  const state = stored?.state as GameState | undefined;
  if (!state || state.phase !== "game_complete") throw new Error("The final Scoreboard is not ready");

  const ranking = positions(state.players);
  const high = Math.max(...state.players.map((player) => player.totalScore));
  const low = Math.min(...state.players.map((player) => player.totalScore));
  const { data: claimed, error: claimError } = await db.from("games").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    ended_by_participant_id: state.endedByPlayerId ?? null,
  }).eq("id", gameId).eq("status", "in_progress").select("id").maybeSingle();
  if (claimError) throw claimError;

  const { data: participants, error: participantError } = await db.from("game_participants").select("id,final_score").eq("game_id", gameId);
  if (participantError) throw participantError;
  const needsRepair = (participants ?? []).some((participant) => participant.final_score === null);
  if (claimed || needsRepair) {
    const updates = state.players.map((player) => db.from("game_participants").update({
      final_score: player.totalScore,
      finishing_position: ranking[player.id],
      is_winner: player.totalScore === high,
      is_last: player.totalScore === low,
    }).eq("id", player.id).eq("game_id", gameId));
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error)?.error;
    if (failed) throw failed;
  }

  return { finalizedNow: Boolean(claimed), state, lowScore: low };
}
