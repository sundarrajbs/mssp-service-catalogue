import type { Metadata } from "next";
import { SlasPage } from "@/components/slas/SlasPage";

export const metadata: Metadata = { title: "Service levels" };

export default function Page() {
  return <SlasPage />;
}
