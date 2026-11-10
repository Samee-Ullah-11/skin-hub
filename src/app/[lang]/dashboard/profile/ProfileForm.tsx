"use client";

import { useActionState, useMemo, useState } from "react";
import { updateClinicProfileAction } from "@/actions/clinic";
import { MapPicker } from "@/components/clinic/MapPicker";
import { Card } from "@/components/ui/Card";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import type { Dict } from "@/i18n";
import type { Lang } from "@/i18n/config";

type Option = { id: string; name: string };

export interface ProfileFormData {
  name: { en: string; ur: string };
  address: { en: string; ur: string };
  description: { en: string; ur: string };
  categoryId: string;
  provinceId: string;
  cityId: string;
  areaId: string;
  phone: string;
  whatsapp: string;
  location?: { lat: number; lng: number };
  treatments: Record<string, number | null>;
}

export function ProfileForm({
  lang,
  t,
  data,
  categories,
  provinces,
  cities,
  areas,
  treatments,
}: {
  lang: Lang;
  t: { d: Dict["dashboard"]; c: Dict["common"]; auth: Dict["auth"] };
  data: ProfileFormData;
  categories: Option[];
  provinces: Option[];
  cities: (Option & { provinceId: string; center: { lat: number; lng: number } })[];
  areas: (Option & { cityId: string })[];
  treatments: (Option & { categoryId: string })[];
}) {
  const [state, action] = useActionState<FormState, FormData>(updateClinicProfileAction, {});
  const [provinceId, setProvinceId] = useState(data.provinceId || provinces[0]?.id || "");
  const [cityId, setCityId] = useState(data.cityId);
  const [categoryId, setCategoryId] = useState(data.categoryId || categories[0]?.id || "");
  const [pin, setPinState] = useState(data.location);
  const [coords, setCoords] = useState({ lat: data.location ? String(data.location.lat) : "", lng: data.location ? String(data.location.lng) : "" });
  function setPin(next: { lat: number; lng: number } | undefined) {
    setPinState(next);
    setCoords({ lat: next ? String(+next.lat.toFixed(6)) : "", lng: next ? String(+next.lng.toFixed(6)) : "" });
  }
  // Typing in the coordinate boxes: keep the text as typed; move the pin only when both are real numbers.
  function typeCoord(key: "lat" | "lng", text: string) {
    const nextCoords = { ...coords, [key]: text };
    setCoords(nextCoords);
    const lat = Number(nextCoords.lat);
    const lng = Number(nextCoords.lng);
    if (nextCoords.lat.trim() && nextCoords.lng.trim() && Number.isFinite(lat) && Number.isFinite(lng)) setPinState({ lat, lng });
  }
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(data.treatments).map((k) => [k, true])),
  );

  const cityOptions = useMemo(() => cities.filter((c) => c.provinceId === provinceId), [cities, provinceId]);
  const areaOptions = useMemo(() => areas.filter((a) => a.cityId === cityId), [areas, cityId]);
  const treatmentOptions = useMemo(() => treatments.filter((tr) => tr.categoryId === categoryId), [treatments, categoryId]);
  const center = cities.find((c) => c.id === cityId)?.center ?? { lat: 30.3753, lng: 69.3451 };
  const err = (k: string) => state.fieldErrors?.[k];
  const { d, c } = t;

  function localizedPair(key: "name" | "address" | "description", label: string, multiline = false, hint?: string) {
    const enId = `f-${key}-en`;
    const Control = multiline ? Textarea : Input;
    return (
      <div>
        <Field id={enId} label={label} hint={hint} error={err(`${key}.en`)}>
          <Control
            id={enId}
            name={`${key}.en`}
            defaultValue={data[key].en}
            dir="ltr"
            lang="en"
            aria-invalid={err(`${key}.en`) ? true : undefined}
            aria-describedby={describedBy(enId, hint, err(`${key}.en`))}
            required
          />
        </Field>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <FormMessage state={state} />

      <Card className="flex flex-col gap-4 p-5">
        {localizedPair("name", d.clinicName)}
        <Field id="f-category" label={d.category} error={err("categoryId")}>
          <Select id="f-category" name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field id="f-province" label={d.province}>
            <Select
              id="f-province"
              name="provinceId"
              value={provinceId}
              onChange={(e) => {
                setProvinceId(e.target.value);
                setCityId("");
              }}
            >
              {provinces.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="f-city" label={d.city} error={err("cityId")}>
            <Select id="f-city" name="cityId" value={cityId} onChange={(e) => setCityId(e.target.value)}>
              <option value="">{c.selectPlaceholder}</option>
              {cityOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="f-area" label={d.area} error={err("areaId")}>
            <Select id="f-area" name="areaId" defaultValue={data.areaId} key={cityId}>
              <option value="">{c.selectPlaceholder}</option>
              {areaOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {localizedPair("address", d.address)}
      </Card>

      <Card className="flex flex-col gap-3 p-5" id="map">
        <h2 className="text-lg">{d.mapPin}</h2>
        <p className="text-sm text-muted">{d.mapHint}</p>
        <MapPicker center={center} value={pin} onChange={setPin} label={d.mapPin} key={cityId} />
        <p className="text-sm text-muted">{d.mapKeyboardHint}</p>
        <div className="grid grid-cols-2 gap-4">
          <Field id="f-lat" label={d.latitude} error={err("lat")}>
            <Input
              id="f-lat"
              name="lat"
              inputMode="decimal"
              dir="ltr"
              value={coords.lat}
              placeholder={String(center.lat)}
              onChange={(e) => typeCoord("lat", e.target.value)}
            />
          </Field>
          <Field id="f-lng" label={d.longitude} error={err("lng")}>
            <Input
              id="f-lng"
              name="lng"
              inputMode="decimal"
              dir="ltr"
              value={coords.lng}
              placeholder={String(center.lng)}
              onChange={(e) => typeCoord("lng", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="f-phone" label={d.clinicPhone} hint={t.auth.phoneHint} error={err("phone")}>
            <Input id="f-phone" name="phone" type="tel" dir="ltr" defaultValue={data.phone} aria-invalid={err("phone") ? true : undefined} />
          </Field>
          <Field id="f-wa" label={d.whatsapp} hint={t.auth.phoneHint} error={err("whatsapp")}>
            <Input id="f-wa" name="whatsapp" type="tel" dir="ltr" defaultValue={data.whatsapp} aria-invalid={err("whatsapp") ? true : undefined} />
          </Field>
        </div>
        {localizedPair("description", d.description, true, d.descriptionHint)}
      </Card>

      <Card className="flex flex-col gap-3 p-5" id="treatments">
        <h2 className="text-lg">{d.treatmentsTitle}</h2>
        <p className="text-sm text-muted">{d.treatmentsHint}</p>
        <ul className="grid gap-2 md:grid-cols-2">
          {treatmentOptions.map((tr) => (
            <li key={tr.id} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2">
              <label className="inline-flex items-center gap-2 text-[15px]">
                <input
                  type="checkbox"
                  name="treatment[]"
                  value={tr.id}
                  checked={Boolean(checked[tr.id])}
                  onChange={(e) => setChecked((s) => ({ ...s, [tr.id]: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                {tr.name}
              </label>
              {checked[tr.id] ? (
                <label className="flex items-center gap-1 text-sm text-muted">
                  <span className="sr-only">{`${tr.name}: ${d.fromPrice}`}</span>
                  <span aria-hidden="true">PKR</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    name={`price_${tr.id}`}
                    defaultValue={data.treatments[tr.id] ?? ""}
                    className="h-9 w-28 rounded-md border border-line bg-surface px-2 text-ink"
                    dir="ltr"
                  />
                </label>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      <div>
        <SubmitButton>{c.save}</SubmitButton>
      </div>
    </form>
  );
}
