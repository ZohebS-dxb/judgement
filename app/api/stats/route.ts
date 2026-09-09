import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function GET() {
  try {
    const { data, error } = await adminDb().from("career_stats").select("*").order("wins", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ stats: data });
  } catch (error) { return apiError(error); }
}
