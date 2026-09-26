import type { Metadata } from "next";
import { ExportPage } from "@/components/export/ExportPage";

export const metadata: Metadata = { title: "Export" };

export default function Page() {
  return <ExportPage />;
}
