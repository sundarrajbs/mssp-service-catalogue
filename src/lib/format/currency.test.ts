import { describe, expect, it } from "vitest";

import { formatCompactMoney, formatMoney } from "./currency";

describe("formatMoney", () => {
  it("uses lakh/crore grouping for INR", () => {
    expect(formatMoney(12345678, "INR")).toBe("₹1,23,45,678");
    expect(formatMoney(150000, "INR")).toBe("₹1,50,000");
    expect(formatMoney(999, "INR")).toBe("₹999");
  });

  it("uses thousands grouping for USD", () => {
    expect(formatMoney(12345678, "USD")).toBe("$12,345,678");
  });

  it("rounds to whole units by default and supports decimals", () => {
    expect(formatMoney(1234.567, "INR")).toBe("₹1,235");
    expect(formatMoney(1234.5, "USD", { decimals: 2 })).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(formatMoney(0, "INR")).toBe("₹0");
  });
});

describe("formatCompactMoney", () => {
  it("uses crore and lakh for INR", () => {
    expect(formatCompactMoney(12500000, "INR")).toBe("₹1.25 Cr");
    expect(formatCompactMoney(1250000, "INR")).toBe("₹12.5 L");
    expect(formatCompactMoney(100000, "INR")).toBe("₹1 L");
    expect(formatCompactMoney(99999, "INR")).toBe("₹99,999");
  });

  it("uses millions for large USD amounts", () => {
    expect(formatCompactMoney(1250000, "USD")).toBe("$1.25M");
    expect(formatCompactMoney(99999, "USD")).toBe("$99,999");
  });
});
