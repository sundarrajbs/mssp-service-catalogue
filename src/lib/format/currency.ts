import type { Currency } from "@/lib/domain/types";

const LOCALES: Record<Currency, string> = { INR: "en-IN", USD: "en-US" };

/** Formats an amount; INR uses lakh/crore grouping (₹12,34,567). */
export function formatMoney(amount: number, currency: Currency, options: { decimals?: number } = {}): string {
  const decimals = options.decimals ?? 0;
  return new Intl.NumberFormat(LOCALES[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
