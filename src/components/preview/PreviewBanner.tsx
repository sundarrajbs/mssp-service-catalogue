import Link from "next/link";
import { EyeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown at the top of every preview page. */
export function PreviewBanner() {
  return (
    <div
      role="region"
      aria-label="Preview notice"
      className="bg-brand text-brand-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm font-medium"
    >
      <p className="flex items-center gap-2">
        <EyeIcon className="size-4 shrink-0" aria-hidden />
        You&apos;re viewing a preview — sign in to build your own catalogue
      </p>
      <Button asChild size="sm" variant="secondary" className="h-8">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    </div>
  );
}
