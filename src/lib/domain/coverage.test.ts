import { describe, expect, it } from "vitest";

import { coverageGaps, tierCoverage, tierPhrase } from "./coverage";
import { defaultSla } from "./sla";
import type { NistFunction, Service, Tier, TierService } from "./types";

function service(id: string, nistFunctions: NistFunction[]): Service {
  return {
    id,
    name: id.toUpperCase(),
    category: "Test",
    description: "",
    deliverables: [],
    prerequisites: [],
    nistFunctions,
    pricingUnit: "flatMonthly",
    unitCost: 1,
    isAddOn: false,
  };
}

const monitoring = service("mon", ["Detect"]);
const mdr = service("mdr", ["Detect", "Respond"]);
const ir = service("ir", ["Respond", "Recover"]);
const grc = service("grc", ["Govern", "Identify"]);
const library = [monitoring, mdr, ir, grc];

function tier(name: string, services: TierService[]): Tier {
  return { id: name, name, services, sla: defaultSla(), marginPercent: 0 };
}

const byFn = (t: ReturnType<typeof tierCoverage>, fn: NistFunction) => t.functions.find((f) => f.fn === fn)!;

describe("tierCoverage", () => {
  it("counts included services per function, in CSF order", () => {
    const result = tierCoverage(
      tier("A", [
        { serviceId: "mon", inclusion: "included" },
        { serviceId: "mdr", inclusion: "included" },
      ]),
      library,
    );
    expect(result.functions.map((f) => f.fn)).toEqual(["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"]);
    expect(byFn(result, "Detect").included.map((s) => s.id)).toEqual(["mon", "mdr"]);
    expect(byFn(result, "Respond").included).toHaveLength(1);
    expect(result.coveredCount).toBe(2);
  });

  it("does not count add-ons as coverage but lists them", () => {
    const result = tierCoverage(tier("A", [{ serviceId: "ir", inclusion: "addOn" }]), library);
    expect(byFn(result, "Recover").included).toEqual([]);
    expect(byFn(result, "Recover").addOns.map((s) => s.id)).toEqual(["ir"]);
    expect(result.coveredCount).toBe(0);
  });

  it("gives zero coverage for an empty tier", () => {
    expect(tierCoverage(tier("Empty", []), library).coveredCount).toBe(0);
  });

  it("ignores services deleted from the library", () => {
    const result = tierCoverage(tier("A", [{ serviceId: "gone", inclusion: "included" }]), library);
    expect(result.coveredCount).toBe(0);
  });
});

describe("coverageGaps", () => {
  it("reports each uncovered function with a readable message", () => {
    const tiers = [
      tier("Advanced", [
        { serviceId: "mon", inclusion: "included" },
        { serviceId: "mdr", inclusion: "included" },
        { serviceId: "grc", inclusion: "included" },
        { serviceId: "ir", inclusion: "addOn" },
      ]),
    ];
    const gaps = coverageGaps(tiers, library);
    expect(gaps.map((g) => g.fn)).toEqual(["Protect", "Recover"]);
    expect(gaps[0].message).toBe("Advanced tier has no Protect coverage.");
    expect(gaps[1].message).toBe("Advanced tier has no Recover coverage (available as an add-on: IR).");
  });

  it("returns no gaps when every function is covered", () => {
    const full = service("full", ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"]);
    expect(coverageGaps([tier("P", [{ serviceId: "full", inclusion: "included" }])], [full])).toEqual([]);
  });

  it("uses a placeholder name for blank tier names", () => {
    const gaps = coverageGaps([tier("", [])], library);
    expect(gaps[0].message).toBe("An untitled tier has no Govern coverage.");
  });
});

describe("tierPhrase", () => {
  it("adds 'tier' only when the name doesn't already say it", () => {
    expect(tierPhrase({ name: "Advanced" })).toBe("Advanced tier");
    expect(tierPhrase({ name: "Tier 4" })).toBe("Tier 4");
    expect(tierPhrase({ name: "Gold tier" })).toBe("Gold tier");
    expect(tierPhrase({ name: "  " })).toBe("An untitled tier");
  });
});
