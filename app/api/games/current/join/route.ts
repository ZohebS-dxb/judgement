import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGuestSession, currentGuest, currentPlayer } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function POST(request: NextRequest) {
  try {
    const body = z.object({ guestName: z.string().trim().min(1).max(30).optional() }).parse(await request.json().catch(() => ({}))); const db = adminDb();
    const { data: game } = await db.from("games").select("id,status").in("status", ["lobby","in_progress"]).maybeSingle();
    if (!game) return NextResponse.json({ error: "No game is currently running." }, { status: 404 });
    const player = await currentPlayer(); const guest = await currentGuest();
    if (player) {
      const { data: existing } = await db.from("game_participants").select("id").eq("game_id", game.id).eq("player_id", player.id).maybeSingle();
      if (existing) return NextResponse.json({ gameId: game.id, participantId: existing.id });
      if (game.status !== "lobby") throw new Error("This game has started; only its original players can reconnect");
      const { data: seats } = await db.from("game_participants").select("seat_position").eq("game_id", game.id); if ((seats?.length ?? 0) >= 4) throw new Error("This game is full");
      const used = new Set(seats?.map((seat) => seat.seat_position)); const seat = [0,1,2,3].find((value) => !used.has(value));
      const { data, error } = await db.from("game_participants").insert({ game_id: game.id, player_id: player.id, seat_position: seat }).select("id").single(); if (error) throw error;
      await db.from("game_updates").insert({ game_id: game.id, version: 0 }); return NextResponse.json({ gameId: game.id, participantId: data.id });
    }
    if (guest) {
      const { data } = await db.from("game_participants").select("id").eq("game_id", game.id).eq("id", guest.participantId).eq("guest_token_hash", guest.tokenHash).maybeSingle();
      if (data) return NextResponse.json({ gameId: game.id, participantId: data.id });
    }
    if (!body.guestName) return NextResponse.json({ error: "Choose a player and enter a PIN, or continue as a guest." }, { status: 401 });
    if (game.status !== "lobby") throw new Error("This game has started; only its original players can reconnect");
    const { count } = await db.from("game_participants").select("id", { count: "exact", head: true }).eq("game_id", game.id); if ((count ?? 0) >= 4) throw new Error("This game is full");
    const participantId = randomUUID(); const tokenHash = await createGuestSession(participantId);
    const { data: seats } = await db.from("game_participants").select("seat_position").eq("game_id", game.id);
    const used = new Set(seats?.map((seat) => seat.seat_position)); const seat = [0,1,2,3].find((value) => !used.has(value));
    const { error } = await db.from("game_participants").insert({ id: participantId, game_id: game.id, guest_name: body.guestName, guest_token_hash: tokenHash, seat_position: seat }); if (error) throw error;
    await db.from("game_updates").insert({ game_id: game.id, version: 0 }); return NextResponse.json({ gameId: game.id, participantId });
  } catch (error) { return apiError(error); }
}
