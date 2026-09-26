import { afterEach, describe, expect, it, vi } from "vitest";

const KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

/** Fresh module each time, so the one-time warning resets. */
async function envWith(values: Record<string, string>) {
  for (const key of KEYS) delete process.env[key];
  Object.assign(process.env, values);
  vi.resetModules();
  return (await import("./env")).getSupabaseEnv();
}

describe("getSupabaseEnv", () => {
  const original = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const key of KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
    vi.restoreAllMocks();
  });

  it("keeps only the origin when the REST endpoint is pasted, and warns", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const env = await envWith({
      NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co/rest/v1",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "key",
    });
    expect(env).toEqual({ url: "https://abcd.supabase.co", anonKey: "key" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("/rest/v1");
  });

  it("accepts the plain project URL, with or without a trailing slash, without warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const url of ["https://abcd.supabase.co", "https://abcd.supabase.co/", "  https://abcd.supabase.co//  "]) {
      expect((await envWith({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" }))?.url).toBe(
        "https://abcd.supabase.co",
      );
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps the port for a local stack", async () => {
    const env = await envWith({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" });
    expect(env?.url).toBe("http://127.0.0.1:54321");
  });

  it("requires https except on localhost", async () => {
    expect(await envWith({ NEXT_PUBLIC_SUPABASE_URL: "http://abcd.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" })).toBeNull();
    expect(await envWith({ NEXT_PUBLIC_SUPABASE_URL: "not a url", NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" })).toBeNull();
  });

  it("returns null when a value is missing", async () => {
    expect(await envWith({ NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co" })).toBeNull();
    expect(await envWith({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" })).toBeNull();
  });

  it("accepts the publishable-key variable name", async () => {
    const env = await envWith({
      NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
    });
    expect(env?.anonKey).toBe("sb_publishable_x");
  });
});
