import { NextRequest, NextResponse } from "next/server";
import { applyAction, toClientState } from "@/lib/game/engine";
import type { GameState } from "@/lib/game/types";
import { participantForGame } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { persistCompletedGame } from "@/lib/server/persist";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const participant = await participantForGame(id); const db = adminDb();
    const { data: config } = await db.from("admin_config").select("bidding_timer_seconds,card_confirmation").eq("singleton", true).single();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: row, error } = await db.from("game_states").select("state,version").eq("game_id", id).single(); if (error || !row) throw error ?? new Error("Game state not found");
      const previous = row.state as GameState; const now = new Date();
      const next = applyAction(previous, participant.id, { type: "heartbeat", actionId: `presence-${participant.id}-${Math.floor(now.getTime() / 5000)}` }, config?.bidding_timer_seconds ?? 15, now);
      if (next === previous) return NextResponse.json({ state: toClientState(previous, participant.id), participantId: participant.id, cardConfirmation: config?.card_confirmation ?? true });
      const { data: changed } = await db.from("game_states").update({ state: next, version: next.version, updated_at: now.toISOString() }).eq("game_id", id).eq("version", row.version).select("version").maybeSingle();
      if (!changed) continue; await persistCompletedGame(previous, next); await db.from("game_updates").insert({ game_id: id, version: next.version });
      return NextResponse.json({ state: toClientState(next, participant.id), participantId: participant.id, cardConfirmation: config?.card_confirmation ?? true });
    }
    throw new Error("The table changed; please refresh");
  } catch (error) { return apiError(error); }
}
