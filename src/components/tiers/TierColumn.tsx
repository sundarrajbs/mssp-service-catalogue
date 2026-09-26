"use client";

import { ArrowLeftIcon, ArrowRightIcon, MoreHorizontalIcon, Trash2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { tierLabel, type Inclusion, type Service, type Tier } from "@/lib/domain/types";
import { DraggableService } from "./DraggableService";
import { DropZone } from "./DropZone";

interface TierColumnProps {
  tier: Tier;
  servicesById: Map<string, Service>;
  isFirst: boolean;
  isLast: boolean;
  onRename: (name: string) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onSetService: (serviceId: string, inclusion: Inclusion | null) => void;
}

export function TierColumn({
  tier,
  servicesById,
  isFirst,
  isLast,
  onRename,
  onMove,
  onDelete,
  onSetService,
}: TierColumnProps) {
  const name = tierLabel(tier);
  const zones: { inclusion: Inclusion; title: string; emptyText: string }[] = [
    { inclusion: "included", title: "Included", emptyText: "Drag services here" },
    { inclusion: "addOn", title: "Add-ons", emptyText: "Drag optional add-ons here" },
  ];

  return (
    <div className="bg-muted/40 flex min-w-0 flex-col gap-3 rounded-xl border p-3">
      <div className="flex items-center gap-1">
        <Input
          aria-label="Tier name"
          value={tier.name}
          placeholder="Untitled tier"
          maxLength={60}
          onChange={(e) => onRename(e.target.value)}
          className="bg-card h-10 text-base font-semibold"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={isFirst} onSelect={() => onMove(-1)}>
              <ArrowLeftIcon /> Move left
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isLast} onSelect={() => onMove(1)}>
              <ArrowRightIcon /> Move right
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon /> Delete tier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {zones.map(({ inclusion, title, emptyText }) => {
        const items = tier.services.filter((ts) => ts.inclusion === inclusion && servicesById.has(ts.serviceId));
        return (
          <div key={inclusion}>
            <h3 className="text-muted-foreground mb-1 px-2 text-xs font-semibold tracking-wide uppercase">
              {title} <span className="font-normal">({items.length})</span>
            </h3>
            <DropZone
              id={`zone:${tier.id}:${inclusion}`}
              data={{ tierId: tier.id, inclusion }}
              label={`${name} – ${title}`}
              emptyText={emptyText}
              isEmpty={items.length === 0}
              className={inclusion === "included" ? "min-h-24" : "min-h-16"}
            >
              {items.map(({ serviceId }) => {
                const service = servicesById.get(serviceId)!;
                return (
                  <DraggableService
                    key={serviceId}
                    dragId={`tier:${tier.id}:${serviceId}`}
                    service={service}
                    data={{ serviceId, fromTierId: tier.id }}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${service.name} from ${name}`}
                        onClick={() => onSetService(serviceId, null)}
                      >
                        <XIcon />
                      </Button>
                    }
                  />
                );
              })}
            </DropZone>
          </div>
        );
      })}
    </div>
  );
}
