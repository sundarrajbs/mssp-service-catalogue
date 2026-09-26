"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { TierCoverage } from "@/lib/domain/coverage";
import { NIST_FUNCTIONS } from "@/lib/domain/schema";
import { tierLabel } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/**
 * Categorical slots validated (CVD and normal vision, all pairs) for up to three
 * overlapping series in each mode; overlapping shapes need all-pairs separation,
 * so the radar compares at most three tiers at a time.
 */
const SERIES = {
  light: ["#2a78d6", "#eb6834", "#1baf7a"],
  dark: ["#3987e5", "#d95926", "#199e70"],
};
const MAX_SERIES = SERIES.light.length;

export function CoverageRadar({ coverage }: { coverage: TierCoverage[] }) {
  const { resolvedTheme } = useTheme();
  const palette = resolvedTheme === "dark" ? SERIES.dark : SERIES.light;
  const [chosen, setChosen] = useState<string[]>(() => coverage.slice(0, MAX_SERIES).map((c) => c.tier.id));

  // Keep catalogue order and drop deleted tiers; fall back to the first tiers if none remain
  // (for example after "Restore default tiers" creates new ones).
  const picked = coverage.filter((c) => chosen.includes(c.tier.id));
  const shown = picked.length > 0 ? picked : coverage.slice(0, MAX_SERIES);
  const shownIds = shown.map((c) => c.tier.id);
  const data = NIST_FUNCTIONS.map((fn, i) => ({
    fn,
    ...Object.fromEntries(shown.map((c) => [c.tier.id, c.functions[i].included.length])),
  }));

  const maxCount = Math.max(1, ...data.flatMap((row) => shownIds.map((id) => Number(row[id as keyof typeof row]) || 0)));

  const toggle = (id: string) =>
    setChosen(
      shownIds.includes(id) ? shownIds.filter((c) => c !== id) : shownIds.length < MAX_SERIES ? [...shownIds, id] : shownIds,
    );

  return (
    <div className="bg-card rounded-xl border p-5">
      {coverage.length > MAX_SERIES && (
        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Tiers to compare">
          <span className="text-muted-foreground text-sm">Compare up to {MAX_SERIES}:</span>
          {coverage.map(({ tier }) => {
            const on = shownIds.includes(tier.id);
            return (
              <button
                key={tier.id}
                type="button"
                aria-pressed={on}
                disabled={(!on && shownIds.length >= MAX_SERIES) || (on && shownIds.length === 1)}
                onClick={() => toggle(tier.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40",
                  on ? "bg-secondary font-medium" : "text-muted-foreground",
                )}
              >
                {tierLabel(tier)}
              </button>
            );
          })}
        </div>
      )}
      <div className="h-[420px]" role="img" aria-label="Radar chart of included services per NIST CSF function for each tier. The heatmap above shows the same numbers.">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="fn" tick={{ fill: "var(--foreground)", fontSize: 14, fontWeight: 500 }} />
            <PolarRadiusAxis
              angle={60}
              domain={[0, maxCount]}
              allowDecimals={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
            />
            {shown.map((c, i) => (
              <Radar
                key={c.tier.id}
                dataKey={c.tier.id}
                name={tierLabel(c.tier)}
                stroke={palette[i]}
                strokeWidth={2}
                fill={palette[i]}
                fillOpacity={0.1}
                dot={{ r: 4, strokeWidth: 2, stroke: "var(--card)", fill: palette[i] }}
                isAnimationActive={false}
              />
            ))}
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
              }}
              formatter={(value, name) => [`${value} ${value === 1 ? "service" : "services"}`, name]}
            />
            <Legend
              iconType="circle"
              itemSorter={null}
              wrapperStyle={{ paddingTop: 12 }}
              formatter={(value) => <span style={{ color: "var(--foreground)", fontSize: 14 }}>{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
