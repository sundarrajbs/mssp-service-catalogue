"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CatalogueValidationError } from "@/lib/repository";
import { LocalStorageCatalogueRepository } from "@/lib/repository/localStorageRepository";
import { createSeedCatalogue } from "@/lib/seed/catalogue";
import { CatalogueStoreProvider, createCatalogueStore, type CatalogueStore } from "@/store/catalogueStore";

export type GuestSaveStatus = "saved" | "pending" | "error";

const GuestStatusContext = createContext<{ status: GuestSaveStatus; error?: string }>({ status: "saved" });

export function useGuestSaveStatus() {
  return useContext(GuestStatusContext);
}

const AUTOSAVE_DELAY_MS = 400;

/**
 * The builder for visitors who haven't signed in: one catalogue kept in this
 * browser's localStorage and saved automatically. Signing in later offers to
 * copy it into the account.
 */
export function GuestWorkspace({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<CatalogueStore | null>(null);
  const [status, setStatus] = useState<GuestSaveStatus>("saved");
  const [error, setError] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Browser storage only exists on the client, so load after mounting.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let catalogue = createSeedCatalogue();
      try {
        const local = new LocalStorageCatalogueRepository();
        const [summary] = await local.list();
        const stored = summary && (await local.load(summary.id));
        if (stored) catalogue = stored.catalogue;
      } catch {
        // Storage blocked (e.g. some private modes): work in memory only.
      }
      if (!cancelled) setStore(createCatalogueStore({ catalogue }));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save shortly after each change.
  useEffect(() => {
    if (!store) return;
    const save = async () => {
      try {
        await new LocalStorageCatalogueRepository().save(store.getState().catalogue);
        setStatus("saved");
        setError(undefined);
      } catch (e) {
        setStatus("error");
        const message =
          e instanceof CatalogueValidationError
            ? `Not saved: ${e.problems[0]}`
            : "Couldn't save in this browser (storage may be full or blocked). Export a JSON backup.";
        setError(message);
        toast.error(message);
      }
    };
    const unsubscribe = store.subscribe((state, previous) => {
      if (state.catalogue === previous.catalogue) return;
      setStatus("pending");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
    });
    const flush = () => {
      if (document.visibilityState === "hidden" && timer.current) {
        clearTimeout(timer.current);
        void save();
      }
    };
    document.addEventListener("visibilitychange", flush);
    return () => {
      unsubscribe();
      clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [store]);

  if (!store) {
    return (
      <div className="text-muted-foreground flex min-h-screen items-center justify-center text-sm" role="status">
        Loading your catalogue…
      </div>
    );
  }

  return (
    <GuestStatusContext.Provider value={{ status, error }}>
      <CatalogueStoreProvider value={store}>{children}</CatalogueStoreProvider>
    </GuestStatusContext.Provider>
  );
}
