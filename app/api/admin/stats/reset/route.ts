import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function POST() {
  try {
    await requireAdmin();
    const { error } = await adminDb().from("games").delete().in("status", ["completed", "abandoned"]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
