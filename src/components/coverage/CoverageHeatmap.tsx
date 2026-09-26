"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FunctionCoverage, TierCoverage } from "@/lib/domain/coverage";
import { NIST_FUNCTIONS } from "@/lib/domain/schema";
import { NIST_COLOURS } from "@/lib/domain/nist";
import { tierLabel } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/**
 * Sequential ramp in the brand hue: more services = stronger colour.
 * Steps are mixes of the brand colour into the card surface, so lightness
 * always increases monotonically whatever the brand colour is.
 */
const RAMP = [
  { min: 1, mix: 22, label: "1" },
  { min: 2, mix: 45, label: "2" },
  { min: 3, mix: 70, label: "3" },
  { min: 4, mix: 100, label: "4+" },
];

function rampStep(count: number) {
  return [...RAMP].reverse().find((step) => count >= step.min);
}

function cellStyle(count: number): React.CSSProperties | undefined {
  const step = rampStep(count);
  if (!step) return undefined;
  return { backgroundColor: `color-mix(in oklab, var(--brand) ${step.mix}%, var(--card))` };
}

/** Strong steps carry the brand's readable text colour; light steps keep normal ink. */
const strongText = (count: number) => (rampStep(count)?.mix ?? 0) >= 70;

export function CoverageHeatmap({ coverage }: { coverage: TierCoverage[] }) {
  return (
    <div className="space-y-4">
      <div className="bg-card overflow-x-auto rounded-xl border">
        <table className="w-full border-separate border-spacing-1 p-2 text-[15px]">
          <caption className="sr-only">
            Number of included services covering each NIST CSF 2.0 function, per tier. Zero means a coverage gap.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="text-muted-foreground px-3 py-2 text-left text-sm font-medium">
                Tier
              </th>
              {NIST_FUNCTIONS.map((fn) => (
                <th key={fn} scope="col" className="min-w-18 px-1 py-2 text-center text-sm font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: NIST_COLOURS[fn] }} aria-hidden />
                    {fn}
                  </span>
                </th>
              ))}
              <th scope="col" className="text-muted-foreground min-w-16 px-2 py-2 text-center text-sm font-medium">
                Covered
              </th>
            </tr>
          </thead>
          <tbody>
            {coverage.map(({ tier, functions, coveredCount }) => (
              <tr key={tier.id}>
                <th scope="row" className="px-2 py-2 text-left text-base font-semibold whitespace-nowrap">
                  {tierLabel(tier)}
                </th>
                {functions.map((f) => (
                  <HeatmapCell key={f.fn} tierName={tierLabel(tier)} coverage={f} />
                ))}
                <td className="px-3 text-center font-semibold tabular-nums">
                  {coveredCount}
                  <span className="text-muted-foreground font-normal"> / {NIST_FUNCTIONS.length}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <HeatmapLegend />
    </div>
  );
}

function HeatmapCell({ tierName, coverage }: { tierName: string; coverage: FunctionCoverage }) {
  const count = coverage.included.length;
  const isGap = count === 0;
  const summary = isGap
    ? `${tierName}, ${coverage.fn}: gap, no included services`
    : `${tierName}, ${coverage.fn}: ${count} included ${count === 1 ? "service" : "services"}`;

  return (
    <td className="p-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={summary}
            style={cellStyle(count)}
            className={cn(
              "flex h-16 w-full cursor-default flex-col items-center justify-center rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              isGap && "border-destructive/50 bg-destructive/5 text-destructive border border-dashed",
              strongText(count) && "text-brand-foreground",
            )}
          >
            {isGap ? (
              <>
                <TriangleAlertIcon className="size-4" aria-hidden />
                <span className="text-xs font-semibold">Gap</span>
              </>
            ) : (
              <span className="text-xl font-semibold tabular-nums">{count}</span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-semibold">
            {tierName} · {coverage.fn}
          </p>
          {coverage.included.length > 0 ? (
            <ul className="mt-1 list-disc pl-4">
              {coverage.included.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1">No included service covers this function.</p>
          )}
          {coverage.addOns.length > 0 && (
            <p className="text-muted-foreground mt-2">
              Add-on: {coverage.addOns.map((s) => s.name).join(", ")}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </td>
  );
}

function HeatmapLegend() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" aria-hidden>
      <span>Included services per function:</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="border-destructive/50 bg-destructive/5 text-destructive inline-flex h-5 w-8 items-center justify-center rounded border border-dashed">
          <TriangleAlertIcon className="size-3" />
        </span>
        0 (gap)
      </span>
      {RAMP.map((step) => (
        <span key={step.label} className="inline-flex items-center gap-1.5">
          <span className="h-5 w-8 rounded border" style={cellStyle(step.min)} />
          {step.label}
        </span>
      ))}
    </div>
  );
}
