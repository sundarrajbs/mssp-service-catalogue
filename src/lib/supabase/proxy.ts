import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import { secureCookieOptions } from "./cookies";
import type { SupabaseEnv } from "./env";

/**
 * Refreshes the Supabase session cookie if needed (the documented getAll/setAll
 * pattern for middleware/proxy) and returns the verified user.
 */
export async function refreshSession(
  request: NextRequest,
  requestHeaders: Headers,
  env: SupabaseEnv,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        // Pass refreshed cookies on to the page being rendered…
        requestHeaders.set("cookie", request.cookies.toString());
        response = NextResponse.next({ request: { headers: requestHeaders } });
        // …and back to the browser.
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, secureCookieOptions(options));
        }
      },
    },
  });

  // getUser() validates the session with Supabase Auth rather than trusting the cookie.
  const { data } = await supabase.auth.getUser();
  return { response, user: data.user ?? null };
}
