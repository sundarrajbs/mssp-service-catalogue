"use client";

import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { ResetDefaultsButton } from "@/components/shared/ResetDefaultsButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Service } from "@/lib/domain/types";
import { useCatalogueStore } from "@/store/catalogueStore";
import { ServiceCard } from "./ServiceCard";
import { ServiceEditorSheet } from "./ServiceEditorSheet";

const ALL_CATEGORIES = "__all__";

export function ServiceLibrary() {
  const services = useCatalogueStore((s) => s.catalogue.services);
  const currency = useCatalogueStore((s) => s.catalogue.currency);
  const { addService, updateService, duplicateService, deleteService } = useCatalogueStore.getState();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  // undefined = sheet closed, null = creating a new service
  const [editing, setEditing] = useState<Service | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);

  const categories = useMemo(
    () => [...new Set(services.map((s) => s.category))].sort((a, b) => a.localeCompare(b)),
    [services],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (category !== ALL_CATEGORIES && s.category !== category) return false;
      if (!q) return true;
      return [s.name, s.description, s.category, ...s.deliverables].some((text) => text.toLowerCase().includes(q));
    });
  }, [services, query, category]);

  return (
    <>
      <PageHeader
        title="Service library"
        description="The building blocks of the catalogue. Edit descriptions, deliverables and unit costs to match how you deliver each service."
        actions={
          <>
            <ResetDefaultsButton />
            <Button onClick={() => setEditing(null)}>
              <PlusIcon aria-hidden />
              Add service
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
          <Input
            type="search"
            placeholder="Search services, descriptions, deliverables…"
            aria-label="Search services"
            className="h-10 pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-10! w-56" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {visible.length} of {services.length} services
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-12 text-center">
          {services.length === 0 ? "The library is empty. Add a service to get started." : "No services match your filters."}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              currency={currency}
              onEdit={() => setEditing(service)}
              onDuplicate={() => {
                const copy = duplicateService(service.id);
                if (copy) toast.success(`Duplicated as “${copy.name}”`);
              }}
              onDelete={() => setPendingDelete(service)}
            />
          ))}
        </div>
      )}

      <ServiceEditorSheet
        service={editing}
        categories={categories}
        onClose={() => setEditing(undefined)}
        onSave={({ id, ...fields }) => {
          if (id) {
            updateService({ ...fields, id });
            toast.success("Service updated");
          } else {
            addService(fields);
            toast.success("Service added");
          }
          setEditing(undefined);
        }}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The service will also be removed from any tiers that include it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) {
                  deleteService(pendingDelete.id);
                  toast.success("Service deleted");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
