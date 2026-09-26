import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { FormStatus } from "@/components/auth/FormStatus";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

/** Reached from the password-reset email, which signs the user in for this step. */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  return (
    <AuthCard title="Choose a new password">
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4">
          <FormStatus state={{ status: "error", message: AUTH_MESSAGES.sessionExpired }} />
          <Link href="/forgot-password" className="text-primary text-sm underline underline-offset-4">
            Request a new link
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
