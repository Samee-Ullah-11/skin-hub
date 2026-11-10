import { notFound } from "next/navigation";
import { removeDocumentAction } from "@/actions/clinic";
import { Uploader } from "@/components/clinic/Uploader";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { fmt, isLang, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { cloudinaryConfigured } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { requireOwnClinic } from "@/services/clinics";
import { listOwnDocuments } from "@/services/documents";
import { getSettings } from "@/services/settings";

export default async function DocumentsPage({ params }: PageProps<"/[lang]/dashboard/documents">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const d = t.dashboard;
  const user = await requireUser("clinic_owner");
  const [clinic, docs, settings] = await Promise.all([requireOwnClinic(user.id), listOwnDocuments(user.id), getSettings()]);
  const uploads = cloudinaryConfigured();
  const canEdit = clinic.status !== "pending" && clinic.status !== "blocked";
  const tone = { submitted: "pending", accepted: "approved", rejected: "rejected" } as const;
  const label = { submitted: d.docSubmitted, accepted: d.docAccepted, rejected: d.docRejected };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={d.navDocuments} intro={d.documentsIntro} />
      {!uploads ? <p className="text-sm text-muted">{d.uploadsNotConfigured}</p> : null}
      {settings.requiredDocTypes.map((type) => {
        const mine = docs.filter((x) => x.docType === type.key);
        return (
          <Card key={type.key} className="flex flex-col gap-4 p-5">
            <h2 className="text-lg">{pick(type.label, lang)}</h2>
            {mine.length === 0 ? <p className="text-sm text-muted">{d.noDocuments}</p> : null}
            <ul className="flex flex-col divide-y divide-line">
              {mine.map((doc) => (
                <li key={String(doc._id)} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <Icon name="file" size={20} className="text-muted" />
                    <div>
                      <p className="font-medium" dir="auto">
                        {doc.originalName || doc.format.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted">{fmt(d.uploadedOn, { date: formatDate(doc.createdAt, lang) })}</p>
                      {doc.reviewNote ? <p className="text-sm text-danger">{doc.reviewNote}</p> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip tone={tone[doc.reviewStatus]} label={label[doc.reviewStatus]} />
                    {canEdit && doc.reviewStatus !== "accepted" ? (
                      <form action={removeDocumentAction}>
                        <input type="hidden" name="lang" value={lang} />
                        <input type="hidden" name="documentId" value={String(doc._id)} />
                        <Button type="submit" variant="danger" size="sm">
                          {t.common.remove}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            {uploads && canEdit ? (
              <Uploader
                kind="document"
                docType={type.key}
                accept="image/jpeg,image/png,application/pdf"
                labels={{
                  button: d.uploadDocument,
                  uploading: d.uploading,
                  failed: d.uploadFailed,
                  tooBig: d.fileTooBig,
                  notConfigured: d.uploadsNotConfigured,
                }}
              />
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
