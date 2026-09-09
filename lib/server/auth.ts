import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { adminDb } from "./db";

const COOKIE = "judgement_session";
const ADMIN_COOKIE = "judgement_admin";
const GUEST_COOKIE = "judgement_guest";
const SESSION_DAYS = 30;
export type SessionPlayer = { id: string; name: string };

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(playerId: string, userAgent?: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const { error } = await adminDb().from("login_sessions").insert({
    player_id: playerId,
    token_hash: hashToken(token),
    expires_at: expires.toISOString(),
    user_agent: userAgent?.slice(0, 300),
  });
  if (error) throw error;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
}

export async function currentPlayer(): Promise<SessionPlayer | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const { data } = await adminDb()
    .from("login_sessions")
    .select("id, player_id, expires_at, players!inner(id, name, active)")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  const profile = data?.players as unknown as { id: string; name: string; active: boolean } | undefined;
  if (!data || !profile?.active) return null;
  void adminDb().from("login_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
  return { id: profile.id, name: profile.name };
}

export async function requirePlayer(): Promise<SessionPlayer> {
  const player = await currentPlayer();
  if (!player) throw new Error("UNAUTHENTICATED");
  return player;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await adminDb().from("login_sessions").delete().eq("token_hash", hashToken(token));
  jar.delete(COOKIE);
}

export async function createAdminSession() {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 12 * 60 * 60_000);
  const { error } = await adminDb().from("admin_sessions").insert({ token_hash: hashToken(token), expires_at: expires.toISOString() });
  if (error) throw error;
  (await cookies()).set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.SESSION_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production", expires, path: "/" });
}

export async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) throw new Error("ADMIN_UNAUTHENTICATED");
  const { data } = await adminDb().from("admin_sessions").select("id").eq("token_hash", hashToken(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!data) throw new Error("ADMIN_UNAUTHENTICATED");
}

export async function createGuestSession(participantId: string) {
  const token = randomBytes(32).toString("base64url");
  (await cookies()).set(GUEST_COOKIE, `${participantId}.${token}`, { httpOnly: true, sameSite: "lax", secure: process.env.SESSION_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production", maxAge: 7 * 86400, path: "/" });
  return hashToken(token);
}

export async function currentGuest() {
  const value = (await cookies()).get(GUEST_COOKIE)?.value;
  const [participantId, token] = value?.split(".") ?? [];
  return participantId && token ? { participantId, tokenHash: hashToken(token) } : null;
}

export async function participantForGame(gameId: string) {
  const db = adminDb();
  const player = await currentPlayer();
  if (player) {
    const { data } = await db.from("game_participants").select("id,player_id,guest_name").eq("game_id", gameId).eq("player_id", player.id).maybeSingle();
    if (data) return { id: data.id as string, name: player.name, profileId: player.id };
  }
  const guest = await currentGuest();
  if (guest) {
    const { data } = await db.from("game_participants").select("id,guest_name").eq("game_id", gameId).eq("id", guest.participantId).eq("guest_token_hash", guest.tokenHash).maybeSingle();
    if (data) return { id: data.id as string, name: data.guest_name as string, profileId: null };
  }
  throw new Error("UNAUTHENTICATED");
}
