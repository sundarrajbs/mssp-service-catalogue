import "server-only";

import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { CatalogueSummary, StoredCatalogue } from "@/lib/repository";
import { SupabaseCatalogueRepository } from "@/lib/repository/supabaseRepository";
import { createSeedCatalogue } from "@/lib/seed/catalogue";

/** Remembers which catalogue was open last. Holds only an ID; HTTP-only like the session. */
export const CURRENT_CATALOGUE_COOKIE = "mssp-current-catalogue";

export interface WorkspaceData {
  summaries: CatalogueSummary[];
  current: StoredCatalogue;
}

export async function rememberCurrentCatalogue(id: string) {
  (await cookies()).set(CURRENT_CATALOGUE_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/**
 * Loads the signed-in user's catalogues and opens the last-used one (or the
 * most recent). A new user gets a starter catalogue.
 */
export async function loadWorkspace(supabase: SupabaseClient): Promise<WorkspaceData> {
  const repository = new SupabaseCatalogueRepository(supabase);
  let summaries = await repository.list();
  const preferred = (await cookies()).get(CURRENT_CATALOGUE_COOKIE)?.value;

  const candidates = [...summaries].sort((a, b) => (a.id === preferred ? -1 : b.id === preferred ? 1 : 0));
  for (const summary of candidates) {
    try {
      const current = await repository.load(summary.id);
      if (current) return { summaries, current };
    } catch (error) {
      // Skip a catalogue whose stored data no longer validates rather than breaking the app.
      console.error(`Catalogue ${summary.id} couldn't be opened`, error);
    }
  }

  const created = await repository.save(createSeedCatalogue());
  summaries = await repository.list();
  const current = await repository.load(created.id);
  if (!current) throw new Error("The starter catalogue couldn't be created");
  return { summaries, current };
}
