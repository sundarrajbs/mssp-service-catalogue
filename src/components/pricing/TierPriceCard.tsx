"use client";

import { NumberField } from "@/components/shared/NumberField";
import { Label } from "@/components/ui/label";
import type { TierPricing } from "@/lib/domain/pricing";
import { tierLabel, type Currency, type Tier } from "@/lib/domain/types";
import { formatCompactMoney, formatMoney } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { useReadOnly } from "@/store/catalogueStore";

interface TierPriceCardProps {
  tier: Tier;
  pricing: TierPricing;
  currency: Currency;
  contractMonths: number;
  selected: boolean;
  onSelect: () => void;
  onMarginChange: (marginPercent: number) => void;
}

export function TierPriceCard({
  tier,
  pricing,
  currency,
  contractMonths,
  selected,
  onSelect,
  onMarginChange,
}: TierPriceCardProps) {
  const readOnly = useReadOnly();
  const money = (n: number) => formatMoney(n, currency);
  const marginId = `margin-${tier.id}`;

  return (
    <article
      className={cn(
        "bg-card flex flex-col gap-5 rounded-xl border p-6 shadow-sm transition-shadow",
        selected && "ring-brand ring-2",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">{tierLabel(tier)}</h2>
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="text-brand cursor-pointer text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
        >
          {selected ? "Showing breakdown" : "Show breakdown"}
        </button>
      </header>

      <div>
        <p className="text-muted-foreground text-sm">Monthly price</p>
        <p className="text-4xl font-semibold tracking-tight tabular-nums">{money(pricing.monthlyPrice)}</p>
        <p className="text-muted-foreground mt-1 text-sm tabular-nums">
          {formatCompactMoney(pricing.contractPrice, currency)} over {contractMonths} months
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Monthly cost</dt>
          <dd className="font-medium tabular-nums">{money(pricing.monthlyCost)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Monthly margin</dt>
          <dd className="font-medium tabular-nums">{money(pricing.monthlyMargin)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Contract total</dt>
          <dd className="font-medium tabular-nums">{money(pricing.contractPrice)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Contract margin</dt>
          <dd className="font-medium tabular-nums">{money(pricing.contractMargin)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Per endpoint / month</dt>
          <dd className="font-medium tabular-nums">
            {pricing.monthlyPricePerEndpoint === null
              ? "—"
              : formatMoney(pricing.monthlyPricePerEndpoint, currency, { decimals: 2 })}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Services</dt>
          <dd className="font-medium">
            {pricing.lines.length} included
            {pricing.addOns.length > 0 && ` · ${pricing.addOns.length} add-ons`}
          </dd>
        </div>
      </dl>

      <div className="flex items-end gap-3 border-t pt-4">
        <div className="w-28 space-y-2">
          <Label htmlFor={marginId}>Margin %</Label>
          <NumberField
            id={marginId}
            value={tier.marginPercent}
            max={1000}
            disabled={readOnly}
            onValueChange={onMarginChange}
          />
        </div>
        <p className="text-muted-foreground pb-2 text-xs">
          {readOnly ? "Sign in to change margins · markup on cost" : "Markup on cost"}
          {pricing.grossMarginPercent !== null && <> · {pricing.grossMarginPercent.toFixed(1)}% of price</>}
        </p>
      </div>
    </article>
  );
}
