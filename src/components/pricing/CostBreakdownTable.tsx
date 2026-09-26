"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PriceLine } from "@/lib/domain/pricing";
import { PRICING_UNIT_LABELS, type Currency } from "@/lib/domain/types";
import { formatMoney, formatNumber } from "@/lib/format/currency";

interface CostBreakdownTableProps {
  caption: string;
  lines: PriceLine[];
  currency: Currency;
  /** Shows a totals row; add-ons are optional so they are not totalled. */
  totals?: { monthlyCost: number; monthlyPrice: number };
  emptyText: string;
}

export function CostBreakdownTable({ caption, lines, currency, totals, emptyText }: CostBreakdownTableProps) {
  const money = (n: number) => formatMoney(n, currency);
  const unitCost = (n: number) => formatMoney(n, currency, { decimals: n % 1 ? 2 : 0 });

  return (
    <div className="bg-card rounded-xl border">
      <Table className="text-[15px]">
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 pl-5">Service</TableHead>
            <TableHead className="h-11">Pricing unit</TableHead>
            <TableHead className="h-11 text-right">Units / month</TableHead>
            <TableHead className="h-11 text-right">Unit cost</TableHead>
            <TableHead className="h-11 text-right">Monthly cost</TableHead>
            <TableHead className="h-11 pr-5 text-right">Monthly price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                {emptyText}
              </TableCell>
            </TableRow>
          )}
          {lines.map(({ service, units, monthlyCost, monthlyPrice }) => (
            <TableRow key={service.id}>
              <TableCell className="pl-5 font-medium">{service.name}</TableCell>
              <TableCell className="text-muted-foreground">{PRICING_UNIT_LABELS[service.pricingUnit]}</TableCell>
              <TableCell className="text-right tabular-nums">{formatNumber(units, currency)}</TableCell>
              <TableCell className="text-right tabular-nums">{unitCost(service.unitCost)}</TableCell>
              <TableCell className="text-right tabular-nums">{money(monthlyCost)}</TableCell>
              <TableCell className="pr-5 text-right font-medium tabular-nums">{money(monthlyPrice)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {totals && lines.length > 0 && (
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className="pl-5" colSpan={4}>
                Total
              </TableCell>
              <TableCell className="text-right tabular-nums">{money(totals.monthlyCost)}</TableCell>
              <TableCell className="pr-5 text-right tabular-nums">{money(totals.monthlyPrice)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
