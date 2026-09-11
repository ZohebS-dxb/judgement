import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlayer } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { ACTIVE_GAME_STATUSES } from "@/lib/game/lifecycle";
import { finalizeCompletedGame } from "@/lib/server/finalize-game";

const schema = z.object({ mode: z.enum(["custom","half","full"]), customRounds: z.number().int().min(1).max(17).default(10) });
export async function POST(request: NextRequest) {
  try {
    const player = await requirePlayer(); const input = schema.parse(await request.json()); const db = adminDb();
    const { data: active } = await db.from("games").select("id,status").in("status", [...ACTIVE_GAME_STATUSES]).maybeSingle();
    if (active?.status === "in_progress") {
      const { data: stored } = await db.from("game_states").select("state").eq("game_id", active.id).maybeSingle();
      if ((stored?.state as { phase?: string } | null)?.phase === "game_complete") await finalizeCompletedGame(active.id);
      else return NextResponse.json({ error: "An unfinished game exists", existingGameId: active.id, status: active.status }, { status: 409 });
    } else if (active) return NextResponse.json({ error: "An unfinished game exists", existingGameId: active.id, status: active.status }, { status: 409 });
    const { data: game, error } = await db.from("games").insert({ created_by_player_id: player.id, mode: input.mode, custom_rounds: input.mode === "custom" ? input.customRounds : null }).select("id,status,mode,custom_rounds").single();
    if (error) throw error;
    const { error: seatError } = await db.from("game_participants").insert({ game_id: game.id, player_id: player.id, seat_position: 0 }); if (seatError) throw seatError;
    return NextResponse.json({ game });
  } catch (error) { return apiError(error); }
}
