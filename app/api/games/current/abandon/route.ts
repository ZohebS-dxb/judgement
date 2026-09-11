import { NextResponse } from "next/server";
import { participantForGame } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { ACTIVE_GAME_STATUSES } from "@/lib/game/lifecycle";

export async function POST() {
  try {
    const db = adminDb();
    const { data: game, error: gameError } = await db.from("games").select("id,status").in("status", [...ACTIVE_GAME_STATUSES]).maybeSingle();
    if (gameError) throw gameError;
    if (!game) return NextResponse.json({ ok: true, abandonedNow: false });
    const participant = await participantForGame(game.id);
    const { data: changed, error } = await db.from("games").update({ status: "abandoned", ended_by_participant_id: participant.id })
      .eq("id", game.id).in("status", [...ACTIVE_GAME_STATUSES]).select("id").maybeSingle();
    if (error) throw error;
    if (changed) await db.from("game_updates").insert({ game_id: game.id, version: Date.now() });
    return NextResponse.json({ ok: true, abandonedNow: Boolean(changed) });
  } catch (error) {
    return apiError(error);
  }
}
