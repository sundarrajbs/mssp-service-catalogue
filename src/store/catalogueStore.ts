"use client";

import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";

import { defaultSla } from "@/lib/domain/sla";
import type { Catalogue, Inclusion, Service, SizingInputs, Sla, Tier } from "@/lib/domain/types";
import { createSeedCatalogue } from "@/lib/seed/catalogue";
import { createDefaultTiers } from "@/lib/seed/tiers";
import { cleanText, sanitizeCatalogue, sanitizeService } from "@/lib/sanitize";

type CatalogueSettings = Pick<Catalogue, "mspName" | "brandColour" | "currency" | "logo">;

export interface CatalogueActions {
  addService: (service: Omit<Service, "id">) => Service | undefined;
  updateService: (service: Service) => void;
  duplicateService: (id: string) => Service | undefined;
  deleteService: (id: string) => void;
  addTier: (name: string) => Tier | undefined;
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
  /** Replaces everything, e.g. after a validated JSON import or when switching catalogues. */
  replaceCatalogue: (catalogue: Catalogue) => void;
}

export interface CatalogueState extends CatalogueActions {
  catalogue: Catalogue;
  /** The public preview: nothing that changes the catalogue itself is allowed. */
  readOnly: boolean;
}

export type CatalogueStore = StoreApi<CatalogueState>;

function touch(catalogue: Catalogue, changes: Partial<Catalogue>): Catalogue {
  return { ...catalogue, ...changes, updatedAt: new Date().toISOString() };
}

/**
 * Creates an independent store. Each area of the app (the signed-in builder,
 * the public preview) gets its own, so the preview can never see or change a
 * user's real catalogue. Saving is handled by whoever owns the store.
 */
export function createCatalogueStore({ catalogue, readOnly = false }: { catalogue: Catalogue; readOnly?: boolean }) {
  return createStore<CatalogueState>()((set, get) => {
    const actions: CatalogueActions = {
      addService: (input) => {
        const service: Service = { ...sanitizeService(input), id: crypto.randomUUID() };
        set(({ catalogue }) => ({
          catalogue: touch(catalogue, { services: [...catalogue.services, service] }),
        }));
        return service;
      },

      updateService: (service) =>
        set(({ catalogue }) => ({
          catalogue: touch(catalogue, {
            services: catalogue.services.map((s) => (s.id === service.id ? sanitizeService(service) : s)),
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
            tiers: catalogue.tiers.map((t) =>
              t.id === id ? { ...t, ...changes, ...(changes.name !== undefined && { name: cleanText(changes.name) }) } : t,
            ),
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

      updateTierSla: (tierId, sla) => actions.updateTier(tierId, { sla }),

      updateSizing: (changes) =>
        set(({ catalogue }) => ({ catalogue: touch(catalogue, { sizing: { ...catalogue.sizing, ...changes } }) })),

      updateSettings: (settings) =>
        set(({ catalogue }) => ({
          catalogue: touch(catalogue, {
            ...settings,
            ...(settings.mspName !== undefined && { mspName: cleanText(settings.mspName) }),
          }),
        })),

      // Resetting or importing changes the contents, not which saved catalogue this is.
      resetToDefaults: () =>
        set(({ catalogue }) => ({
          catalogue: { ...createSeedCatalogue(), id: catalogue.id, createdAt: catalogue.createdAt },
        })),

      replaceCatalogue: (incoming) =>
        set(({ catalogue }) => ({
          catalogue: touch(sanitizeCatalogue(incoming), { id: catalogue.id, createdAt: catalogue.createdAt }),
        })),
    };

    return {
      catalogue,
      readOnly,
      ...(readOnly ? readOnlyActions(actions) : actions),
    };
  });
}

/**
 * Defence in depth behind the preview's disabled controls: every action that
 * changes the catalogue does nothing. Visitors may still try different sizing
 * and currency, which only affects prices shown on screen and is never saved.
 */
function readOnlyActions(actions: CatalogueActions): CatalogueActions {
  const noop = () => undefined;
  return {
    addService: noop,
    updateService: noop,
    duplicateService: noop,
    deleteService: noop,
    addTier: noop,
    updateTier: noop,
    removeTier: noop,
    moveTier: noop,
    restoreDefaultTiers: noop,
    setTierService: noop,
    updateTierSla: noop,
    updateSizing: actions.updateSizing,
    updateSettings: (settings) => {
      if (settings.currency !== undefined) actions.updateSettings({ currency: settings.currency });
    },
    resetToDefaults: noop,
    replaceCatalogue: noop,
  };
}

const CatalogueStoreContext = createContext<CatalogueStore | null>(null);

export const CatalogueStoreProvider = CatalogueStoreContext.Provider;

export function useCatalogueStoreApi(): CatalogueStore {
  const store = useContext(CatalogueStoreContext);
  if (!store) throw new Error("useCatalogueStore must be used inside a CatalogueStoreProvider");
  return store;
}

/** Reads from the nearest catalogue store, e.g. `useCatalogueStore((s) => s.catalogue.tiers)`. */
export function useCatalogueStore<T>(selector: (state: CatalogueState) => T): T {
  return useStore(useCatalogueStoreApi(), selector);
}

/** The store's actions. They never change, so this doesn't cause re-renders. */
export function useCatalogueActions(): CatalogueActions {
  return useCatalogueStoreApi().getState();
}

/** True in the public preview. */
export function useReadOnly(): boolean {
  return useCatalogueStore((s) => s.readOnly);
}
