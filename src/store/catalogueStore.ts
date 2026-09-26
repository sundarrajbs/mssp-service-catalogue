"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

import { CATALOGUE_SCHEMA_VERSION } from "@/lib/domain/schema";
import { defaultSla } from "@/lib/domain/sla";
import type { Catalogue, Inclusion, Service, SizingInputs, Sla, Tier } from "@/lib/domain/types";
import { catalogueRepository } from "@/lib/repository";
import { createSeedCatalogue } from "@/lib/seed/catalogue";
import { createDefaultTiers } from "@/lib/seed/tiers";

type CatalogueSettings = Pick<Catalogue, "mspName" | "brandColour" | "currency" | "logo">;

interface CatalogueState {
  catalogue: Catalogue;
  addService: (service: Omit<Service, "id">) => Service;
  updateService: (service: Service) => void;
  duplicateService: (id: string) => Service | undefined;
  deleteService: (id: string) => void;
  addTier: (name: string) => Tier;
  updateTier: (id: string, changes: Partial<Pick<Tier, "name" | "marginPercent" | "sla">>) => void;
  removeTier: (id: string) => void;
  moveTier: (id: string, direction: -1 | 1) => void;
  restoreDefaultTiers: () => void;
  /** Adds, moves or re-classifies a service in a tier; `null` removes it. */
  setTierService: (tierId: string, serviceId: string, inclusion: Inclusion | null) => void;
  updateTierSla: (tierId: string, sla: Sla) => void;
  updateSizing: (changes: Partial<SizingInputs>) => void;
  updateSettings: (settings: Partial<CatalogueSettings>) => void;
  resetToDefaults: () => void;
  /** Replaces everything, e.g. after a validated JSON import. */
  replaceCatalogue: (catalogue: Catalogue) => void;
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

      addTier: (name) => {
        const tier: Tier = { id: crypto.randomUUID(), name, services: [], sla: defaultSla(), marginPercent: 30 };
        set(({ catalogue }) => ({ catalogue: touch(catalogue, { tiers: [...catalogue.tiers, tier] }) }));
        return tier;
      },

      updateTier: (id, changes) =>
        set(({ catalogue }) => ({
          catalogue: touch(catalogue, {
            tiers: catalogue.tiers.map((t) => (t.id === id ? { ...t, ...changes } : t)),
          }),
        })),

      removeTier: (id) =>
        set(({ catalogue }) => ({
          catalogue: touch(catalogue, { tiers: catalogue.tiers.filter((t) => t.id !== id) }),
        })),

      moveTier: (id, direction) =>
        set(({ catalogue }) => {
          const tiers = [...catalogue.tiers];
          const from = tiers.findIndex((t) => t.id === id);
          const to = from + direction;
          if (from === -1 || to < 0 || to >= tiers.length) return {};
          [tiers[from], tiers[to]] = [tiers[to], tiers[from]];
          return { catalogue: touch(catalogue, { tiers }) };
        }),

      restoreDefaultTiers: () =>
        set(({ catalogue }) => {
          // Only keep references to services that still exist in the library.
          const serviceIds = new Set(catalogue.services.map((s) => s.id));
          const tiers = createDefaultTiers().map((t) => ({
            ...t,
            services: t.services.filter((ts) => serviceIds.has(ts.serviceId)),
          }));
          return { catalogue: touch(catalogue, { tiers }) };
        }),

      setTierService: (tierId, serviceId, inclusion) =>
        set(({ catalogue }) => ({
          catalogue: touch(catalogue, {
            tiers: catalogue.tiers.map((t) => {
              if (t.id !== tierId) return t;
              const exists = t.services.some((ts) => ts.serviceId === serviceId);
              if (inclusion === null) return { ...t, services: t.services.filter((ts) => ts.serviceId !== serviceId) };
              if (exists) {
                return {
                  ...t,
                  services: t.services.map((ts) => (ts.serviceId === serviceId ? { ...ts, inclusion } : ts)),
                };
              }
              return { ...t, services: [...t.services, { serviceId, inclusion }] };
            }),
          }),
        })),

      updateTierSla: (tierId, sla) => get().updateTier(tierId, { sla }),

      updateSizing: (changes) =>
        set(({ catalogue }) => ({ catalogue: touch(catalogue, { sizing: { ...catalogue.sizing, ...changes } }) })),

      updateSettings: (settings) =>
        set(({ catalogue }) => ({ catalogue: touch(catalogue, settings) })),

      resetToDefaults: () => set({ catalogue: createSeedCatalogue() }),

      replaceCatalogue: (catalogue) => set({ catalogue }),
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
