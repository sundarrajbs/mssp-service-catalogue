import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountPage } from "@/components/account/AccountPage";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account" };

/** The only builder page that needs an account. */
export default async function Page({ searchParams }: PageProps<"/app/account">) {
  if (!(await getCurrentUser())) redirect("/sign-in?next=%2Fapp%2Faccount");
  const params = await searchParams;
  return <AccountPage passwordUpdated={params.password === "updated"} />;
}
