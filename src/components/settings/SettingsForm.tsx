"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ResetDefaultsButton } from "@/components/shared/ResetDefaultsButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCatalogueStore } from "@/store/catalogueStore";
import { LogoField } from "./LogoField";

const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/;

export function SettingsForm() {
  const mspName = useCatalogueStore((s) => s.catalogue.mspName);
  const catalogueId = useCatalogueStore((s) => s.catalogue.id);
  const updateSettings = useCatalogueStore((s) => s.updateSettings);

  return (
    <>
      <PageHeader title="Settings" description="Branding used across the app and in exported catalogues." />

      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branding</CardTitle>
            <CardDescription>Your logo and brand colour appear in the app and on exported PDFs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="msp-name">MSSP name</Label>
              <Input
                id="msp-name"
                value={mspName}
                maxLength={120}
                onChange={(e) => updateSettings({ mspName: e.target.value })}
              />
            </div>
            <LogoField />
            {/* Keyed by catalogue so the text box resets after "Reset to defaults" or an import. */}
            <BrandColourField key={catalogueId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Start over</CardTitle>
            <CardDescription>Restore the starter service library, tiers and settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResetDefaultsButton />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BrandColourField() {
  const brandColour = useCatalogueStore((s) => s.catalogue.brandColour);
  const updateSettings = useCatalogueStore((s) => s.updateSettings);
  // Local text so a half-typed hex value doesn't get saved.
  const [hexText, setHexText] = useState(brandColour);

  return (
    <div className="space-y-2">
      <Label htmlFor="brand-colour-hex">Brand colour</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label="Pick brand colour"
          value={brandColour}
          onChange={(e) => {
            setHexText(e.target.value);
            updateSettings({ brandColour: e.target.value });
          }}
          className="h-10 w-14 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <Input
          id="brand-colour-hex"
          className="w-36 font-mono"
          value={hexText}
          maxLength={7}
          aria-invalid={!HEX_COLOUR.test(hexText)}
          onChange={(e) => {
            setHexText(e.target.value);
            if (HEX_COLOUR.test(e.target.value)) updateSettings({ brandColour: e.target.value.toLowerCase() });
          }}
        />
      </div>
    </div>
  );
}
