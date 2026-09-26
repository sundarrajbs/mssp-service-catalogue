"use client";

import { useRef, useState } from "react";
import { FileDownIcon, FileUpIcon, TriangleAlertIcon } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { catalogueToJson, exportFileName, MAX_IMPORT_BYTES, parseCatalogueJson } from "@/lib/domain/importExport";
import type { Catalogue } from "@/lib/domain/types";
import { downloadBlob } from "@/lib/download";
import { useCatalogueStore } from "@/store/catalogueStore";

export function JsonImportExport() {
  const catalogue = useCatalogueStore((s) => s.catalogue);
  const replaceCatalogue = useCatalogueStore((s) => s.replaceCatalogue);
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{ fileName: string; messages: string[] } | null>(null);
  const [pending, setPending] = useState<{ fileName: string; catalogue: Catalogue } | null>(null);

  function handleExport() {
    const blob = new Blob([catalogueToJson(catalogue)], { type: "application/json" });
    downloadBlob(blob, exportFileName(catalogue.mspName, "json"));
    toast.success("Catalogue exported");
  }

  async function handleFile(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setErrors(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setErrors({ fileName: file.name, messages: ["The file is larger than 5 MB, so it can't be a catalogue export."] });
      return;
    }
    const result = parseCatalogueJson(await file.text());
    if (result.ok) setPending({ fileName: file.name, catalogue: result.catalogue });
    else setErrors({ fileName: file.name, messages: result.errors });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Back up and share (JSON)</CardTitle>
        <CardDescription>
          Everything is saved only in this browser. Export a JSON file to keep a backup, move to another device or share
          with a colleague, who can import it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport}>
            <FileDownIcon aria-hidden />
            Export JSON
          </Button>
          <input
            ref={inputRef}
            id="json-import"
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Choose a catalogue JSON file to import"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <FileUpIcon aria-hidden />
            Import JSON…
          </Button>
        </div>

        {errors && (
          <div role="alert" className="border-destructive/40 bg-destructive/5 rounded-lg border p-4 text-sm">
            <p className="text-destructive flex items-center gap-2 font-semibold">
              <TriangleAlertIcon className="size-4" aria-hidden />
              “{errors.fileName}” wasn&apos;t imported
            </p>
            <p className="text-muted-foreground mt-1">Your current catalogue is unchanged. Problems found:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs">
              {errors.messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the current catalogue?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pending?.fileName}” contains {pending?.catalogue.services.length} services and{" "}
              {pending?.catalogue.tiers.length} tiers for {pending?.catalogue.mspName || "an unnamed MSSP"}. Importing it
              replaces everything currently in the app. Export a backup first if you want to keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pending) {
                  replaceCatalogue(pending.catalogue);
                  toast.success("Catalogue imported");
                }
              }}
            >
              Replace catalogue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
