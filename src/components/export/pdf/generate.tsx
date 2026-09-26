import type { Catalogue } from "@/lib/domain/types";
import { exportFileName } from "@/lib/domain/importExport";
import { downloadBlob } from "@/lib/download";

export type PdfKind = "catalogue" | "onePager";

/**
 * Builds a PDF in the browser. The renderer and documents are loaded on demand
 * so they don't add to the app's initial download.
 */
export async function downloadPdf(kind: PdfKind, catalogue: Catalogue, includePricing: boolean) {
  const [{ pdf }, { registerPdfFonts }, { CataloguePdf }, { OnePagerPdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./theme"),
    import("./CataloguePdf"),
    import("./OnePagerPdf"),
  ]);
  registerPdfFonts(window.location.origin);

  const props = { catalogue, includePricing, generatedAt: new Date() };
  const document = kind === "catalogue" ? <CataloguePdf {...props} /> : <OnePagerPdf {...props} />;
  const blob = await pdf(document).toBlob();
  downloadBlob(blob, exportFileName(catalogue.mspName, "pdf", new Date(), kind === "catalogue" ? "catalogue" : "tiers"));
}
