"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Link from "next/link";
import { LockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OpenPrompt = (action?: string) => void;

const SignInPromptContext = createContext<OpenPrompt>(() => {});

/** Opens the "build your own catalogue" dialog, e.g. `prompt("edit services")`. */
export function useSignInPrompt(): OpenPrompt {
  return useContext(SignInPromptContext);
}

export function SignInPromptProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // Kept after closing so the title doesn't go blank during the fade-out.
  const [action, setAction] = useState("make changes");
  const show = useCallback<OpenPrompt>((a) => {
    setAction(a ?? "make changes");
    setOpen(true);
  }, []);

  return (
    <SignInPromptContext.Provider value={show}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockIcon className="text-brand size-5" aria-hidden />
              Open the builder to {action}
            </DialogTitle>
            <DialogDescription>
              This demo is read-only. The builder is free and needs no sign-up: your catalogue is saved in this
              browser, and you can sign in any time to keep it in the cloud.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep browsing
            </Button>
            <Button variant="outline" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/app/library">Start building</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SignInPromptContext.Provider>
  );
}
