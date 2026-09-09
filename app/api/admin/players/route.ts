import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function GET() {
  try { await requireAdmin(); const { data, error } = await adminDb().from("players").select("id,name,active,archived_at,created_at").order("name"); if (error) throw error; return NextResponse.json({ players: data }); }
  catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { name, pin } = z.object({ name: z.string().trim().min(1).max(40), pin: z.string().regex(/^\d{4}$/) }).parse(await request.json());
    const pin_hash = await bcrypt.hash(pin, 12);
    const { data, error } = await adminDb().from("players").insert({ name, pin_hash }).select("id,name,active,archived_at").single();
    if (error) throw error; return NextResponse.json({ player: data });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(40).optional(), pin: z.string().regex(/^\d{4}$/).optional(), active: z.boolean().optional(), archived: z.boolean().optional() }).parse(await request.json());
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.pin !== undefined) update.pin_hash = await bcrypt.hash(body.pin, 12);
    if (body.active !== undefined) update.active = body.active;
    if (body.archived !== undefined) { update.archived_at = body.archived ? new Date().toISOString() : null; if (body.archived) update.active = false; }
    const { error } = await adminDb().from("players").update(update).eq("id", body.id); if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(); const { id } = z.object({ id: z.string().uuid() }).parse(await request.json()); const db = adminDb();
    const { count } = await db.from("game_participants").select("id", { count: "exact", head: true }).eq("player_id", id).not("final_score", "is", null);
    if ((count ?? 0) > 0) throw new Error("This player has results and must be archived instead");
    const { data: activeSeats } = await db.from("game_participants").select("id,games!inner(status)").eq("player_id", id).in("games.status", ["lobby","in_progress"]);
    if (activeSeats?.length) throw new Error("Abandon the active game before deleting this player");
    await db.from("game_participants").delete().eq("player_id", id).is("final_score", null);
    const { error } = await db.from("players").delete().eq("id", id); if (error) throw error; return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
