import type { NistFunction } from "./types";

/** Colours follow the familiar NIST CSF wheel, softened for projectors. */
export const NIST_COLOURS: Record<NistFunction, string> = {
  Govern: "#8b5cf6",
  Identify: "#3b82f6",
  Protect: "#0ea5e9",
  Detect: "#f59e0b",
  Respond: "#ef4444",
  Recover: "#10b981",
};
