"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { useBuilderHref } from "@/components/layout/BuilderContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DAYS_PER_MONTH, priceTier } from "@/lib/domain/pricing";
import { tierLabel } from "@/lib/domain/types";
import { formatMoney } from "@/lib/format/currency";
import { useCatalogueActions, useCatalogueStore } from "@/store/catalogueStore";
import { CostBreakdownTable } from "./CostBreakdownTable";
import { SizingForm } from "./SizingForm";
import { TierPriceCard } from "./TierPriceCard";

export function PricingPage() {
  const href = useBuilderHref();
  const catalogue = useCatalogueStore((s) => s.catalogue);
  const { updateSizing, updateSettings, updateTier } = useCatalogueActions();
  const { services, tiers, sizing, currency } = catalogue;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const priced = useMemo(
    () => tiers.map((tier) => ({ tier, pricing: priceTier(tier, services, sizing) })),
    [tiers, services, sizing],
  );
  const selected = priced.find((p) => p.tier.id === selectedId) ?? priced[0];

  return (
    <>
      <PageHeader
        title="Pricing"
        description={`Monthly and contract prices for each tier. Service cost = unit cost × units; tier price = total cost + margin. GB-day services use daily volume × ${DAYS_PER_MONTH} days.`}
      />

      <SizingForm
        sizing={sizing}
        currency={currency}
        onSizingChange={updateSizing}
        onCurrencyChange={(c) => updateSettings({ currency: c })}
      />

      {tiers.length === 0 ? (
        <div className="text-muted-foreground mt-8 flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <p>Create tiers first to see their prices.</p>
          <Button asChild>
            <Link href={href("/tiers")}>Go to Tiers</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-5">
            {priced.map(({ tier, pricing }) => (
              <TierPriceCard
                key={tier.id}
                tier={tier}
                pricing={pricing}
                currency={currency}
                contractMonths={sizing.contractMonths}
                selected={tier.id === selected?.tier.id}
                onSelect={() => setSelectedId(tier.id)}
                onMarginChange={(marginPercent) => updateTier(tier.id, { marginPercent })}
              />
            ))}
          </div>

          {selected && (
            <section className="mt-12 space-y-8" aria-labelledby="breakdown-heading">
              <div>
                <h2 id="breakdown-heading" className="text-2xl font-semibold tracking-tight">
                  {tierLabel(selected.tier)} cost breakdown
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Margin of {selected.tier.marginPercent}% adds {formatMoney(selected.pricing.monthlyMargin, currency)} a
                  month.
                </p>
              </div>
              <CostBreakdownTable
                caption={`Included services in ${tierLabel(selected.tier)}`}
                lines={selected.pricing.lines}
                currency={currency}
                totals={selected.pricing}
                emptyText="No services are included in this tier yet."
              />
              <div>
                <h3 className="mb-1 text-lg font-semibold">Optional add-ons</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Priced individually with the tier&apos;s margin and not included in the tier price.
                </p>
                <CostBreakdownTable
                  caption={`Optional add-ons for ${tierLabel(selected.tier)}`}
                  lines={selected.pricing.addOns}
                  currency={currency}
                  emptyText="No add-ons offered with this tier."
                />
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
