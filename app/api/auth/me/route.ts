import { NextResponse } from "next/server";
import { currentPlayer } from "@/lib/server/auth";

export async function GET() {
  const player = await currentPlayer();
  return NextResponse.json({ player }, { status: player ? 200 : 401 });
}
