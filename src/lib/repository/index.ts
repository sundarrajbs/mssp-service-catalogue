import type { CatalogueRepository } from "./CatalogueRepository";
import { LocalStorageCatalogueRepository } from "./localStorageRepository";

/** Swap this for a database-backed repository when a backend is added. */
export const catalogueRepository: CatalogueRepository = new LocalStorageCatalogueRepository();

export type { CatalogueRepository };
