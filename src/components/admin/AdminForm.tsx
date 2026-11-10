"use client";

import { useActionState, type ReactNode } from "react";
import { adminOp } from "@/actions/admin";
import { FormMessage, type FormState } from "@/components/ui/Form";
import type { Lang } from "@/i18n/config";

/** Wraps an admin form: posts to the shared admin action with a fixed op and shows the result. */
export function AdminForm({
  op,
  lang,
  hidden = {},
  children,
  className = "flex flex-col gap-3",
}: {
  op: string;
  lang: Lang;
  hidden?: Record<string, string>;
  children: ReactNode | ((state: FormState) => ReactNode);
  className?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(adminOp, {});
  return (
    <form action={action} className={className}>
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="lang" value={lang} />
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <FormMessage state={state} />
      {typeof children === "function" ? children(state) : children}
    </form>
  );
}
