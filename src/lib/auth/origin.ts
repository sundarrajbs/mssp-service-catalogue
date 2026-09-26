import "server-only";

import { headers } from "next/headers";

/**
 * The site's own origin, for links in emails. Prefers NEXT_PUBLIC_SITE_URL;
 * otherwise uses the request's host. Supabase only sends links to URLs on its
 * allow-list (see README), so a spoofed Host header can't redirect elsewhere.
 */
export async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
