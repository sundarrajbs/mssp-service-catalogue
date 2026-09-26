import { SEVERITIES } from "./schema";
import type { Severity, Sla } from "./types";

export type SlaPreset = "essential" | "advanced" | "premium";

/** Sensible starting points; every value is editable per tier. */
export const SLA_PRESETS: Record<SlaPreset, Sla> = {
  essential: {
    coverage: "12x6",
    severities: {
      P1: { responseMinutes: 60, resolutionHours: 24 },
      P2: { responseMinutes: 120, resolutionHours: 48 },
      P3: { responseMinutes: 480, resolutionHours: 120 },
      P4: { responseMinutes: 1440, resolutionHours: 240 },
    },
    reportingCadence: "monthly",
  },
  advanced: {
    coverage: "24x7",
    severities: {
      P1: { responseMinutes: 30, resolutionHours: 8 },
      P2: { responseMinutes: 60, resolutionHours: 24 },
      P3: { responseMinutes: 240, resolutionHours: 72 },
      P4: { responseMinutes: 720, resolutionHours: 168 },
    },
    reportingCadence: "monthly",
  },
  premium: {
    coverage: "24x7",
    severities: {
      P1: { responseMinutes: 15, resolutionHours: 4 },
      P2: { responseMinutes: 30, resolutionHours: 12 },
      P3: { responseMinutes: 120, resolutionHours: 48 },
      P4: { responseMinutes: 480, resolutionHours: 120 },
    },
    reportingCadence: "weekly",
  },
};

export function defaultSla(preset: SlaPreset = "advanced"): Sla {
  return structuredClone(SLA_PRESETS[preset]);
}

export interface SlaIssue {
  level: "error" | "warning";
  /** Which cell the issue relates to, for highlighting. */
  severity?: Severity;
  field?: "responseMinutes" | "resolutionHours";
  message: string;
}

/**
 * Errors: non-positive targets, or P1 not strictly tighter than P4.
 * Warnings: a severity looser than the one below it (e.g. P2 slower than P3).
 */
export function validateSla(sla: Sla): SlaIssue[] {
  const issues: SlaIssue[] = [];
  const fields = [
    { field: "responseMinutes", label: "response" },
    { field: "resolutionHours", label: "resolution" },
  ] as const;

  for (const severity of SEVERITIES) {
    for (const { field, label } of fields) {
      const value = sla.severities[severity][field];
      if (!Number.isFinite(value) || value <= 0) {
        issues.push({ level: "error", severity, field, message: `${severity} ${label} target must be greater than zero.` });
      }
    }
  }

  for (const { field, label } of fields) {
    const p1 = sla.severities.P1[field];
    const p4 = sla.severities.P4[field];
    if (p1 > 0 && p4 > 0 && p1 >= p4) {
      issues.push({
        level: "error",
        severity: "P1",
        field,
        message: `P1 ${label} target must be tighter (shorter) than P4.`,
      });
    }
    for (let i = 0; i < SEVERITIES.length - 1; i++) {
      const higher = SEVERITIES[i];
      const lower = SEVERITIES[i + 1];
      const a = sla.severities[higher][field];
      const b = sla.severities[lower][field];
      if (a > 0 && b > 0 && a > b && !(higher === "P1" && lower === "P4")) {
        issues.push({
          level: "warning",
          severity: higher,
          field,
          message: `${higher} ${label} target is looser than ${lower}.`,
        });
      }
    }
  }
  return issues;
}

/** "15 min", "2 h", "1 day", "1.5 days" — for summaries and exports. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return formatHours(minutes / 60);
}

export function formatHours(hours: number): string {
  const round = (n: number) => Math.round(n * 10) / 10;
  if (hours < 24 || hours % 24 !== 0) return `${round(hours)} h`;
  const days = hours / 24;
  return `${round(days)} ${days === 1 ? "day" : "days"}`;
}
