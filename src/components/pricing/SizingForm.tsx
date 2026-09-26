"use client";

import { NumberField } from "@/components/shared/NumberField";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/domain/schema";
import type { Currency, SizingInputs } from "@/lib/domain/types";

const FIELDS: { key: keyof SizingInputs; label: string; hint: string; max: number }[] = [
  { key: "endpoints", label: "Endpoints", hint: "Laptops, desktops and servers", max: 10_000_000 },
  { key: "users", label: "Users", hint: "Mailboxes and identities", max: 10_000_000 },
  { key: "gbPerDay", label: "Log volume (GB/day)", hint: "Average daily ingest", max: 1_000_000 },
  { key: "contractMonths", label: "Contract length (months)", hint: "Typically 12, 24 or 36", max: 120 },
];

const CURRENCY_LABELS: Record<Currency, string> = { INR: "INR (₹)", USD: "USD ($)" };

interface SizingFormProps {
  sizing: SizingInputs;
  currency: Currency;
  onSizingChange: (changes: Partial<SizingInputs>) => void;
  onCurrencyChange: (currency: Currency) => void;
}

export function SizingForm({ sizing, currency, onSizingChange, onCurrencyChange }: SizingFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Customer sizing</CardTitle>
        <CardDescription>Prices update as you type.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {FIELDS.map(({ key, label, hint, max }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`sizing-${key}`}>{label}</Label>
            <NumberField
              id={`sizing-${key}`}
              className="h-11 text-lg font-medium"
              value={sizing[key]}
              max={max}
              aria-describedby={`sizing-${key}-hint`}
              onValueChange={(value) => onSizingChange({ [key]: value })}
            />
            <p id={`sizing-${key}-hint`} className="text-muted-foreground text-xs">
              {hint}
            </p>
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="sizing-currency">Currency</Label>
          <Select value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
            <SelectTrigger id="sizing-currency" className="h-11! w-full text-base" aria-describedby="sizing-currency-hint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p id="sizing-currency-hint" className="text-muted-foreground text-xs">
            Relabels prices; unit costs are not converted.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
