"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createCatalogue } from "@/app/app/catalogue-actions";
import { validateCatalogue } from "@/lib/domain/importExport";
import type { Catalogue } from "@/lib/domain/types";
import { CatalogueValidationError, type CatalogueSummary, type StoredCatalogue } from "@/lib/repository";
import { createSeedCatalogue } from "@/lib/seed/catalogue";
import { CatalogueStoreProvider, createCatalogueStore, type CatalogueStore } from "@/store/catalogueStore";
import { LegacyImportDialog } from "./LegacyImportDialog";
import { ServerActionRepository, SignedOutError } from "./ServerActionRepository";

export type SaveStatus = "saved" | "pending" | "saving" | "error";

interface WorkspaceContextValue {
  user: { id: string; email: string };
  summaries: CatalogueSummary[];
  current: CatalogueSummary;
  saveStatus: SaveStatus;
  saveError?: string;
  retrySave: () => void;
  switchTo: (id: string) => Promise<void>;
  /** Resolves to true once the new catalogue is saved and open. */
  createNew: (catalogue?: Catalogue, name?: string) => Promise<boolean>;
  duplicateCurrent: () => Promise<void>;
  renameCurrent: (name: string) => Promise<void>;
  deleteCurrent: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside CatalogueWorkspace");
  return value;
}

const AUTOSAVE_DELAY_MS = 800;
const repository = new ServerActionRepository();

/**
 * The signed-in builder's data: the user's catalogues, the open one in a
 * store, and autosave to Postgres (validated before every save).
 */
export function CatalogueWorkspace({
  user,
  initial,
  children,
}: {
  user: { id: string; email: string };
  initial: { summaries: CatalogueSummary[]; current: StoredCatalogue };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [summaries, setSummaries] = useState(initial.summaries);
  const [open, setOpen] = useState<StoredCatalogue>(initial.current);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [saveError, setSaveError] = useState<string>();

  // A fresh store for each opened catalogue.
  const store = useMemo<CatalogueStore>(() => createCatalogueStore({ catalogue: open.catalogue }), [open]);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlight = useRef<Promise<void> | null>(null);
  const dirty = useRef(false);

  const upsertSummary = useCallback((summary: CatalogueSummary) => {
    setSummaries((list) =>
      [summary, ...list.filter((s) => s.id !== summary.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  }, []);

  const handleSignedOut = useCallback(() => {
    toast.error("Your session has ended. Please sign in again.");
    router.push(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
  }, [router]);

  /** Saves the store's current catalogue now (one save at a time). */
  const saveNow = useCallback(async () => {
    clearTimeout(timer.current);
    if (inFlight.current) await inFlight.current;
    if (!dirty.current) return;
    dirty.current = false;
    const catalogue = store.getState().catalogue;

    const check = validateCatalogue(catalogue);
    if (!check.ok) {
      setSaveStatus("error");
      setSaveError(`Not saved: ${check.errors[0]}`);
      return;
    }

    setSaveStatus("saving");
    inFlight.current = repository
      .save(catalogue)
      .then((summary) => {
        upsertSummary(summary);
        if (!dirty.current) setSaveStatus("saved");
        setSaveError(undefined);
      })
      .catch((error: unknown) => {
        dirty.current = true;
        setSaveStatus("error");
        if (error instanceof SignedOutError) return handleSignedOut();
        setSaveError(error instanceof CatalogueValidationError ? `Not saved: ${error.problems[0]}` : "Couldn't save. Check your connection.");
      })
      .finally(() => {
        inFlight.current = null;
      });
    await inFlight.current;
  }, [store, upsertSummary, handleSignedOut]);

  // Autosave shortly after each change.
  useEffect(() => {
    const unsubscribe = store.subscribe((state, previous) => {
      if (state.catalogue === previous.catalogue) return;
      dirty.current = true;
      setSaveStatus("pending");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void saveNow(), AUTOSAVE_DELAY_MS);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer.current);
    };
  }, [store, saveNow]);

  // Save straight away when the tab is hidden or closed.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden" && dirty.current) void saveNow();
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current || inFlight.current) event.preventDefault();
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("beforeunload", warn);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("beforeunload", warn);
    };
  }, [saveNow]);

  const run = useCallback(
    async (task: () => Promise<void>, failure: string): Promise<boolean> => {
      try {
        await task();
        return true;
      } catch (error) {
        if (error instanceof SignedOutError) handleSignedOut();
        else toast.error(error instanceof CatalogueValidationError ? `${failure}: ${error.problems[0]}` : failure);
        return false;
      }
    },
    [handleSignedOut],
  );

  const switchTo = useCallback(
    async (id: string) =>
      void (await run(async () => {
        if (id === open.id) return;
        await saveNow();
        const next = await repository.load(id);
        if (!next) throw new Error("not found");
        setOpen(next);
      }, "That catalogue couldn't be opened")),
    [open.id, run, saveNow],
  );

  const createNew = useCallback(
    (catalogue: Catalogue = createSeedCatalogue(), name?: string) =>
      run(async () => {
        await saveNow();
        const fresh = { ...catalogue, id: crypto.randomUUID() };
        const result = await createCatalogue(fresh, name);
        if (!result.ok) {
          if (result.error === "signed-out") throw new SignedOutError();
          throw result.problems ? new CatalogueValidationError(result.problems) : new Error(result.error);
        }
        upsertSummary(result.data);
        setOpen({ ...result.data, catalogue: fresh });
        toast.success(`Created “${result.data.name}”`);
      }, "The catalogue couldn't be created"),
    [run, saveNow, upsertSummary],
  );

  const duplicateCurrent = useCallback(async () => {
    const current = summaries.find((s) => s.id === open.id);
    void await createNew(structuredClone(store.getState().catalogue), `${current?.name ?? open.name} (copy)`);
  }, [createNew, open, store, summaries]);

  const renameCurrent = useCallback(
    async (name: string) =>
      void (await run(async () => {
        upsertSummary(await repository.rename(open.id, name));
        toast.success("Catalogue renamed");
      }, "The catalogue couldn't be renamed")),
    [open.id, run, upsertSummary],
  );

  const deleteCurrent = useCallback(
    async () =>
      void (await run(async () => {
        clearTimeout(timer.current);
        dirty.current = false;
        await repository.remove(open.id);
        const remaining = summaries.filter((s) => s.id !== open.id);
        setSummaries(remaining);
        toast.success("Catalogue deleted");
        if (remaining.length > 0) {
          const next = await repository.load(remaining[0].id);
          if (next) return setOpen(next);
        }
        await createNew();
      }, "The catalogue couldn't be deleted")),
    [createNew, open.id, run, summaries],
  );

  const current = summaries.find((s) => s.id === open.id) ?? open;

  const value: WorkspaceContextValue = {
    user,
    summaries,
    current,
    saveStatus,
    saveError,
    retrySave: () => {
      dirty.current = true;
      void saveNow();
    },
    switchTo,
    createNew,
    duplicateCurrent,
    renameCurrent,
    deleteCurrent,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      <CatalogueStoreProvider value={store}>
        {children}
        <LegacyImportDialog userId={user.id} onImport={(catalogue) => createNew(catalogue)} />
      </CatalogueStoreProvider>
    </WorkspaceContext.Provider>
  );
}
