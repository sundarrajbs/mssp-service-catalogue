export interface SupabaseEnv {
  /** The project URL's origin only, e.g. "https://abcd.supabase.co". */
  url: string;
  /** The public "anon" (or "publishable") key. Row Level Security decides what it can access. */
  anonKey: string;
}

let warnedAboutPath = false;

/**
 * Reads the public Supabase settings. Returns null when they aren't set, so the
 * landing page and preview still work before Supabase is configured.
 * The service-role key is deliberately never read anywhere in this app.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!raw || !anonKey) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) return null;

  // The Supabase client adds /rest/v1, /auth/v1 and so on itself. A common
  // mistake is pasting the REST endpoint (…/rest/v1), which would double it,
  // so keep just the origin.
  const extra = `${parsed.pathname.replace(/\/+$/, "")}${parsed.search}${parsed.hash}`;
  if (extra && !warnedAboutPath) {
    warnedAboutPath = true;
    console.warn(
      `NEXT_PUBLIC_SUPABASE_URL should be the project URL (e.g. https://<ref>.supabase.co); ignoring "${extra}".`,
    );
  }
  return { url: parsed.origin, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
