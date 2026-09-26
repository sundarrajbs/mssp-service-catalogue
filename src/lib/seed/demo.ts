import { CATALOGUE_SCHEMA_VERSION } from "@/lib/domain/schema";
import type { Catalogue } from "@/lib/domain/types";
import { SEED_SERVICES } from "./services";
import { createDefaultTiers } from "./tiers";

/** Unit costs (INR per month) for the fictional demo MSSP. */
const DEMO_COSTS: Record<string, number> = {
  "svc-security-monitoring": 140,
  "svc-mdr": 690,
  "svc-threat-hunting": 280,
  "svc-ir-retainer": 175000,
  "svc-vulnerability-management": 110,
  "svc-identity-threat": 85,
};

/**
 * The public preview's catalogue for a fictional MSSP. It is built from
 * static data only: the preview never reads or writes a real user's catalogue.
 */
export function createDemoCatalogue(): Catalogue {
  const tierNames = ["Core", "Plus", "Elite"];
  const tiers = createDefaultTiers().map((tier, i) => ({
    ...tier,
    // Stable IDs so server and browser render the same thing.
    id: `demo-tier-${i + 1}`,
    name: tierNames[i] ?? tier.name,
  }));

  return {
    id: "demo-sentinel-shield",
    schemaVersion: CATALOGUE_SCHEMA_VERSION,
    mspName: "Sentinel Shield Managed Services",
    brandColour: "#3730a3",
    currency: "INR",
    services: SEED_SERVICES.map((service) => ({
      ...structuredClone(service),
      unitCost: DEMO_COSTS[service.id] ?? service.unitCost,
    })),
    tiers,
    sizing: { endpoints: 1200, users: 950, gbPerDay: 45, contractMonths: 36 },
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-01-15T09:00:00.000Z",
  };
}
