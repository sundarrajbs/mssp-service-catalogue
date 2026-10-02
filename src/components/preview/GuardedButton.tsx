"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useReadOnly } from "@/store/catalogueStore";
import { useSignInPrompt } from "./SignInPrompt";

type GuardedButtonProps = React.ComponentProps<typeof Button> & {
  /** Finishes the sentence "Open the builder to …", e.g. "add services". */
  action: string;
};

/**
 * A normal button in the builder. In the read-only preview it looks disabled,
 * explains why in a tooltip, and opens the "start building" prompt instead of acting.
 */
export function GuardedButton({ action, onClick, className, ...props }: GuardedButtonProps) {
  const readOnly = useReadOnly();
  const prompt = useSignInPrompt();
  if (!readOnly) return <Button onClick={onClick} className={className} {...props} />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          {...props}
          aria-disabled
          className={`${className ?? ""} cursor-not-allowed opacity-50`}
          onClick={(e) => {
            e.preventDefault();
            prompt(action);
          }}
        />
      </TooltipTrigger>
      <TooltipContent>Open the builder to {action}</TooltipContent>
    </Tooltip>
  );
}
