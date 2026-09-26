import type { Catalogue } from "@/lib/domain/types";

/**
 * The only way the app reads or writes saved catalogues.
 * v1 uses browser localStorage; a Supabase/Postgres implementation
 * can be swapped in later without touching the UI.
 */
export interface CatalogueRepository {
  load(): Promise<Catalogue | null>;
  save(catalogue: Catalogue): Promise<void>;
  clear(): Promise<void>;
}
