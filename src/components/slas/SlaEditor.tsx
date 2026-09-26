"use client";

import { AlertTriangleIcon, CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COVERAGE_HOURS, REPORTING_CADENCES, SEVERITIES } from "@/lib/domain/schema";
import { defaultSla, formatHours, formatMinutes, validateSla, type SlaPreset } from "@/lib/domain/sla";
import {
  tierLabel,
  type CoverageHours,
  type ReportingCadence,
  type Severity,
  type SeverityTarget,
  type Sla,
  type Tier,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const COVERAGE_LABELS: Record<CoverageHours, string> = {
  "8x5": "8×5 (business hours)",
  "12x6": "12×6 (extended hours)",
  "24x7": "24×7 (always on)",
};

const CADENCE_LABELS: Record<ReportingCadence, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  P1: "Critical",
  P2: "High",
  P3: "Medium",
  P4: "Low",
};

const PRESETS: { value: SlaPreset; label: string }[] = [
  { value: "essential", label: "Essential defaults" },
  { value: "advanced", label: "Advanced defaults" },
  { value: "premium", label: "Premium defaults" },
];

export function SlaEditor({ tier, onChange }: { tier: Tier; onChange: (sla: Sla) => void }) {
  const { sla } = tier;
  const issues = validateSla(sla);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const idBase = `sla-${tier.id}`;

  const hasIssue = (severity: Severity, field: keyof SeverityTarget) =>
    issues.some((i) => i.severity === severity && i.field === field);

  const setTarget = (severity: Severity, field: keyof SeverityTarget, raw: string) => {
    const value = raw === "" ? 0 : Math.max(0, Number(raw));
    onChange({
      ...sla,
      severities: { ...sla.severities, [severity]: { ...sla.severities[severity], [field]: Number.isFinite(value) ? value : 0 } },
    });
  };

  return (
    <Card className="gap-5">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-xl">{tierLabel(tier)}</CardTitle>
        <Select value="" onValueChange={(preset) => onChange(defaultSla(preset as SlaPreset))}>
          <SelectTrigger size="sm" aria-label={`Apply preset SLA to ${tierLabel(tier)}`}>
            <SelectValue placeholder="Apply preset…" />
          </SelectTrigger>
          <SelectContent align="end">
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idBase}-coverage`}>Coverage hours</Label>
            <Select value={sla.coverage} onValueChange={(v) => onChange({ ...sla, coverage: v as CoverageHours })}>
              <SelectTrigger id={`${idBase}-coverage`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COVERAGE_HOURS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {COVERAGE_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idBase}-cadence`}>Reporting cadence</Label>
            <Select
              value={sla.reportingCadence}
              onValueChange={(v) => onChange({ ...sla, reportingCadence: v as ReportingCadence })}
            >
              <SelectTrigger id={`${idBase}-cadence`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORTING_CADENCES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CADENCE_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <table className="w-full text-sm">
          <caption className="sr-only">Severity targets for {tierLabel(tier)}</caption>
          <thead>
            <tr className="text-muted-foreground text-left text-xs">
              <th scope="col" className="pb-2 font-medium">Severity</th>
              <th scope="col" className="pb-2 font-medium">Response (minutes)</th>
              <th scope="col" className="pb-2 pl-3 font-medium">Resolution (hours)</th>
            </tr>
          </thead>
          <tbody>
            {SEVERITIES.map((severity) => {
              const target = sla.severities[severity];
              return (
                <tr key={severity} className="border-t">
                  <th scope="row" className="py-2 pr-3 text-left align-top font-medium">
                    <span className="block">{severity}</span>
                    <span className="text-muted-foreground text-xs font-normal">{SEVERITY_LABELS[severity]}</span>
                  </th>
                  <td className="py-2 align-top">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      aria-label={`${severity} response time in minutes`}
                      value={target.responseMinutes || ""}
                      aria-invalid={hasIssue(severity, "responseMinutes")}
                      onChange={(e) => setTarget(severity, "responseMinutes", e.target.value)}
                    />
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {target.responseMinutes > 0 ? formatMinutes(target.responseMinutes) : "—"}
                    </span>
                  </td>
                  <td className="py-2 pl-3 align-top">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      aria-label={`${severity} resolution target in hours`}
                      value={target.resolutionHours || ""}
                      aria-invalid={hasIssue(severity, "resolutionHours")}
                      onChange={(e) => setTarget(severity, "resolutionHours", e.target.value)}
                    />
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {target.resolutionHours > 0 ? formatHours(target.resolutionHours) : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div aria-live="polite" className="space-y-1.5 text-sm">
          {issues.length === 0 && (
            <p className="text-muted-foreground flex items-center gap-2">
              <CircleCheckIcon className="size-4 text-emerald-600" aria-hidden /> Targets look consistent.
            </p>
          )}
          {[...errors, ...warnings].map((issue) => (
            <p
              key={issue.message}
              className={cn(
                "flex items-start gap-2",
                issue.level === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-400",
              )}
            >
              {issue.level === "error" ? (
                <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              ) : (
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              <span>
                <span className="sr-only">{issue.level === "error" ? "Error: " : "Warning: "}</span>
                {issue.message}
              </span>
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
