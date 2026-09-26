"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

import { INCLUSION_LABELS, tierLabel, type Inclusion, type Service, type Tier } from "@/lib/domain/types";
import { useCatalogueStore } from "@/store/catalogueStore";
import { ServiceDragPreview, type DragData } from "./DraggableService";
import type { DropData } from "./DropZone";
import { zoneKeyboardCoordinates } from "./keyboardCoordinates";
import { LibraryPanel } from "./LibraryPanel";
import { TierColumn } from "./TierColumn";

interface TierBoardProps {
  services: Service[];
  tiers: Tier[];
  onDeleteTier: (tier: Tier) => void;
}

export function TierBoard({ services, tiers, onDeleteTier }: TierBoardProps) {
  const { setTierService, updateTier, moveTier } = useCatalogueStore.getState();
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  const servicesById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const tiersById = useMemo(() => new Map(tiers.map((t) => [t.id, t])), [tiers]);

  const sensors = useSensors(
    // A small movement threshold keeps clicks on items working normally.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // A short press-and-hold on touch screens (iPads) so lists still scroll.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: zoneKeyboardCoordinates }),
  );

  const describeDrop = (drop: DropData | undefined) => {
    if (!drop) return "nowhere";
    if (!drop.tierId) return "the library (removes it from the tier)";
    const tier = tiersById.get(drop.tierId);
    return `${tier ? tierLabel(tier) : "tier"}, ${INCLUSION_LABELS[drop.inclusion ?? "included"]}`;
  };
  const serviceName = (data: unknown) => servicesById.get((data as DragData | undefined)?.serviceId ?? "")?.name ?? "service";

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${serviceName(active.data.current)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${serviceName(active.data.current)} is over ${describeDrop(over.data.current as DropData)}.`
        : `${serviceName(active.data.current)} is no longer over a drop area.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${serviceName(active.data.current)} dropped on ${describeDrop(over.data.current as DropData)}.`
        : `${serviceName(active.data.current)} dropped. No change.`,
    onDragCancel: ({ active }) => `Cancelled moving ${serviceName(active.data.current)}.`,
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveServiceId((event.active.data.current as DragData).serviceId);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveServiceId(null);
    if (!over) return;
    const { serviceId, fromTierId } = active.data.current as DragData;
    const drop = over.data.current as DropData;

    if (!drop.tierId) {
      if (fromTierId) setTierService(fromTierId, serviceId, null);
      return;
    }
    const target = tiersById.get(drop.tierId);
    const inclusion: Inclusion = drop.inclusion ?? "included";
    if (!target) return;
    if (!fromTierId && target.services.some((ts) => ts.serviceId === serviceId && ts.inclusion === inclusion)) {
      toast.info(`${servicesById.get(serviceId)?.name} is already in ${tierLabel(target)}`);
      return;
    }
    setTierService(drop.tierId, serviceId, inclusion);
    // Dragging between tiers moves the service.
    if (fromTierId && fromTierId !== drop.tierId) setTierService(fromTierId, serviceId, null);
  }

  const activeService = activeServiceId ? servicesById.get(activeServiceId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveServiceId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To pick up a service, press space or enter. Use the arrow keys to move it over a tier, then press space or enter to drop it, or escape to cancel. You can also use the add button next to each library service.",
        },
      }}
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        {/* Side panel on wide screens; a shorter scrolling panel above the tiers on tablets. */}
        <div className="max-h-80 overflow-y-auto rounded-xl xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:w-72 xl:shrink-0">
          <LibraryPanel services={services} tiers={tiers} onAddToTier={(tierId, serviceId, inclusion) => setTierService(tierId, serviceId, inclusion)} />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {tiers.map((tier, index) => (
            <TierColumn
              key={tier.id}
              tier={tier}
              servicesById={servicesById}
              isFirst={index === 0}
              isLast={index === tiers.length - 1}
              onRename={(name) => updateTier(tier.id, { name })}
              onMove={(direction) => moveTier(tier.id, direction)}
              onDelete={() => onDeleteTier(tier)}
              onSetService={(serviceId, inclusion) => setTierService(tier.id, serviceId, inclusion)}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>{activeService && <ServiceDragPreview service={activeService} />}</DragOverlay>
    </DndContext>
  );
}
