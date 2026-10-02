"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalculatorIcon,
  DownloadIcon,
  GaugeIcon,
  LayersIcon,
  LibraryIcon,
  LockIcon,
  RadarIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

import { useSignInPrompt } from "@/components/preview/SignInPrompt";
import { cn } from "@/lib/utils";
import { useCatalogueStore } from "@/store/catalogueStore";
import { useBuilder } from "./BuilderContext";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Not available in the public preview: shown locked, opens the "start building" prompt. */
  signedInOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/library", label: "Library", icon: LibraryIcon },
  { path: "/tiers", label: "Tiers", icon: LayersIcon },
  { path: "/slas", label: "SLAs", icon: GaugeIcon },
  { path: "/pricing", label: "Pricing", icon: CalculatorIcon },
  { path: "/coverage", label: "Coverage", icon: RadarIcon },
  { path: "/export", label: "Export", icon: DownloadIcon, signedInOnly: true },
];

const itemClass =
  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { basePath, mode } = useBuilder();
  const prompt = useSignInPrompt();
  const Icon = item.icon;

  if (mode === "preview" && item.signedInOnly) {
    return (
      <button
        type="button"
        onClick={() => prompt(item.label.toLowerCase() === "export" ? "export PDFs and JSON" : "change settings")}
        className={cn(itemClass, "text-muted-foreground hover:bg-accent cursor-pointer")}
      >
        <Icon className="size-4.5" aria-hidden />
        {item.label}
        <LockIcon className="ml-auto size-3.5" aria-label="Not available in the preview" />
      </button>
    );
  }

  const href = `${basePath}${item.path}`;
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        itemClass,
        active
          ? "bg-brand-soft text-foreground shadow-[inset_3px_0_0_var(--brand)]"
          : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className={cn("size-4.5", active && "text-brand")} aria-hidden />
      {item.label}
    </Link>
  );
}

export interface SidebarSlots {
  /** Extra content under the brand, e.g. the catalogue switcher. */
  header?: React.ReactNode;
  /** Extra footer links, e.g. Account and Sign out, or Sign in in the preview. */
  footer?: React.ReactNode;
}

/** Brand, navigation and theme toggle: shared by the desktop sidebar and the tablet menu. */
export function SidebarContent({ onNavigate, header, footer }: SidebarSlots & { onNavigate?: () => void }) {
  const { mode } = useBuilder();
  return (
    <>
      <div className="space-y-4 px-5 py-6">
        <BrandMark />
        {header}
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-sidebar-border flex flex-col gap-1 border-t p-3">
        <NavLink
          item={{ path: "/settings", label: "Settings", icon: SettingsIcon, signedInOnly: true }}
          onNavigate={onNavigate}
        />
        {footer}
        <ThemeToggle />
      </div>
      {mode === "preview" && <span className="sr-only">Preview mode</span>}
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
export function AppSidebar(slots: SidebarSlots) {
  return (
    <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r lg:flex">
      <SidebarContent {...slots} />
    </aside>
  );
}
