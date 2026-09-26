import { describe, expect, it } from "vitest";

import { applyMargin, DAYS_PER_MONTH, priceTier, serviceMonthlyCost, unitsFor } from "./pricing";
import type { Service, SizingInputs, Tier, TierService } from "./types";
import { defaultSla } from "./sla";

const sizing: SizingInputs = { endpoints: 500, users: 400, gbPerDay: 20, contractMonths: 36 };

function service(id: string, pricingUnit: Service["pricingUnit"], unitCost: number): Service {
  return {
    id,
    name: id,
    category: "Test",
    description: "",
    deliverables: [],
    prerequisites: [],
    nistFunctions: ["Detect"],
    pricingUnit,
    unitCost,
    isAddOn: false,
  };
}

function tier(services: TierService[], marginPercent = 30): Tier {
  return { id: "t", name: "Test", services, sla: defaultSla(), marginPercent };
}

const edr = service("edr", "endpoint", 100);
const mail = service("mail", "user", 50);
const siem = service("siem", "gbDay", 10);
const flat = service("flat", "flatMonthly", 20000);
const library = [edr, mail, siem, flat];

describe("unitsFor", () => {
  it("maps each pricing unit to the right sizing input", () => {
    expect(unitsFor("endpoint", sizing)).toBe(500);
    expect(unitsFor("user", sizing)).toBe(400);
    expect(unitsFor("gbDay", sizing)).toBe(20 * DAYS_PER_MONTH);
    expect(unitsFor("flatMonthly", sizing)).toBe(1);
  });

  it("flat monthly services cost the same with zero sizing", () => {
    const zero = { endpoints: 0, users: 0, gbPerDay: 0, contractMonths: 0 };
    expect(serviceMonthlyCost(flat, zero)).toBe(20000);
  });
});

describe("serviceMonthlyCost", () => {
  it("is unit cost × units", () => {
    expect(serviceMonthlyCost(edr, sizing)).toBe(50000);
    expect(serviceMonthlyCost(mail, sizing)).toBe(20000);
    expect(serviceMonthlyCost(siem, sizing)).toBe(6000);
  });

  it("is zero when there are zero units", () => {
    expect(serviceMonthlyCost(edr, { ...sizing, endpoints: 0 })).toBe(0);
    expect(serviceMonthlyCost(siem, { ...sizing, gbPerDay: 0 })).toBe(0);
  });
});

describe("applyMargin", () => {
  it("marks cost up by the margin percentage", () => {
    expect(applyMargin(100, 30)).toBeCloseTo(130);
    expect(applyMargin(100, 0)).toBe(100);
    expect(applyMargin(0, 50)).toBe(0);
  });
});

describe("priceTier", () => {
  const included: TierService[] = library.map((s) => ({ serviceId: s.id, inclusion: "included" }));

  it("sums included services and applies the margin", () => {
    const result = priceTier(tier(included, 25), library, sizing);
    const cost = 50000 + 20000 + 6000 + 20000;
    expect(result.monthlyCost).toBe(cost);
    expect(result.monthlyPrice).toBeCloseTo(cost * 1.25);
    expect(result.monthlyMargin).toBeCloseTo(cost * 0.25);
    expect(result.grossMarginPercent).toBeCloseTo(20);
    expect(result.contractPrice).toBeCloseTo(cost * 1.25 * 36);
    expect(result.contractCost).toBe(cost * 36);
    expect(result.monthlyPricePerEndpoint).toBeCloseTo((cost * 1.25) / 500);
    expect(result.lines).toHaveLength(4);
  });

  it("returns zeros for an empty tier", () => {
    const result = priceTier(tier([]), library, sizing);
    expect(result.lines).toEqual([]);
    expect(result.monthlyCost).toBe(0);
    expect(result.monthlyPrice).toBe(0);
    expect(result.monthlyMargin).toBe(0);
    expect(result.contractPrice).toBe(0);
    expect(result.grossMarginPercent).toBeNull();
    expect(result.monthlyPricePerEndpoint).toBe(0);
  });

  it("with 0% margin the price equals the cost", () => {
    const result = priceTier(tier(included, 0), library, sizing);
    expect(result.monthlyPrice).toBe(result.monthlyCost);
    expect(result.monthlyMargin).toBe(0);
    expect(result.grossMarginPercent).toBe(0);
  });

  it("handles zero units across the board", () => {
    const zero = { endpoints: 0, users: 0, gbPerDay: 0, contractMonths: 12 };
    const result = priceTier(tier(included), library, zero);
    expect(result.monthlyCost).toBe(20000); // only the flat service
    expect(result.monthlyPricePerEndpoint).toBeNull();
  });

  it("gives a zero contract total for a zero-month contract", () => {
    const result = priceTier(tier(included), library, { ...sizing, contractMonths: 0 });
    expect(result.monthlyPrice).toBeGreaterThan(0);
    expect(result.contractPrice).toBe(0);
  });

  it("prices add-ons separately and leaves them out of the tier price", () => {
    const result = priceTier(
      tier([
        { serviceId: "edr", inclusion: "included" },
        { serviceId: "flat", inclusion: "addOn" },
      ], 10),
      library,
      sizing,
    );
    expect(result.monthlyCost).toBe(50000);
    expect(result.addOns).toHaveLength(1);
    expect(result.addOns[0].monthlyCost).toBe(20000);
    expect(result.addOns[0].monthlyPrice).toBeCloseTo(22000);
  });

  it("ignores services that no longer exist in the library", () => {
    const result = priceTier(tier([{ serviceId: "deleted", inclusion: "included" }]), library, sizing);
    expect(result.lines).toEqual([]);
    expect(result.monthlyPrice).toBe(0);
  });
});
