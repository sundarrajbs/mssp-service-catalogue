"use client";

import { useMemo } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { coverageGaps, tierCoverage } from "@/lib/domain/coverage";
import { useCatalogueStore } from "@/store/catalogueStore";
import { CoverageHeatmap } from "./CoverageHeatmap";
import { CoverageRadar } from "./CoverageRadar";
import { GapList } from "./GapList";

export function CoveragePage() {
  const services = useCatalogueStore((s) => s.catalogue.services);
  const tiers = useCatalogueStore((s) => s.catalogue.tiers);

  const coverage = useMemo(() => tiers.map((tier) => tierCoverage(tier, services)), [tiers, services]);
  const gaps = useMemo(() => coverageGaps(tiers, services), [tiers, services]);

  return (
    <>
      <PageHeader
        title="NIST CSF 2.0 coverage"
        description="How each tier's included services map to the six Cybersecurity Framework functions. Add-ons don't count towards coverage until they are bought."
      />
      {tiers.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <p>Create tiers first to see their coverage.</p>
          <Button asChild>
            <Link href="/tiers">Go to Tiers</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <GapList gaps={gaps} />
          <section aria-labelledby="heatmap-heading">
            <h2 id="heatmap-heading" className="mb-1 text-2xl font-semibold tracking-tight">
              Coverage heatmap
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Each cell is the number of included services covering that function. Hover or focus a cell to see them.
            </p>
            <CoverageHeatmap coverage={coverage} />
          </section>
          <section aria-labelledby="radar-heading">
            <h2 id="radar-heading" className="mb-1 text-2xl font-semibold tracking-tight">
              Coverage shape
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              The same numbers as a radar, to compare the balance of each tier at a glance.
            </p>
            <CoverageRadar coverage={coverage} />
          </section>
        </div>
      )}
    </>
  );
}
