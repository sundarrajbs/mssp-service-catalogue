"use client";

import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Catalogue } from "@/lib/domain/types";
import { LocalStorageCatalogueRepository } from "@/lib/repository/localStorageRepository";

const dismissedKey = (userId: string) => `mssp-catalogue-builder:legacy-import-dismissed:${userId}`;

/**
 * Before sign-in existed, the catalogue lived only in this browser. On sign-in
 * we offer to copy it into the account, then remove the local copy.
 */
export function LegacyImportDialog({
  userId,
  onImport,
}: {
  userId: string;
  /** Resolves to true once the catalogue is safely saved in the account. */
  onImport: (catalogue: Catalogue) => Promise<boolean>;
}) {
  const [found, setFound] = useState<{ catalogue: Catalogue; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (window.localStorage.getItem(dismissedKey(userId))) return;
        const local = new LocalStorageCatalogueRepository();
        const [summary] = await local.list();
        const stored = summary && (await local.load(summary.id));
        if (stored && !cancelled) setFound({ catalogue: stored.catalogue, name: stored.name });
      } catch {
        // Storage blocked (private mode etc.): nothing to offer.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!found) return null;

  return (
    <AlertDialog open onOpenChange={(open) => !open && setFound(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Import the catalogue saved in this browser?</AlertDialogTitle>
          <AlertDialogDescription>
            We found “{found.name}” with {found.catalogue.services.length} services and {found.catalogue.tiers.length} tiers,
            saved on this device before you signed in. Import it into your account to keep working on it anywhere. The
            copy in this browser is then removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              try {
                window.localStorage.setItem(dismissedKey(userId), "1");
              } catch {}
            }}
          >
            Not now
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              // Only remove the local copy once it's safely in the account.
              if (await onImport(found.catalogue)) {
                await new LocalStorageCatalogueRepository().remove(found.catalogue.id);
              }
            }}
          >
            Import into my account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
