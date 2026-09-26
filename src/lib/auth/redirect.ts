export const DEFAULT_SIGNED_IN_PATH = "/app/library";

/**
 * Only allows redirects to a path on this site, so a crafted
 * `?next=https://evil.example` or `?next=//evil.example` can't send people away.
 */
export function safeNextPath(next: string | null | undefined, fallback = DEFAULT_SIGNED_IN_PATH): string {
  if (!next || typeof next !== "string" || next.length > 2048) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // Control characters and backslashes can be normalised by browsers into other URLs.
  if (/[\u0000-\u001F\u007F\\]/.test(next)) return fallback;
  try {
    const url = new URL(next, "http://localhost");
    if (url.origin !== "http://localhost") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** "/sign-in?next=%2Fapp%2Ftiers" */
export function signInPathFor(next: string): string {
  return `/sign-in?next=${encodeURIComponent(safeNextPath(next))}`;
}
