/**
 * Auth messages are deliberately generic: none of them reveals whether an
 * email address has an account.
 */
export const AUTH_MESSAGES = {
  magicLinkSent: "If an account exists for that email, we've sent a sign-in link. It expires in one hour.",
  passwordSignInFailed: "Email or password is incorrect, or the email address hasn't been confirmed yet.",
  signUpSent: "Check your email for a link to confirm your account.",
  resetSent: "If an account exists for that email, we've sent a link to reset your password.",
  passwordUpdated: "Your password has been updated.",
  rateLimited: "Too many attempts. Please wait a few minutes and try again.",
  linkInvalid: "That link is invalid or has expired. Please request a new one.",
  generic: "Something went wrong. Please try again.",
  notConfigured: "Sign-in isn't set up yet. Add the Supabase settings described in the README.",
  sessionExpired: "Your session has expired. Request a new password reset link.",
} as const;

export type AuthMessage = (typeof AUTH_MESSAGES)[keyof typeof AUTH_MESSAGES];

export interface AuthFormState {
  status: "idle" | "success" | "error";
  message?: string;
  /** Field-level problems from input validation (never from Supabase). */
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword", string>>;
}

export const INITIAL_AUTH_STATE: AuthFormState = { status: "idle" };
