import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { BrandAccent } from "@/components/layout/BrandAccent";
import { MobileNav } from "@/components/layout/MobileNav";
import { StoreHydration } from "@/components/layout/StoreHydration";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "MSSP Catalogue Builder", template: "%s · MSSP Catalogue Builder" },
  description: "Design, tier, price and export a managed security service catalogue.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Set by src/proxy.ts for each request; reading it renders pages per request.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full lg:flex">
        <a
          href="#main"
          className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to main content
        </a>
        <ThemeProvider nonce={nonce}>
          <BrandAccent />
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileNav />
            <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-5 py-8 outline-none sm:px-6 lg:px-10 lg:py-10">
              <div className="mx-auto max-w-7xl">
                <StoreHydration>{children}</StoreHydration>
              </div>
            </main>
          </div>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
