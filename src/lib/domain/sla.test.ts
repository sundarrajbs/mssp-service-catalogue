import { describe, expect, it } from "vitest";

import { defaultSla, formatHours, formatMinutes, SLA_PRESETS, validateSla } from "./sla";
import type { Sla } from "./types";

function withTargets(overrides: Partial<Record<"P1" | "P2" | "P3" | "P4", [number, number]>>): Sla {
  const sla = defaultSla("advanced");
  for (const [severity, [responseMinutes, resolutionHours]] of Object.entries(overrides)) {
    sla.severities[severity as keyof Sla["severities"]] = { responseMinutes, resolutionHours };
  }
  return sla;
}

describe("validateSla", () => {
  it.each(Object.keys(SLA_PRESETS) as (keyof typeof SLA_PRESETS)[])("accepts the %s preset", (preset) => {
    expect(validateSla(defaultSla(preset))).toEqual([]);
  });

  it("rejects P1 response equal to P4", () => {
    const issues = validateSla(withTargets({ P1: [720, 8] }));
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "error", severity: "P1", field: "responseMinutes" }),
    );
  });

  it("rejects P1 resolution looser than P4", () => {
    const issues = validateSla(withTargets({ P1: [30, 200] }));
    expect(issues.filter((i) => i.level === "error")).toEqual([
      expect.objectContaining({ severity: "P1", field: "resolutionHours" }),
    ]);
  });

  it("rejects zero targets", () => {
    const issues = validateSla(withTargets({ P3: [0, 72] }));
    expect(issues).toContainEqual(expect.objectContaining({ level: "error", severity: "P3", field: "responseMinutes" }));
  });

  it("warns, but does not error, when neighbouring severities are out of order", () => {
    const issues = validateSla(withTargets({ P2: [300, 24] }));
    expect(issues).toEqual([expect.objectContaining({ level: "warning", severity: "P2", field: "responseMinutes" })]);
  });

  it("returns a fresh copy for each default", () => {
    const a = defaultSla();
    a.severities.P1.responseMinutes = 999;
    expect(defaultSla().severities.P1.responseMinutes).not.toBe(999);
  });
});

describe("duration formatting", () => {
  it("formats minutes, hours and days", () => {
    expect(formatMinutes(15)).toBe("15 min");
    expect(formatMinutes(90)).toBe("1.5 h");
    expect(formatMinutes(1440)).toBe("1 day");
    expect(formatHours(4)).toBe("4 h");
    expect(formatHours(72)).toBe("3 days");
    expect(formatHours(30)).toBe("30 h");
  });
});
