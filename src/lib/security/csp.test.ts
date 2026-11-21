import { describe, expect, it } from "vitest";

import { buildCsp, createNonce, frameAncestorsFromEnv } from "./csp";

const directive = (csp: string, name: string) =>
  csp
    .split("; ")
    .find((d) => d.startsWith(`${name} `) || d === name)
    ?.split(" ")
    .slice(1);

describe("buildCsp", () => {
  const csp = buildCsp("abc123", false);

  it("only runs scripts carrying the nonce", () => {
    expect(directive(csp, "script-src")).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'", "'wasm-unsafe-eval'"]);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("blocks framing, plugins and foreign form posts", () => {
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
  });

  it("allows the Supabase project origin for connections only", () => {
    const withSupabase = buildCsp("n", false, { supabaseUrl: "https://abcd.supabase.co/" });
    expect(directive(withSupabase, "connect-src")).toEqual(["'self'", "data:", "blob:", "https://abcd.supabase.co"]);
    expect(directive(withSupabase, "script-src")).not.toContain("https://abcd.supabase.co");
  });

  it("ignores a malformed Supabase URL", () => {
    expect(buildCsp("n", false, { supabaseUrl: "javascript:alert(1); script-src *" })).not.toContain("script-src *");
    expect(buildCsp("n", false, { supabaseUrl: "not a url" })).toBe(buildCsp("n", false));
  });

  it("allows no third-party origins", () => {
    expect(csp).not.toMatch(/https?:/);
  });

  it("upgrades insecure requests in production only", () => {
    expect(csp).toContain("upgrade-insecure-requests");
    expect(buildCsp("n", true)).not.toContain("upgrade-insecure-requests");
  });

  it("adds unsafe-eval only in development (needed by React dev tooling)", () => {
    expect(directive(buildCsp("n", true), "script-src")).toContain("'unsafe-eval'");
  });
});

describe("frame-ancestors allowlist", () => {
  it("allows only 'self' plus the configured embedder origins", () => {
    const framed = buildCsp("n", false, { frameAncestors: ["https://pryviontech.vercel.app/some/path"] });
    expect(directive(framed, "frame-ancestors")).toEqual(["'self'", "https://pryviontech.vercel.app"]);
  });

  it("falls back to 'none' when nothing valid is configured", () => {
    expect(directive(buildCsp("n", false, { frameAncestors: [] }), "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(buildCsp("n", false, { frameAncestors: ["not a url"] }), "frame-ancestors")).toEqual(["'none'"]);
  });

  it("parses FRAME_ANCESTORS and drops wildcards, keywords and injection attempts", () => {
    expect(frameAncestorsFromEnv(undefined)).toEqual([]);
    expect(
      frameAncestorsFromEnv(
        " https://pryviontech.vercel.app , http://localhost:3000,https://pryviontech.vercel.app, *, https://*.vercel.app, 'self', https://a.com; script-src *, javascript:alert(1)",
      ),
    ).toEqual(["https://pryviontech.vercel.app", "http://localhost:3000"]);
  });
});

describe("createNonce", () => {
  it("is different every time", () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce));
    expect(nonces.size).toBe(50);
  });
});
