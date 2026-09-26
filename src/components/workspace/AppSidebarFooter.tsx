"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon, UserRoundIcon } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppSidebarFooter() {
  const active = usePathname() === "/app/account";
  return (
    <>
      <Link
        href="/app/account"
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          active
            ? "bg-brand-soft text-foreground shadow-[inset_3px_0_0_var(--brand)]"
            : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <UserRoundIcon className="size-4.5" aria-hidden />
        Account
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
          <LogOutIcon aria-hidden />
          Sign out
        </Button>
      </form>
    </>
  );
}
