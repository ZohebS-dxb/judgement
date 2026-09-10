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
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
