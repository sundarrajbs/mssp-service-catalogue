"use client";

import Link from "next/link";
import { PencilIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { GuardedButton } from "@/components/preview/GuardedButton";
import { Button } from "@/components/ui/button";
import { useBuilderHref } from "@/components/layout/BuilderContext";
import { useCatalogueStore, useReadOnly } from "@/store/catalogueStore";
import { SlaEditor } from "./SlaEditor";

export function SlasPage() {
  const href = useBuilderHref();
  const tiers = useCatalogueStore((s) => s.catalogue.tiers);
  const updateTierSla = useCatalogueStore((s) => s.updateTierSla);
  const readOnly = useReadOnly();

  return (
    <>
      <PageHeader
        title="Service levels"
        description="Coverage hours, response and resolution targets per severity, and reporting cadence for each tier. P1 targets must be tighter than P4."
        actions={
          readOnly && (
            <GuardedButton variant="outline" action="edit service levels">
              <PencilIcon aria-hidden />
              Edit SLAs
            </GuardedButton>
          )
        }
      />
      {tiers.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <p>Create tiers first, then set their SLAs here.</p>
          <Button asChild>
            <Link href={href("/tiers")}>Go to Tiers</Link>
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
