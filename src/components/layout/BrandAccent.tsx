"use client";

import { useEffect } from "react";

import { readableTextColour } from "@/lib/color/contrast";
import { useCatalogueStore } from "@/store/catalogueStore";

/** Applies the MSSP's brand colour as the app-wide accent via CSS variables. */
export function BrandAccent() {
  const brandColour = useCatalogueStore((s) => s.catalogue.brandColour);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand", brandColour);
    root.style.setProperty("--brand-foreground", readableTextColour(brandColour));
  }, [brandColour]);

  return null;
}
