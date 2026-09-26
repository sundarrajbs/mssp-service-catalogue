import { NIST_FUNCTIONS } from "@/lib/domain/schema";
import { NIST_COLOURS } from "@/lib/domain/nist";
import type { NistFunction } from "@/lib/domain/types";

export function NistBadges({ functions }: { functions: NistFunction[] }) {
  const ordered = NIST_FUNCTIONS.filter((f) => functions.includes(f));
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="NIST CSF functions">
      {ordered.map((fn) => (
        <li
          key={fn}
          className="text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
        >
          <span className="size-2 rounded-full" style={{ backgroundColor: NIST_COLOURS[fn] }} aria-hidden />
          {fn}
        </li>
      ))}
    </ul>
  );
}
