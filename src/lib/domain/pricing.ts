import type { PricingUnit, Service, SizingInputs, Tier } from "./types";

/** GB-day pricing is per GB ingested, so a month is 30 days of the daily volume. */
export const DAYS_PER_MONTH = 30;

export function unitsFor(unit: PricingUnit, sizing: SizingInputs): number {
  switch (unit) {
    case "endpoint":
      return sizing.endpoints;
    case "user":
      return sizing.users;
    case "gbDay":
      return sizing.gbPerDay * DAYS_PER_MONTH;
    case "flatMonthly":
      return 1;
  }
}

export function serviceMonthlyCost(service: Service, sizing: SizingInputs): number {
  return service.unitCost * unitsFor(service.pricingUnit, sizing);
}

/** Margin is a markup on cost: price = cost × (1 + margin%). */
export function applyMargin(cost: number, marginPercent: number): number {
  return cost * (1 + marginPercent / 100);
}

export interface PriceLine {
  service: Service;
  units: number;
  monthlyCost: number;
  monthlyPrice: number;
}

export interface TierPricing {
  /** Included services, which make up the tier price. */
  lines: PriceLine[];
  /** Optional add-ons, priced individually with the tier's margin; not in the tier price. */
  addOns: PriceLine[];
  monthlyCost: number;
  monthlyPrice: number;
  monthlyMargin: number;
  contractCost: number;
  contractPrice: number;
  contractMargin: number;
  /** Margin as a share of price (what finance calls gross margin); null when the price is zero. */
  grossMarginPercent: number | null;
  /** Monthly price divided by endpoints; null when there are no endpoints. */
  monthlyPricePerEndpoint: number | null;
}

function priceLine(service: Service, sizing: SizingInputs, marginPercent: number): PriceLine {
  const monthlyCost = serviceMonthlyCost(service, sizing);
  return {
    service,
    units: unitsFor(service.pricingUnit, sizing),
    monthlyCost,
    monthlyPrice: applyMargin(monthlyCost, marginPercent),
  };
}

export function priceTier(tier: Tier, services: Service[], sizing: SizingInputs): TierPricing {
  const byId = new Map(services.map((s) => [s.id, s]));
  const lines: PriceLine[] = [];
  const addOns: PriceLine[] = [];

  for (const { serviceId, inclusion } of tier.services) {
    const service = byId.get(serviceId);
    if (!service) continue; // service was deleted from the library
    (inclusion === "included" ? lines : addOns).push(priceLine(service, sizing, tier.marginPercent));
  }

  const monthlyCost = lines.reduce((sum, line) => sum + line.monthlyCost, 0);
  const monthlyPrice = applyMargin(monthlyCost, tier.marginPercent);
  const monthlyMargin = monthlyPrice - monthlyCost;
  const months = sizing.contractMonths;

  return {
    lines,
    addOns,
    monthlyCost,
    monthlyPrice,
    monthlyMargin,
    contractCost: monthlyCost * months,
    contractPrice: monthlyPrice * months,
    contractMargin: monthlyMargin * months,
    grossMarginPercent: monthlyPrice > 0 ? (monthlyMargin / monthlyPrice) * 100 : null,
    monthlyPricePerEndpoint: sizing.endpoints > 0 ? monthlyPrice / sizing.endpoints : null,
  };
}
