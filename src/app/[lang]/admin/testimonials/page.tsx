import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Form";
import { isLang, type Lang } from "@/i18n/config";
import { getDict, type Dict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { listTestimonials } from "@/services/engagement";

function Fields({ t, v }: { t: Dict; v?: { name: string; en: string; ur: string; active: boolean } }) {
  return (
    <>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t.common.name}
        <Input name="name" defaultValue={v?.name} required />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t.admin.quoteEn}
        <Textarea name="quoteEn" defaultValue={v?.en} required dir="ltr" rows={3} />
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={v?.active ?? true} className="h-4 w-4 accent-[var(--primary)]" />
        {t.admin.active}
      </label>
    </>
  );
}

export default async function TestimonialsPage({ params }: PageProps<"/[lang]/admin/testimonials">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang as Lang);
  const items = await listTestimonials();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t.admin.navTestimonials} intro={t.admin.testimonialsIntro} />
      <Card className="p-5">
        <h2 className="mb-3 text-lg">{t.admin.addTestimonial}</h2>
        <AdminForm op="testimonial.save" lang={lang}>
          <Fields t={t} />
          <div>
            <SubmitButton>{t.common.save}</SubmitButton>
          </div>
        </AdminForm>
      </Card>
      {items.map((x) => (
        <Card key={String(x._id)} className="flex flex-col gap-3 p-5">
          <AdminForm op="testimonial.save" lang={lang} hidden={{ id: String(x._id) }}>
            <Fields t={t} v={{ name: x.name, en: x.quote.en, ur: x.quote.ur ?? "", active: x.active }} />
            <div>
              <SubmitButton variant="secondary">{t.common.save}</SubmitButton>
            </div>
          </AdminForm>
          <AdminForm op="testimonial.delete" lang={lang} hidden={{ id: String(x._id) }}>
            <div>
              <SubmitButton variant="danger">{t.admin.delete}</SubmitButton>
            </div>
          </AdminForm>
        </Card>
      ))}
    </div>
  );
}
