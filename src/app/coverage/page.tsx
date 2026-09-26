import type { Metadata } from "next";
import { CoveragePage } from "@/components/coverage/CoveragePage";

export const metadata: Metadata = { title: "NIST CSF coverage" };

export default function Page() {
  return <CoveragePage />;
}
