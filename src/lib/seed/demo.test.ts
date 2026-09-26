import { describe, expect, it } from "vitest";

import { parseCatalogueJson } from "@/lib/domain/importExport";
import { createDemoCatalogue } from "./demo";

describe("createDemoCatalogue", () => {
  it("is a valid catalogue", () => {
    expect(parseCatalogueJson(JSON.stringify(createDemoCatalogue())).ok).toBe(true);
  });

  it("is identical every time (safe to render on server and client)", () => {
    expect(createDemoCatalogue()).toEqual(createDemoCatalogue());
  });

  it("uses the fictional MSSP and its own tier names", () => {
    const demo = createDemoCatalogue();
    expect(demo.mspName).toBe("Sentinel Shield Managed Services");
    expect(demo.tiers.map((t) => t.name)).toEqual(["Core", "Plus", "Elite"]);
  });
});
