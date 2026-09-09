import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const { data, error } = await adminDb().rpc("finalize_game", { p_game_id: id });
    if (error) throw error;
    return NextResponse.json({ ok: true, finalizedNow: Boolean(data) });
  } catch (error) { return apiError(error); }
}
