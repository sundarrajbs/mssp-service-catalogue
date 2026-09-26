import { describe, expect, it } from "vitest";

import { createSeedCatalogue } from "@/lib/seed/catalogue";
import { createCatalogueStore } from "./catalogueStore";

describe("createCatalogueStore", () => {
  it("creates independent stores", () => {
    const a = createCatalogueStore({ catalogue: createSeedCatalogue() });
    const b = createCatalogueStore({ catalogue: createSeedCatalogue() });
    a.getState().deleteService(a.getState().catalogue.services[0].id);
    expect(a.getState().catalogue.services).toHaveLength(14);
    expect(b.getState().catalogue.services).toHaveLength(15);
  });

  it("applies edits in normal mode", () => {
    const store = createCatalogueStore({ catalogue: createSeedCatalogue() });
    store.getState().updateSettings({ mspName: "Acme" });
    store.getState().addTier("Gold");
    expect(store.getState().catalogue.mspName).toBe("Acme");
    expect(store.getState().catalogue.tiers).toHaveLength(4);
  });
});

describe("catalogue identity", () => {
  it("keeps the catalogue id when resetting or importing, so the same saved record is updated", () => {
    const store = createCatalogueStore({ catalogue: createSeedCatalogue() });
    const { id } = store.getState().catalogue;
    store.getState().resetToDefaults();
    expect(store.getState().catalogue.id).toBe(id);
    store.getState().replaceCatalogue({ ...createSeedCatalogue(), mspName: "Imported" });
    expect(store.getState().catalogue.id).toBe(id);
    expect(store.getState().catalogue.mspName).toBe("Imported");
  });
});

describe("read-only store (public preview)", () => {
  const readOnlyStore = () => createCatalogueStore({ catalogue: createSeedCatalogue(), readOnly: true });

  it("ignores every action that changes the catalogue", () => {
    const store = readOnlyStore();
    const before = structuredClone(store.getState().catalogue);
    const { catalogue, ...actions } = store.getState();
    const service = catalogue.services[0];
    const tier = catalogue.tiers[0];

    expect(actions.addService({ ...service, name: "New" })).toBeUndefined();
    actions.updateService({ ...service, name: "Changed" });
    expect(actions.duplicateService(service.id)).toBeUndefined();
    actions.deleteService(service.id);
    expect(actions.addTier("Extra")).toBeUndefined();
    actions.updateTier(tier.id, { name: "Renamed", marginPercent: 99 });
    actions.removeTier(tier.id);
    actions.moveTier(tier.id, 1);
    actions.restoreDefaultTiers();
    actions.setTierService(tier.id, service.id, null);
    actions.updateTierSla(tier.id, { ...tier.sla, coverage: "8x5" });
    actions.updateSettings({ mspName: "Hacked", brandColour: "#000000", logo: "data:image/png;base64,AAAA" });
    actions.resetToDefaults();
    actions.replaceCatalogue(createSeedCatalogue());

    expect(store.getState().catalogue).toEqual(before);
  });

  it("still lets visitors try different sizing and currency", () => {
    const store = readOnlyStore();
    store.getState().updateSizing({ endpoints: 1234 });
    store.getState().updateSettings({ currency: "USD", mspName: "Ignored" });
    expect(store.getState().catalogue.sizing.endpoints).toBe(1234);
    expect(store.getState().catalogue.currency).toBe("USD");
    expect(store.getState().catalogue.mspName).not.toBe("Ignored");
  });
});
