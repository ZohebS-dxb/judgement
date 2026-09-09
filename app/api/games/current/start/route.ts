import { NextResponse } from "next/server";
import { createGameState } from "@/lib/game/engine";
import { requirePlayer } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function POST() {
  try {
    const player = await requirePlayer(); const db = adminDb();
    const { data: game } = await db.from("games").select("id,status,mode,custom_rounds,created_by_player_id").eq("status", "lobby").maybeSingle();
    if (!game) throw new Error("No lobby was found"); if (game.created_by_player_id !== player.id) throw new Error("Only the creator can start this game");
    const { data: rows } = await db.from("game_participants").select("id,player_id,guest_name,seat_position,players(name)").eq("game_id", game.id).order("seat_position");
    if (!rows || rows.length < 3 || rows.length > 4) throw new Error("Three or four players are required");
    if (game.mode === "custom" && rows.length === 4 && (game.custom_rounds ?? 10) > 12) throw new Error("Reduce custom rounds to 12 or fewer before starting with four players");
    const { data: config } = await db.from("admin_config").select("bidding_timer_seconds").eq("singleton", true).single();
    const state = createGameState(game.id, rows.map((row) => ({ id: row.id, profileId: row.player_id, name: row.guest_name ?? (row.players as unknown as { name: string } | null)?.name ?? "Guest", seat: row.seat_position })), game.mode, game.custom_rounds ?? 10, config?.bidding_timer_seconds ?? 15);
    const { error: stateError } = await db.from("game_states").insert({ game_id: game.id, version: state.version, state }); if (stateError) throw stateError;
    const { error } = await db.from("games").update({ status: "in_progress", player_count: rows.length, started_at: new Date().toISOString() }).eq("id", game.id).eq("status", "lobby"); if (error) throw error;
    await db.from("game_updates").insert({ game_id: game.id, version: state.version }); return NextResponse.json({ gameId: game.id });
  } catch (error) { return apiError(error); }
}
