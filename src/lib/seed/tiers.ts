import { defaultSla, type SlaPreset } from "@/lib/domain/sla";
import type { Tier, TierService } from "@/lib/domain/types";

const included = (...ids: string[]): TierService[] => ids.map((serviceId) => ({ serviceId, inclusion: "included" }));
const addOns = (...ids: string[]): TierService[] => ids.map((serviceId) => ({ serviceId, inclusion: "addOn" }));

function tier(name: string, preset: SlaPreset, marginPercent: number, services: TierService[]): Tier {
  return { id: crypto.randomUUID(), name, services, sla: defaultSla(preset), marginPercent };
}

/** Essential / Advanced / Premium, referencing the seed service IDs. */
export function createDefaultTiers(): Tier[] {
  return [
    tier("Essential", "essential", 25, [
      ...included("svc-security-monitoring", "svc-vulnerability-management", "svc-email-security", "svc-managed-firewall"),
      ...addOns("svc-mdr", "svc-forensics", "svc-compliance-reporting", "svc-awareness-training"),
    ]),
    tier("Advanced", "advanced", 30, [
      ...included(
        "svc-security-monitoring",
        "svc-mdr",
        "svc-vulnerability-management",
        "svc-attack-surface",
        "svc-email-security",
        "svc-identity-threat",
        "svc-managed-firewall",
        "svc-threat-intel",
      ),
      ...addOns("svc-ir-retainer", "svc-forensics", "svc-cspm", "svc-compliance-reporting", "svc-awareness-training"),
    ]),
    tier("Premium", "premium", 35, [
      ...included(
        "svc-security-monitoring",
        "svc-mdr",
        "svc-threat-hunting",
        "svc-ir-retainer",
        "svc-vulnerability-management",
        "svc-attack-surface",
        "svc-managed-firewall",
        "svc-cspm",
        "svc-identity-threat",
        "svc-email-security",
        "svc-soar",
        "svc-threat-intel",
        "svc-compliance-reporting",
        "svc-awareness-training",
      ),
      ...addOns("svc-forensics"),
    ]),
  ];
}
