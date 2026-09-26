import type { Metadata } from "next";

import { AccountPage } from "@/components/account/AccountPage";

export const metadata: Metadata = { title: "Account" };

export default async function Page({ searchParams }: PageProps<"/app/account">) {
  const params = await searchParams;
  return <AccountPage passwordUpdated={params.password === "updated"} />;
}
