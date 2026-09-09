import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { ACTIVE_GAME_STATUSES } from "@/lib/game/lifecycle";
export async function POST() { try { await requireAdmin(); const db=adminDb(); const { data: games }=await db.from("games").select("id").in("status", [...ACTIVE_GAME_STATUSES]); const ids=(games??[]).map(game=>game.id); if(ids.length){const { error } = await db.from("games").update({ status: "abandoned" }).in("id", ids); if (error) throw error; await db.from("game_updates").insert(ids.map(game_id=>({game_id,version:Date.now()})));} return NextResponse.json({ ok: true }); } catch (error) { return apiError(error); } }
