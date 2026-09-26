"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

import { CATALOGUE_SCHEMA_VERSION } from "@/lib/domain/schema";
import type { Catalogue, Service } from "@/lib/domain/types";
import { catalogueRepository } from "@/lib/repository";
import { createSeedCatalogue } from "@/lib/seed/catalogue";

type CatalogueSettings = Pick<Catalogue, "mspName" | "brandColour" | "currency" | "logo">;

interface CatalogueState {
  catalogue: Catalogue;
  addService: (service: Omit<Service, "id">) => Service;
  updateService: (service: Service) => void;
  duplicateService: (id: string) => Service | undefined;
  deleteService: (id: string) => void;
  updateSettings: (settings: Partial<CatalogueSettings>) => void;
  resetToDefaults: () => void;
}

type PersistedState = Pick<CatalogueState, "catalogue">;

/** Adapts the repository to Zustand's persist middleware. */
const repositoryStorage: PersistStorage<PersistedState> = {
  getItem: async () => {
    const catalogue = await catalogueRepository.load();
    return catalogue ? { state: { catalogue }, version: catalogue.schemaVersion } : null;
  },
  setItem: async (_name, value) => catalogueRepository.save(value.state.catalogue),
  removeItem: async () => catalogueRepository.clear(),
};

function touch(catalogue: Catalogue, changes: Partial<Catalogue>): Catalogue {
  return { ...catalogue, ...changes, updatedAt: new Date().toISOString() };
}

export const useCatalogueStore = create<CatalogueState>()(
  persist(
    (set, get) => ({
      catalogue: createSeedCatalogue(),

      addService: (input) => {
        const service: Service = { ...input, id: crypto.randomUUID() };
        set(({ catalogue }) => ({
          catalogue: touch(catalogue, { services: [...catalogue.services, service] }),
        }));
        return service;
      },

      updateService: (service) =>
        set(({ catalogue }) => ({
          catalogue: touch(catalogue, {
            services: catalogue.services.map((s) => (s.id === service.id ? service : s)),
          }),
        })),

      duplicateService: (id) => {
        const { catalogue } = get();
        const index = catalogue.services.findIndex((s) => s.id === id);
        if (index === -1) return undefined;
        const original = catalogue.services[index];
        const copy: Service = { ...structuredClone(original), id: crypto.randomUUID(), name: `${original.name} (copy)` };
        const services = [...catalogue.services];
        services.splice(index + 1, 0, copy);
        set({ catalogue: touch(catalogue, { services }) });
        return copy;
      },

      deleteService: (id) =>
        set(({ catalogue }) => ({
          catalogue: touch(catalogue, {
            services: catalogue.services.filter((s) => s.id !== id),
            tiers: catalogue.tiers.map((tier) => ({
              ...tier,
              services: tier.services.filter((ts) => ts.serviceId !== id),
            })),
          }),
        })),

      updateSettings: (settings) =>
        set(({ catalogue }) => ({ catalogue: touch(catalogue, settings) })),

      resetToDefaults: () => set({ catalogue: createSeedCatalogue() }),
    }),
    {
      name: "catalogue",
      version: CATALOGUE_SCHEMA_VERSION,
      storage: repositoryStorage,
      partialize: (state) => ({ catalogue: state.catalogue }),
      // Hydrated explicitly on the client (see StoreHydration) to avoid SSR mismatches.
      skipHydration: true,
    },
  ),
);
