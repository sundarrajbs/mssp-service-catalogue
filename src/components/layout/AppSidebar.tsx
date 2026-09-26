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

type NavItem = (typeof NAV_ITEMS)[number] & { onNavigate?: () => void };

function NavLink({ href, label, icon: Icon, onNavigate }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
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

/** Brand, navigation and theme toggle: shared by the desktop sidebar and the tablet menu. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-5 py-6">
        <BrandMark />
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-sidebar-border flex flex-col gap-1 border-t p-3">
        <NavLink href="/settings" label="Settings" icon={SettingsIcon} onNavigate={onNavigate} />
        <ThemeToggle />
      </div>
    </>
  );
}

export function BrandMark() {
  const mspName = useCatalogueStore((s) => s.catalogue.mspName);
  const logo = useCatalogueStore((s) => s.catalogue.logo);

  return (
    <div className="flex min-w-0 items-center gap-3">
      {logo ? (
        // The name is shown next to the logo, so the image itself is decorative.
        // eslint-disable-next-line @next/next/no-img-element -- data URL logo, not optimisable
        <img src={logo} alt="" className="h-9 w-auto max-w-24 shrink-0 rounded-md object-contain" />
      ) : (
        <div
          className="bg-brand text-brand-foreground flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold"
          aria-hidden
        >
          {mspName.trim().charAt(0).toUpperCase() || "M"}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{mspName || "Your MSSP"}</p>
        <p className="text-muted-foreground text-xs">Catalogue Builder</p>
      </div>
    </div>
  );
}

/** Fixed sidebar on laptop and projector screens (lg and up). */
export function AppSidebar() {
  return (
    <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r lg:flex">
      <SidebarContent />
    </aside>
  );
}
