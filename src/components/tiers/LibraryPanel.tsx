"use client";

import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";

import { GuardedButton } from "@/components/preview/GuardedButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useReadOnly } from "@/store/catalogueStore";
import { tierLabel, type Inclusion, type Service, type Tier } from "@/lib/domain/types";
import { DraggableService } from "./DraggableService";
import { DropZone } from "./DropZone";

interface LibraryPanelProps {
  services: Service[];
  tiers: Tier[];
  onAddToTier: (tierId: string, serviceId: string, inclusion: Inclusion) => void;
}

export function LibraryPanel({ services, tiers, onAddToTier }: LibraryPanelProps) {
  const readOnly = useReadOnly();
  const [query, setQuery] = useState("");

  const tierCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tier of tiers)
      for (const ts of tier.services) counts.set(ts.serviceId, (counts.get(ts.serviceId) ?? 0) + 1);
    return counts;
  }, [tiers]);

  const q = query.trim().toLowerCase();
  const visible = services.filter(
    (s) => !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
  );
  const groups = [
    { title: "Core services", items: visible.filter((s) => !s.isAddOn) },
    { title: "Add-on services", items: visible.filter((s) => s.isAddOn) },
  ];

  return (
    <DropZone
      id="library"
      data={{}}
      label="Service library. Drop a tier service here to remove it from the tier."
      emptyText=""
      isEmpty={false}
      className="bg-card border-border! gap-4 rounded-xl p-4"
    >
      <div>
        <h2 className="text-lg font-semibold">Library</h2>
        <p className="text-muted-foreground text-xs">
          {readOnly ? "Services available to add to tiers." : "Drag into a tier, or use + to add."}
        </p>
      </div>
      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
        <Input
          type="search"
          aria-label="Search library"
          placeholder="Search…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {groups.map(({ title, items }) => (
        <div key={title} className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
          {items.length === 0 && <p className="text-muted-foreground text-xs">None</p>}
          {items.map((service) => {
            const count = tierCount.get(service.id) ?? 0;
            return (
              <DraggableService
                key={service.id}
                dragId={`lib:${service.id}`}
                service={service}
                data={{ serviceId: service.id }}
                hint={count === 0 ? "Not in any tier" : `In ${count} ${count === 1 ? "tier" : "tiers"}`}
                actions={
                  readOnly ? (
                    <GuardedButton
                      variant="ghost"
                      size="icon-sm"
                      action="add services to tiers"
                      aria-label={`Add ${service.name} to a tier`}
                    >
                      <PlusIcon />
                    </GuardedButton>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Add ${service.name} to a tier`}>
                          <PlusIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {tiers.length === 0 && <DropdownMenuLabel>Create a tier first</DropdownMenuLabel>}
                        {tiers.map((tier, index) => (
                          <div key={tier.id}>
                            {index > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel>{tierLabel(tier)}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => onAddToTier(tier.id, service.id, "included")}>
                              Include in tier
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onAddToTier(tier.id, service.id, "addOn")}>
                              Offer as add-on
                            </DropdownMenuItem>
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }
              />
            );
          })}
        </div>
      ))}
    </DropZone>
  );
}
