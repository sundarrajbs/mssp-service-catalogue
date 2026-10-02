import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";

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
      <body className="min-h-full">
        <a
          href="#main"
          className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to main content
        </a>
        <ThemeProvider nonce={nonce}>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
