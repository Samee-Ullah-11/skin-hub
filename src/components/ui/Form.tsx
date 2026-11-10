"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Banner } from "./Banner";
import { Button, type ButtonVariant } from "./Button";

export interface FormState {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

export function SubmitButton({
  children,
  variant = "primary",
  className = "",
  pendingLabel,
  name,
  value,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} className={className} disabled={pending} aria-busy={pending} name={name} value={value}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) return <Banner tone="rejected">{state.error}</Banner>;
  if (state.ok && state.message) return <Banner tone="approved">{state.message}</Banner>;
  return null;
}
