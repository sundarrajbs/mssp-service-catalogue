export interface SupabaseEnv {
  url: string;
  /** The public "anon" (or "publishable") key. Row Level Security decides what it can access. */
  anonKey: string;
}

/**
 * Reads the public Supabase settings. Returns null when they aren't set, so the
 * landing page and preview still work before Supabase is configured.
 * The service-role key is deliberately never read anywhere in this app.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !anonKey) return null;
  try {
    const parsed = new URL(url);
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) return null;
  } catch {
    return null;
  }
  return { url: url.replace(/\/+$/, ""), anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
