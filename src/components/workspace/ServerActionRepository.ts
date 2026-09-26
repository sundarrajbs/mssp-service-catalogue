import {
  deleteCatalogue,
  listCatalogues,
  openCatalogue,
  renameCatalogue,
  saveCatalogue,
  type ActionResult,
} from "@/app/app/catalogue-actions";
import type { Catalogue } from "@/lib/domain/types";
import {
  CatalogueValidationError,
  type CatalogueRepository,
  type CatalogueSummary,
  type StoredCatalogue,
} from "@/lib/repository";

export class SignedOutError extends Error {}

function unwrap<T>(result: ActionResult<T>): T {
  if (result.ok) return result.data;
  if (result.error === "signed-out") throw new SignedOutError("Your session has ended. Please sign in again.");
  if (result.problems) throw new CatalogueValidationError(result.problems);
  throw new Error(result.error);
}

/**
 * The browser's view of the signed-in user's catalogues. Same interface as
 * the other repositories, but every call goes through a server action, so the
 * browser never talks to Supabase or holds a session token.
 */
export class ServerActionRepository implements CatalogueRepository {
  async list(): Promise<CatalogueSummary[]> {
    return unwrap(await listCatalogues());
  }
  async load(id: string): Promise<StoredCatalogue | null> {
    return unwrap(await openCatalogue(id));
  }
  async save(catalogue: Catalogue, name?: string): Promise<CatalogueSummary> {
    return unwrap(await saveCatalogue(catalogue, name));
  }
  async rename(id: string, name: string): Promise<CatalogueSummary> {
    return unwrap(await renameCatalogue(id, name));
  }
  async remove(id: string): Promise<void> {
    unwrap(await deleteCatalogue(id));
  }
}
