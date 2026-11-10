"use client";

import { useActionState, useState } from "react";
import { saveDoctorAction } from "@/actions/clinic";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import type { Dict } from "@/i18n";
import { fmt, type Lang } from "@/i18n/config";

export interface DoctorFormData {
  id?: string;
  name: { en: string; ur: string };
  gender?: "female" | "male";
  specialty: { en: string; ur: string };
  qualifications: string;
  bio: { en: string; ur: string };
  slotMinutes: number;
  weekly: { weekday: number; start: string; end: string; breaks: { start: string; end: string }[] }[];
  blockedDates: string[];
  active: boolean;
}

const SLOT_OPTIONS = [15, 20, 30, 45, 60];

export function DoctorForm({ lang, t, data }: { lang: Lang; t: { d: Dict["dashboard"]; c: Dict["common"] }; data: DoctorFormData }) {
  const [state, action] = useActionState<FormState, FormData>(saveDoctorAction, {});
  const [blocked, setBlocked] = useState<string[]>(data.blockedDates);
  const [newDate, setNewDate] = useState("");
  const { d, c } = t;
  const err = (k: string) => state.fieldErrors?.[k];

  const pair = (key: "name" | "specialty" | "bio", label: string, multiline = false) => {
    const Control = multiline ? Textarea : Input;
    return (
      <Field id={`d-${key}-en`} label={label} error={err(`${key}.en`)}>
        <Control id={`d-${key}-en`} name={`${key}.en`} defaultValue={data[key].en} dir="ltr" lang="en" />
      </Field>
    );
  };

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="lang" value={lang} />
      {data.id ? <input type="hidden" name="doctorId" value={data.id} /> : null}
      <FormMessage state={state} />

      <Card className="flex flex-col gap-4 p-5">
        {pair("name", d.doctorName)}
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="d-gender" label={d.gender} optionalLabel={c.optional}>
            <Select id="d-gender" name="gender" defaultValue={data.gender ?? ""}>
              <option value="">{d.genderUnspecified}</option>
              <option value="female">{d.female}</option>
              <option value="male">{d.male}</option>
            </Select>
          </Field>
          <Field id="d-slot" label={d.slotLength}>
            <Select id="d-slot" name="slotMinutes" defaultValue={String(data.slotMinutes)}>
              {SLOT_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {fmt(d.minutes, { n: m })}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {pair("specialty", d.specialty)}
        <Field id="d-qual" label={d.qualifications} hint={d.qualificationsHint}>
          <Input id="d-qual" name="qualifications" defaultValue={data.qualifications} dir="ltr" />
        </Field>
        {pair("bio", d.bio, true)}
        <label className="inline-flex items-center gap-2 text-[15px]">
          <input type="checkbox" name="active" defaultChecked={data.active} className="h-4 w-4 accent-[var(--primary)]" />
          {d.activeDoctor}
        </label>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg">{d.weeklySchedule}</h2>
        <div className="flex flex-col divide-y divide-line">
          {[1, 2, 3, 4, 5, 6, 0].map((w) => {
            const day = data.weekly.find((x) => x.weekday === w);
            const brk = day?.breaks[0];
            return (
              <fieldset key={w} className="grid items-end gap-3 py-3 sm:grid-cols-[140px_repeat(4,1fr)]">
                <legend className="sr-only">{d.days[w]}</legend>
                <label className="inline-flex items-center gap-2 font-medium">
                  <input type="checkbox" name={`day_${w}_on`} defaultChecked={Boolean(day)} className="h-4 w-4 accent-[var(--primary)]" />
                  {d.days[w]}
                </label>
                {(
                  [
                    ["start", d.from, day?.start ?? "10:00"],
                    ["end", d.to, day?.end ?? "18:00"],
                    ["bstart", d.breakFrom, brk?.start ?? ""],
                    ["bend", d.breakTo, brk?.end ?? ""],
                  ] as const
                ).map(([k, label, value]) => (
                  <label key={k} className="flex flex-col gap-1 text-sm text-muted">
                    {label}
                    <input
                      type="time"
                      name={`day_${w}_${k}`}
                      defaultValue={value}
                      step={300}
                      className="h-10 rounded-md border border-line bg-surface px-2 text-ink"
                      aria-label={`${d.days[w]}: ${label}`}
                    />
                  </label>
                ))}
                {err(`day_${w}`) ? (
                  <p className="text-sm font-medium text-danger sm:col-span-5" role="alert">
                    {err(`day_${w}`)}
                  </p>
                ) : null}
              </fieldset>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg">{d.blockedDays}</h2>
        <p className="text-sm text-muted">{d.blockedDaysHint}</p>
        <div className="flex flex-wrap items-end gap-2">
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-48" aria-label={d.addBlockedDay} dir="ltr" />
          <Button
            variant="secondary"
            onClick={() => {
              if (newDate && !blocked.includes(newDate)) setBlocked([...blocked, newDate].sort());
              setNewDate("");
            }}
          >
            {d.addBlockedDay}
          </Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {blocked.map((date) => (
            <li key={date} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm">
              <input type="hidden" name="blocked[]" value={date} />
              <span dir="ltr">{date}</span>
              <button
                type="button"
                className="text-danger underline"
                onClick={() => setBlocked(blocked.filter((x) => x !== date))}
                aria-label={`${c.remove} ${date}`}
              >
                {c.remove}
              </button>
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
