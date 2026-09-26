"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { SignInPromptProvider } from "@/components/preview/SignInPrompt";
import { AppSidebar, type SidebarSlots } from "./AppSidebar";
import { BrandAccent } from "./BrandAccent";
import { BuilderContextProvider, type BuilderMode } from "./BuilderContext";
import { MobileNav } from "./MobileNav";

interface BuilderShellProps extends SidebarSlots {
  mode: BuilderMode;
  /** Shown above the page content, e.g. the preview banner. */
  banner?: React.ReactNode;
  children: React.ReactNode;
}

/** Sidebar, tablet menu and main area shared by the signed-in builder and the preview. */
export function BuilderShell({ mode, banner, header, footer, children }: BuilderShellProps) {
  return (
    <BuilderContextProvider value={{ mode, basePath: mode === "preview" ? "/preview" : "/app" }}>
      <SignInPromptProvider>
        <TooltipProvider>
          <BrandAccent />
          <div className="min-h-full lg:flex">
            <AppSidebar header={header} footer={footer} />
            <div className="flex min-w-0 flex-1 flex-col">
              {/* The banner and the tablet top bar stay pinned together. */}
              <div className="sticky top-0 z-40">
                {banner}
                <MobileNav header={header} footer={footer} />
              </div>
              <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-5 py-8 outline-none sm:px-6 lg:px-10 lg:py-10">
                <div className="mx-auto max-w-7xl">{children}</div>
              </main>
            </div>
          </div>
        </TooltipProvider>
      </SignInPromptProvider>
    </BuilderContextProvider>
  );
}
