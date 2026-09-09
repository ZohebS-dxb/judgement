import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function POST(request: NextRequest) {
  try {
    const { pin } = z.object({ pin: z.string().regex(/^\d{4}$/) }).parse(await request.json());
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const db = adminDb();
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { count } = await db.from("pin_login_attempts").select("id", { count: "exact", head: true }).eq("login_kind", "admin").eq("ip_hash", ipHash).eq("succeeded", false).gte("attempted_at", since);
    const { data: config } = await db.from("admin_config").select("admin_pin_hash").eq("singleton", true).single();
    const valid = Boolean(config?.admin_pin_hash && await bcrypt.compare(pin, config.admin_pin_hash));
    await db.from("pin_login_attempts").insert({ login_kind: "admin", subject: "admin", ip_hash: ipHash, succeeded: valid });
    if ((count ?? 0) >= 5) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    if (!valid) return NextResponse.json({ error: "Administrator PIN is incorrect" }, { status: 401 });
    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
