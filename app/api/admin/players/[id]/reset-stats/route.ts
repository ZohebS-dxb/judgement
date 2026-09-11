import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const db = adminDb();
    const { data: player, error: playerError } = await db.from("players").select("id").eq("id", id).maybeSingle();
    if (playerError) throw playerError;
    if (!player) throw new Error("Player not found");

    const { data: completedGames, error: gamesError } = await db.from("games").select("id").eq("status", "completed");
    if (gamesError) throw gamesError;
    const gameIds = completedGames?.map((game) => game.id) ?? [];
    if (gameIds.length > 0) {
      const { error: resetError } = await db.from("game_participants").delete().eq("player_id", id).in("game_id", gameIds);
      if (resetError) throw resetError;
    }
    const { data: participantRows, error: participantsError } = await db.from("game_participants").select("id").eq("player_id", id);
    if (participantsError) throw participantsError;
    const participantIds = (participantRows ?? []).map((participant) => participant.id);
    if (participantIds.length > 0) {
      const { data: abandonedGames, error: abandonedError } = await db.from("games").select("ended_by_participant_id").eq("status", "abandoned").in("ended_by_participant_id", participantIds);
      if (abandonedError) throw abandonedError;
      const abandonedParticipantIds = (abandonedGames ?? []).map((game) => game.ended_by_participant_id).filter(Boolean) as string[];
      if (abandonedParticipantIds.length > 0) {
        const { error: resetAbandonedError } = await db.from("game_participants").delete().in("id", abandonedParticipantIds);
        if (resetAbandonedError) throw resetAbandonedError;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
