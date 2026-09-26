import { describe, expect, it } from "vitest";

import { DEFAULT_SIGNED_IN_PATH, safeNextPath, signInPathFor } from "./redirect";

describe("safeNextPath", () => {
  it("keeps same-site paths with query and hash", () => {
    expect(safeNextPath("/app/tiers")).toBe("/app/tiers");
    expect(safeNextPath("/app/pricing?tier=2#breakdown")).toBe("/app/pricing?tier=2#breakdown");
  });

  it.each([
    "https://evil.example/app",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "app/library",
    "/app\u0000/library",
    "/app/\ttiers",
    "",
    null,
    undefined,
  ])("falls back for %j", (value) => {
    expect(safeNextPath(value as string | null | undefined)).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("uses the given fallback", () => {
    expect(safeNextPath("//x", "/")).toBe("/");
  });
});

describe("signInPathFor", () => {
  it("encodes the destination", () => {
    expect(signInPathFor("/app/tiers?x=1")).toBe("/sign-in?next=%2Fapp%2Ftiers%3Fx%3D1");
  });
});
