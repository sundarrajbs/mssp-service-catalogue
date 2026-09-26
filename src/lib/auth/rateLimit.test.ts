import { describe, expect, it, vi } from "vitest";

import { allowAuthAttempt, clientIp, rateLimitKey } from "./rateLimit";

describe("rateLimitKey", () => {
  it("is a stable SHA-256 hex digest that hides the inputs", () => {
    const key = rateLimitKey(["sign-in", "203.0.113.7", "a@example.com"]);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).toBe(rateLimitKey(["sign-in", "203.0.113.7", "a@example.com"]));
    expect(key).not.toContain("203.0.113.7");
  });

  it("changes with the pepper, action, IP or email", () => {
    const base = rateLimitKey(["sign-in", "1.1.1.1", "a@example.com"]);
    expect(rateLimitKey(["sign-in", "1.1.1.1", "a@example.com"], "pepper")).not.toBe(base);
    expect(rateLimitKey(["sign-up", "1.1.1.1", "a@example.com"])).not.toBe(base);
    expect(rateLimitKey(["sign-in", "1.1.1.2", "a@example.com"])).not.toBe(base);
    expect(rateLimitKey(["sign-in", "1.1.1.1", "b@example.com"])).not.toBe(base);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for address, then x-real-ip", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("allowAuthAttempt", () => {
  const fakeClient = (results: Array<{ data: boolean | null; error: { message: string } | null }>) => {
    const rpc = vi.fn();
    results.forEach((r) => rpc.mockResolvedValueOnce(r));
    return { client: { rpc } as never, rpc };
  };
  const attempt = { action: "sign-in" as const, email: "A@Example.com", ip: "203.0.113.7" };

  it("allows when both limits allow", async () => {
    const { client, rpc } = fakeClient([
      { data: true, error: null },
      { data: true, error: null },
    ]);
    expect(await allowAuthAttempt(client, attempt)).toBe(true);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0][0]).toBe("auth_rate_limit_hit");
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("example.com");
  });

  it("blocks when the per-email limit is reached", async () => {
    const { client, rpc } = fakeClient([{ data: false, error: null }]);
    expect(await allowAuthAttempt(client, attempt)).toBe(false);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("fails open if the database function is missing", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeClient([{ data: null, error: { message: "function not found" } }]);
    expect(await allowAuthAttempt(client, attempt)).toBe(true);
    spy.mockRestore();
  });
});
