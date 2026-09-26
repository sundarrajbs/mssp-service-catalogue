"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** `nonce` lets next-themes' small inline script (which prevents a theme flash) pass the CSP. */
export function ThemeProvider({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange nonce={nonce}>
      {children}
    </NextThemesProvider>
  );
}
