import type { Metadata } from "next";
import { TiersPage } from "@/components/tiers/TiersPage";

export const metadata: Metadata = { title: "Tiers" };

export default function Page() {
  return <TiersPage />;
}
