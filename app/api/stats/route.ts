import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function GET() {
  try {
    const db = adminDb();
    const { data, error } = await db.from("career_stats").select("*");
    if (error) throw error;
    const { data: abandoned, error: abandonedError } = await db.from("games").select("ended_by_participant_id").eq("status", "abandoned").not("ended_by_participant_id", "is", null);
    if (abandonedError) throw abandonedError;
    const participantIds = (abandoned ?? []).map((game) => game.ended_by_participant_id).filter(Boolean) as string[];
    const { data: abandoners, error: abandonerError } = participantIds.length
      ? await db.from("game_participants").select("id,player_id,players(name)").in("id", participantIds).not("player_id", "is", null)
      : { data: [], error: null };
    if (abandonerError) throw abandonerError;
    const counts = new Map<string, { name: string; count: number }>();
    for (const row of abandoners ?? []) {
      const profileId = row.player_id as string;
      const name = (row.players as unknown as { name: string } | null)?.name ?? "Player";
      counts.set(profileId, { name, count: (counts.get(profileId)?.count ?? 0) + 1 });
    }
    const stats = (data ?? []).map((stat) => ({ ...stat, abandoned_games: counts.get(stat.player_id)?.count ?? 0 }));
    for (const [player_id, value] of counts) if (!stats.some((stat) => stat.player_id === player_id)) stats.push({ player_id, name: value.name, games_played: 0, average_position: 0, wins: 0, podiums: 0, last_place_finishes: 0, high_score: 0, abandoned_games: value.count });
    return NextResponse.json({ stats });
  } catch (error) { return apiError(error); }
}
