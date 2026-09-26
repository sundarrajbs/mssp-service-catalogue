import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitedAction = "sign-in" | "magic-link" | "sign-up" | "reset";

/** Per visitor (IP) and email, and per visitor overall, within a 15-minute window. */
export const RATE_LIMITS = {
  perEmail: { limit: 5, windowSeconds: 15 * 60 },
  perIp: { limit: 30, windowSeconds: 15 * 60 },
} as const;

/**
 * An opaque key: the database only ever sees a hash, never the IP or email.
 * The optional pepper (a server-only secret) stops anyone who can call the
 * database function from guessing keys for other visitors.
 */
export function rateLimitKey(parts: string[], pepper = ""): string {
  return createHash("sha256").update([pepper, ...parts].join("|")).digest("hex");
}

/** The visitor's IP as seen by the hosting platform. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Records an attempt and returns false when the visitor is over a limit.
 * Supabase's own auth limits apply as well; this adds per-visitor limits,
 * because Supabase sees every request as coming from our server.
 */
export async function allowAuthAttempt(
  supabase: SupabaseClient,
  { action, email, ip }: { action: RateLimitedAction; email: string; ip: string },
): Promise<boolean> {
  const pepper = process.env.AUTH_RATE_LIMIT_PEPPER ?? "";
  const checks = [
    { key: rateLimitKey([action, ip, email.toLowerCase()], pepper), ...RATE_LIMITS.perEmail },
    { key: rateLimitKey([action, ip], pepper), ...RATE_LIMITS.perIp },
  ];
  for (const { key, limit, windowSeconds } of checks) {
    const { data, error } = await supabase.rpc("auth_rate_limit_hit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      // Fail open so a missing migration can't lock everyone out; Supabase's limits still apply.
      console.error("Rate limit check failed; is the database migration applied?", error.message);
      return true;
    }
    if (data === false) return false;
  }
  return true;
}
