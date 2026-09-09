import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function GET() {
  try {
    const { data, error } = await adminDb().from("players").select("id,name").eq("active", true).is("archived_at", null).order("name");
    if (error) throw error;
    return NextResponse.json({ players: data });
  } catch (error) { return apiError(error); }
}
