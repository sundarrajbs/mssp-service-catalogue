import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";

import { tierPhrase, type CoverageGap } from "@/lib/domain/coverage";
import { NIST_FUNCTIONS } from "@/lib/domain/schema";

/** One line per gap, except a tier with no coverage at all gets a single line. */
function gapLines(gaps: CoverageGap[]): { key: string; text: string }[] {
  const byTier = new Map<string, CoverageGap[]>();
  for (const gap of gaps) byTier.set(gap.tier.id, [...(byTier.get(gap.tier.id) ?? []), gap]);

  return [...byTier.values()].flatMap((tierGaps) =>
    tierGaps.length === NIST_FUNCTIONS.length
      ? [{ key: tierGaps[0].tier.id, text: `${tierPhrase(tierGaps[0].tier)} has no coverage yet. Add services to it on the Tiers page.` }]
      : tierGaps.map((gap) => ({ key: `${gap.tier.id}-${gap.fn}`, text: gap.message })),
  );
}

export function GapList({ gaps }: { gaps: CoverageGap[] }) {
  if (gaps.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-5">
        <CircleCheckIcon className="size-5 shrink-0 text-emerald-600" aria-hidden />
        <p className="font-medium">Every tier covers all six NIST CSF 2.0 functions.</p>
      </div>
    );
  }

  const lines = gapLines(gaps);
  const tierCount = new Set(gaps.map((g) => g.tier.id)).size;
  return (
    <section aria-labelledby="gaps-heading" className="border-destructive/30 bg-destructive/5 rounded-xl border p-5">
      <h2 id="gaps-heading" className="flex items-center gap-2 text-lg font-semibold">
        <TriangleAlertIcon className="text-destructive size-5" aria-hidden />
        {gaps.length} coverage {gaps.length === 1 ? "gap" : "gaps"}
        {tierCount > 1 && <span className="text-muted-foreground font-normal">across {tierCount} tiers</span>}
      </h2>
      <ul className="mt-3 space-y-1.5 text-[15px]">
        {lines.map((line) => (
          <li key={line.key} className="flex gap-2">
            <span className="text-destructive" aria-hidden>
              •
            </span>
            {line.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
