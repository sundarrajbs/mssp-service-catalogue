"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { KeyRoundIcon, LoaderCircleIcon, MailIcon } from "lucide-react";

import {
  requestPasswordReset,
  sendMagicLink,
  signInWithPassword,
  signUp,
  updatePassword,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_AUTH_STATE, type AuthFormState } from "@/lib/auth/messages";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";
import { FieldError, FormStatus } from "./FormStatus";

function EmailField({ state, autoFocus }: { state: AuthFormState; autoFocus?: boolean }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        autoFocus={autoFocus}
        className="h-11"
        aria-invalid={!!state.fieldErrors?.email}
        aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
      />
      <FieldError id="email-error" message={state.fieldErrors?.email} />
    </div>
  );
}

function PasswordField({
  state,
  name = "password",
  label = "Password",
  autoComplete,
  hint,
}: {
  state: AuthFormState;
  name?: "password" | "confirmPassword";
  label?: string;
  autoComplete: string;
  hint?: string;
}) {
  const error = state.fieldErrors?.[name];
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="password"
        autoComplete={autoComplete}
        required
        className="h-11"
        aria-invalid={!!error}
        aria-describedby={describedBy}
      />
      {hint && (
        <p id={`${name}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" className="h-11 w-full text-base" disabled={pending} aria-busy={pending}>
      {pending && <LoaderCircleIcon className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

export function SignInForms({ next }: { next: string }) {
  const [usePassword, setUsePassword] = useState(false);
  const [linkState, linkAction, linkPending] = useActionState(sendMagicLink, INITIAL_AUTH_STATE);
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, INITIAL_AUTH_STATE);

  return (
    <div className="space-y-6">
      {!usePassword ? (
        <form action={linkAction} className="space-y-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <EmailField state={linkState} autoFocus />
          <FormStatus state={linkState} />
          <SubmitButton pending={linkPending}>
            <MailIcon aria-hidden /> Email me a sign-in link
          </SubmitButton>
        </form>
      ) : (
        <form action={pwAction} className="space-y-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <EmailField state={pwState} autoFocus />
          <PasswordField state={pwState} autoComplete="current-password" />
          <FormStatus state={pwState} />
          <SubmitButton pending={pwPending}>
            <KeyRoundIcon aria-hidden /> Sign in
          </SubmitButton>
          <p className="text-right text-sm">
            <Link href="/forgot-password" className="text-primary underline underline-offset-4">
              Forgot your password?
            </Link>
          </p>
        </form>
      )}
      <div className="border-t pt-5 text-center">
        <Button variant="link" type="button" onClick={() => setUsePassword((v) => !v)}>
          {usePassword ? "Email me a sign-in link instead" : "Use a password instead"}
        </Button>
      </div>
    </div>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, INITIAL_AUTH_STATE);
  if (state.status === "success") return <FormStatus state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <EmailField state={state} autoFocus />
      <PasswordField
        state={state}
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters. You can also sign in later with an email link.`}
      />
      <FormStatus state={state} />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, INITIAL_AUTH_STATE);
  if (state.status === "success") return <FormStatus state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <EmailField state={state} autoFocus />
      <FormStatus state={state} />
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, INITIAL_AUTH_STATE);
  return (
    <form action={action} className="space-y-4" noValidate>
      <PasswordField
        state={state}
        label="New password"
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />
      <PasswordField state={state} name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
      <FormStatus state={state} />
      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
