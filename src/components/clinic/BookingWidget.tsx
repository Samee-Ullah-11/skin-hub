"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createBookingAction } from "@/actions/bookings";
import { buttonClass } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import { Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { localePath, type Lang } from "@/i18n/config";
import { DateTimeWheels } from "./DateTimeWheels";
import type { SlotView } from "./SlotGrid";

interface Day {
  date: string;
  dayLabel: string;
  blocked: boolean;
  slots: SlotView[];
}

export interface BookingLabels {
  chooseDoctor: string;
  chooseDay: string;
  chooseWeek: string;
  wheelDay: string;
  wheelMonth: string;
  wheelYear: string;
  wheelHour: string;
  wheelMinute: string;
  wheelPeriod: string;
  openTimes: string;
  thisWeek: string;
  nextWeek: string;
  treatment: string;
  anyTreatment: string;
  treatmentsHint: string;
  chooseTime: string;
  noSlots: string;
  noDoctors: string;
  timesShownIn: string;
  loadError: string;
  available: string;
  booked: string;
  yourRequest: string;
  unavailable: string;
  slotLabel: string;
  note: string;
  noteHint: string;
  requestButton: string;
  loginToBook: string;
  signupToBook: string;
  verifyToBook: string;
  verifyNow: string;
  clinicCannotBook: string;
  goToBookings: string;
  selected: string;
}

type Viewer = "anonymous" | "patient" | "unverified" | "other";

/** Event the clinic page's treatment list fires to pick a treatment here. */
export const SELECT_TREATMENT_EVENT = "clinic:select-treatment";

export function BookingWidget({
  lang,
  doctors,
  labels,
  viewer,
  returnPath,
  dayLabels,
  treatments = [],
  initialTreatmentId = "",
}: {
  lang: Lang;
  doctors: { id: string; name: string; specialty: string }[];
  treatments?: { id: string; name: string }[];
  initialTreatmentId?: string;
  labels: BookingLabels;
  viewer: Viewer;
  returnPath: string;
  dayLabels: Record<string, string>;
}) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [version, setVersion] = useState(0);
  const [treatmentIds, setTreatmentIds] = useState<string[]>(initialTreatmentId ? [initialTreatmentId] : []);
  const toggleTreatment = (id: string) =>
    setTreatmentIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await createBookingAction(prev, fd);
    setSelected(undefined);
    setVersion((v) => v + 1);
    return result;
  }, {});

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    fetch(`/api/slots?doctorId=${doctorId}&lang=${lang}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ days: Omit<Day, "dayLabel">[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        const mapped = data.days.map((d) => ({ ...d, dayLabel: dayLabels[d.date] ?? d.date }));
        setError(false);
        setDays(mapped);
        setDayIndex((i) => {
          if (mapped[i]?.slots.some((sl) => sl.state === "available")) return i;
          const first = mapped.findIndex((d) => d.slots.some((sl) => sl.state === "available"));
          return first >= 0 ? first : 0;
        });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, lang, dayLabels, version]);

  useEffect(() => {
    function onPick(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      setTreatmentIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    }
    window.addEventListener(SELECT_TREATMENT_EVENT, onPick);
    return () => window.removeEventListener(SELECT_TREATMENT_EVENT, onPick);
  }, []);

  if (!doctors.length) return <p className="text-muted">{labels.noDoctors}</p>;

  const day = days?.[dayIndex];
  function pickDay(index: number) {
    setDayIndex(index);
    setSelected(undefined);
  }
  // The time wheels always show a time: use the chosen slot, or the first free one on that day.
  const freeSlots = day?.slots.filter((s) => s.state === "available") ?? [];
  const effective = freeSlots.some((s) => s.startUtc === selected) ? selected : freeSlots[0]?.startUtc;
  const selectedSlot = day?.slots.find((s) => s.startUtc === effective);
  const loginHref = localePath(lang, `/login?next=${encodeURIComponent(returnPath)}`);

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{labels.chooseDoctor}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {doctors.map((d) => (
            <label
              key={d.id}
              className={`flex cursor-pointer flex-col rounded-md border px-3 py-2 ${doctorId === d.id ? "border-primary bg-chip" : "border-line"}`}
            >
              <span className="flex w-full items-center gap-2 font-semibold">
                <input
                  type="radio"
                  name="doctor-choice"
                  value={d.id}
                  checked={doctorId === d.id}
                  onChange={() => {
                    setDoctorId(d.id);
                    setSelected(undefined);
                    setDays(null);
                  }}
                  className="sr-only"
                />
                {d.name}
                {doctorId === d.id ? <Icon name="check" size={16} className="ms-auto text-primary" /> : null}
              </span>
              {d.specialty ? <span className="ps-6 text-sm text-muted">{d.specialty}</span> : null}
            </label>
          ))}
        </div>
      </fieldset>

      {treatments.length ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{labels.treatment}</legend>
          <p className="-mt-1 text-xs text-muted">{labels.treatmentsHint}</p>
          <div className="flex flex-wrap gap-2">
            {treatments.map((tr) => {
              const on = treatmentIds.includes(tr.id);
              return (
                <button
                  key={tr.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleTreatment(tr.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                    on ? "border-primary bg-primary text-on-primary" : "border-line bg-surface hover:border-primary hover:text-primary"
                  }`}
                >
                  {on ? <Icon name="check" size={15} /> : null}
                  {tr.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {error ? <Banner tone="rejected">{labels.loadError}</Banner> : null}

      {days ? (
        <DateTimeWheels
          lang={lang}
          days={days}
          dayIndex={dayIndex}
          selected={effective}
          onPickDay={pickDay}
          onPickSlot={setSelected}
          labels={labels}
        />
      ) : !error ? (
        <div className="h-40 animate-pulse rounded-md bg-soft motion-reduce:animate-none" aria-hidden="true" />
      ) : null}

      <FormMessage state={state} />
      {state.ok ? (
        <Link href={localePath(lang, "/account/bookings")} className={buttonClass("secondary", "md", "self-start")}>
          {labels.goToBookings}
        </Link>
      ) : null}

      {viewer === "patient" ? (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="doctorId" value={doctorId} />
          <input type="hidden" name="startUtc" value={effective ?? ""} />
          {treatmentIds.map((id) => (
            <input key={id} type="hidden" name="treatmentIds[]" value={id} />
          ))}
          {selectedSlot && day ? (
            <p className="font-semibold" aria-live="polite">
              {labels.selected.replace("{date}", day.dayLabel).replace("{time}", selectedSlot.label)}
            </p>
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{labels.note}</span>
            <Textarea name="note" maxLength={300} rows={3} aria-describedby="note-hint" />
            <span id="note-hint" className="text-sm text-muted">
              {labels.noteHint}
            </span>
          </label>
          <div className={effective ? "" : "pointer-events-none opacity-50"} aria-disabled={!effective}>
            <SubmitButton>{labels.requestButton}</SubmitButton>
          </div>
        </form>
      ) : viewer === "unverified" ? (
        <Banner tone="pending">
          <p>{labels.verifyToBook}</p>
          <Link href={localePath(lang, "/verify-email/sent")} className={`${buttonClass("primary", "sm")} mt-3`}>
            {labels.verifyNow}
          </Link>
        </Banner>
      ) : viewer === "other" ? (
        <Banner tone="info">{labels.clinicCannotBook}</Banner>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link href={loginHref} className={buttonClass("primary")}>
            {labels.loginToBook}
          </Link>
          <Link href={localePath(lang, "/signup")} className={buttonClass("secondary")}>
            {labels.signupToBook}
          </Link>
        </div>
      )}
    </div>
  );
}
