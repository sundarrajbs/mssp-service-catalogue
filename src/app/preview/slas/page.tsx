import type { Metadata } from "next";
import { SlasPage } from "@/components/slas/SlasPage";

export const metadata: Metadata = { title: "Service levels (preview)" };

export default function Page() {
  return <SlasPage />;
}
