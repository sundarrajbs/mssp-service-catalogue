"use client";

import { useRef, useState } from "react";
import { ImageUpIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ACCEPTED_LOGO_TYPES, LogoError, processLogoFile } from "@/lib/logo";
import { useCatalogueStore } from "@/store/catalogueStore";

export function LogoField() {
  const logo = useCatalogueStore((s) => s.catalogue.logo);
  const updateSettings = useCatalogueStore((s) => s.updateSettings);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      updateSettings({ logo: await processLogoFile(file) });
      toast.success("Logo updated");
    } catch (e) {
      setError(e instanceof LogoError ? e.message : "The logo couldn't be processed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="logo-upload">Logo</Label>
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-muted/50 flex size-20 items-center justify-center overflow-hidden rounded-lg border">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL logo, not optimisable
            <img src={logo} alt="Current logo" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-muted-foreground text-xs">No logo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id="logo-upload"
            type="file"
            accept={ACCEPTED_LOGO_TYPES.join(",")}
            className="sr-only"
            aria-describedby="logo-hint"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
            <ImageUpIcon aria-hidden />
            {logo ? "Replace logo" : "Upload logo"}
          </Button>
          {logo && (
            <Button type="button" variant="ghost" onClick={() => updateSettings({ logo: undefined })}>
              <Trash2Icon aria-hidden />
              Remove
            </Button>
          )}
        </div>
      </div>
      <p id="logo-hint" className="text-muted-foreground text-xs">
        PNG, JPG or SVG, up to 500 KB. Images are converted to PNG, which also removes any scripts in SVG files.
      </p>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
