import Link from "next/link";
import { HammerIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PreviewSidebarFooter() {
  return (
    <Button asChild variant="ghost" size="sm" className="w-full justify-start">
      <Link href="/app/library">
        <HammerIcon aria-hidden />
        Start building
      </Link>
    </Button>
  );
}
