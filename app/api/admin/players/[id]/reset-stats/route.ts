import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const { data, error } = await adminDb().from("players").update({ stats_reset_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Player not found");
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
