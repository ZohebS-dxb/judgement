import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function GET() { try { await requireAdmin(); const { data, error } = await adminDb().from("admin_config").select("bidding_timer_seconds,card_confirmation").eq("singleton", true).single(); if (error) throw error; return NextResponse.json(data); } catch (error) { return apiError(error); } }
export async function PATCH(request: NextRequest) {
  try { await requireAdmin(); const body = z.object({ biddingTimerSeconds: z.number().int().min(5).max(60).multipleOf(5).optional(), cardConfirmation: z.boolean().optional() }).parse(await request.json());
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }; if (body.biddingTimerSeconds !== undefined) update.bidding_timer_seconds = body.biddingTimerSeconds; if (body.cardConfirmation !== undefined) update.card_confirmation = body.cardConfirmation;
    const { error } = await adminDb().from("admin_config").update(update).eq("singleton", true); if (error) throw error; return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
