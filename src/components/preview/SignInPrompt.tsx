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

/** Opens the "sign in to build your own catalogue" dialog, e.g. `prompt("edit services")`. */
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
              Sign in to {action}
            </DialogTitle>
            <DialogDescription>
              You&apos;re viewing a preview. Sign in or create a free account to build, save and export your own
              catalogue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep browsing
            </Button>
            <Button variant="outline" asChild>
              <Link href="/sign-up">Create account</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SignInPromptContext.Provider>
  );
}
