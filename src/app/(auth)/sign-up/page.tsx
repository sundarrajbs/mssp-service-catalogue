import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { SignUpForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Save catalogues to your account and open them on any device."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
