"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpenIcon, FileTextIcon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCatalogueStore } from "@/store/catalogueStore";
import { JsonImportExport } from "./JsonImportExport";
import type { PdfKind } from "./pdf/generate";

export function ExportPage() {
  const catalogue = useCatalogueStore((s) => s.catalogue);
  const [includePricing, setIncludePricing] = useState(false);
  const [busy, setBusy] = useState<PdfKind | null>(null);

  async function handlePdf(kind: PdfKind) {
    setBusy(kind);
    try {
      const { downloadPdf } = await import("./pdf/generate");
      await downloadPdf(kind, catalogue, includePricing);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("The PDF couldn't be created. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const noTiers = catalogue.tiers.length === 0;

  return (
    <>
      <PageHeader
        title="Export"
        description="Create branded PDFs to hand over at the end of the workshop, and back up or share the catalogue as JSON."
      />

      <div className="grid max-w-4xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PDF documents</CardTitle>
            <CardDescription>
              Uses {catalogue.mspName || "your MSSP"}&apos;s name, logo and brand colour from{" "}
              <Link href="/settings" className="text-brand underline underline-offset-4">
                Settings
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <Label htmlFor="include-pricing">Include pricing</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Adds tier prices and add-on prices from the Pricing page. Costs and margins are never included.
                </p>
              </div>
              <Switch id="include-pricing" checked={includePricing} onCheckedChange={setIncludePricing} />
            </div>

            {noTiers && (
              <p className="text-muted-foreground text-sm">
                Add tiers on the{" "}
                <Link href="/tiers" className="text-brand underline underline-offset-4">
                  Tiers page
                </Link>{" "}
                before exporting.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <ExportOption
                icon={<BookOpenIcon className="text-brand size-5" aria-hidden />}
                title="Full catalogue"
                description="Cover page, tier comparison, one page per service, SLA table and optional pricing."
                action="Download catalogue PDF"
                busy={busy === "catalogue"}
                disabled={busy !== null || noTiers}
                onClick={() => handlePdf("catalogue")}
              />
              <ExportOption
                icon={<FileTextIcon className="text-brand size-5" aria-hidden />}
                title="One-page tier comparison"
                description="A single landscape page with tiers, key SLAs and services for sales conversations."
                action="Download one-pager PDF"
                busy={busy === "onePager"}
                disabled={busy !== null || noTiers}
                onClick={() => handlePdf("onePager")}
              />
            </div>
          </CardContent>
        </Card>

        <JsonImportExport />
      </div>
    </>
  );
}

function ExportOption({
  icon,
  title,
  description,
  action,
  busy,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-muted-foreground flex-1 text-sm">{description}</p>
      <Button onClick={onClick} disabled={disabled} aria-busy={busy}>
        {busy && <LoaderCircleIcon className="animate-spin" aria-hidden />}
        {busy ? "Creating PDF…" : action}
      </Button>
    </div>
  );
}
