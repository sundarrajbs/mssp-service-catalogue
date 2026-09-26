"use client";

import { useState } from "react";

import { createDemoCatalogue } from "@/lib/seed/demo";
import { CatalogueStoreProvider, createCatalogueStore } from "@/store/catalogueStore";

/**
 * The public preview's data: a read-only, in-memory copy of the demo catalogue.
 * Deliberately imports no repository, Supabase client or browser storage, so
 * the preview can never read or write a real user's catalogue.
 */
export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createCatalogueStore({ catalogue: createDemoCatalogue(), readOnly: true }));
  return <CatalogueStoreProvider value={store}>{children}</CatalogueStoreProvider>;
}
