import { NextResponse } from "next/server";
import { currentGuest, currentPlayer } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { ACTIVE_GAME_STATUSES } from "@/lib/game/lifecycle";

export async function GET() {
  try {
    const db = adminDb();
    const { data: game } = await db.from("games").select("id,status,mode,custom_rounds,created_by_player_id,created_at,player_count").in("status", [...ACTIVE_GAME_STATUSES]).maybeSingle();
    if (!game) return NextResponse.json({ game: null });
    const { data: rows } = await db.from("game_participants").select("id,player_id,guest_name,seat_position,players(name)").eq("game_id", game.id).order("seat_position");
    const player = await currentPlayer(); const guest = await currentGuest();
    const participants = (rows ?? []).map((row) => ({ id: row.id, profileId: row.player_id, name: row.guest_name ?? (row.players as unknown as { name: string } | null)?.name, seat: row.seat_position }));
    const mine = participants.find((participant) => participant.profileId === player?.id || participant.id === guest?.participantId);
    return NextResponse.json({ game: { ...game, participants }, participantId: mine?.id ?? null, rememberedPlayer: player });
  } catch (error) { return apiError(error); }
}
