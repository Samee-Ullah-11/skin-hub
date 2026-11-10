import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { fmt, isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatClock } from "@/lib/format";
import { listOwnDoctors } from "@/services/doctors";

export default async function DoctorsPage({ params }: PageProps<"/[lang]/dashboard/doctors">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const d = t.dashboard;
  const user = await requireUser("clinic_owner");
  const doctors = await listOwnDoctors(user.id);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={d.navDoctors}
        intro={d.doctorsIntro}
        actions={<LinkButton href={localePath(lang, "/dashboard/doctors/new")}>{d.addDoctor}</LinkButton>}
      />
      {doctors.length === 0 ? <p className="text-muted">{d.noDoctors}</p> : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {doctors.map((doc) => (
          <li key={String(doc._id)}>
            <Card className="flex h-full flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg">
                  <Link href={localePath(lang, `/dashboard/doctors/${doc._id}`)} className="hover:underline">
                    {pick(doc.name, lang)}
                  </Link>
                </h2>
                <Chip>{doc.active ? t.status.active : t.status.inactive}</Chip>
              </div>
              {doc.specialty?.en ? <p className="text-muted">{pick(doc.specialty, lang)}</p> : null}
              <p className="text-sm text-muted">{fmt(d.minutes, { n: doc.slotMinutes })}</p>
              <ul className="text-sm">
                {doc.weekly
                  .slice()
                  .sort((a, b) => a.weekday - b.weekday)
                  .map((w) => (
                    <li key={w.weekday}>
                      {d.days[w.weekday]}: <span dir="ltr">{formatClock(w.start, lang)} – {formatClock(w.end, lang)}</span>
                    </li>
                  ))}
              </ul>
              <LinkButton href={localePath(lang, `/dashboard/doctors/${doc._id}`)} variant="secondary" size="sm" className="mt-auto self-start">
                {t.common.edit}
              </LinkButton>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
