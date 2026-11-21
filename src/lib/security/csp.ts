/**
 * The Content-Security-Policy for every page.
 *
 * - Scripts only run if they carry this request's nonce ('strict-dynamic' lets
 *   those scripts load the app's own chunks).
 * - 'wasm-unsafe-eval' lets the PDF layout engine (Yoga, WebAssembly) compile.
 *   It does not allow JavaScript eval.
 * - Styles allow 'unsafe-inline' because the toast, Radix and chart libraries
 *   inject inline styles. Inline styles cannot execute code.
 * - data:/blob: images cover the uploaded logo and generated PDF downloads.
 * - The Supabase project origin is allowed for connections. Today all Supabase
 *   calls happen on the server, but this keeps the policy ready for client features.
 * - Framing is blocked ('none') unless trusted embedder origins are passed in
 *   (from FRAME_ANCESTORS, see frameAncestorsFromEnv), e.g. the Pryviontech MSSP Hub.
 */
export function buildCsp(
  nonce: string,
  isDev: boolean,
  options: { supabaseUrl?: string; frameAncestors?: string[] } = {},
): string {
  const supabaseOrigin = options.supabaseUrl ? safeOrigin(options.supabaseUrl) : null;
  const ancestors = [...new Set((options.frameAncestors ?? []).map(safeOrigin).filter((o): o is string => o !== null))];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", "'wasm-unsafe-eval'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "data:", "blob:", ...(supabaseOrigin ? [supabaseOrigin] : [])],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ancestors.length ? ["'self'", ...ancestors] : ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  // Only meaningful over HTTPS; locally it would break plain-http assets.
  if (!isDev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/**
 * Trusted embedder origins from a comma-separated env value, e.g.
 * FRAME_ANCESTORS="https://pryviontech.vercel.app". Anything that isn't a plain
 * http(s) origin is dropped, so wildcards and keywords can't be injected.
 */
export function frameAncestorsFromEnv(value: string | undefined): string[] {
  if (!value) return [];
  const origins = value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^https?:\/\/[^*'\s;,]+$/i.test(v))
    .map(safeOrigin)
    .filter((o): o is string => o !== null);
  return [...new Set(origins)];
}

/** A fresh, unguessable nonce for each request. */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

/** Just the origin, and only for http(s) URLs, so nothing else can be smuggled into the policy. */
function safeOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.origin : null;
  } catch {
    return null;
  }
}
