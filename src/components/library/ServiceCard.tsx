"use client";

import { CopyIcon, MoreHorizontalIcon, EyeIcon, LockIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { NistBadges } from "@/components/shared/NistBadges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/format/currency";
import { PRICING_UNIT_LABELS, type Currency, type Service } from "@/lib/domain/types";

interface ServiceCardProps {
  service: Service;
  currency: Currency;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** Public preview: the menu offers "View details"; the other actions ask the visitor to sign in. */
  readOnly?: boolean;
}

export function ServiceCard({ service, currency, onEdit, onDuplicate, onDelete, readOnly = false }: ServiceCardProps) {
  return (
    <article className="bg-card group relative flex flex-col gap-4 rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{service.category}</Badge>
            {service.isAddOn && <Badge variant="brand">Add-on</Badge>}
          </div>
          <h2 className="text-lg leading-snug font-semibold">
            {/* The title button covers the card so the whole card opens the editor. */}
            <button
              type="button"
              onClick={onEdit}
              className="text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
            >
              {service.name}
            </button>
          </h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative z-10" aria-label={`Actions for ${service.name}`}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              {readOnly ? <EyeIcon /> : <PencilIcon />} {readOnly ? "View details" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              <CopyIcon /> Duplicate
              {readOnly && <LockIcon className="ml-auto" aria-label="Not available in the preview" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon /> Delete
              {readOnly && <LockIcon className="ml-auto" aria-label="Not available in the preview" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{service.description}</p>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-2">
        <NistBadges functions={service.nistFunctions} />
        <p className="text-sm whitespace-nowrap">
          <span className="font-semibold">{formatMoney(service.unitCost, currency, { decimals: service.unitCost % 1 ? 2 : 0 })}</span>{" "}
          <span className="text-muted-foreground">{PRICING_UNIT_LABELS[service.pricingUnit]}</span>
        </p>
      </div>
    </article>
  );
}
