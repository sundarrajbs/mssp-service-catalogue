"use client";

import { useState } from "react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  CircleAlertIcon,
  CloudCheckIcon,
  CopyIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "./CatalogueWorkspace";

/** Switch between, create, rename, duplicate and delete catalogues. */
export function CatalogueSwitcher() {
  const workspace = useWorkspace();
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-auto w-full justify-between gap-2 px-3 py-2 text-left" aria-label={`Catalogue: ${workspace.current.name}. Switch or manage catalogues`}>
            <span className="min-w-0">
              <span className="text-muted-foreground block text-[11px] font-medium tracking-wide uppercase">Catalogue</span>
              <span className="block truncate text-sm font-medium">{workspace.current.name}</span>
            </span>
            <ChevronsUpDownIcon className="text-muted-foreground shrink-0" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Your catalogues</DropdownMenuLabel>
          {workspace.summaries.map((summary) => (
            <DropdownMenuItem key={summary.id} onSelect={() => void workspace.switchTo(summary.id)}>
              <CheckIcon className={summary.id === workspace.current.id ? "opacity-100" : "opacity-0"} aria-hidden />
              <span className="truncate">{summary.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void workspace.createNew()}>
            <PlusIcon aria-hidden /> New catalogue
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setName(workspace.current.name);
              setRenaming(true);
            }}
          >
            <PencilIcon aria-hidden /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void workspace.duplicateCurrent()}>
            <CopyIcon aria-hidden /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
            <Trash2Icon aria-hidden /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SaveIndicator />

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              setRenaming(false);
              void workspace.renameCurrent(name);
            }}
            className="grid gap-4"
          >
            <DialogHeader>
              <DialogTitle>Rename catalogue</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="catalogue-name">Name</Label>
              <Input id="catalogue-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{workspace.current.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the catalogue from your account. Export a JSON backup first if you might need it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void workspace.deleteCurrent()}>
              Delete catalogue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SaveIndicator() {
  const { saveStatus, saveError, retrySave } = useWorkspace();
  return (
    <div className="text-muted-foreground flex min-h-5 items-center gap-1.5 px-1 text-xs" role="status" aria-live="polite">
      {saveStatus === "saved" && (
        <>
          <CloudCheckIcon className="size-3.5" aria-hidden /> All changes saved
        </>
      )}
      {(saveStatus === "saving" || saveStatus === "pending") && (
        <>
          <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden /> Saving…
        </>
      )}
      {saveStatus === "error" && (
        <span className="text-destructive flex items-center gap-1.5">
          <CircleAlertIcon className="size-3.5 shrink-0" aria-hidden />
          <span>{saveError ?? "Couldn't save."}</span>
          <button type="button" onClick={retrySave} className="cursor-pointer font-medium underline underline-offset-2">
            Retry
          </button>
        </span>
      )}
    </div>
  );
}
