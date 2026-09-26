import { z } from "@/lib/zod";

import { catalogueSchema } from "./schema";
import type { Catalogue } from "./types";

/** Imports larger than this are rejected before parsing. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type ImportResult = { ok: true; catalogue: Catalogue } | { ok: false; errors: string[] };

/** The full schema plus cross-references that a type check alone can't catch. */
const importSchema = catalogueSchema.superRefine((catalogue, ctx) => {
  const serviceIds = new Set<string>();
  catalogue.services.forEach((service, i) => {
    if (serviceIds.has(service.id)) {
      ctx.addIssue({ code: "custom", path: ["services", i, "id"], message: `Duplicate service id "${service.id}"` });
    }
    serviceIds.add(service.id);
  });

  const tierIds = new Set<string>();
  catalogue.tiers.forEach((tier, t) => {
    if (tierIds.has(tier.id)) {
      ctx.addIssue({ code: "custom", path: ["tiers", t, "id"], message: `Duplicate tier id "${tier.id}"` });
    }
    tierIds.add(tier.id);
    const seen = new Set<string>();
    tier.services.forEach(({ serviceId }, i) => {
      if (!serviceIds.has(serviceId)) {
        ctx.addIssue({
          code: "custom",
          path: ["tiers", t, "services", i, "serviceId"],
          message: `Refers to a service that isn't in the library ("${serviceId}")`,
        });
      }
      if (seen.has(serviceId)) {
        ctx.addIssue({
          code: "custom",
          path: ["tiers", t, "services", i, "serviceId"],
          message: `Lists the same service twice ("${serviceId}")`,
        });
      }
      seen.add(serviceId);
    });
  });
});

/** "tiers[1].sla.severities.P1.responseMinutes" */
function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>((out, key) => {
    if (typeof key === "number") return `${out}[${key}]`;
    return out ? `${out}.${String(key)}` : String(key);
  }, "");
}

function describeIssues(error: z.ZodError, limit = 8): string[] {
  const messages = error.issues.map((issue) => {
    const message = /received undefined$/.test(issue.message) ? "Missing" : issue.message;
    return issue.path.length > 0 ? `${formatPath(issue.path)}: ${message}` : message;
  });
  const extra = messages.length - limit;
  return extra > 0 ? [...messages.slice(0, limit), `…and ${extra} more ${extra === 1 ? "problem" : "problems"}`] : messages;
}

/** Parses and validates exported JSON text. Never throws. */
export function parseCatalogueJson(text: string): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) {
    return { ok: false, errors: ["The file is larger than 5 MB, so it can't be a catalogue export."] };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["The file isn't valid JSON. Choose a file exported from this app."] };
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, errors: ["The file doesn't contain a catalogue object."] };
  }
  if ("schemaVersion" in data && data.schemaVersion !== catalogueSchema.shape.schemaVersion.value) {
    return {
      ok: false,
      errors: [`This file uses catalogue format version ${String(data.schemaVersion)}, which this app can't read.`],
    };
  }
  return validateCatalogue(data);
}

/**
 * Full validation of catalogue data (schema plus cross-references), used for
 * imports and before every save to the database.
 */
export function validateCatalogue(data: unknown): ImportResult {
  const parsed = importSchema.safeParse(data);
  return parsed.success ? { ok: true, catalogue: parsed.data } : { ok: false, errors: describeIssues(parsed.error) };
}

export function catalogueToJson(catalogue: Catalogue): string {
  return JSON.stringify(catalogue, null, 2);
}

/** "acme-secure-catalogue-2026-09-26.json" */
export function exportFileName(mspName: string, extension: string, now = new Date(), suffix = "catalogue"): string {
  const slug =
    mspName
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "mssp";
  const date = now.toISOString().slice(0, 10);
  return `${slug}-${suffix}-${date}.${extension}`;
}
