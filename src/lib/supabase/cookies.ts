import type { CookieOptions } from "@supabase/ssr";

/**
 * Session cookies are HTTP-only (JavaScript can't read them), sent only over
 * HTTPS in production, and not sent on cross-site requests.
 */
export function secureCookieOptions(options: CookieOptions = {}): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}
