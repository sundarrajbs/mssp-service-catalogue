"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { NIST_FUNCTIONS, PRICING_UNITS, serviceSchema } from "@/lib/domain/schema";
import { NIST_COLOURS } from "@/lib/domain/nist";
import { PRICING_UNIT_LABELS, type NistFunction, type PricingUnit, type Service } from "@/lib/domain/types";

export const EMPTY_SERVICE: Omit<Service, "id"> = {
  name: "",
  category: "",
  description: "",
  deliverables: [],
  prerequisites: [],
  nistFunctions: [],
  pricingUnit: "endpoint",
  unitCost: 0,
  isAddOn: false,
};

interface Draft {
  name: string;
  category: string;
  description: string;
  deliverables: string;
  prerequisites: string;
  nistFunctions: NistFunction[];
  pricingUnit: PricingUnit;
  unitCost: string;
  isAddOn: boolean;
}

type FieldErrors = Partial<Record<keyof Draft, string>>;

function toDraft(service: Omit<Service, "id">): Draft {
  return {
    ...service,
    deliverables: service.deliverables.join("\n"),
    prerequisites: service.prerequisites.join("\n"),
    unitCost: String(service.unitCost),
  };
}

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

interface ServiceEditorSheetProps {
  /** The service being edited, or `null` to create a new one. `undefined` closes the sheet. */
  service: Service | null | undefined;
  categories: string[];
  onClose: () => void;
  onSave: (service: Omit<Service, "id"> & { id?: string }) => void;
}

export function ServiceEditorSheet({ service, categories, onClose, onSave }: ServiceEditorSheetProps) {
  const open = service !== undefined;
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        {open && (
          <ServiceForm
            key={service?.id ?? "new"}
            service={service}
            categories={categories}
            onCancel={onClose}
            onSave={onSave}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ServiceForm({
  service,
  categories,
  onCancel,
  onSave,
}: {
  service: Service | null;
  categories: string[];
  onCancel: () => void;
  onSave: ServiceEditorSheetProps["onSave"];
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(service ?? EMPTY_SERVICE));
  const [errors, setErrors] = useState<FieldErrors>({});
  const ids = useId();
  const fieldId = (name: string) => `${ids}-${name}`;

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const toggleFunction = (fn: NistFunction, checked: boolean) =>
    update("nistFunctions", checked ? [...draft.nistFunctions, fn] : draft.nistFunctions.filter((f) => f !== fn));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const candidate = {
      id: service?.id ?? "new",
      name: draft.name,
      category: draft.category,
      description: draft.description,
      deliverables: splitLines(draft.deliverables),
      prerequisites: splitLines(draft.prerequisites),
      nistFunctions: draft.nistFunctions,
      pricingUnit: draft.pricingUnit,
      unitCost: draft.unitCost.trim() === "" ? NaN : Number(draft.unitCost),
      isAddOn: draft.isAddOn,
    };
    const result = serviceSchema.safeParse(candidate);
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Draft;
        if (key === "unitCost") next.unitCost = "Enter a cost of zero or more";
        else next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    onSave({ ...result.data, id: service?.id });
  }

  const errorId = (name: keyof Draft) => (errors[name] ? `${fieldId(name)}-error` : undefined);

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col" noValidate>
      <SheetHeader className="border-b px-6 py-5">
        <SheetTitle className="text-xl">{service ? "Edit service" : "New service"}</SheetTitle>
        <SheetDescription>Describe what the customer gets, how it maps to NIST CSF and how it is priced.</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <div className="space-y-2">
          <Label htmlFor={fieldId("name")}>Name</Label>
          <Input
            id={fieldId("name")}
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errorId("name")}
            maxLength={120}
          />
          <FieldError id={errorId("name")} message={errors.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("category")}>Category</Label>
          <Input
            id={fieldId("category")}
            list={fieldId("category-options")}
            value={draft.category}
            onChange={(e) => update("category", e.target.value)}
            aria-invalid={!!errors.category}
            aria-describedby={errorId("category")}
            placeholder="Pick an existing category or type a new one"
            maxLength={80}
          />
          <datalist id={fieldId("category-options")}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <FieldError id={errorId("category")} message={errors.category} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("description")}>Description</Label>
          <Textarea
            id={fieldId("description")}
            rows={4}
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={2000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("deliverables")}>Deliverables</Label>
          <Textarea
            id={fieldId("deliverables")}
            rows={4}
            value={draft.deliverables}
            onChange={(e) => update("deliverables", e.target.value)}
            aria-describedby={`${fieldId("deliverables")}-hint`}
          />
          <p id={`${fieldId("deliverables")}-hint`} className="text-muted-foreground text-xs">
            One deliverable per line.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={fieldId("prerequisites")}>Prerequisites</Label>
          <Textarea
            id={fieldId("prerequisites")}
            rows={3}
            value={draft.prerequisites}
            onChange={(e) => update("prerequisites", e.target.value)}
            aria-describedby={`${fieldId("prerequisites")}-hint`}
          />
          <p id={`${fieldId("prerequisites")}-hint`} className="text-muted-foreground text-xs">
            One prerequisite per line.
          </p>
        </div>

        <fieldset className="space-y-3" aria-describedby={errorId("nistFunctions")}>
          <legend className="mb-3 text-sm font-medium">NIST CSF 2.0 functions</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {NIST_FUNCTIONS.map((fn) => {
              const id = fieldId(`nist-${fn}`);
              return (
                <div key={fn} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={draft.nistFunctions.includes(fn)}
                    onCheckedChange={(checked) => toggleFunction(fn, checked === true)}
                  />
                  <Label htmlFor={id} className="font-normal">
                    <span className="size-2 rounded-full" style={{ backgroundColor: NIST_COLOURS[fn] }} aria-hidden />
                    {fn}
                  </Label>
                </div>
              );
            })}
          </div>
          <FieldError id={errorId("nistFunctions")} message={errors.nistFunctions} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={fieldId("pricingUnit")}>Pricing unit</Label>
            <Select value={draft.pricingUnit} onValueChange={(v) => update("pricingUnit", v as PricingUnit)}>
              <SelectTrigger id={fieldId("pricingUnit")} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {PRICING_UNIT_LABELS[unit]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={fieldId("unitCost")}>Unit cost (monthly)</Label>
            <Input
              id={fieldId("unitCost")}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={draft.unitCost}
              onChange={(e) => update("unitCost", e.target.value)}
              aria-invalid={!!errors.unitCost}
              aria-describedby={errorId("unitCost")}
            />
            <FieldError id={errorId("unitCost")} message={errors.unitCost} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <Label htmlFor={fieldId("isAddOn")}>Offer as an add-on</Label>
            <p className="text-muted-foreground mt-1 text-xs">
              Add-ons are sold on top of a tier rather than included in it.
            </p>
          </div>
          <Switch id={fieldId("isAddOn")} checked={draft.isAddOn} onCheckedChange={(v) => update("isAddOn", v)} />
        </div>
      </div>

      <SheetFooter className="flex-row justify-end border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{service ? "Save changes" : "Add service"}</Button>
      </SheetFooter>
    </form>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  );
}
