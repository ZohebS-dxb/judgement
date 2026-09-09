import { NextResponse } from "next/server";

export function apiError(error: unknown, fallback = "Something went wrong") {
  const message = error instanceof Error ? error.message : fallback;
  const unauthenticated = message === "UNAUTHENTICATED" || message === "ADMIN_UNAUTHENTICATED";
  const status = unauthenticated ? 401 : message.includes("not found") ? 404 : message.includes("not your") ? 409 : 400;
  return NextResponse.json({ error: unauthenticated ? "Please authenticate" : message }, { status });
}
