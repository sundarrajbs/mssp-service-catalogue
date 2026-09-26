import type { Metadata } from "next";
import { ServiceLibrary } from "@/components/library/ServiceLibrary";

export const metadata: Metadata = { title: "Service library (preview)" };

export default function LibraryPage() {
  return <ServiceLibrary />;
}
