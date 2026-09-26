import Link from "next/link";
import { LayersIcon } from "lucide-react";

import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <header className="mb-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <LayersIcon className="size-4.5" aria-hidden />
          </span>
          MSSP Catalogue Builder
        </Link>
      </header>
      <main id="main" tabIndex={-1} className="bg-card w-full max-w-md rounded-xl border p-8 shadow-sm outline-none">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-2 text-sm">{description}</p>}
        {!isSupabaseConfigured() && (
          <p role="alert" className="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            {AUTH_MESSAGES.notConfigured}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </main>
      {footer && <footer className="text-muted-foreground mt-6 text-center text-sm">{footer}</footer>}
    </div>
  );
}
