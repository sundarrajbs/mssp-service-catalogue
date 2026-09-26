import { describe, expect, it } from "vitest";

import { createSeedCatalogue } from "@/lib/seed/catalogue";
import { cleanText, sanitizeCatalogue } from "./sanitize";

describe("cleanText", () => {
  it("keeps ordinary text, punctuation, newlines and tabs", () => {
    const text = "Line one – ₹1,50,000 & <b>“quotes”</b>\n\tLine two";
    expect(cleanText(text)).toBe(text);
  });

  it("strips control characters", () => {
    expect(cleanText("a\u0000b\u0007c\u001Bd\u007Fe")).toBe("abcde");
  });

  it("strips bidirectional overrides used to disguise text", () => {
    expect(cleanText("invoice‮gpj.exe")).toBe("invoicegpj.exe");
  });

  it("strips zero-width and invisible formatting characters", () => {
    expect(cleanText("S​h‍i﻿eld⁠")).toBe("Shield");
  });
});

describe("sanitizeCatalogue", () => {
  it("cleans every free-text field", () => {
    const catalogue = createSeedCatalogue();
    catalogue.mspName = "Acme\u0000";
    catalogue.services[0].name = "Mon​itoring";
    catalogue.services[0].deliverables = ["Report\u0007"];
    catalogue.tiers[0].name = "Gold‮";

    const clean = sanitizeCatalogue(catalogue);
    expect(clean.mspName).toBe("Acme");
    expect(clean.services[0].name).toBe("Monitoring");
    expect(clean.services[0].deliverables).toEqual(["Report"]);
    expect(clean.tiers[0].name).toBe("Gold");
  });

  it("leaves clean data unchanged", () => {
    const catalogue = createSeedCatalogue();
    expect(sanitizeCatalogue(catalogue)).toEqual(catalogue);
  });
});
