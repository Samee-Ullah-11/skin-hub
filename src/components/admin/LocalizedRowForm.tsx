import type { ReactNode } from "react";
import { AdminForm } from "./AdminForm";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Form";
import type { Lang } from "@/i18n/config";

/** Inline add/edit row for admin-managed named records (provinces, cities, areas, categories, treatments). */
export function LocalizedRowForm({
  op,
  lang,
  labels,
  values,
  hidden = {},
  extra,
}: {
  op: string;
  lang: Lang;
  labels: { en: string; ur: string; active: string; save: string };
  values?: { id: string; en: string; ur: string; active: boolean };
  hidden?: Record<string, string>;
  extra?: ReactNode;
}) {
  return (
    <AdminForm op={op} lang={lang} hidden={{ ...hidden, ...(values ? { id: values.id } : {}) }} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
        {labels.en}
        <Input name="en" defaultValue={values?.en} required className="h-9 w-44" dir="ltr" />
      </label>
      {extra}
      <label className="inline-flex h-9 items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={values?.active ?? true} className="h-4 w-4 accent-[var(--primary)]" />
        {labels.active}
      </label>
      <SubmitButton variant="secondary">{labels.save}</SubmitButton>
    </AdminForm>
  );
}
