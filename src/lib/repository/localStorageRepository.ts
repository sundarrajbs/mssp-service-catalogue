import { catalogueSchema } from "@/lib/domain/schema";
import type { Catalogue } from "@/lib/domain/types";
import { sanitizeCatalogue } from "@/lib/sanitize";
import type { CatalogueRepository } from "./CatalogueRepository";

const STORAGE_KEY = "mssp-catalogue-builder:catalogue";

export class LocalStorageCatalogueRepository implements CatalogueRepository {
  constructor(private readonly key: string = STORAGE_KEY) {}

  async load(): Promise<Catalogue | null> {
    const raw = window.localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      const parsed = catalogueSchema.safeParse(JSON.parse(raw));
      // Data saved by older versions may predate text sanitising.
      if (parsed.success) return sanitizeCatalogue(parsed.data);
      console.warn("Saved catalogue failed validation; starting from defaults.", parsed.error);
    } catch (error) {
      console.warn("Saved catalogue is not valid JSON; starting from defaults.", error);
    }
    // Keep the unreadable data so it isn't lost when the defaults are saved over it.
    window.localStorage.setItem(`${this.key}:unreadable-backup`, raw);
    return null;
  }

  async save(catalogue: Catalogue): Promise<void> {
    window.localStorage.setItem(this.key, JSON.stringify(catalogue));
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(this.key);
  }
}
