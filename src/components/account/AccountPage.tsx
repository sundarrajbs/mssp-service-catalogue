"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { LoaderCircleIcon, LogOutIcon } from "lucide-react";

import { deleteAccount, signOut } from "@/app/(auth)/actions";
import { FormStatus } from "@/components/auth/FormStatus";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_MESSAGES, INITIAL_AUTH_STATE } from "@/lib/auth/messages";
import { useWorkspace } from "@/components/workspace/CatalogueWorkspace";

export function AccountPage({ passwordUpdated }: { passwordUpdated: boolean }) {
  const { user, summaries } = useWorkspace();
  const [state, action, pending] = useActionState(deleteAccount, INITIAL_AUTH_STATE);
  const [confirm, setConfirm] = useState("");

  return (
    <>
      <PageHeader title="Account" />
      <div className="grid max-w-3xl gap-6">
        {passwordUpdated && <FormStatus state={{ status: "success", message: AUTH_MESSAGES.passwordUpdated }} />}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your account</CardTitle>
            <CardDescription>You sign in with this email address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid gap-1">
              <dt className="text-muted-foreground text-sm">Email</dt>
              <dd className="text-base font-medium break-all">{user.email}</dd>
            </dl>
            <div className="flex flex-wrap gap-3">
              <form action={signOut}>
                <Button type="submit" variant="outline">
                  <LogOutIcon aria-hidden /> Sign out
                </Button>
              </form>
              <Button asChild variant="ghost">
                <Link href="/forgot-password">Set or change password</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-lg">Delete account</CardTitle>
            <CardDescription>
              Permanently deletes your account and all {summaries.length}{" "}
              {summaries.length === 1 ? "catalogue" : "catalogues"}. This can&apos;t be undone. Export anything you want to
              keep first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
                <Input
                  id="confirm-delete"
                  name="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="off"
                  className="max-w-xs"
                />
              </div>
              <FormStatus state={state} />
              <Button type="submit" variant="destructive" disabled={confirm !== "DELETE" || pending}>
                {pending && <LoaderCircleIcon className="animate-spin" aria-hidden />}
                Delete my account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
