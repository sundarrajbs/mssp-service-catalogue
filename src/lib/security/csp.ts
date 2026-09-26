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
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", "'wasm-unsafe-eval'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "data:", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  // Only meaningful over HTTPS; locally it would break plain-http assets.
  if (!isDev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/** A fresh, unguessable nonce for each request. */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}
