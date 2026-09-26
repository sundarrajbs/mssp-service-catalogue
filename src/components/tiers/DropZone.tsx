"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

export interface DropData {
  /** Undefined means the library panel (dropping there removes the service from its tier). */
  tierId?: string;
  inclusion?: "included" | "addOn";
}

interface DropZoneProps {
  id: string;
  data: DropData;
  label: string;
  emptyText: string;
  children: React.ReactNode;
  isEmpty: boolean;
  className?: string;
}

export function DropZone({ id, data, label, emptyText, children, isEmpty, className }: DropZoneProps) {
  const { setNodeRef, isOver, active } = useDroppable({ id, data });

  return (
    <section
      ref={setNodeRef}
      data-drop-zone={id}
      aria-label={label}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-transparent p-2 transition-colors",
        active && "border-dashed border-border",
        isOver && "border-brand bg-brand-soft",
        className,
      )}
    >
      {children}
      {isEmpty && (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-xs">{emptyText}</p>
      )}
    </section>
  );
}
