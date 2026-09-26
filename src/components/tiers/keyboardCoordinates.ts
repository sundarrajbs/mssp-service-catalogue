import { KeyboardCode, type KeyboardCoordinateGetter } from "@dnd-kit/core";

/**
 * Keyboard dragging: arrow keys step through the drop zones in reading order
 * (library, then each tier's Included and Add-ons zones) instead of dnd-kit's
 * default of nudging the item 25px per key press.
 */
export const zoneKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  const step =
    event.code === KeyboardCode.Right || event.code === KeyboardCode.Down
      ? 1
      : event.code === KeyboardCode.Left || event.code === KeyboardCode.Up
        ? -1
        : 0;
  const { collisionRect, droppableRects, over } = context;
  if (step === 0 || !collisionRect) return undefined;
  event.preventDefault();

  // DOM order of the zones is their reading order.
  const order = Array.from(document.querySelectorAll<HTMLElement>("[data-drop-zone]"), (el) => el.dataset.dropZone!);
  const currentIndex = over ? order.indexOf(String(over.id)) : 0;
  const nextId = order[Math.min(Math.max(currentIndex + step, 0), order.length - 1)];
  const rect = nextId ? droppableRects.get(nextId) : undefined;
  if (!rect) return currentCoordinates;

  // Move the dragged item's centre onto the target zone's centre.
  const dx = rect.left + rect.width / 2 - (collisionRect.left + collisionRect.width / 2);
  const dy = rect.top + rect.height / 2 - (collisionRect.top + collisionRect.height / 2);
  return { x: currentCoordinates.x + dx, y: currentCoordinates.y + dy };
};
