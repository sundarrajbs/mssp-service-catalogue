"use server";

import type { Catalogue } from "@/lib/domain/types";
import {
  CatalogueValidationError,
  type CatalogueSummary,
  type StoredCatalogue,
} from "@/lib/repository";
import { SupabaseCatalogueRepository } from "@/lib/repository/supabaseRepository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rememberCurrentCatalogue } from "@/lib/workspace/server";

/*
 * Catalogue storage for signed-in users. Every action checks the user again
 * (the proxy isn't the only guard), and Row Level Security in Postgres limits
 * every query to the user's own rows.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; problems?: string[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function withRepository<T>(
  run: (repository: SupabaseCatalogueRepository) => Promise<T>,
): Promise<ActionResult<T>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Sign-in isn't configured." };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: "signed-out" };
  try {
    return { ok: true, data: await run(new SupabaseCatalogueRepository(supabase)) };
  } catch (error) {
    if (error instanceof CatalogueValidationError) {
      return { ok: false, error: "The catalogue has invalid data and wasn't saved.", problems: error.problems };
    }
    console.error(error);
    return { ok: false, error: "The server couldn't complete that. Please try again." };
  }
}

function checkId(id: unknown): asserts id is string {
  if (typeof id !== "string" || !UUID.test(id)) throw new Error("Invalid catalogue id");
}

export async function listCatalogues(): Promise<ActionResult<CatalogueSummary[]>> {
  return withRepository((repo) => repo.list());
}

/** Opens a catalogue and remembers it as the current one. */
export async function openCatalogue(id: string): Promise<ActionResult<StoredCatalogue | null>> {
  return withRepository(async (repo) => {
    checkId(id);
    const stored = await repo.load(id);
    if (stored) await rememberCurrentCatalogue(id);
    return stored;
  });
}

/** Validated on the server with the zod schema before anything is written. */
export async function saveCatalogue(catalogue: Catalogue, name?: string): Promise<ActionResult<CatalogueSummary>> {
  return withRepository(async (repo) => {
    checkId((catalogue as { id?: unknown })?.id);
    return repo.save(catalogue, name);
  });
}

/** Saves a new catalogue and makes it the current one. */
export async function createCatalogue(catalogue: Catalogue, name?: string): Promise<ActionResult<CatalogueSummary>> {
  return withRepository(async (repo) => {
    checkId((catalogue as { id?: unknown })?.id);
    const summary = await repo.save(catalogue, name);
    await rememberCurrentCatalogue(summary.id);
    return summary;
  });
}

export async function renameCatalogue(id: string, name: string): Promise<ActionResult<CatalogueSummary>> {
  return withRepository(async (repo) => {
    checkId(id);
    return repo.rename(id, String(name));
  });
}

export async function deleteCatalogue(id: string): Promise<ActionResult<null>> {
  return withRepository(async (repo) => {
    checkId(id);
    await repo.remove(id);
    return null;
  });
}
