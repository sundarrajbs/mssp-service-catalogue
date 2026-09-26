import type { Catalogue, Service, Tier } from "@/lib/domain/types";

/**
 * Removes control characters (keeping newlines and tabs), bidirectional
 * overrides and zero-width characters from user-entered text. React already
 * escapes text, so this is about invisible or spoofing characters reaching the
 * UI, storage and PDFs, not about HTML injection.
 */
export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[​-‏‪-‮⁠-⁩﻿]/g, "");
}

export function sanitizeService<T extends Omit<Service, "id">>(service: T): T {
  return {
    ...service,
    name: cleanText(service.name),
    category: cleanText(service.category),
    description: cleanText(service.description),
    deliverables: service.deliverables.map(cleanText),
    prerequisites: service.prerequisites.map(cleanText),
  };
}

export function sanitizeTier(tier: Tier): Tier {
  return { ...tier, name: cleanText(tier.name) };
}

/** Cleans every free-text field, e.g. on JSON import. */
export function sanitizeCatalogue(catalogue: Catalogue): Catalogue {
  return {
    ...catalogue,
    mspName: cleanText(catalogue.mspName),
    services: catalogue.services.map(sanitizeService),
    tiers: catalogue.tiers.map(sanitizeTier),
  };
}
