import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyAction, toClientState } from "@/lib/game/engine";
import { RANKS, SUITS, type GameAction, type GameState } from "@/lib/game/types";
import { participantForGame } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { persistCompletedGame } from "@/lib/server/persist";

const actionId = z.string().min(8).max(100);
const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("place_bid"), bid: z.number().int().min(0).max(17), actionId }),
  z.object({ type: z.literal("play_card"), card: z.object({ suit: z.enum(SUITS), rank: z.enum(RANKS) }), actionId }),
  z.object({ type: z.literal("scorecard_ready"), actionId }), z.object({ type: z.literal("heartbeat"), actionId }),
]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const participant = await participantForGame(id); const action = schema.parse(await request.json()) as GameAction; const db = adminDb();
    const { data: config } = await db.from("admin_config").select("bidding_timer_seconds").eq("singleton", true).single();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: row, error: readError } = await db.from("game_states").select("state,version").eq("game_id", id).single(); if (readError || !row) throw readError ?? new Error("Game state not found");
      const previous = row.state as GameState; const next = applyAction(previous, participant.id, action, config?.bidding_timer_seconds ?? 15);
      if (next === previous) return NextResponse.json({ state: toClientState(previous, participant.id) });
      const { data: changed, error } = await db.from("game_states").update({ state: next, version: next.version, updated_at: new Date().toISOString() }).eq("game_id", id).eq("version", row.version).select("version").maybeSingle();
      if (error) throw error; if (!changed) continue; await persistCompletedGame(previous, next); await db.from("game_updates").insert({ game_id: id, version: next.version });
      return NextResponse.json({ state: toClientState(next, participant.id) });
    }
    throw new Error("The table changed; please try again");
  } catch (error) { return apiError(error); }
}
