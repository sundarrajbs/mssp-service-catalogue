"use client";

import { RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/preview/GuardedButton";
import { useCatalogueStore, useReadOnly } from "@/store/catalogueStore";

export function ResetDefaultsButton() {
  const resetToDefaults = useCatalogueStore((s) => s.resetToDefaults);
  const readOnly = useReadOnly();

  if (readOnly) {
    return (
      <GuardedButton variant="outline" action="reset the catalogue">
        <RotateCcwIcon aria-hidden />
        Reset to defaults
      </GuardedButton>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <RotateCcwIcon aria-hidden />
          Reset to defaults
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset the whole catalogue?</AlertDialogTitle>
          <AlertDialogDescription>
            This replaces all services, tiers, SLAs, pricing inputs and branding with the starter defaults. Export a
            JSON backup first if you want to keep your current work. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              resetToDefaults();
              toast.success("Catalogue reset to defaults");
            }}
          >
            Reset everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
