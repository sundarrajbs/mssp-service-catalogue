"use client";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useCatalogueStore } from "@/store/catalogueStore";
import { SlaEditor } from "./SlaEditor";

export function SlasPage() {
  const tiers = useCatalogueStore((s) => s.catalogue.tiers);
  const updateTierSla = useCatalogueStore((s) => s.updateTierSla);

  return (
    <>
      <PageHeader
        title="Service levels"
        description="Coverage hours, response and resolution targets per severity, and reporting cadence for each tier. P1 targets must be tighter than P4."
      />
      {tiers.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <p>Create tiers first, then set their SLAs here.</p>
          <Button asChild>
            <Link href="/tiers">Go to Tiers</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {tiers.map((tier) => (
            <SlaEditor key={tier.id} tier={tier} onChange={(sla) => updateTierSla(tier.id, sla)} />
          ))}
        </div>
      )}
    </>
  );
}
