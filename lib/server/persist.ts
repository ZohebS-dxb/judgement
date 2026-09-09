import type { GameState } from "@/lib/game/types";
import { adminDb } from "./db";

export async function persistCompletedGame(previous: GameState, next: GameState) {
  if (next.phase !== "game_complete" || previous.phase === "game_complete") return;
  const { error } = await adminDb().from("games").update({ ended_by_participant_id: next.endedByPlayerId ?? null }).eq("id", next.gameId).eq("status", "in_progress");
  if (error) throw error;
}
