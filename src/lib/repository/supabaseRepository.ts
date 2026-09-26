import type { SupabaseClient } from "@supabase/supabase-js";

import { validateCatalogue } from "@/lib/domain/importExport";
import type { Catalogue } from "@/lib/domain/types";
import { cleanText, sanitizeCatalogue } from "@/lib/sanitize";
import {
  catalogueName,
  CatalogueValidationError,
  type CatalogueRepository,
  type CatalogueSummary,
  type StoredCatalogue,
} from "./CatalogueRepository";

interface CatalogueRow {
  id: string;
  name: string;
  data?: unknown;
  updated_at: string;
}

const SUMMARY_COLUMNS = "id, name, updated_at";

const toSummary = (row: CatalogueRow): CatalogueSummary => ({ id: row.id, name: row.name, updatedAt: row.updated_at });

/** Validates and cleans a catalogue, or throws CatalogueValidationError. */
function validated(catalogue: unknown): Catalogue {
  const result = validateCatalogue(catalogue);
  if (!result.ok) throw new CatalogueValidationError(result.errors);
  return sanitizeCatalogue(result.catalogue);
}

/**
 * Catalogues stored in Postgres (table `catalogues`, full catalogue as JSONB).
 * Server-side only. The client carries the signed-in user's session, so Row
 * Level Security limits every query to that user's own rows. owner_id is set
 * by the database (default auth.uid()), never by this code.
 */
export class SupabaseCatalogueRepository implements CatalogueRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async list(): Promise<CatalogueSummary[]> {
    const { data, error } = await this.supabase
      .from("catalogues")
      .select(SUMMARY_COLUMNS)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(`Couldn't list catalogues: ${error.message}`);
    return (data as CatalogueRow[]).map(toSummary);
  }

  async load(id: string): Promise<StoredCatalogue | null> {
    const { data, error } = await this.supabase
      .from("catalogues")
      .select(`${SUMMARY_COLUMNS}, data`)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Couldn't load catalogue: ${error.message}`);
    if (!data) return null;
    const row = data as CatalogueRow;
    // Stored data is validated on the way out too, in case it was edited directly in the database.
    const catalogue = validated({ ...(row.data as object), id: row.id });
    return { ...toSummary(row), catalogue };
  }

  async save(catalogue: Catalogue, name?: string): Promise<CatalogueSummary> {
    const data = validated(catalogue);
    const changes = { data, ...(name !== undefined && { name: catalogueName(cleanText(name), data) }) };

    const updated = await this.supabase.from("catalogues").update(changes).eq("id", data.id).select(SUMMARY_COLUMNS);
    if (updated.error) throw new Error(`Couldn't save catalogue: ${updated.error.message}`);
    if (updated.data.length > 0) return toSummary(updated.data[0] as CatalogueRow);

    const inserted = await this.supabase
      .from("catalogues")
      .insert({ id: data.id, name: catalogueName(name && cleanText(name), data), data })
      .select(SUMMARY_COLUMNS)
      .single();
    if (inserted.error) throw new Error(`Couldn't create catalogue: ${inserted.error.message}`);
    return toSummary(inserted.data as CatalogueRow);
  }

  async rename(id: string, name: string): Promise<CatalogueSummary> {
    const cleaned = cleanText(name).replace(/\s+/g, " ").trim().slice(0, 120);
    if (!cleaned) throw new CatalogueValidationError(["Enter a name"]);
    const { data, error } = await this.supabase
      .from("catalogues")
      .update({ name: cleaned })
      .eq("id", id)
      .select(SUMMARY_COLUMNS)
      .single();
    if (error) throw new Error(`Couldn't rename catalogue: ${error.message}`);
    return toSummary(data as CatalogueRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from("catalogues").delete().eq("id", id);
    if (error) throw new Error(`Couldn't delete catalogue: ${error.message}`);
  }
}
