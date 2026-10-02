import { BuilderShell } from "@/components/layout/BuilderShell";
import { AppSidebarFooter } from "@/components/workspace/AppSidebarFooter";
import { CatalogueSwitcher } from "@/components/workspace/CatalogueSwitcher";
import { CatalogueWorkspace } from "@/components/workspace/CatalogueWorkspace";
import { GuestSidebarFooter, GuestSidebarHeader } from "@/components/workspace/GuestSidebar";
import { GuestWorkspace } from "@/components/workspace/GuestWorkspace";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/workspace/server";

/**
 * The builder. No sign-in needed: visitors work on a catalogue saved in their
 * browser. Signed-in users get their catalogues from the database instead.
 */
export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!supabase || !user) {
    const signInAvailable = isSupabaseConfigured();
    return (
      <GuestWorkspace>
        <BuilderShell
          mode="app"
          header={<GuestSidebarHeader signInAvailable={signInAvailable} />}
          footer={<GuestSidebarFooter signInAvailable={signInAvailable} />}
        >
          {children}
        </BuilderShell>
      </GuestWorkspace>
    );
  }

  const workspace = await loadWorkspace(supabase);
  return (
    <CatalogueWorkspace user={{ id: user.id, email: user.email ?? "" }} initial={workspace}>
      <BuilderShell mode="app" header={<CatalogueSwitcher />} footer={<AppSidebarFooter />}>
        {children}
      </BuilderShell>
    </CatalogueWorkspace>
  );
}
