import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageTitle } from "@/components/layout/DashboardShell";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FeaturedBadge, StatusChip, clinicTone } from "@/components/ui/Chip";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { getClinicForAdmin, getClinicDisplayData, isFeatured } from "@/services/clinics";
import { getSettings } from "@/services/settings";
import { zonedDateKey } from "@/services/schedule";

export default async function AdminClinicPage({ params }: PageProps<"/[lang]/admin/clinics/[id]">) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const a = t.admin;
  let data;
  try {
    data = await getClinicForAdmin(id);
  } catch (err) {
    if (err instanceof AppError) notFound();
    throw err;
  }
  const { clinic, documents } = data;
  const [display, settings] = await Promise.all([getClinicDisplayData(clinic, { activeDoctorsOnly: false }), getSettings()]);
  const owner = clinic.ownerId as unknown as { name: string; email: string; phone: string; emailVerifiedAt?: Date };
  const hidden = { clinicId: String(clinic._id) };
  const docLabel = (key: string) => pick(settings.requiredDocTypes.find((d) => d.key === key)?.label, lang) || key;

  const facts: [string, string][] = [
    [a.owner, `${owner.name} · ${owner.email} · ${owner.phone}`],
    [t.dashboard.category, pick(display.category?.name, lang)],
    [t.dashboard.city, `${pick(display.area?.name, lang)}, ${pick(display.city?.name, lang)}`],
    [t.dashboard.address, clinic.address?.en ?? ""],
    [t.dashboard.clinicPhone, clinic.phone],
    [t.dashboard.whatsapp, clinic.whatsapp],
    [t.dashboard.treatmentsTitle, display.treatments.map((x) => pick(x.name, lang)).join(", ")],
    [t.dashboard.navDoctors, display.doctors.map((x) => `${x.name.en}${x.qualifications ? ` (${x.qualifications})` : ""}`).join("; ")],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={pick(clinic.name, lang)}
        actions={
          <LinkButton href={localePath(lang, `/admin/clinics/${clinic._id}/preview`)} variant="secondary">
            {a.previewPage}
          </LinkButton>
        }
      />
      <div className="flex flex-wrap gap-2">
        <StatusChip tone={clinicTone(clinic.status)} label={t.status[clinic.status]} />
        {isFeatured(clinic) ? <FeaturedBadge label={t.common.featured} /> : null}
      </div>
      {clinic.rejectionReason ? <p className="text-danger">{clinic.rejectionReason}</p> : null}

      <Card className="p-5">
        <h2 className="mb-3 text-lg">{a.clinicDetails}</h2>
        <dl className="grid gap-x-6 gap-y-2 md:grid-cols-[200px_1fr]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-sm font-semibold text-muted">{k}</dt>
              <dd dir="auto">{v || "—"}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 whitespace-pre-line text-[15px]" dir="auto">
          {clinic.description?.en}
        </p>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg">{a.documents}</h2>
        {documents.length === 0 ? <p className="text-muted">{a.noDocs}</p> : null}
        <ul className="flex flex-col divide-y divide-line">
          {documents.map((doc) => (
            <li key={String(doc._id)} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{docLabel(doc.docType)}</p>
                <p className="text-sm text-muted" dir="auto">
                  {doc.originalName} · {doc.format.toUpperCase()} · {Math.round(doc.bytes / 1024)} KB · {formatDate(doc.createdAt, lang)}
                </p>
                <StatusChip
                  tone={doc.reviewStatus === "accepted" ? "approved" : doc.reviewStatus === "rejected" ? "rejected" : "pending"}
                  label={doc.reviewStatus === "accepted" ? t.dashboard.docAccepted : doc.reviewStatus === "rejected" ? t.dashboard.docRejected : t.dashboard.docSubmitted}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a href={`/api/admin/documents/${doc._id}`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
                  <Icon name="file" size={16} />
                  {a.openDocument}
                </a>
                <AdminForm op="doc.review" lang={lang} hidden={{ documentId: String(doc._id), accept: "1" }} className="contents">
                  <SubmitButton variant="ghost">{a.acceptDoc}</SubmitButton>
                </AdminForm>
                <AdminForm op="doc.review" lang={lang} hidden={{ documentId: String(doc._id), accept: "0" }} className="flex items-center gap-2">
                  <Input name="note" placeholder={t.common.reason} className="h-9 w-44" />
                  <SubmitButton variant="danger">{a.rejectDoc}</SubmitButton>
                </AdminForm>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {clinic.status === "pending" || clinic.status === "rejected" ? (
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-lg">{a.approve}</h2>
            <AdminForm op="clinic.approve" lang={lang} hidden={hidden}>
              <SubmitButton>{a.approve}</SubmitButton>
            </AdminForm>
          </Card>
        ) : null}
        {clinic.status === "pending" ? (
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-lg">{a.reject}</h2>
            <AdminForm op="clinic.reject" lang={lang} hidden={hidden}>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {a.rejectReason}
                <Textarea name="reason" required minLength={5} />
              </label>
              <SubmitButton variant="danger">{a.reject}</SubmitButton>
            </AdminForm>
          </Card>
        ) : null}
        {clinic.status === "blocked" ? (
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-lg">{a.unblock}</h2>
            <AdminForm op="clinic.unblock" lang={lang} hidden={hidden}>
              <SubmitButton>{a.unblock}</SubmitButton>
            </AdminForm>
          </Card>
        ) : (
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-lg">{a.block}</h2>
            <AdminForm op="clinic.block" lang={lang} hidden={hidden}>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {a.blockReason}
                <Textarea name="reason" required minLength={5} />
              </label>
              <SubmitButton variant="danger">{a.block}</SubmitButton>
            </AdminForm>
          </Card>
        )}

        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-lg">{a.feature}</h2>
          <AdminForm op="clinic.feature" lang={lang} hidden={hidden}>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {a.featuredFrom}
                <Input type="date" name="from" required dir="ltr" defaultValue={clinic.featuredFrom ? zonedDateKey(clinic.featuredFrom) : ""} />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {a.featuredUntil}
                <Input type="date" name="until" required dir="ltr" defaultValue={clinic.featuredUntil ? zonedDateKey(clinic.featuredUntil) : ""} />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {a.paymentRef}
              <Input name="note" defaultValue={clinic.featuredNote ?? ""} />
            </label>
            <SubmitButton>{a.saveFeature}</SubmitButton>
          </AdminForm>
          {clinic.featuredFrom ? (
            <AdminForm op="clinic.unfeature" lang={lang} hidden={hidden}>
              <SubmitButton variant="secondary">{a.unfeature}</SubmitButton>
            </AdminForm>
          ) : null}
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-lg">{a.commissionOverride}</h2>
          <AdminForm op="clinic.commission" lang={lang} hidden={hidden}>
            <Select name="mode" defaultValue={clinic.commissionOverride?.mode ?? ""}>
              <option value="">{a.useDefault}</option>
              <option value="percent">{a.percent}</option>
              <option value="fixed">{a.fixed}</option>
            </Select>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {a.rate}
              <Input type="number" name="rate" min={0} step="0.5" defaultValue={clinic.commissionOverride?.rate ?? ""} dir="ltr" />
            </label>
            <SubmitButton variant="secondary">{t.common.save}</SubmitButton>
          </AdminForm>
        </Card>

        {!clinic.deletedAt ? (
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="text-lg">{a.softDelete}</h2>
            <AdminForm op="clinic.delete" lang={lang} hidden={hidden}>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {a.softDeleteConfirm}
                <Input name="confirm" dir="ltr" autoComplete="off" />
              </label>
              <SubmitButton variant="danger">{a.softDelete}</SubmitButton>
            </AdminForm>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
