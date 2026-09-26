import { NextResponse, type NextRequest } from "next/server";

import { buildCsp, createNonce } from "@/lib/security/csp";

/**
 * Adds a per-request nonce-based Content-Security-Policy. Next.js reads the
 * nonce from the request header and applies it to its own scripts. The other
 * security headers are static and set in next.config.ts.
 */
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: skip static files, which don't need a nonce.
      source: "/((?!api|_next/static|_next/image|fonts/|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
