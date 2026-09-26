"use client";

import { useState } from "react";
import { KeyboardIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
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
import { GuardedButton } from "@/components/preview/GuardedButton";
import { Button } from "@/components/ui/button";
import { tierLabel, type Tier } from "@/lib/domain/types";
import { useCatalogueActions, useCatalogueStore, useReadOnly } from "@/store/catalogueStore";
import { TierBoard } from "./TierBoard";
import { TierComparisonMatrix } from "./TierComparisonMatrix";

export function TiersPage() {
  const services = useCatalogueStore((s) => s.catalogue.services);
  const tiers = useCatalogueStore((s) => s.catalogue.tiers);
  const { addTier, removeTier, restoreDefaultTiers, setTierService } = useCatalogueActions();
  const readOnly = useReadOnly();
  const [pendingDelete, setPendingDelete] = useState<Tier | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  return (
    <>
      <PageHeader
        title="Tiers"
        description={
          readOnly
            ? "How services are packaged into tiers, with optional add-ons."
            : "Package services into tiers. Drag from the library into a tier, or click cells in the comparison below."
        }
        actions={
          <>
            <GuardedButton variant="outline" action="change tiers" onClick={() => setConfirmRestore(true)}>
              <RotateCcwIcon aria-hidden />
              Restore default tiers
            </GuardedButton>
            <GuardedButton action="add tiers" onClick={() => addTier(`Tier ${tiers.length + 1}`)}>
              <PlusIcon aria-hidden />
              Add tier
            </GuardedButton>
          </>
        }
      />

      {tiers.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <p>No tiers yet.</p>
          <Button onClick={restoreDefaultTiers}>Create Essential, Advanced and Premium</Button>
        </div>
      ) : (
        <>
          {!readOnly && (
            <p className="text-muted-foreground -mt-4 mb-6 flex items-start gap-2 text-sm">
              <KeyboardIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Keyboard: Tab to a service, press Space to pick it up, use the arrow keys to move between tiers, then
                Space to drop (Escape cancels). Or use the + button next to a library service. On an iPad, press and
                hold to drag.
              </span>
            </p>
          )}
          <TierBoard services={services} tiers={tiers} onDeleteTier={setPendingDelete} />
          <section className="mt-12" aria-labelledby="comparison-heading">
            <h2 id="comparison-heading" className="mb-1 text-2xl font-semibold tracking-tight">
              Tier comparison
            </h2>
            <p className="text-muted-foreground mb-5 text-sm">
              ✓ included · Add-on available at extra cost · — not offered.
              {readOnly ? "" : " Click a cell to change it."}
            </p>
            <TierComparisonMatrix services={services} tiers={tiers} onChange={readOnly ? undefined : setTierService} />
          </section>
        </>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the “{pendingDelete ? tierLabel(pendingDelete) : ""}” tier?</AlertDialogTitle>
            <AlertDialogDescription>
              Its service selection and SLA will be removed. Services stay in the library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) {
                  removeTier(pendingDelete.id);
                  toast.success("Tier deleted");
                }
              }}
            >
              Delete tier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRestore} onOpenChange={setConfirmRestore}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore the default tiers?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces all current tiers, their services, SLAs and margins with Essential, Advanced and Premium.
              Your service library is not changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                restoreDefaultTiers();
                toast.success("Default tiers restored");
              }}
            >
              Restore defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
