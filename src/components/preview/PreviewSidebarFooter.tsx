import Link from "next/link";
import { LogInIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PreviewSidebarFooter() {
  return (
    <Button asChild variant="ghost" size="sm" className="w-full justify-start">
      <Link href="/sign-in">
        <LogInIcon aria-hidden />
        Sign in
      </Link>
    </Button>
  );
}
