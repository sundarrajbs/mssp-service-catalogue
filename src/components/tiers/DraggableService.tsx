"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVerticalIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useReadOnly } from "@/store/catalogueStore";
import type { Service } from "@/lib/domain/types";

export interface DragData {
  serviceId: string;
  /** Set when the item is dragged out of a tier rather than the library. */
  fromTierId?: string;
}

interface DraggableServiceProps {
  dragId: string;
  service: Service;
  data: DragData;
  hint?: string;
  /** Rendered beside (not inside) the drag target so buttons stay separately focusable. */
  actions?: React.ReactNode;
}

export function DraggableService({ dragId, service, data, hint, actions }: DraggableServiceProps) {
  // Dragging is switched off in the read-only preview.
  const readOnly = useReadOnly();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId, data, disabled: readOnly });

  return (
    <div className={cn("bg-card flex items-stretch rounded-lg border shadow-xs", isDragging && "opacity-40")}>
      <div
        ref={setNodeRef}
        {...(readOnly ? {} : { ...listeners, ...attributes, "aria-roledescription": "draggable service" })}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
      >
        {!readOnly && <GripVerticalIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm leading-snug font-medium">{service.name}</span>
          {hint && <span className="text-muted-foreground block text-xs">{hint}</span>}
        </span>
      </div>
      {actions && <div className="flex items-center pr-1">{actions}</div>}
    </div>
  );
}

/** Static copy of an item shown under the pointer while dragging. */
export function ServiceDragPreview({ service }: { service: Service }) {
  return (
    <div className="bg-card ring-brand flex w-64 cursor-grabbing items-center gap-2 rounded-lg border px-2.5 py-2 shadow-lg ring-2">
      <GripVerticalIcon className="text-muted-foreground size-4" aria-hidden />
      <span className="truncate text-sm font-medium">{service.name}</span>
    </div>
  );
}
