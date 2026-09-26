import { CATALOGUE_SCHEMA_VERSION } from "@/lib/domain/schema";
import type { Catalogue } from "@/lib/domain/types";
import { SEED_SERVICES } from "./services";

export const DEFAULT_BRAND_COLOUR = "#2563eb";

/** A fresh catalogue with the starter service library. */
export function createSeedCatalogue(): Catalogue {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: CATALOGUE_SCHEMA_VERSION,
    mspName: "Your MSSP",
    brandColour: DEFAULT_BRAND_COLOUR,
    currency: "INR",
    services: structuredClone(SEED_SERVICES),
    tiers: [],
    sizing: { endpoints: 500, users: 400, gbPerDay: 20, contractMonths: 36 },
    createdAt: now,
    updatedAt: now,
  };
}
