import type { Currency } from "@/lib/domain/types";

const LOCALES: Record<Currency, string> = { INR: "en-IN", USD: "en-US" };
const SYMBOLS: Record<Currency, string> = { INR: "₹", USD: "$" };

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

/** Short form for headlines: ₹1.25 Cr, ₹12.5 L, $1.3M. Small amounts are shown in full. */
export function formatCompactMoney(amount: number, currency: Currency): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const trim = (n: number) => Number(n.toFixed(2)).toString();

  if (currency === "INR") {
    if (abs >= 1e7) return `${sign}${SYMBOLS.INR}${trim(abs / 1e7)} Cr`;
    if (abs >= 1e5) return `${sign}${SYMBOLS.INR}${trim(abs / 1e5)} L`;
    return formatMoney(amount, currency);
  }
  if (abs >= 1e6) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return formatMoney(amount, currency);
}

export function formatNumber(value: number, currency: Currency): string {
  return new Intl.NumberFormat(LOCALES[currency], { maximumFractionDigits: 2 }).format(value);
}
