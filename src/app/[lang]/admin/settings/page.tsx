import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Form";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/services/settings";

export default async function SettingsPage({ params }: PageProps<"/[lang]/admin/settings">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const a = t.admin;
  const s = await getSettings();
  const docs = s.requiredDocTypes.map((d) => `${d.key} | ${d.label.en} | ${d.label.ur ?? ""}`).join("\n");
  return (
    <div>
      <PageTitle title={a.navSettings} intro={a.settingsIntro} />
      <Card className="p-5">
        <AdminForm op="settings.save" lang={lang} className="grid max-w-2xl gap-4">
          <Field id="s-mode" label={a.commissionMode}>
            <Select id="s-mode" name="commissionMode" defaultValue={s.commissionMode}>
              <option value="percent">{a.percent}</option>
              <option value="fixed">{a.fixed}</option>
            </Select>
          </Field>
          <Field id="s-rate" label={a.defaultRate} hint={a.defaultRateHint}>
            <Input id="s-rate" name="commissionRate" type="number" min={0} step="0.5" defaultValue={s.commissionRate} dir="ltr" />
          </Field>
          <Field id="s-exp" label={a.pendingExpiry}>
            <Input id="s-exp" name="pendingExpiryHours" type="number" min={1} max={168} defaultValue={s.pendingExpiryHours} dir="ltr" />
          </Field>
          <Field id="s-win" label={a.bookingWindow}>
            <Input id="s-win" name="bookingWindowDays" type="number" min={1} max={90} defaultValue={s.bookingWindowDays} dir="ltr" />
          </Field>
          <Field id="s-ret" label={a.retention}>
            <Input id="s-ret" name="rejectedDocsRetentionDays" type="number" min={1} defaultValue={s.rejectedDocsRetentionDays} dir="ltr" />
          </Field>
          <Field id="s-docs" label={a.requiredDocs} hint={a.requiredDocsHint}>
            <Textarea id="s-docs" name="requiredDocs" defaultValue={docs} rows={5} dir="auto" />
          </Field>
          <div>
            <SubmitButton>{t.common.save}</SubmitButton>
          </div>
        </AdminForm>
      </Card>
    </div>
  );
}
