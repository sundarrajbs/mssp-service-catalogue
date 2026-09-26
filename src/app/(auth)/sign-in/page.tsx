import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { SignInForms } from "@/components/auth/AuthForms";
import { FormStatus } from "@/components/auth/FormStatus";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { safeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const linkError = params.error === "link";

  return (
    <AuthCard
      title="Sign in"
      description="We'll email you a one-time sign-in link. No password needed."
      footer={
        <>
          New here?{" "}
          <Link href="/sign-up" className="text-primary underline underline-offset-4">
            Create an account
          </Link>{" "}
          or{" "}
          <Link href="/preview" className="text-primary underline underline-offset-4">
            try the preview
          </Link>
          .
        </>
      }
    >
      {linkError && (
        <div className="mb-5">
          <FormStatus state={{ status: "error", message: AUTH_MESSAGES.linkInvalid }} />
        </div>
      )}
      <SignInForms next={next} />
    </AuthCard>
  );
}
