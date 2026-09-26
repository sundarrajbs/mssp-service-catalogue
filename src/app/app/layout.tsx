import { redirect } from "next/navigation";

import { BuilderShell } from "@/components/layout/BuilderShell";
import { AppSidebarFooter } from "@/components/workspace/AppSidebarFooter";
import { CatalogueSwitcher } from "@/components/workspace/CatalogueSwitcher";
import { CatalogueWorkspace } from "@/components/workspace/CatalogueWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/workspace/server";

/** The signed-in builder. The proxy already redirects signed-out visitors; this checks again. */
export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/sign-in");
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  const workspace = await loadWorkspace(supabase);

  return (
    <CatalogueWorkspace user={{ id: data.user.id, email: data.user.email ?? "" }} initial={workspace}>
      <BuilderShell mode="app" header={<CatalogueSwitcher />} footer={<AppSidebarFooter />}>
        {children}
      </BuilderShell>
    </CatalogueWorkspace>
  );
}
