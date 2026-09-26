import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { BrandAccent } from "@/components/layout/BrandAccent";
import { StoreHydration } from "@/components/layout/StoreHydration";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MSSP Catalogue Builder",
  description: "Design, tier, price and export a managed security service catalogue.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full">
        <ThemeProvider>
          <BrandAccent />
          <AppSidebar />
          <main className="min-w-0 flex-1 px-6 py-8 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-7xl">
              <StoreHydration>{children}</StoreHydration>
            </div>
          </main>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
