import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = z.object({ id: z.string().uuid() }).parse(await context.params);
    const { data, error } = await adminDb().from("games").delete().eq("id", id).in("status", ["completed", "abandoned"]).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Game not found");
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
