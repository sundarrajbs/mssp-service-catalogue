import { NextResponse, type NextRequest } from "next/server";

import { signInPathFor } from "@/lib/auth/redirect";
import { buildCsp, createNonce } from "@/lib/security/csp";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { refreshSession } from "@/lib/supabase/proxy";

/** The builder: open to everyone, but a signed-in user's session is refreshed here. */
const isBuilder = (path: string) => path === "/app" || path.startsWith("/app/");
/** Sign-in pages that signed-in users skip. /reset-password is excluded: it needs the recovery session. */
const isAuthPage = (path: string) => ["/sign-in", "/sign-up", "/forgot-password"].includes(path);
const needsSession = (path: string) =>
  isBuilder(path) || isAuthPage(path) || path === "/reset-password" || path.startsWith("/auth/");

/**
 * Runs before every page request:
 * 1. Adds a per-request nonce-based Content-Security-Policy.
 * 2. Refreshes the Supabase session cookie. The builder (/app/**) needs no
 *    sign-in; signed-in users simply get their saved catalogues. Server
 *    actions that touch the database check the user themselves.
 */
export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();
  const nonce = createNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development", { supabaseUrl: env?.url });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const path = request.nextUrl.pathname;
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (needsSession(path)) {
    let user = null;
    if (env) ({ response, user } = await refreshSession(request, requestHeaders, env));

    if (path === "/app/account" && !user) {
      // The one builder page that needs an account.
      response = redirectKeepingCookies(request, signInPathFor(path), response);
    } else if (isAuthPage(path) && user) {
      response = redirectKeepingCookies(request, "/app/library", response);
    }
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/** A redirect that still carries any refreshed session cookies. */
function redirectKeepingCookies(request: NextRequest, to: string, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(new URL(to, request.url));
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: [
    {
      // Pages only: skip static files, which don't need a nonce or a session.
      source: "/((?!api|_next/static|_next/image|fonts/|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
