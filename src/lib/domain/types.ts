import type { z } from "@/lib/zod";
import type {
  catalogueSchema,
  CURRENCIES,
  COVERAGE_HOURS,
  INCLUSIONS,
  NIST_FUNCTIONS,
  PRICING_UNITS,
  REPORTING_CADENCES,
  serviceSchema,
  SEVERITIES,
  severityTargetSchema,
  sizingSchema,
  slaSchema,
  tierSchema,
  tierServiceSchema,
} from "./schema";

export type NistFunction = (typeof NIST_FUNCTIONS)[number];
export type PricingUnit = (typeof PRICING_UNITS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type CoverageHours = (typeof COVERAGE_HOURS)[number];
export type Severity = (typeof SEVERITIES)[number];
export type ReportingCadence = (typeof REPORTING_CADENCES)[number];
export type Inclusion = (typeof INCLUSIONS)[number];

export type Service = z.infer<typeof serviceSchema>;
export type SeverityTarget = z.infer<typeof severityTargetSchema>;
export type Sla = z.infer<typeof slaSchema>;
export type TierService = z.infer<typeof tierServiceSchema>;
export type Tier = z.infer<typeof tierSchema>;
export type SizingInputs = z.infer<typeof sizingSchema>;
export type Catalogue = z.infer<typeof catalogueSchema>;

export const PRICING_UNIT_LABELS: Record<PricingUnit, string> = {
  endpoint: "per endpoint",
  user: "per user",
  gbDay: "per GB-day",
  flatMonthly: "flat monthly",
};

export const INCLUSION_LABELS: Record<Inclusion, string> = {
  included: "Included",
  addOn: "Add-on",
};

/** Display name for a tier, tolerating a blank name mid-edit. */
export function tierLabel(tier: Pick<Tier, "name">): string {
  return tier.name.trim() || "Untitled tier";
}
