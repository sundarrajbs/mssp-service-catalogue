import type { Catalogue } from "@/lib/domain/types";

export interface CatalogueSummary {
  id: string;
  /** The name shown in the catalogue switcher. */
  name: string;
  updatedAt: string;
}

export interface StoredCatalogue extends CatalogueSummary {
  catalogue: Catalogue;
}

/**
 * The only way the app reads or writes saved catalogues.
 * Implementations: Supabase/Postgres for signed-in users, and browser
 * localStorage (used to find catalogues saved before sign-in existed).
 * Every implementation validates catalogues with the zod schema.
 */
export interface CatalogueRepository {
  list(): Promise<CatalogueSummary[]>;
  load(id: string): Promise<StoredCatalogue | null>;
  /** Creates or updates. `name` defaults to the existing name, or the MSSP name for a new catalogue. */
  save(catalogue: Catalogue, name?: string): Promise<CatalogueSummary>;
  rename(id: string, name: string): Promise<CatalogueSummary>;
  remove(id: string): Promise<void>;
}

export class CatalogueValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(`The catalogue isn't valid: ${problems.join("; ")}`);
    this.name = "CatalogueValidationError";
  }
}

/** The switcher name for a catalogue: trimmed, 1–120 characters. */
export function catalogueName(name: string | undefined, catalogue: Catalogue): string {
  const cleaned = (name ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  return cleaned || catalogue.mspName.trim().slice(0, 120) || "Untitled catalogue";
}
