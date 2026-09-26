"use client";

import { useEffect, useState } from "react";

import { useCatalogueStore } from "@/store/catalogueStore";

/** Loads the saved catalogue on the client before rendering the pages. */
export function StoreHydration({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useCatalogueStore.persist.onFinishHydration(() => setHydrated(true));
    void useCatalogueStore.persist.rehydrate();
    return unsubscribe;
  }, []);

  if (!hydrated) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-sm" role="status">
        Loading catalogue…
      </div>
    );
  }
  return <>{children}</>;
}
