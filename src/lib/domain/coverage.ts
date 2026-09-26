import { NIST_FUNCTIONS } from "./schema";
import type { NistFunction, Service, Tier } from "./types";

export interface FunctionCoverage {
  fn: NistFunction;
  /** Included services that map to this function. */
  included: Service[];
  /** Add-ons that would cover it if bought. */
  addOns: Service[];
}

export interface TierCoverage {
  tier: Tier;
  functions: FunctionCoverage[];
  /** How many of the six CSF functions have at least one included service. */
  coveredCount: number;
}

export interface CoverageGap {
  tier: Tier;
  fn: NistFunction;
  addOns: Service[];
  message: string;
}

export function tierCoverage(tier: Tier, services: Service[]): TierCoverage {
  const byId = new Map(services.map((s) => [s.id, s]));
  const functions = NIST_FUNCTIONS.map((fn) => {
    const coverage: FunctionCoverage = { fn, included: [], addOns: [] };
    for (const { serviceId, inclusion } of tier.services) {
      const service = byId.get(serviceId);
      if (!service?.nistFunctions.includes(fn)) continue;
      (inclusion === "included" ? coverage.included : coverage.addOns).push(service);
    }
    return coverage;
  });
  return { tier, functions, coveredCount: functions.filter((f) => f.included.length > 0).length };
}

/** "Advanced tier", "Tier 4" (no doubled "tier"), or "An untitled tier". */
export function tierPhrase(tier: Pick<Tier, "name">): string {
  const name = tier.name.trim();
  if (!name) return "An untitled tier";
  return /\btier$/i.test(name) || /^tier\b/i.test(name) ? name : `${name} tier`;
}

/** Every function a tier leaves uncovered by its included services. */
export function coverageGaps(tiers: Tier[], services: Service[]): CoverageGap[] {
  return tiers.flatMap((tier) =>
    tierCoverage(tier, services)
      .functions.filter((f) => f.included.length === 0)
      .map(({ fn, addOns }) => ({
        tier,
        fn,
        addOns,
        message:
          `${tierPhrase(tier)} has no ${fn} coverage` +
          (addOns.length > 0 ? ` (available as an add-on: ${addOns.map((s) => s.name).join(", ")}).` : "."),
      })),
  );
}
