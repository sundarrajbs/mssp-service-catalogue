"use client";

import { CheckIcon, MinusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { INCLUSION_LABELS, tierLabel, type Inclusion, type Service, type Tier } from "@/lib/domain/types";

const NEXT_STATE: Record<Inclusion | "none", Inclusion | null> = {
  none: "included",
  included: "addOn",
  addOn: null,
};

interface TierComparisonMatrixProps {
  services: Service[];
  tiers: Tier[];
  /** When provided, cells become buttons that cycle — → ✓ → Add-on. */
  onChange?: (tierId: string, serviceId: string, inclusion: Inclusion | null) => void;
}

export function inclusionFor(tier: Tier, serviceId: string): Inclusion | undefined {
  return tier.services.find((ts) => ts.serviceId === serviceId)?.inclusion;
}

export function MatrixCellContent({ inclusion }: { inclusion: Inclusion | undefined }) {
  if (inclusion === "included") return <CheckIcon className="text-brand mx-auto size-5" strokeWidth={3} aria-label="Included" />;
  if (inclusion === "addOn") return <Badge variant="brand">Add-on</Badge>;
  return <MinusIcon className="text-muted-foreground/60 mx-auto size-4" aria-label="Not offered" />;
}

export function TierComparisonMatrix({ services, tiers, onChange }: TierComparisonMatrixProps) {
  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <div className="bg-card rounded-xl border">
      <Table className="text-[15px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-12 min-w-64 pl-5">Service</TableHead>
            {tiers.map((tier) => (
              <TableHead key={tier.id} className="h-12 min-w-32 text-center text-base font-semibold">
                {tierLabel(tier)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <CategoryRows
              key={category}
              category={category}
              services={services.filter((s) => s.category === category)}
              tiers={tiers}
              onChange={onChange}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CategoryRows({
  category,
  services,
  tiers,
  onChange,
}: {
  category: string;
  services: Service[];
  tiers: Tier[];
  onChange?: TierComparisonMatrixProps["onChange"];
}) {
  return (
    <>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableCell
          colSpan={tiers.length + 1}
          className="text-muted-foreground py-2 pl-5 text-xs font-semibold tracking-wide uppercase"
        >
          {category}
        </TableCell>
      </TableRow>
      {services.map((service) => (
        <TableRow key={service.id}>
          <TableCell className="pl-5 font-medium">{service.name}</TableCell>
          {tiers.map((tier) => {
            const inclusion = inclusionFor(tier, service.id);
            const state = inclusion ? INCLUSION_LABELS[inclusion] : "Not offered";
            return (
              <TableCell key={tier.id} className="p-1 text-center">
                {onChange ? (
                  <button
                    type="button"
                    className="hover:bg-accent flex h-10 w-full cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    aria-label={`${service.name} in ${tierLabel(tier)}: ${state}. Activate to change.`}
                    onClick={() => onChange(tier.id, service.id, NEXT_STATE[inclusion ?? "none"])}
                  >
                    <MatrixCellContent inclusion={inclusion} />
                  </button>
                ) : (
                  <MatrixCellContent inclusion={inclusion} />
                )}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
