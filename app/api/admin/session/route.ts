import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";

export async function GET() {
  try { await requireAdmin(); return NextResponse.json({ authenticated: true }); }
  catch { return NextResponse.json({ authenticated: false }); }
}
