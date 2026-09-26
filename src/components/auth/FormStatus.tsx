import { CircleAlertIcon, MailCheckIcon } from "lucide-react";

import type { AuthFormState } from "@/lib/auth/messages";

/** Announces the result of a form submission to screen readers as well. */
export function FormStatus({ state }: { state: AuthFormState }) {
  return (
    <div aria-live="polite">
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "border-destructive/40 bg-destructive/5 text-destructive flex gap-2 rounded-lg border p-3 text-sm"
              : "flex gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/5 p-3 text-sm"
          }
        >
          {state.status === "error" ? (
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <MailCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
          )}
          {state.message}
        </p>
      )}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  );
}
