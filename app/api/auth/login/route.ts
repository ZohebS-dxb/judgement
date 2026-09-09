import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

const input = z.object({ name: z.string().trim().min(1).max(40), pin: z.string().regex(/^\d{4}$/) });

export async function POST(request: NextRequest) {
  try {
    const { name, pin } = input.parse(await request.json());
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const windowStart = new Date(Date.now() - 15 * 60_000).toISOString();
    const db = adminDb();
    const { count } = await db.from("pin_login_attempts").select("id", { count: "exact", head: true })
      .eq("login_kind", "player").ilike("subject", name).eq("ip_hash", ipHash).eq("succeeded", false).gte("attempted_at", windowStart);
    if ((count ?? 0) >= 5) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });

    const { data: player } = await db.from("players").select("id, name, pin_hash, active").ilike("name", name).maybeSingle();
    const valid = Boolean(player?.active && player.pin_hash && await bcrypt.compare(pin, player.pin_hash));
    await db.from("pin_login_attempts").insert({ login_kind: "player", subject: name, ip_hash: ipHash, succeeded: valid });
    if (!player || !valid) return NextResponse.json({ error: "Name or PIN is incorrect" }, { status: 401 });
    await createSession(player.id, request.headers.get("user-agent") ?? undefined);
    return NextResponse.json({ player: { id: player.id, name: player.name } });
  } catch (error) {
    return apiError(error);
  }
}
