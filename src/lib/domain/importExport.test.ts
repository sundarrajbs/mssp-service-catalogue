import { describe, expect, it } from "vitest";

import { createSeedCatalogue } from "@/lib/seed/catalogue";
import { catalogueToJson, exportFileName, parseCatalogueJson } from "./importExport";

describe("parseCatalogueJson", () => {
  it("round-trips an exported catalogue", () => {
    const catalogue = createSeedCatalogue();
    const result = parseCatalogueJson(catalogueToJson(catalogue));
    expect(result).toEqual({ ok: true, catalogue });
  });

  it("rejects text that isn't JSON", () => {
    const result = parseCatalogueJson("not json {");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/isn't valid JSON/);
  });

  it("rejects JSON that isn't an object", () => {
    expect(parseCatalogueJson("[1,2,3]").ok).toBe(false);
    expect(parseCatalogueJson("null").ok).toBe(false);
  });

  it("rejects an unknown format version with a clear message", () => {
    const result = parseCatalogueJson(JSON.stringify({ ...createSeedCatalogue(), schemaVersion: 99 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toEqual(["This file uses catalogue format version 99, which this app can't read."]);
  });

  it("reports the path of invalid fields", () => {
    const catalogue = createSeedCatalogue();
    const broken = JSON.parse(catalogueToJson(catalogue));
    broken.services[2].unitCost = "cheap";
    broken.tiers[0].sla.coverage = "9x9";
    const result = parseCatalogueJson(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.startsWith("services[2].unitCost:"))).toBe(true);
      expect(result.errors.some((e) => e.startsWith("tiers[0].sla.coverage:"))).toBe(true);
    }
  });

  it("says when a field is missing", () => {
    const broken = JSON.parse(catalogueToJson(createSeedCatalogue()));
    delete broken.mspName;
    const result = parseCatalogueJson(JSON.stringify(broken));
    expect(result).toEqual({ ok: false, errors: ["mspName: Missing"] });
  });

  it("rejects tiers that refer to missing services", () => {
    const broken = JSON.parse(catalogueToJson(createSeedCatalogue()));
    broken.tiers[0].services.push({ serviceId: "svc-ghost", inclusion: "included" });
    const result = parseCatalogueJson(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/svc-ghost/);
  });

  it("rejects duplicate service ids", () => {
    const broken = JSON.parse(catalogueToJson(createSeedCatalogue()));
    broken.services[1].id = broken.services[0].id;
    expect(parseCatalogueJson(JSON.stringify(broken)).ok).toBe(false);
  });

  it("rejects logos that aren't PNG or JPEG data URLs", () => {
    const withSvg = { ...createSeedCatalogue(), logo: "data:image/svg+xml;base64,PHN2Zz4=" };
    const withUrl = { ...createSeedCatalogue(), logo: "https://example.com/logo.png" };
    const withPng = { ...createSeedCatalogue(), logo: "data:image/png;base64,iVBORw0KGgo=" };
    expect(parseCatalogueJson(JSON.stringify(withSvg)).ok).toBe(false);
    expect(parseCatalogueJson(JSON.stringify(withUrl)).ok).toBe(false);
    expect(parseCatalogueJson(JSON.stringify(withPng)).ok).toBe(true);
  });

  it("limits the number of reported problems", () => {
    const broken = JSON.parse(catalogueToJson(createSeedCatalogue()));
    for (const service of broken.services) service.unitCost = -1;
    const result = parseCatalogueJson(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(9);
      expect(result.errors[8]).toBe("…and 7 more problems");
    }
  });
});

describe("exportFileName", () => {
  const date = new Date("2026-09-26T10:00:00Z");
  it("slugifies the MSSP name", () => {
    expect(exportFileName("Acme Secure (India) Pvt. Ltd.", "json", date)).toBe(
      "acme-secure-india-pvt-ltd-catalogue-2026-09-26.json",
    );
  });
  it("falls back when the name has no usable characters", () => {
    expect(exportFileName("  !!  ", "pdf", date, "tiers")).toBe("mssp-tiers-2026-09-26.pdf");
  });
});
