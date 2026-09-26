import { z } from "@/lib/zod";

/**
 * Zod schemas are the single source of truth for the data model.
 * Types are inferred from them (see types.ts) and the same schemas
 * validate anything loaded from storage or imported from JSON.
 */

export const NIST_FUNCTIONS = ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"] as const;
export const PRICING_UNITS = ["endpoint", "user", "gbDay", "flatMonthly"] as const;
export const CURRENCIES = ["INR", "USD"] as const;
export const COVERAGE_HOURS = ["8x5", "12x6", "24x7"] as const;
export const SEVERITIES = ["P1", "P2", "P3", "P4"] as const;
export const REPORTING_CADENCES = ["weekly", "monthly", "quarterly"] as const;
export const INCLUSIONS = ["included", "addOn"] as const;

export const CATALOGUE_SCHEMA_VERSION = 1;

/** Logos are stored as PNG or JPEG data URLs (SVGs are rasterised on upload). */
export const MAX_LOGO_DATA_URL_LENGTH = 1_000_000;
const LOGO_DATA_URL = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;

const text = (max: number) => z.string().trim().max(max);
const nonNegative = z.number().finite().min(0);

export const serviceSchema = z.object({
  id: z.string().min(1),
  name: text(120).min(1, "Name is required"),
  category: text(80).min(1, "Category is required"),
  description: text(2000),
  deliverables: z.array(text(300)).max(50),
  prerequisites: z.array(text(300)).max(50),
  nistFunctions: z.array(z.enum(NIST_FUNCTIONS)).min(1, "Pick at least one NIST CSF function"),
  pricingUnit: z.enum(PRICING_UNITS),
  unitCost: nonNegative,
  isAddOn: z.boolean(),
});

export const severityTargetSchema = z.object({
  responseMinutes: z.number().finite().min(0),
  resolutionHours: z.number().finite().min(0),
});

export const slaSchema = z.object({
  coverage: z.enum(COVERAGE_HOURS),
  severities: z.object({
    P1: severityTargetSchema,
    P2: severityTargetSchema,
    P3: severityTargetSchema,
    P4: severityTargetSchema,
  }),
  reportingCadence: z.enum(REPORTING_CADENCES),
});

export const tierServiceSchema = z.object({
  serviceId: z.string().min(1),
  inclusion: z.enum(INCLUSIONS),
});

export const tierSchema = z.object({
  id: z.string().min(1),
  name: text(60),
  services: z.array(tierServiceSchema),
  sla: slaSchema,
  marginPercent: nonNegative.max(1000),
});

export const sizingSchema = z.object({
  endpoints: nonNegative,
  users: nonNegative,
  gbPerDay: nonNegative,
  contractMonths: nonNegative,
});

export const catalogueSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(CATALOGUE_SCHEMA_VERSION),
  mspName: text(120),
  logo: z
    .string()
    .max(MAX_LOGO_DATA_URL_LENGTH, "Logo image is too large")
    .regex(LOGO_DATA_URL, "Logo must be a PNG or JPEG image")
    .optional(),
  brandColour: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Brand colour must be a hex colour like #2563eb"),
  currency: z.enum(CURRENCIES),
  services: z.array(serviceSchema),
  tiers: z.array(tierSchema),
  sizing: sizingSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
