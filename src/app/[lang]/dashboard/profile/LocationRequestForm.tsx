"use client";

import { useActionState, useState } from "react";
import { requestLocationAction } from "@/actions/clinic";
import { Field, Input, Select } from "@/components/ui/Field";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import type { Dict } from "@/i18n";
import type { Lang } from "@/i18n/config";

export function LocationRequestForm({
  lang,
  t,
  provinces,
  cities,
}: {
  lang: Lang;
  t: Dict["dashboard"];
  provinces: { id: string; name: string }[];
  cities: { id: string; name: string; provinceId: string }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(requestLocationAction, {});
  const [kind, setKind] = useState<"city" | "area">("area");
  const [provinceId, setProvinceId] = useState(provinces[0]?.id ?? "");
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="lang" value={lang} />
      <div className="md:col-span-2">
        <FormMessage state={state} />
      </div>
      <Field id="lr-kind" label={t.requestKind}>
        <Select id="lr-kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as "city" | "area")}>
          <option value="area">{t.requestArea}</option>
          <option value="city">{t.requestCity}</option>
        </Select>
      </Field>
      <Field id="lr-province" label={t.province}>
        <Select id="lr-province" name="provinceId" value={provinceId} onChange={(e) => setProvinceId(e.target.value)}>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      {kind === "area" ? (
        <Field id="lr-city" label={t.city} error={state.fieldErrors?.cityId}>
          <Select id="lr-city" name="cityId">
            {cities
              .filter((c) => c.provinceId === provinceId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </Field>
      ) : null}
      <Field id="lr-name" label={t.requestLocationName} error={state.fieldErrors?.name}>
        <Input id="lr-name" name="name" />
      </Field>
      <div className="md:col-span-2">
        <SubmitButton variant="secondary">{t.requestLocation}</SubmitButton>
      </div>
    </form>
  );
}
