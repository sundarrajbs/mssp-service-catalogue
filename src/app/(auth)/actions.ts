"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_MESSAGES, type AuthFormState } from "@/lib/auth/messages";
import { siteOrigin } from "@/lib/auth/origin";
import { allowAuthAttempt, clientIp, type RateLimitedAction } from "@/lib/auth/rateLimit";
import { safeNextPath } from "@/lib/auth/redirect";
import { emailSchema, newPasswordSchema, passwordSchema } from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * All sign-in steps run here, on the server, so session cookies can be
 * HTTP-only and no token ever reaches the browser's JavaScript.
 * Messages never reveal whether an email address has an account.
 */

type Supabase = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

async function prepare(
  action: RateLimitedAction,
  email: string,
): Promise<{ supabase: Supabase } | { error: AuthFormState }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: { status: "error", message: AUTH_MESSAGES.notConfigured } };
  const ip = clientIp(await headers());
  if (!(await allowAuthAttempt(supabase, { action, email, ip }))) {
    return { error: { status: "error", message: AUTH_MESSAGES.rateLimited } };
  }
  return { supabase };
}

function readEmail(formData: FormData): { email: string } | { error: AuthFormState } {
  const parsed = emailSchema.safeParse(formData.get("email") ?? "");
  if (!parsed.success) return { error: { status: "error", fieldErrors: { email: parsed.error.issues[0].message } } };
  return { email: parsed.data };
}

async function confirmUrl(next: string): Promise<string> {
  return `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(safeNextPath(next))}`;
}

export async function sendMagicLink(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const read = readEmail(formData);
  if ("error" in read) return read.error;
  const ready = await prepare("magic-link", read.email);
  if ("error" in ready) return ready.error;

  const { error } = await ready.supabase.auth.signInWithOtp({
    email: read.email,
    // Sign-in only: new accounts go through sign-up, so this can't be used to probe for accounts.
    options: { shouldCreateUser: false, emailRedirectTo: await confirmUrl(String(formData.get("next") ?? "")) },
  });
  if (error && error.status === 429) return { status: "error", message: AUTH_MESSAGES.rateLimited };
  // Any other outcome (including "no such user") gets the same response.
  return { status: "success", message: AUTH_MESSAGES.magicLinkSent };
}

export async function signInWithPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const read = readEmail(formData);
  if ("error" in read) return read.error;
  const password = String(formData.get("password") ?? "");
  if (!password) return { status: "error", fieldErrors: { password: "Enter your password" } };
  const ready = await prepare("sign-in", read.email);
  if ("error" in ready) return ready.error;

  const { error } = await ready.supabase.auth.signInWithPassword({ email: read.email, password });
  if (error) {
    return { status: "error", message: error.status === 429 ? AUTH_MESSAGES.rateLimited : AUTH_MESSAGES.passwordSignInFailed };
  }
  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function signUp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const read = readEmail(formData);
  if ("error" in read) return read.error;
  const password = passwordSchema.safeParse(formData.get("password") ?? "");
  if (!password.success) return { status: "error", fieldErrors: { password: password.error.issues[0].message } };
  const ready = await prepare("sign-up", read.email);
  if ("error" in ready) return ready.error;

  const { data, error } = await ready.supabase.auth.signUp({
    email: read.email,
    password: password.data,
    options: { emailRedirectTo: await confirmUrl("/app/library") },
  });
  if (error?.status === 429) return { status: "error", message: AUTH_MESSAGES.rateLimited };
  if (error?.code === "weak_password") {
    return { status: "error", fieldErrors: { password: "Choose a stronger password that's harder to guess" } };
  }
  // If email confirmation is turned off in Supabase, the user is signed in straight away.
  if (!error && data.session) redirect("/app/library");
  // Existing accounts, new accounts and most errors all get the same answer.
  return { status: "success", message: AUTH_MESSAGES.signUpSent };
}

export async function requestPasswordReset(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const read = readEmail(formData);
  if ("error" in read) return read.error;
  const ready = await prepare("reset", read.email);
  if ("error" in ready) return ready.error;

  const { error } = await ready.supabase.auth.resetPasswordForEmail(read.email, {
    redirectTo: await confirmUrl("/reset-password"),
  });
  if (error?.status === 429) return { status: "error", message: AUTH_MESSAGES.rateLimited };
  return { status: "success", message: AUTH_MESSAGES.resetSent };
}

export async function updatePassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "password" | "confirmPassword";
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", fieldErrors };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: AUTH_MESSAGES.notConfigured };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error", message: AUTH_MESSAGES.sessionExpired };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "weak_password") return { status: "error", fieldErrors: { password: "Choose a stronger password" } };
    if (error.code === "same_password") {
      return { status: "error", fieldErrors: { password: "Choose a password you haven't used before" } };
    }
    return { status: "error", message: AUTH_MESSAGES.generic };
  }
  redirect("/app/account?password=updated");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function deleteAccount(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (formData.get("confirm") !== "DELETE") {
    return { status: "error", message: "Type DELETE in capitals to confirm." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: AUTH_MESSAGES.notConfigured };
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  // A database function that can only delete the caller's own account (see the migration).
  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    console.error("delete_own_account failed", error.message);
    return { status: "error", message: "Your account couldn't be deleted. Please try again." };
  }
  await supabase.auth.signOut();
  redirect("/?account=deleted");
}
