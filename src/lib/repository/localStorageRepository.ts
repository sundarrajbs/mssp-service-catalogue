import { validateCatalogue } from "@/lib/domain/importExport";
import type { Catalogue } from "@/lib/domain/types";
import { sanitizeCatalogue } from "@/lib/sanitize";
import {
  catalogueName,
  CatalogueValidationError,
  type CatalogueRepository,
  type CatalogueSummary,
  type StoredCatalogue,
} from "./CatalogueRepository";

/** Where versions before sign-in saved the single catalogue. */
export const LEGACY_STORAGE_KEY = "mssp-catalogue-builder:catalogue";

/**
 * A single catalogue kept in this browser's localStorage. Since sign-in was
 * added it's only used to find, import and then remove a catalogue saved by
 * the earlier browser-only version.
 */
export class LocalStorageCatalogueRepository implements CatalogueRepository {
  constructor(
    private readonly key: string = LEGACY_STORAGE_KEY,
    private readonly storage: Storage = window.localStorage,
  ) {}

  private read(): Catalogue | null {
    const raw = this.storage.getItem(this.key);
    if (!raw) return null;
    try {
      const result = validateCatalogue(JSON.parse(raw));
      if (result.ok) return sanitizeCatalogue(result.catalogue);
    } catch {
      // Not JSON; treat as absent.
    }
    return null;
  }

  async list(): Promise<CatalogueSummary[]> {
    const catalogue = this.read();
    return catalogue ? [{ id: catalogue.id, name: catalogueName(undefined, catalogue), updatedAt: catalogue.updatedAt }] : [];
  }

  async load(id: string): Promise<StoredCatalogue | null> {
    const catalogue = this.read();
    if (!catalogue || catalogue.id !== id) return null;
    return { id, name: catalogueName(undefined, catalogue), updatedAt: catalogue.updatedAt, catalogue };
  }

  async save(catalogue: Catalogue, name?: string): Promise<CatalogueSummary> {
    const result = validateCatalogue(catalogue);
    if (!result.ok) throw new CatalogueValidationError(result.errors);
    this.storage.setItem(this.key, JSON.stringify(result.catalogue));
    return { id: catalogue.id, name: catalogueName(name, catalogue), updatedAt: catalogue.updatedAt };
  }

  async rename(id: string, name: string): Promise<CatalogueSummary> {
    const catalogue = this.read();
    if (!catalogue || catalogue.id !== id) throw new Error("Catalogue not found");
    return { id, name: catalogueName(name, catalogue), updatedAt: catalogue.updatedAt };
  }

  async remove(id: string): Promise<void> {
    if (this.read()?.id === id) this.storage.removeItem(this.key);
  }
}
