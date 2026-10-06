import { NextResponse } from "next/server";

export function apiError(message: string, status = 400, code = "INVALID_REQUEST", details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function validSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{12,80}$/.test(value);
}
