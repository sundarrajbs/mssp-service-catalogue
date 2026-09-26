"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";

interface NumberFieldProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

/**
 * A number input that lets people clear the box while typing.
 * The store only ever receives valid, clamped numbers; an empty box counts as 0.
 */
export function NumberField({ value, onValueChange, min = 0, max, ...props }: NumberFieldProps) {
  const [text, setText] = useState(String(value));
  // Follow outside changes (reset, import) without fighting the user's typing.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (Number(text) !== value) setText(String(value));
  }

  return (
    <Input
      {...props}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step="any"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const parsed = e.target.value.trim() === "" ? 0 : Number(e.target.value);
        if (!Number.isFinite(parsed)) return;
        const clamped = Math.max(min, max === undefined ? parsed : Math.min(max, parsed));
        setLastValue(clamped);
        onValueChange(clamped);
      }}
      onBlur={(e) => {
        setText(String(lastValue));
        props.onBlur?.(e);
      }}
    />
  );
}
