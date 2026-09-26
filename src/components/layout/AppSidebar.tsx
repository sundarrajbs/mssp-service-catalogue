"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DownloadIcon,
  GaugeIcon,
  CalculatorIcon,
  LayersIcon,
  LibraryIcon,
  RadarIcon,
  SettingsIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useCatalogueStore } from "@/store/catalogueStore";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/library", label: "Library", icon: LibraryIcon },
  { href: "/tiers", label: "Tiers", icon: LayersIcon },
  { href: "/slas", label: "SLAs", icon: GaugeIcon },
  { href: "/pricing", label: "Pricing", icon: CalculatorIcon },
  { href: "/coverage", label: "Coverage", icon: RadarIcon },
  { href: "/export", label: "Export", icon: DownloadIcon },
];

function NavLink({ href, label, icon: Icon }: (typeof NAV_ITEMS)[number]) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active
          ? "bg-brand-soft text-foreground shadow-[inset_3px_0_0_var(--brand)]"
          : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className={cn("size-4.5", active && "text-brand")} aria-hidden />
      {label}
    </Link>
  );
}

export function AppSidebar() {
  const mspName = useCatalogueStore((s) => s.catalogue.mspName);
  const logo = useCatalogueStore((s) => s.catalogue.logo);

  return (
    <aside className="bg-sidebar border-sidebar-border flex w-60 shrink-0 flex-col border-r">
      <div className="flex items-center gap-3 px-5 py-6">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL logo, not optimisable
          <img src={logo} alt="" className="size-9 rounded-md object-contain" />
        ) : (
          <div className="bg-brand text-brand-foreground flex size-9 items-center justify-center rounded-md text-sm font-semibold">
            {mspName.trim().charAt(0).toUpperCase() || "M"}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{mspName || "Your MSSP"}</p>
          <p className="text-muted-foreground text-xs">Catalogue Builder</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
      <div className="border-sidebar-border flex flex-col gap-1 border-t p-3">
        <NavLink href="/settings" label="Settings" icon={SettingsIcon} />
        <ThemeToggle />
      </div>
    </aside>
  );
}
