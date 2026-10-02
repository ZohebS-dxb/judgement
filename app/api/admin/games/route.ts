import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const page = z.coerce.number().int().min(1).catch(1).parse(request.nextUrl.searchParams.get("page"));
    const from = (page - 1) * PAGE_SIZE;
    const db = adminDb();
    const { data, count, error } = await db
      .from("games")
      .select("id,completed_at,started_at,created_at,mode", { count: "exact" })
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const gameIds = (data ?? []).map((game) => game.id);
    const { data: participantRows, error: participantError } = gameIds.length
      ? await db.from("game_participants").select("game_id,player_id,guest_name,seat_position,final_score,finishing_position,players(name)").in("game_id", gameIds).order("seat_position")
      : { data: [], error: null };
    if (participantError) throw participantError;
    const games = (data ?? []).map((game) => ({
      id: game.id,
      completedAt: game.completed_at ?? game.started_at ?? game.created_at,
      mode: game.mode,
      players: (participantRows ?? []).filter((participant) => participant.game_id === game.id).map((participant) => ({
        name: participant.guest_name ?? (participant.players as unknown as { name?: string } | null)?.name ?? "Unknown player",
        score: participant.final_score,
        position: participant.finishing_position,
        seat: participant.seat_position,
      })).sort((a, b) => a.seat - b.seat),
    }));
    return NextResponse.json({ games, page, pageSize: PAGE_SIZE, total: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)) });
  } catch (error) { return apiError(error); }
}
