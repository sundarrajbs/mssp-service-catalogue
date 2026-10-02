"use client";

import Link from "next/link";
import { CircleAlertIcon, CloudUploadIcon, HardDriveIcon, LoaderCircleIcon, LogInIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGuestSaveStatus } from "./GuestWorkspace";

/** Under the brand in the sidebar: where the work is saved, and how to keep it in the cloud. */
export function GuestSidebarHeader({ signInAvailable }: { signInAvailable: boolean }) {
  const { status, error } = useGuestSaveStatus();
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex min-h-5 items-center gap-1.5 px-1 text-xs" role="status" aria-live="polite">
        {status === "saved" && (
          <>
            <HardDriveIcon className="size-3.5" aria-hidden /> Saved in this browser
          </>
        )}
        {status === "pending" && (
          <>
            <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden /> Saving…
          </>
        )}
        {status === "error" && (
          <span className="text-destructive flex items-center gap-1.5">
            <CircleAlertIcon className="size-3.5 shrink-0" aria-hidden /> {error ?? "Couldn't save."}
          </span>
        )}
      </div>
      {signInAvailable && (
        <Button asChild variant="outline" size="sm" className="w-full justify-start">
          <Link href="/sign-up">
            <CloudUploadIcon aria-hidden />
            Save to the cloud (free account)
          </Link>
        </Button>
      )}
    </div>
  );
}

export function GuestSidebarFooter({ signInAvailable }: { signInAvailable: boolean }) {
  if (!signInAvailable) return null;
  return (
    <Button asChild variant="ghost" size="sm" className="w-full justify-start">
      <Link href="/sign-in">
        <LogInIcon aria-hidden />
        Sign in
      </Link>
    </Button>
  );
}
