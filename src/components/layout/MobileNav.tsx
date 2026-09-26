"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandMark, SidebarContent } from "./AppSidebar";

/** Top bar with a slide-out menu for tablets (below lg). */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-sidebar border-sidebar-border sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="size-11" aria-label="Open menu">
            <MenuIcon className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-sidebar w-72 gap-0 p-0 sm:max-w-72">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Move between the sections of the catalogue builder.</SheetDescription>
          <div className="flex h-full flex-col overflow-y-auto">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
      <BrandMark />
    </header>
  );
}
